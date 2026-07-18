"""ML configuration — paths, seeds, thresholds, and interaction weights."""

import os
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────
ML_ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = ML_ROOT.parent
PROJECT_ROOT = BACKEND_ROOT.parent

ARTIFACTS_DIR = ML_ROOT / "artifacts"
METADATA_DIR = ML_ROOT / "metadata"
DATA_DIR = ML_ROOT / "data"

ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
METADATA_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ── Deterministic seed ─────────────────────────────────────────────────
DEFAULT_SEED = 42

# ── Model names ────────────────────────────────────────────────────────
MODEL_RECOMMENDER = "property_recommender"
MODEL_LEAD_CONVERSION = "lead_conversion"
MODEL_PRICE_SALE = "price_estimator_sale"
MODEL_PRICE_RENT = "price_estimator_rent"

# ── Minimum training-row thresholds ────────────────────────────────────
MIN_ROWS_RECOMMENDER_USERS = 100
MIN_ROWS_RECOMMENDER_PROPERTIES = 500
MIN_ROWS_RECOMMENDER_INTERACTIONS = 1000

MIN_ROWS_LEAD_TOTAL = 500
MIN_ROWS_LEAD_POSITIVE = 50
MIN_ROWS_LEAD_NEGATIVE = 50

MIN_ROWS_PRICE = 500

# ── Interaction weights for recommendation ─────────────────────────────
INTERACTION_WEIGHTS = {
    "property_view": 1,
    "search_click": 2,
    "favorite_add": 4,
    "saved_search_match": 3,
    "agent_contact": 5,
    "conversation_property": 5,
    "appointment_requested": 7,
    "appointment_confirmed": 9,
    "completed_transaction": 15,
}

# ── Lead-conversion label definition ───────────────────────────────────
# Primary target: conversion within 90 days of request creation.
# Positive label hierarchy (strongest available):
#   1. completed contract
#   2. completed appointment
#   3. confirmed appointment
#   4. appointment requested + active conversation
LEAD_CONVERSION_WINDOW_DAYS = 90

# Priority bands for conversion probability
LEAD_PRIORITY_BANDS = {
    "low": 0.0,
    "medium": 0.35,
    "high": 0.65,
}

# ── Artifact compatibility version ─────────────────────────────────────
ARTIFACT_COMPAT_VERSION = "1.0"

# ── Environment overrides ──────────────────────────────────────────────
ML_OUTPUT_DIR = os.getenv("ML_OUTPUT_DIR", str(ARTIFACTS_DIR))
