"""Train the lead-conversion prediction model.

Target: binary — did a search request lead to a meaningful conversion
(appointment or contract) within the prediction window?

Falls back to insufficient_training_data status when data is inadequate.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ml.config import (
    ARTIFACT_COMPAT_VERSION,
    DEFAULT_SEED,
    LEAD_CONVERSION_WINDOW_DAYS,
    MIN_ROWS_LEAD_NEGATIVE,
    MIN_ROWS_LEAD_POSITIVE,
    MIN_ROWS_LEAD_TOTAL,
    MODEL_LEAD_CONVERSION,
)
from ml.evaluation.metrics import classification_metrics, save_metrics
from ml.evaluation.reports import generate_model_card, generate_training_report, save_report
from ml.feature_definitions import LEAD_ALL_FEATURES, build_feature_schema
from ml.inference.model_loader import save_artifact

logger = logging.getLogger(__name__)


def load_lead_data(db_session) -> pd.DataFrame:
    """Load lead data from the database and compute conversion labels."""
    from app.models.client_search_request import ClientSearchRequest
    from app.models.contract import Contract
    from app.models.conversation import Conversation
    from app.models.message import Message
    from app.models.property_appointment import PropertyAppointment
    from app.models.property_favorite import PropertyFavorite
    from app.models.saved_search import SavedSearch
    from app.models.user import User

    requests = (
        db_session.query(ClientSearchRequest)
        .filter(ClientSearchRequest.is_active.is_(True))
        .all()
    )

    rows = []
    for req in requests:
        created = req.created_at or datetime.now(timezone.utc)
        window_end = created + timedelta(days=LEAD_CONVERSION_WINDOW_DAYS)

        # Check for conversion: contract, completed/confirmed appointment
        contracts = (
            db_session.query(Contract)
            .filter(Contract.client_id == req.client_id)
            .filter(Contract.sale_date >= created.date() if hasattr(Contract, 'sale_date') else True)
            .count()
        )

        appointments = (
            db_session.query(PropertyAppointment)
            .filter(PropertyAppointment.client_id == req.client_id)
            .filter(PropertyAppointment.created_at >= created)
            .filter(PropertyAppointment.created_at <= window_end)
            .count()
        )

        conversations = (
            db_session.query(Conversation)
            .filter(Conversation.search_request_id == req.id)
            .count()
        )

        messages = 0
        convs = (
            db_session.query(Conversation)
            .filter(Conversation.search_request_id == req.id)
            .all()
        )
        for conv in convs:
            messages += (
                db_session.query(Message)
                .filter(Message.conversation_id == conv.id)
                .count()
            )

        favorites = (
            db_session.query(PropertyFavorite)
            .filter(PropertyFavorite.user_id == req.client_id)
            .count()
        )

        saved_searches = (
            db_session.query(SavedSearch)
            .filter(SavedSearch.user_id == req.client_id)
            .filter(SavedSearch.is_active.is_(True))
            .count()
        )

        user = db_session.query(User).filter(User.id == req.client_id).first()
        days_since_registration = (datetime.now(timezone.utc) - user.created_at).days if user else 0

        # Label: 1 if contracts > 0 or appointments > 0
        label = 1 if (contracts > 0 or appointments > 0) else 0

        budget_min = float(req.minimum_budget) if req.minimum_budget else 0.0
        budget_max = float(req.maximum_budget) if req.maximum_budget else 0.0

        row = {
            "property_type": req.property_type or "unknown",
            "listing_type": req.listing_type or "unknown",
            "preferred_city": req.preferred_city or "unknown",
            "urgency": req.urgency or "medium",
            "budget_min": budget_min,
            "budget_max": budget_max,
            "budget_range": budget_max - budget_min if budget_max > budget_min else 0.0,
            "budget_completeness": 1.0 if (budget_min > 0 and budget_max > 0) else (0.5 if (budget_min > 0 or budget_max > 0) else 0.0),
            "location_completeness": 1.0 if (req.preferred_city and req.preferred_district) else (0.5 if req.preferred_city else 0.0),
            "min_bedrooms": req.minimum_bedrooms or 0,
            "min_bathrooms": req.minimum_bathrooms or 0,
            "min_area_sqm": float(req.minimum_area_sqm) if req.minimum_area_sqm else 0.0,
            "request_age_days": max(0, (datetime.now(timezone.utc) - created).days),
            "property_views": 0,
            "favorites": favorites,
            "saved_searches": saved_searches,
            "conversations": conversations,
            "messages": messages,
            "appointment_requests": appointments,
            "days_since_registration": days_since_registration,
            "days_since_last_activity": max(0, (datetime.now(timezone.utc) - created).days),
            "agent_response_time_hours": 0.0,
            "agent_current_workload": 0,
            "agent_appointment_completion_rate": 0.0,
            "agent_historical_conversion_rate": 0.0,
            "label": label,
        }
        rows.append(row)

    return pd.DataFrame(rows)


def train_lead_model(
    df: pd.DataFrame,
    seed: int = DEFAULT_SEED,
) -> dict:
    """Train the lead-conversion prediction model."""
    report_rows = {
        "total_requests": len(df),
        "positive_labels": int(df["label"].sum()) if len(df) > 0 else 0,
        "negative_labels": int(len(df) - df["label"].sum()) if len(df) > 0 else 0,
    }

    if len(df) < MIN_ROWS_LEAD_TOTAL:
        logger.warning(
            "Insufficient data for lead model: %d rows (need %d)",
            len(df),
            MIN_ROWS_LEAD_TOTAL,
        )
        metadata = {
            "model_name": MODEL_LEAD_CONVERSION,
            "status": "insufficient_training_data",
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "training_rows": len(df),
            "minimum_required": MIN_ROWS_LEAD_TOTAL,
            "compatibility_version": ARTIFACT_COMPAT_VERSION,
            "model_version": "0.0.0",
            "metrics": {},
            "target_definition": f"conversion within {LEAD_CONVERSION_WINDOW_DAYS} days",
            "data_date_range": "N/A",
        }
        save_artifact(MODEL_LEAD_CONVERSION, model=None, metadata=metadata)
        report = generate_training_report(
            model_name=MODEL_LEAD_CONVERSION,
            status="insufficient_training_data",
            row_counts=report_rows,
            failure_reason=f"Only {len(df)} search requests available (minimum: {MIN_ROWS_LEAD_TOTAL})",
        )
        save_report(report, f"{MODEL_LEAD_CONVERSION}_training_report.md")
        return {"status": "insufficient_training_data", "rows": len(df)}

    positive_count = int(df["label"].sum())
    negative_count = len(df) - positive_count

    if positive_count < MIN_ROWS_LEAD_POSITIVE or negative_count < MIN_ROWS_LEAD_NEGATIVE:
        logger.warning(
            "Insufficient class balance: %d positive, %d negative (need %d each)",
            positive_count,
            negative_count,
            MIN_ROWS_LEAD_POSITIVE,
        )
        metadata = {
            "model_name": MODEL_LEAD_CONVERSION,
            "status": "insufficient_training_data",
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "training_rows": len(df),
            "positive_labels": positive_count,
            "negative_labels": negative_count,
            "minimum_positive": MIN_ROWS_LEAD_POSITIVE,
            "minimum_negative": MIN_ROWS_LEAD_NEGATIVE,
            "compatibility_version": ARTIFACT_COMPAT_VERSION,
            "model_version": "0.0.0",
            "metrics": {},
            "target_definition": f"conversion within {LEAD_CONVERSION_WINDOW_DAYS} days",
            "data_date_range": "N/A",
        }
        save_artifact(MODEL_LEAD_CONVERSION, model=None, metadata=metadata)
        report = generate_training_report(
            model_name=MODEL_LEAD_CONVERSION,
            status="insufficient_training_data",
            row_counts=report_rows,
            class_distribution={"positive": positive_count, "negative": negative_count},
            failure_reason=f"Class imbalance: {positive_count} positive, {negative_count} negative (need {MIN_ROWS_LEAD_POSITIVE} each)",
        )
        save_report(report, f"{MODEL_LEAD_CONVERSION}_training_report.md")
        return {"status": "insufficient_training_data", "rows": len(df), "positive": positive_count, "negative": negative_count}

    # Prepare features
    feature_cols = [c for c in LEAD_ALL_FEATURES if c in df.columns]
    X = df[feature_cols].copy()
    y = df["label"].values

    # Fill NaN
    for col in feature_cols:
        if col in ["property_type", "listing_type", "preferred_city", "urgency"]:
            X[col] = X[col].fillna("unknown")
        else:
            X[col] = pd.to_numeric(X[col], errors="coerce").fillna(0)

    categorical_cols = [c for c in feature_cols if c in ["property_type", "listing_type", "preferred_city", "urgency"]]
    numeric_cols = [c for c in feature_cols if c not in categorical_cols]

    # Split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )

    # Preprocessor (shared by both algorithms)
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols),
            ("num", StandardScaler(), numeric_cols),
        ],
        remainder="drop",
    )

    # ── Algorithm 1: GradientBoostingClassifier ──
    gb_model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        random_state=seed,
    )
    gb_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", gb_model),
    ])

    logger.info("Training GradientBoostingClassifier on %d rows (%d positive)...", len(X_train), y_train.sum())
    gb_pipeline.fit(X_train, y_train)
    gb_prob = gb_pipeline.predict_proba(X_val)[:, 1]
    gb_pred = (gb_prob >= 0.5).astype(int)
    gb_metrics = classification_metrics(y_val, gb_pred, gb_prob, threshold=0.5)

    # ── Algorithm 2: RandomForestClassifier ──
    rf_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=seed,
        n_jobs=-1,
    )
    rf_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", rf_model),
    ])

    logger.info("Training RandomForestClassifier on %d rows (%d positive)...", len(X_train), y_train.sum())
    rf_pipeline.fit(X_train, y_train)
    rf_prob = rf_pipeline.predict_proba(X_val)[:, 1]
    rf_pred = (rf_prob >= 0.5).astype(int)
    rf_metrics = classification_metrics(y_val, rf_pred, rf_prob, threshold=0.5)

    # ── Select best algorithm by ROC-AUC ──
    gb_auc = gb_metrics.get("roc_auc") or 0.0
    rf_auc = rf_metrics.get("roc_auc") or 0.0
    logger.info("Algorithm comparison — GradientBoosting ROC-AUC=%.4f vs RandomForest ROC-AUC=%.4f", gb_auc, rf_auc)

    if rf_auc > gb_auc:
        pipeline = rf_pipeline
        metrics = rf_metrics
        winning_algo = "RandomForestClassifier"
        losing_algo = "GradientBoostingClassifier"
        losing_metrics = gb_metrics
        losing_auc = gb_auc
    else:
        pipeline = gb_pipeline
        metrics = gb_metrics
        winning_algo = "GradientBoostingClassifier"
        losing_algo = "RandomForestClassifier"
        losing_metrics = rf_metrics
        losing_auc = rf_auc

    logger.info("Winner: %s (ROC-AUC=%.4f over %s ROC-AUC=%.4f)", winning_algo, max(gb_auc, rf_auc), losing_algo, losing_auc)

    feature_schema = build_feature_schema(LEAD_ALL_FEATURES)

    metadata = {
        "model_name": MODEL_LEAD_CONVERSION,
        "status": "ready",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_rows": len(X_train),
        "validation_rows": len(X_val),
        "model_version": "1.0.0",
        "compatibility_version": ARTIFACT_COMPAT_VERSION,
        "metrics": metrics,
        "target_definition": f"conversion within {LEAD_CONVERSION_WINDOW_DAYS} days (appointment or contract)",
        "data_date_range": "N/A",
        "positive_labels": int(y_train.sum()),
        "negative_labels": int(len(y_train) - y_train.sum()),
        "seed": seed,
        "winning_algorithm": winning_algo,
        "algorithm_comparison": {
            "selection_metric": "roc_auc",
            "GradientBoostingClassifier": {"roc_auc": gb_auc},
            "RandomForestClassifier": {"roc_auc": rf_auc},
            "runner_up": losing_algo,
            "runner_up_roc_auc": losing_auc,
        },
    }

    save_artifact(
        model_name=MODEL_LEAD_CONVERSION,
        model=pipeline,
        preprocessor=None,
        feature_schema=feature_schema,
        metadata=metadata,
    )

    save_metrics(metrics, Path(f"ml/metadata/{MODEL_LEAD_CONVERSION}_metrics.json"))

    # Also save algorithm comparison to a separate file for easy inspection
    comparison_data = {
        "winning_algorithm": winning_algo,
        "selection_metric": "roc_auc",
        "GradientBoostingClassifier": {"roc_auc": gb_auc, "metrics": gb_metrics},
        "RandomForestClassifier": {"roc_auc": rf_auc, "metrics": rf_metrics},
    }
    save_metrics(comparison_data, Path(f"ml/metadata/{MODEL_LEAD_CONVERSION}_algorithm_comparison.json"))

    card = generate_model_card(
        model_name=MODEL_LEAD_CONVERSION,
        purpose="Predict probability that a client search request leads to conversion",
        target=f"Binary: conversion within {LEAD_CONVERSION_WINDOW_DAYS} days (appointment or contract)",
        training_data={
            "rows": len(X_train),
            "date_range": "N/A",
            "source": "Database (search requests, appointments, contracts)",
        },
        evaluation_data={
            "rows": len(X_val),
            "split": "80/20 stratified train/validation",
        },
        metrics=metrics,
        limitations=[
            "Limited training data may not capture all conversion patterns",
            "Does not account for external economic factors",
            "Prediction is advisory — do not use to automatically reject leads",
            "Model performance depends on consistent interaction tracking",
        ],
        prohibited_uses=[
            "Do not use to automatically reject or deprioritize leads without human review",
            "Do not use as the sole factor in agent-lead assignment",
            "Do not expose raw probability scores to clients",
        ],
        fallback="Rule-based heuristic from budget, location, engagement, and urgency signals",
        retraining_recommendation="Retrain weekly once interaction tracking accumulates sufficient data",
        model_version="1.0.0",
        status="technical_demo",
    )
    save_report(card, f"{MODEL_LEAD_CONVERSION}_model_card.md")

    report = generate_training_report(
        model_name=MODEL_LEAD_CONVERSION,
        status="ready",
        row_counts=report_rows,
        split_sizes={"train": len(X_train), "validation": len(X_val)},
        class_distribution={"positive": int(y_train.sum()), "negative": int(len(y_train) - y_train.sum())},
        metrics=metrics,
    )
    save_report(report, f"{MODEL_LEAD_CONVERSION}_training_report.md")

    logger.info("Lead model training complete: ROC-AUC=%.4f", metrics.get("roc_auc", 0))
    return {"status": "ready", "rows": len(X_train), "metrics": metrics}


def run(db_session=None) -> dict:
    """Main entry point."""
    if db_session is None:
        from app.database.session import SessionLocal
        db_session = SessionLocal()

    try:
        df = load_lead_data(db_session)
        return train_lead_model(df)
    finally:
        db_session.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = run()
    print(json.dumps(result, indent=2, default=str))
    sys.exit(0)
