"""Property listing-price estimation inference.

Estimates a plausible listing price from comparable property data.
Separate models for sale and rent listings.
Falls back to median-based estimation when the ML model is unavailable.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sqlalchemy.orm import Session

from ml.config import (
    ARTIFACT_COMPAT_VERSION,
    MODEL_PRICE_RENT,
    MODEL_PRICE_SALE,
)
from ml.feature_definitions import (
    PRICE_ALL_FEATURES,
    PRICE_BOOLEAN,
    PRICE_CATEGORICAL,
    PRICE_FEATURE_FLAGS,
    PRICE_NUMERIC,
)
from ml.inference.model_loader import get_model_status, load_artifact

logger = logging.getLogger(__name__)


def _extract_price_features(
    prop: Any,
    listing_type: str = "sale",
) -> dict:
    """Extract features for price estimation from a property or input dict."""
    features: dict = {}

    for col in PRICE_CATEGORICAL:
        features[col] = getattr(prop, col, None) if not isinstance(prop, dict) else prop.get(col)
    for col in PRICE_NUMERIC:
        val = getattr(prop, col, None) if not isinstance(prop, dict) else prop.get(col)
        if val is not None:
            features[col] = float(val)
        else:
            features[col] = 0.0
    for col in PRICE_BOOLEAN:
        features[col] = 1 if (getattr(prop, col, False) if not isinstance(prop, dict) else prop.get(col, False)) else 0

    # Feature flags
    if hasattr(prop, "features"):
        prop_features = {f.feature for f in (prop.features or [])}
    elif isinstance(prop, dict):
        prop_features = set(prop.get("features", []))
    else:
        prop_features = set()
    for flag in PRICE_FEATURE_FLAGS:
        features[f"feat_{flag}"] = 1 if flag in prop_features else 0

    return features


def _features_to_vector(features: dict, feature_names: list[str]) -> np.ndarray:
    """Convert a feature dict to a numeric vector."""
    vec = np.zeros(len(feature_names))
    for i, name in enumerate(feature_names):
        val = features.get(name, 0)
        if isinstance(val, str):
            vec[i] = float(hash(val) % 1000) / 1000.0
        elif val is None:
            vec[i] = 0.0
        else:
            vec[i] = float(val)
    return vec


def _fallback_estimate(
    db: Session,
    city: str,
    property_type: str,
    area_sqm: float,
    listing_type: str = "sale",
) -> dict:
    """Median-based fallback when no trained model is available."""
    from app.models.property import Property, PropertyStatus

    query = db.query(Property).filter(
        Property.status.in_([PropertyStatus.AVAILABLE.value, PropertyStatus.SOLD.value, PropertyStatus.RESERVED.value]),
        Property.listing_type == listing_type,
        Property.area_sqm > 0,
        Property.price > 0,
    )
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if property_type:
        query = query.filter(Property.property_type == property_type)

    props = query.all()
    if not props:
        # Broosen search — just same listing_type
        props = db.query(Property).filter(
            Property.listing_type == listing_type,
            Property.price > 0,
            Property.area_sqm > 0,
        ).limit(100).all()

    if not props:
        return {
            "estimate": 0,
            "lower_estimate": 0,
            "upper_estimate": 0,
            "reliability": "low",
            "comparable_count": 0,
            "model_version": "fallback_no_data",
            "disclaimer": "No comparable properties found. Estimate is not available.",
            "fallback": True,
        }

    prices_per_sqm = [float(p.price) / float(p.area_sqm) for p in props if float(p.area_sqm) > 0]
    if not prices_per_sqm:
        return {
            "estimate": 0,
            "lower_estimate": 0,
            "upper_estimate": 0,
            "reliability": "low",
            "comparable_count": 0,
            "model_version": "fallback_no_data",
            "disclaimer": "No valid comparable data.",
            "fallback": True,
        }

    median_pps = float(np.median(prices_per_sqm))
    std_pps = float(np.std(prices_per_sqm)) if len(prices_per_sqm) > 1 else median_pps * 0.2

    estimate = median_pps * area_sqm
    lower = (median_pps - 1.5 * std_pps) * area_sqm
    upper = (median_pps + 1.5 * std_pps) * area_sqm

    lower = max(0, lower)
    reliability = "medium" if len(prices_per_sqm) >= 20 else "low"

    return {
        "estimate": round(estimate, 2),
        "lower_estimate": round(lower, 2),
        "upper_estimate": round(upper, 2),
        "reliability": reliability,
        "comparable_count": len(prices_per_sqm),
        "model_version": "fallback_median",
        "disclaimer": (
            "Estimated listing price based on median price per m² of comparable properties. "
            "This is not a professional valuation or guaranteed sale price."
        ),
        "fallback": True,
    }


def estimate_price(
    db: Session,
    listing_type: str = "sale",
    city: str = "",
    district: str | None = None,
    property_type: str = "",
    area_sqm: float = 0,
    bedrooms: int = 0,
    bathrooms: int = 0,
    features: list[str] | None = None,
) -> dict:
    """Return a price-estimation dict.

    Uses the trained model if available, otherwise falls back to median-based estimation.
    """
    model_name = MODEL_PRICE_SALE if listing_type == "sale" else MODEL_PRICE_RENT
    status = get_model_status(model_name)
    artifact = load_artifact(model_name, expected_features=PRICE_ALL_FEATURES)

    # Build a pseudo-property object for feature extraction
    pseudo_prop = {
        "city": city,
        "district": district or "",
        "property_type": property_type,
        "area_sqm": area_sqm,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "rooms": bedrooms + bathrooms,
        "floor_number": 0,
        "construction_year": 0,
        "latitude": 0.0,
        "longitude": 0.0,
        "is_furnished": False,
        "features": features or [],
    }

    if artifact is not None and status == "ready":
        model = artifact["model"]
        preprocessor = artifact.get("preprocessor")
        feature_names = artifact.get("feature_schema", {}).get("features", PRICE_ALL_FEATURES)

        feat_dict = _extract_price_features(pseudo_prop, listing_type)
        X = _features_to_vector(feat_dict, feature_names).reshape(1, -1)

        if preprocessor is not None:
            try:
                X = preprocessor.transform(X)
            except Exception as e:
                logger.warning("Price preprocessor transform failed: %s", e)

        try:
            estimate = float(model.predict(X)[0])
        except Exception as e:
            logger.warning("Price model prediction failed: %s — using fallback", e)
            return _fallback_estimate(db, city, property_type, area_sqm, listing_type)

        # Residual-based prediction interval
        residuals = artifact.get("metadata", {}).get("residuals", [])
        if residuals:
            std = float(np.std(residuals))
        else:
            std = estimate * 0.2

        lower = max(0, estimate - 1.96 * std)
        upper = estimate + 1.96 * std

        comparable_count = artifact.get("metadata", {}).get("training_rows", 0)
        model_version = artifact.get("metadata", {}).get("model_version", "unknown")

        # Important factors
        important_factors = artifact.get("metadata", {}).get("important_features", [])
        factors_text = [f for f in important_factors[:5]] if important_factors else ["area_sqm", "city", "property_type"]

        return {
            "estimate": round(estimate, 2),
            "lower_estimate": round(lower, 2),
            "upper_estimate": round(upper, 2),
            "reliability": "medium" if comparable_count >= 100 else "low",
            "comparable_count": comparable_count,
            "model_version": model_version,
            "disclaimer": (
                f"Estimated listing price for {listing_type}. "
                "This is not a professional valuation or guaranteed sale price. "
                "Factors associated with this estimate include: "
                + ", ".join(factors_text)
                + "."
            ),
            "fallback": False,
            "data_date_range": artifact.get("metadata", {}).get("data_date_range", "N/A"),
        }
    else:
        return _fallback_estimate(db, city, property_type, area_sqm, listing_type)
