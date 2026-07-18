"""Feature definitions for all three ML models.

Each model has a feature schema that is saved alongside the artifact and
validated at load time.  This prevents silent mismatches when the training
code is updated but old artifacts are still on disk.
"""

from __future__ import annotations

# ── Property features (used by recommender and price estimator) ────────
PROPERTY_CATEGORICAL = [
    "city",
    "district",
    "property_type",
    "listing_type",
]

PROPERTY_NUMERIC = [
    "price",
    "area_sqm",
    "bedrooms",
    "bathrooms",
    "rooms",
    "floor_number",
    "total_floors",
    "construction_year",
    "latitude",
    "longitude",
]

PROPERTY_BOOLEAN = [
    "is_furnished",
    "is_featured",
]

# Feature flags derived from property_features table
PROPERTY_FEATURE_FLAGS = [
    "parking",
    "elevator",
    "balcony",
    "terrace",
    "garden",
    "pool",
    "air_conditioning",
    "central_heating",
    "security_system",
    "sea_view",
    "storage_room",
    "accessible_entry",
]

# ── Recommender: user preference features ──────────────────────────────
RECOMMENDER_USER_CATEGORICAL = [
    "preferred_city",
    "preferred_property_type",
    "preferred_listing_type",
]

RECOMMENDER_USER_NUMERIC = [
    "budget_min",
    "budget_max",
    "min_bedrooms",
    "min_bathrooms",
    "min_area_sqm",
]

# ── Lead-conversion features ───────────────────────────────────────────
LEAD_REQUEST_CATEGORICAL = [
    "property_type",
    "listing_type",
    "preferred_city",
    "urgency",
]

LEAD_REQUEST_NUMERIC = [
    "budget_min",
    "budget_max",
    "budget_range",
    "budget_completeness",
    "location_completeness",
    "min_bedrooms",
    "min_bathrooms",
    "min_area_sqm",
    "request_age_days",
]

LEAD_ENGAGEMENT_NUMERIC = [
    "property_views",
    "favorites",
    "saved_searches",
    "conversations",
    "messages",
    "appointment_requests",
    "days_since_registration",
    "days_since_last_activity",
]

LEAD_AGENT_NUMERIC = [
    "agent_response_time_hours",
    "agent_current_workload",
    "agent_appointment_completion_rate",
    "agent_historical_conversion_rate",
]

# All lead features combined (order matters for schema)
LEAD_ALL_FEATURES = (
    LEAD_REQUEST_CATEGORICAL
    + LEAD_REQUEST_NUMERIC
    + LEAD_ENGAGEMENT_NUMERIC
    + LEAD_AGENT_NUMERIC
)

# ── Price-estimator features ───────────────────────────────────────────
PRICE_CATEGORICAL = [
    "city",
    "district",
    "property_type",
]

PRICE_NUMERIC = [
    "area_sqm",
    "bedrooms",
    "bathrooms",
    "rooms",
    "floor_number",
    "construction_year",
    "latitude",
    "longitude",
]

PRICE_BOOLEAN = [
    "is_furnished",
]

PRICE_FEATURE_FLAGS = PROPERTY_FEATURE_FLAGS

PRICE_ALL_FEATURES = (
    PRICE_CATEGORICAL
    + PRICE_NUMERIC
    + PRICE_BOOLEAN
    + PRICE_FEATURE_FLAGS
)

# ── Prohibited features (responsible ML) ───────────────────────────────
PROHIBITED_FEATURES = [
    "race",
    "religion",
    "health_status",
    "disability",
    "ethnicity",
    "nationality",
    "language",
    "gender",
    "first_name",
    "last_name",
    "email",
    "phone",
    "password_hash",
    "message_content",
]


def build_feature_schema(feature_names: list[str]) -> dict:
    """Return a JSON-serializable feature schema dict."""
    return {
        "features": feature_names,
        "count": len(feature_names),
        "prohibited_checked": True,
    }
