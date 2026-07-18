"""ML Model Registry Service.

Tracks metadata for all ML models. Provides status, metrics, and metadata
to manager-only endpoints. Does not expose filesystem secrets.
"""

from __future__ import annotations

import logging

from ml.config import (
    MODEL_LEAD_CONVERSION,
    MODEL_PRICE_RENT,
    MODEL_PRICE_SALE,
    MODEL_RECOMMENDER,
)
from ml.inference.model_loader import get_model_status, load_metadata

logger = logging.getLogger(__name__)

MODEL_DESCRIPTIONS = {
    MODEL_RECOMMENDER: {
        "name": "Property Recommender",
        "type": "hybrid_content_interaction",
        "purpose": "Recommend relevant properties to authenticated clients",
    },
    MODEL_LEAD_CONVERSION: {
        "name": "Lead Conversion Predictor",
        "type": "binary_classification",
        "purpose": "Predict probability that a search request leads to conversion",
    },
    MODEL_PRICE_SALE: {
        "name": "Sale Price Estimator",
        "type": "regression",
        "purpose": "Estimate listing price for sale properties",
    },
    MODEL_PRICE_RENT: {
        "name": "Rent Price Estimator",
        "type": "regression",
        "purpose": "Estimate monthly rent for rental properties",
    },
}

ALL_MODELS = [MODEL_RECOMMENDER, MODEL_LEAD_CONVERSION, MODEL_PRICE_SALE, MODEL_PRICE_RENT]


class MLModelRegistryService:
    """Service for querying ML model status and metadata."""

    @staticmethod
    def get_all_models_status() -> list[dict]:
        """Return status and metadata for all registered models."""
        results = []
        for model_name in ALL_MODELS:
            meta = load_metadata(model_name)
            desc = MODEL_DESCRIPTIONS.get(model_name, {})
            status = get_model_status(model_name)
            entry = {
                "model_name": model_name,
                "display_name": desc.get("name", model_name),
                "model_type": desc.get("type", "unknown"),
                "purpose": desc.get("purpose", ""),
                "status": status,
                "version": meta.get("model_version") if meta else None,
                "trained_at": meta.get("trained_at") if meta else None,
                "training_rows": meta.get("training_rows") if meta else None,
                "validation_rows": meta.get("validation_rows") if meta else None,
                "data_date_range": meta.get("data_date_range") if meta else None,
                "target_definition": meta.get("target_definition") if meta else None,
                "compatibility_version": meta.get("compatibility_version") if meta else None,
            }
            results.append(entry)
        return results

    @staticmethod
    def get_model_status(model_name: str) -> dict | None:
        """Return status and metadata for a single model."""
        if model_name not in ALL_MODELS:
            return None
        meta = load_metadata(model_name)
        desc = MODEL_DESCRIPTIONS.get(model_name, {})
        status = get_model_status(model_name)
        return {
            "model_name": model_name,
            "display_name": desc.get("name", model_name),
            "model_type": desc.get("type", "unknown"),
            "purpose": desc.get("purpose", ""),
            "status": status,
            "version": meta.get("model_version") if meta else None,
            "trained_at": meta.get("trained_at") if meta else None,
            "training_rows": meta.get("training_rows") if meta else None,
            "validation_rows": meta.get("validation_rows") if meta else None,
            "data_date_range": meta.get("data_date_range") if meta else None,
            "target_definition": meta.get("target_definition") if meta else None,
            "compatibility_version": meta.get("compatibility_version") if meta else None,
        }

    @staticmethod
    def get_model_metrics(model_name: str) -> dict | None:
        """Return evaluation metrics for a model."""
        if model_name not in ALL_MODELS:
            return None
        meta = load_metadata(model_name)
        if meta is None:
            return None
        return {
            "model_name": model_name,
            "status": get_model_status(model_name),
            "metrics": meta.get("metrics", {}),
            "trained_at": meta.get("trained_at"),
            "training_rows": meta.get("training_rows"),
            "validation_rows": meta.get("validation_rows"),
        }
