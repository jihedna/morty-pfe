"""Price-estimation ML service — bridges ML inference with existing app services.

Provides estimated listing prices for sale and rent properties.
The estimate never overwrites the entered price automatically.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from ml.inference.price_estimator import estimate_price as _ml_estimate

logger = logging.getLogger(__name__)


class PriceEstimationService:
    """Service for ML-based property listing-price estimation."""

    @staticmethod
    def estimate(
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
        """Return a price estimation dict."""
        return _ml_estimate(
            db=db,
            listing_type=listing_type,
            city=city,
            district=district,
            property_type=property_type,
            area_sqm=area_sqm,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            features=features,
        )
