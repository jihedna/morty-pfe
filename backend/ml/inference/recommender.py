"""Hybrid property recommendation inference.

Combines content-based property similarity with weighted user interactions.
Falls back to popularity-based ranking when the model is unavailable.
"""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
from sqlalchemy.orm import Session

from ml.config import INTERACTION_WEIGHTS, MODEL_RECOMMENDER
from ml.feature_definitions import (
    PROPERTY_BOOLEAN,
    PROPERTY_CATEGORICAL,
    PROPERTY_FEATURE_FLAGS,
    PROPERTY_NUMERIC,
)
from ml.inference.model_loader import get_model_status, load_artifact

logger = logging.getLogger(__name__)

# Status string exposed to API
_status: str | None = None


def _extract_property_features(prop: Any) -> dict:
    """Extract a flat feature dict from a Property ORM object."""
    features: dict = {}
    for col in PROPERTY_CATEGORICAL + PROPERTY_NUMERIC:
        val = getattr(prop, col, None)
        if val is not None:
            if hasattr(val, "__float__"):
                features[col] = float(val)
            else:
                features[col] = str(val)
    for col in PROPERTY_BOOLEAN:
        features[col] = 1 if getattr(prop, col, False) else 0

    # Feature flags from property_features relationship
    prop_features = {f.feature for f in (prop.features or [])}
    for flag in PROPERTY_FEATURE_FLAGS:
        features[f"feat_{flag}"] = 1 if flag in prop_features else 0

    return features


def _build_property_matrix(properties: list[Any]) -> tuple[np.ndarray, list[str], list[dict]]:
    """Build a numeric matrix from property objects."""
    feat_dicts = [_extract_property_features(p) for p in properties]
    if not feat_dicts:
        return np.array([]), [], []

    all_keys = sorted(feat_dicts[0].keys())
    matrix = np.zeros((len(feat_dicts), len(all_keys)))
    for i, fd in enumerate(feat_dicts):
        for j, key in enumerate(all_keys):
            val = fd.get(key, 0)
            if isinstance(val, str):
                # Simple hash-based encoding for categorical at inference
                matrix[i, j] = float(hash(val) % 1000) / 1000.0
            else:
                matrix[i, j] = float(val) if val is not None else 0.0
    prop_ids = [str(p.id) for p in properties]
    return matrix, prop_ids, feat_dicts


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two 1-D vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _popularity_fallback(
    properties: list[Any],
    limit: int = 10,
    exclude_ids: set[str] | None = None,
) -> list[dict]:
    """Popularity-based fallback: featured properties first, then by recency."""
    exclude_ids = exclude_ids or set()
    available = [
        p for p in properties
        if p.status == "available" and str(p.id) not in exclude_ids
    ]
    # Sort: featured first, then by published_at desc
    available.sort(
        key=lambda p: (not p.is_featured, getattr(p, "published_at", None) or 0),
        reverse=False,
    )
    # Re-sort: featured first then newest
    available.sort(key=lambda p: not p.is_featured)

    results = []
    for i, prop in enumerate(available[:limit]):
        results.append({
            "property_id": str(prop.id),
            "score": max(0.5 - i * 0.05, 0.1),
            "rank": i + 1,
            "reasons": ["Popular property"],
            "model_version": "fallback_popularity",
            "fallback": True,
        })
    return results


def _generate_reasons(
    prop: Any,
    user_preferences: dict,
    interaction_properties: set[str],
) -> list[str]:
    """Generate human-readable recommendation reasons."""
    reasons: list[str] = []

    pref_city = user_preferences.get("preferred_city")
    if pref_city and prop.city and pref_city.lower() in (prop.city or "").lower():
        reasons.append(f"Matches your preferred city: {pref_city}")

    pref_district = user_preferences.get("preferred_district")
    if pref_district and prop.district and pref_district.lower() in (prop.district or "").lower():
        reasons.append(f"Located in your preferred district: {pref_district}")

    pref_type = user_preferences.get("property_type")
    if pref_type and prop.property_type == pref_type:
        reasons.append(f"Matches your property type: {pref_type}")

    budget_min = user_preferences.get("budget_min")
    budget_max = user_preferences.get("budget_max")
    if budget_min and budget_max and prop.price:
        price = float(prop.price)
        if budget_min <= price <= budget_max:
            reasons.append("Within your budget range")

    if str(prop.id) in interaction_properties:
        reasons.append("Similar to properties you've shown interest in")

    if not reasons:
        reasons.append("Popular among clients with similar searches")

    return reasons[:3]


