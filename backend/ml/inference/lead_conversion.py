"""Lead-conversion prediction inference.

Predicts the probability that a client search request will produce a
meaningful conversion (appointment or contract) within the prediction window.
Falls back to the existing rule-based lead score when the ML model is unavailable.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sqlalchemy.orm import Session

from ml.config import LEAD_PRIORITY_BANDS, MODEL_LEAD_CONVERSION
from ml.feature_definitions import LEAD_ALL_FEATURES
from ml.inference.model_loader import get_model_status, load_artifact

logger = logging.getLogger(__name__)


def _extract_lead_features(
    request: Any,
    db: Session,
    prediction_time: datetime | None = None,
) -> dict:
    """Extract features available at prediction time from a search request."""
    from app.models.conversation import Conversation
    from app.models.message import Message
    from app.models.property_appointment import PropertyAppointment
    from app.models.property_favorite import PropertyFavorite
    from app.models.saved_search import SavedSearch

    now = prediction_time or datetime.now(timezone.utc)
    request_created = getattr(request, "created_at", now)

    # Request features
    budget_min = float(request.minimum_budget) if request.minimum_budget else 0.0
    budget_max = float(request.maximum_budget) if request.maximum_budget else 0.0
    budget_range = budget_max - budget_min if budget_max > budget_min else 0.0
    budget_completeness = 1.0 if (budget_min > 0 and budget_max > 0) else (0.5 if (budget_min > 0 or budget_max > 0) else 0.0)
    location_completeness = 1.0 if (request.preferred_city and request.preferred_district) else (0.5 if request.preferred_city else 0.0)
    request_age_days = max(0, (now - request_created).days)

    # Engagement features — default to 0 when db is unavailable
    fav_count = 0
    saved_count = 0
    conv_count = 0
    msg_count = 0
    appt_count = 0
    days_since_registration = 0

    if db is not None:
        fav_count = db.query(PropertyFavorite).filter(
            PropertyFavorite.user_id == request.client_id,
            PropertyFavorite.created_at <= now,
        ).count()

        saved_count = db.query(SavedSearch).filter(
            SavedSearch.user_id == request.client_id,
            SavedSearch.is_active.is_(True),
        ).count()

        convs = db.query(Conversation).filter(
            Conversation.search_request_id == request.id,
            Conversation.created_at <= now,
        ).all()
        conv_count = len(convs)

        for conv in convs:
            msg_count += db.query(Message).filter(
                Message.conversation_id == conv.id,
                Message.created_at <= now,
            ).count()

        appt_count = db.query(PropertyAppointment).filter(
            PropertyAppointment.client_id == request.client_id,
            PropertyAppointment.created_at <= now,
        ).count()

        from app.models.user import User
        user = db.query(User).filter(User.id == request.client_id).first()
        days_since_registration = (now - user.created_at).days if user else 0

    days_since_last_activity = request_age_days  # simplified

    features = {
        "property_type": request.property_type or "unknown",
        "listing_type": request.listing_type or "unknown",
        "preferred_city": request.preferred_city or "unknown",
        "urgency": request.urgency or "medium",
        "budget_min": budget_min,
        "budget_max": budget_max,
        "budget_range": budget_range,
        "budget_completeness": budget_completeness,
        "location_completeness": location_completeness,
        "min_bedrooms": request.minimum_bedrooms or 0,
        "min_bathrooms": request.minimum_bathrooms or 0,
        "min_area_sqm": float(request.minimum_area_sqm) if request.minimum_area_sqm else 0.0,
        "request_age_days": request_age_days,
        "property_views": 0,  # from interaction table when available
        "favorites": fav_count,
        "saved_searches": saved_count,
        "conversations": conv_count,
        "messages": msg_count,
        "appointment_requests": appt_count,
        "days_since_registration": days_since_registration,
        "days_since_last_activity": days_since_last_activity,
        "agent_response_time_hours": 0.0,
        "agent_current_workload": 0,
        "agent_appointment_completion_rate": 0.0,
        "agent_historical_conversion_rate": 0.0,
    }
    return features


def _features_to_vector(features: dict, feature_names: list[str]) -> np.ndarray:
    """Convert a feature dict to a numeric vector following feature_names order."""
    vec = np.zeros(len(feature_names))
    for i, name in enumerate(feature_names):
        val = features.get(name, 0)
        if isinstance(val, str):
            vec[i] = float(hash(val) % 1000) / 1000.0
        else:
            vec[i] = float(val) if val is not None else 0.0
    return vec


def _priority_band(probability: float) -> str:
    """Map a probability to a priority band."""
    if probability >= LEAD_PRIORITY_BANDS["high"]:
        return "high"
    if probability >= LEAD_PRIORITY_BANDS["medium"]:
        return "medium"
    return "low"


def _generate_explanation(features: dict, feature_importances: dict | None = None) -> list[str]:
    """Generate human-readable explanation phrases."""
    reasons: list[str] = []

    if features.get("budget_completeness", 0) >= 1.0:
        reasons.append("Complete budget range specified")
    elif features.get("budget_completeness", 0) >= 0.5:
        reasons.append("Partial budget information provided")

    if features.get("location_completeness", 0) >= 1.0:
        reasons.append("Specific location preferences indicated")
    elif features.get("location_completeness", 0) >= 0.5:
        reasons.append("City preference indicated")

    if features.get("favorites", 0) > 0:
        reasons.append(f"Has {features['favorites']} favorited properties")

    if features.get("conversations", 0) > 0:
        reasons.append(f"Engaged in {features['conversations']} conversation(s) with agents")

    if features.get("appointment_requests", 0) > 0:
        reasons.append(f"Requested {features['appointment_requests']} viewing appointment(s)")

    if features.get("urgency") in ("immediate", "high"):
        reasons.append(f"High urgency level: {features['urgency']}")

    if not reasons:
        reasons.append("Limited engagement signals available")

    return reasons[:5]


def predict_conversion(
    db: Session,
    request: Any,
    prediction_time: datetime | None = None,
) -> dict:
    """Return a conversion-prediction dict for a search request.

    Falls back to rule-based estimation when the ML model is unavailable.
    """
    status = get_model_status(MODEL_LEAD_CONVERSION)
    artifact = load_artifact(MODEL_LEAD_CONVERSION, expected_features=LEAD_ALL_FEATURES)
    features = _extract_lead_features(request, db, prediction_time)

    if artifact is not None and status == "ready":
        model = artifact["model"]
        preprocessor = artifact.get("preprocessor")
        feature_names = artifact.get("feature_schema", {}).get("features", LEAD_ALL_FEATURES)

        X = _features_to_vector(features, feature_names).reshape(1, -1)
        if preprocessor is not None:
            try:
                X = preprocessor.transform(X)
            except Exception as e:
                logger.warning("Preprocessor transform failed: %s — using raw features", e)

        try:
            prob = float(model.predict_proba(X)[0, 1])
        except Exception as e:
            logger.warning("Model prediction failed: %s — using fallback", e)
            prob = _fallback_probability(features)
            status = "fallback"

        model_version = artifact.get("metadata", {}).get("model_version", "unknown")
        explanation = _generate_explanation(features)
        fallback = False
    else:
        # Fallback: use rule-based heuristic from features
        prob = _fallback_probability(features)
        model_version = "fallback_rule_based"
        explanation = _generate_explanation(features)
        fallback = True
        if status == "not_trained":
            status = "not_trained"
        elif status == "insufficient_training_data":
            status = "insufficient_training_data"
        else:
            status = "fallback"

    return {
        "conversion_probability": round(prob, 4),
        "predicted_priority": _priority_band(prob),
        "model_version": model_version,
        "model_status": status,
        "top_reasons": explanation,
        "prediction_timestamp": datetime.now(timezone.utc).isoformat(),
        "fallback": fallback,
        "experimental_label": "Experimental ML estimate",
    }


def _fallback_probability(features: dict) -> float:
    """Heuristic probability from available features (not a trained model)."""
    score = 0.0
    score += features.get("budget_completeness", 0) * 0.15
    score += features.get("location_completeness", 0) * 0.15
    score += min(features.get("favorites", 0) * 0.05, 0.15)
    score += min(features.get("conversations", 0) * 0.10, 0.20)
    score += min(features.get("messages", 0) * 0.02, 0.10)
    score += min(features.get("appointment_requests", 0) * 0.10, 0.15)
    urgency = features.get("urgency", "medium")
    score += {"immediate": 0.10, "high": 0.07, "medium": 0.03, "low": 0.0}.get(urgency, 0.03)
    return max(0.01, min(0.95, score))
