"""Content-based KNN matching from an agent profile to property listings."""

from __future__ import annotations

from itertools import product
from typing import Any
import unicodedata

import numpy as np
from scipy.sparse import hstack
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def _normalise(value: str | None) -> str:
    """Case- and accent-insensitive value used for exact matching."""
    text = unicodedata.normalize("NFKD", value or "")
    return "".join(char for char in text if not unicodedata.combining(char)).strip().casefold()


def recommend_properties(
    properties: list[Any],
    property_types: list[str],
    territories: list[str],
    minimum_budget: float,
    maximum_budget: float,
    limit: int = 20,
) -> list[dict]:
    """Train a catalog KNN model and return the closest listings for an agent."""
    if not properties or not property_types or not territories:
        return []

    type_set = {_normalise(value) for value in property_types}
    territory_set = {_normalise(value) for value in territories}
    eligible_properties = []
    for prop in properties:
        price = float(prop.price or 0)
        type_match = _normalise(prop.property_type) in type_set
        property_location = f"{prop.city}, {prop.governorate}" if prop.city and prop.governorate else (prop.city or prop.governorate)
        territory_match = (
            _normalise(property_location) in territory_set
            or _normalise(prop.governorate) in territory_set
        )
        budget_match = price >= minimum_budget and (
            maximum_budget <= 0 or price <= maximum_budget
        )
        if type_match and territory_match and budget_match:
            eligible_properties.append(prop)

    if not eligible_properties:
        return []

    rows = []
    for prop in eligible_properties:
        rows.append({
            "property_id": str(prop.id),
            "property_type": prop.property_type or "unknown",
            "territory": property_location or "unknown",
            "price": float(prop.price or 0),
        })
    categorical = [[row["property_type"], row["territory"]] for row in rows]
    prices = np.array([row["price"] for row in rows], dtype=float).reshape(-1, 1)
    encoder = OneHotEncoder(handle_unknown="ignore")
    scaler = StandardScaler()
    catalog_matrix = hstack([encoder.fit_transform(categorical), scaler.fit_transform(prices)]).tocsr()
    model = NearestNeighbors(metric="euclidean", algorithm="brute")
    model.fit(catalog_matrix)

    midpoint = (minimum_budget + maximum_budget) / 2 if maximum_budget else minimum_budget
    queries = [
        [property_type, territory]
        for property_type, territory in product(property_types, territories)
    ]
    query_prices = np.full((len(queries), 1), midpoint, dtype=float)
    query_matrix = hstack([encoder.transform(queries), scaler.transform(query_prices)]).tocsr()
    neighbor_count = min(max(limit * 4, limit), len(rows))
    distances, indices = model.kneighbors(query_matrix, n_neighbors=neighbor_count)

    candidates: dict[str, dict] = {}
    for query_distances, query_indices in zip(distances, indices):
        for distance, index in zip(query_distances, query_indices):
            row = rows[int(index)]
            prop = eligible_properties[int(index)]
            price = float(row["price"])
            type_match = _normalise(row["property_type"]) in type_set
            territory_match = _normalise(row["territory"]) in territory_set
            budget_match = minimum_budget <= price <= maximum_budget if maximum_budget else price >= minimum_budget
            score = max(0.0, 1.0 - float(distance) / 5.0)
            score += 0.30 if type_match else 0
            score += 0.30 if territory_match else 0
            score += 0.25 if budget_match else 0
            score = min(score / 1.85, 1.0)
            reasons = []
            if type_match:
                reasons.append(f"Matches property type: {row['property_type']}")
            if territory_match:
                reasons.append(f"Matches territory: {row['territory']}")
            if budget_match:
                reasons.append("Within agent budget range")
            candidate = {
                "property_id": row["property_id"],
                "score": round(score, 4),
                "reasons": reasons or ["Nearest catalog match"],
                "model": "agent_property_knn_v1",
            }
            previous = candidates.get(row["property_id"])
            if previous is None or candidate["score"] > previous["score"]:
                candidates[row["property_id"]] = candidate

    ranked = sorted(candidates.values(), key=lambda item: item["score"], reverse=True)
    return ranked[:limit]