def get_recommendations(
    db: Session,
    user_id: str,
    user_preferences: dict,
    interactions: list[dict],
    properties: list[Any],
    limit: int = 10,
    exclude_viewed: bool = True,
    city: str | None = None,
    property_type: str | None = None,
    listing_type: str | None = None,
) -> list[dict]:
    """Return property recommendations for a user.

    Uses the trained model if available, otherwise falls back to popularity.
    """
    status = get_model_status(MODEL_RECOMMENDER)
    artifact = load_artifact(MODEL_RECOMMENDER)

    # Build exclusion set from interactions
    viewed_ids: set[str] = set()
    interacted_ids: set[str] = set()
    for inter in interactions:
        pid = inter.get("property_id")
        if pid:
            weight = INTERACTION_WEIGHTS.get(inter.get("event_type", ""), 0)
            if weight > 0:
                interacted_ids.add(pid)
            if inter.get("event_type") == "property_view":
                viewed_ids.add(pid)

    exclude_ids = viewed_ids if exclude_viewed else set()

    # Filter properties
    filtered = [
        p for p in properties
        if p.status == "available"
        and str(p.id) not in exclude_ids
        and (city is None or (p.city or "").lower() == city.lower())
        and (property_type is None or p.property_type == property_type)
        and (listing_type is None or p.listing_type == listing_type)
    ]

    if not filtered:
        return []

    # If model is not ready, use popularity fallback
    if artifact is None or status != "ready":
        return _popularity_fallback(filtered, limit=limit, exclude_ids=exclude_ids)

    # --- Hybrid scoring ---
    prop_matrix, prop_ids, feat_dicts = _build_property_matrix(filtered)
    if prop_matrix.size == 0:
        return _popularity_fallback(filtered, limit=limit, exclude_ids=exclude_ids)

    # Build user preference vector from preferences + weighted interactions
    user_vector = np.zeros(prop_matrix.shape[1])
    if feat_dicts:
        pref_features: dict = {}
        for key in feat_dicts[0]:
            pref_features[key] = 0.0

        # Apply user preferences
        pref_city = user_preferences.get("preferred_city")
        pref_type = user_preferences.get("property_type")
        for j, key in enumerate(sorted(feat_dicts[0].keys())):
            if key == "city" and pref_city:
                user_vector[j] = float(hash(pref_city) % 1000) / 1000.0
            elif key == "property_type" and pref_type:
                user_vector[j] = float(hash(pref_type) % 1000) / 1000.0
            elif key == "price":
                budget = user_preferences.get("budget_max") or user_preferences.get("budget_min") or 0
                user_vector[j] = float(budget)
            elif key == "area_sqm":
                user_vector[j] = float(user_preferences.get("min_area_sqm") or 0)

    # Add interaction weighting
    for inter in interactions:
        pid = inter.get("property_id")
        if not pid:
            continue
        weight = INTERACTION_WEIGHTS.get(inter.get("event_type", ""), 0)
        if weight > 0 and pid in prop_ids:
            idx = prop_ids.index(pid)
            user_vector += prop_matrix[idx] * weight

    # Compute similarity scores
    scores = []
    for i in range(len(filtered)):
        sim = _cosine_similarity(user_vector, prop_matrix[i])
        # Normalize to 0-1
        score = max(0.0, min(1.0, (sim + 1) / 2))
        scores.append((score, i))

    scores.sort(key=lambda x: x[0], reverse=True)

    results = []
    for rank, (score, idx) in enumerate(scores[:limit]):
        prop = filtered[idx]
        reasons = _generate_reasons(prop, user_preferences, interacted_ids)
        results.append({
            "property_id": str(prop.id),
            "score": round(score, 4),
            "rank": rank + 1,
            "reasons": reasons,
            "model_version": artifact.get("metadata", {}).get("model_version", "unknown"),
            "fallback": False,
        })

    return results
