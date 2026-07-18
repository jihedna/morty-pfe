"""Recommendation service — bridges ML inference with existing app services.

Uses the trained hybrid recommender when available, falls back to
popularity-based ranking when the model is not trained.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from ml.config import MODEL_RECOMMENDER
from ml.inference.model_loader import get_model_status
from ml.inference.recommender import get_recommendations as _ml_get_recommendations

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for generating property recommendations for clients."""

    @staticmethod
    def get_recommendations(
        db: Session,
        user_id: str,
        limit: int = 10,
        city: str | None = None,
        property_type: str | None = None,
        listing_type: str | None = None,
        exclude_viewed: bool = True,
    ) -> dict:
        """Return recommendations for a client user."""
        from app.models.client_search_request import ClientSearchRequest
        from app.models.property import Property, PropertyStatus
        from app.models.property_favorite import PropertyFavorite
        from app.models.saved_search import SavedSearch
        from app.models.user_interaction import UserInteraction

        # Gather user preferences from active search requests
        requests = (
            db.query(ClientSearchRequest)
            .filter(
                ClientSearchRequest.client_id == user_id,
                ClientSearchRequest.is_active.is_(True),
            )
            .all()
        )

        user_preferences: dict = {}
        if requests:
            req = requests[0]
            user_preferences = {
                "preferred_city": req.preferred_city,
                "preferred_district": req.preferred_district,
                "property_type": req.property_type,
                "listing_type": req.listing_type,
                "budget_min": float(req.minimum_budget) if req.minimum_budget else None,
                "budget_max": float(req.maximum_budget) if req.maximum_budget else None,
                "min_bedrooms": req.minimum_bedrooms,
                "min_bathrooms": req.minimum_bathrooms,
                "min_area_sqm": float(req.minimum_area_sqm) if req.minimum_area_sqm else None,
            }

        # Gather interactions
        interactions_raw = (
            db.query(UserInteraction)
            .filter(UserInteraction.user_id == user_id)
            .order_by(UserInteraction.occurred_at.desc())
            .limit(200)
            .all()
        )

        interactions = [
            {
                "property_id": i.property_id,
                "event_type": i.event_type,
                "occurred_at": i.occurred_at.isoformat() if i.occurred_at else None,
            }
            for i in interactions_raw
            if i.property_id
        ]

        # Also use favorites as interactions if no interaction table records
        if not interactions:
            favs = db.query(PropertyFavorite).filter(PropertyFavorite.user_id == user_id).all()
            interactions = [
                {"property_id": f.property_id, "event_type": "favorite_add"}
                for f in favs
            ]

        # Get available properties
        prop_query = db.query(Property).filter(Property.status == PropertyStatus.AVAILABLE.value)
        if city:
            prop_query = prop_query.filter(Property.city.ilike(f"%{city}%"))
        if property_type:
            prop_query = prop_query.filter(Property.property_type == property_type)
        if listing_type:
            prop_query = prop_query.filter(Property.listing_type == listing_type)
        properties = prop_query.limit(500).all()

        recommendations = _ml_get_recommendations(
            db=db,
            user_id=user_id,
            user_preferences=user_preferences,
            interactions=interactions,
            properties=properties,
            limit=limit,
            exclude_viewed=exclude_viewed,
            city=city,
            property_type=property_type,
            listing_type=listing_type,
        )

        model_status = get_model_status(MODEL_RECOMMENDER)
        is_fallback = model_status != "ready"

        return {
            "recommendations": recommendations,
            "model_status": model_status,
            "fallback": is_fallback,
            "count": len(recommendations),
        }
