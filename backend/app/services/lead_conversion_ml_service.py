"""Lead-conversion ML service — bridges ML inference with existing app services.

Preserves the existing rule-based lead scoring system.
The ML conversion prediction is additive, not a replacement.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from ml.inference.lead_conversion import predict_conversion as _ml_predict

logger = logging.getLogger(__name__)


class LeadConversionMLService:
    """Service for ML-based lead-conversion prediction."""

    @staticmethod
    def get_prediction(
        db: Session,
        request_id: str,
    ) -> dict | None:
        """Return a conversion prediction for a search request."""
        from app.models.client_search_request import ClientSearchRequest

        request = (
            db.query(ClientSearchRequest)
            .filter(ClientSearchRequest.id == request_id)
            .first()
        )
        if request is None:
            return None

        return _ml_predict(db, request)

    @staticmethod
    def get_metrics() -> dict:
        """Return model metrics for manager analytics."""
        from ml.config import MODEL_LEAD_CONVERSION
        from ml.inference.model_loader import load_metadata

        meta = load_metadata(MODEL_LEAD_CONVERSION)
        if meta is None:
            return {
                "model_name": MODEL_LEAD_CONVERSION,
                "status": "not_trained",
                "metrics": {},
            }
        return {
            "model_name": MODEL_LEAD_CONVERSION,
            "status": meta.get("status", "not_trained"),
            "metrics": meta.get("metrics", {}),
            "model_version": meta.get("model_version"),
            "trained_at": meta.get("trained_at"),
            "training_rows": meta.get("training_rows"),
        }
