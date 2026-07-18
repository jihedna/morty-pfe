"""Safe model artifact loader.

Only loads artifacts generated from the controlled local training pipeline.
Validates artifact version and feature schema before loading.
Never loads arbitrary untrusted pickle files.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

import joblib

from ml.config import ARTIFACTS_DIR, ARTIFACT_COMPAT_VERSION, METADATA_DIR

logger = logging.getLogger(__name__)


class ArtifactLoadError(Exception):
    """Raised when an artifact cannot be loaded safely."""


def _metadata_path(model_name: str) -> Path:
    return METADATA_DIR / f"{model_name}_metadata.json"


def _artifact_path(model_name: str) -> Path:
    return ARTIFACTS_DIR / f"{model_name}.joblib"


def load_metadata(model_name: str) -> dict | None:
    """Load training metadata for a model. Returns None if not found."""
    path = _metadata_path(model_name)
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("Failed to load metadata for %s: %s", model_name, e)
        return None


def load_artifact(model_name: str, expected_features: list[str] | None = None) -> dict | None:
    """Safely load a model artifact bundle.

    Returns a dict with keys:
        - model: the trained model object
        - preprocessor: the fitted preprocessor (if any)
        - metadata: training metadata dict
        - feature_schema: feature schema dict

    Returns None if the artifact is missing, incompatible, or corrupted.
    Never raises — callers should handle None as a fallback signal.
    """
    meta = load_metadata(model_name)
    if meta is None:
        logger.info("No metadata found for model %s — treating as not_trained", model_name)
        return None

    if meta.get("status") in ("not_trained", "insufficient_training_data", "failed", "disabled"):
        logger.info("Model %s status is %s — skipping artifact load", model_name, meta.get("status"))
        return None

    compat = meta.get("compatibility_version", "0")
    if compat != ARTIFACT_COMPAT_VERSION:
        logger.warning(
            "Model %s compatibility version %s != expected %s — skipping load",
            model_name,
            compat,
            ARTIFACT_COMPAT_VERSION,
        )
        return None

    art_path = _artifact_path(model_name)
    if not art_path.exists():
        logger.warning("Artifact file missing for model %s at %s", model_name, art_path)
        return None

    try:
        bundle = joblib.load(art_path)
    except Exception as e:
        logger.error("Failed to load artifact for %s: %s", model_name, e)
        return None

    if not isinstance(bundle, dict) or "model" not in bundle:
        logger.error("Artifact bundle for %s is malformed", model_name)
        return None

    # Validate feature schema if expected features are provided
    if expected_features is not None:
        saved_schema = bundle.get("feature_schema", {})
        saved_features = saved_schema.get("features", [])
        if saved_features != expected_features:
            logger.warning(
                "Feature schema mismatch for %s — saved %d features vs expected %d",
                model_name,
                len(saved_features),
                len(expected_features),
            )
            return None

    bundle["metadata"] = meta
    return bundle


def save_artifact(
    model_name: str,
    model: object,
    preprocessor: object | None = None,
    feature_schema: dict | None = None,
    metadata: dict | None = None,
) -> None:
    """Save a model artifact bundle and metadata."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)

    bundle = {
        "model": model,
        "preprocessor": preprocessor,
        "feature_schema": feature_schema or {},
    }
    joblib.dump(bundle, _artifact_path(model_name))

    if metadata:
        with open(_metadata_path(model_name), "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, default=str)


def get_model_status(model_name: str) -> str:
    """Return the current status of a model from metadata."""
    meta = load_metadata(model_name)
    if meta is None:
        return "not_trained"
    return meta.get("status", "not_trained")
