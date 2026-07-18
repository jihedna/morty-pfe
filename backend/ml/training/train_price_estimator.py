"""Train the property listing-price estimator.

Uses property data from the database (CSV-imported records).
Separate models for sale and rent listings.

Target: property.price
Features: city, district, property_type, area_sqm, bedrooms, bathrooms,
          rooms, floor_number, construction_year, latitude, longitude,
          is_furnished, feature flags
"""

from __future__ import annotations

import logging
import sys
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ml.config import (
    ARTIFACT_COMPAT_VERSION,
    DEFAULT_SEED,
    MIN_ROWS_PRICE,
    MODEL_PRICE_RENT,
    MODEL_PRICE_SALE,
)
from ml.evaluation.metrics import regression_metrics, save_metrics
from ml.evaluation.reports import generate_model_card, generate_training_report, save_report
from ml.feature_definitions import (
    PRICE_ALL_FEATURES,
    PRICE_BOOLEAN,
    PRICE_CATEGORICAL,
    PRICE_FEATURE_FLAGS,
    PRICE_NUMERIC,
    build_feature_schema,
)
from ml.inference.model_loader import save_artifact

logger = logging.getLogger(__name__)


def load_price_data(db_session) -> pd.DataFrame:
    """Load property data from the database into a DataFrame."""
    from app.models.property import Property, PropertyStatus
    from app.models.property_feature import PropertyFeature

    properties = (
        db_session.query(Property)
        .filter(
            Property.status.in_([
                PropertyStatus.AVAILABLE.value,
                PropertyStatus.SOLD.value,
                PropertyStatus.RESERVED.value,
            ]),
            Property.price > 0,
            Property.area_sqm > 0,
        )
        .all()
    )

    rows = []
    for prop in properties:
        row = {
            "id": str(prop.id),
            "price": float(prop.price),
            "city": prop.city or "Unknown",
            "district": prop.district or "Unknown",
            "property_type": prop.property_type or "unknown",
            "listing_type": prop.listing_type or "sale",
            "area_sqm": float(prop.area_sqm) if prop.area_sqm else 0,
            "bedrooms": prop.bedrooms or 0,
            "bathrooms": prop.bathrooms or 0,
            "rooms": prop.rooms or 0,
            "floor_number": prop.floor_number or 0,
            "construction_year": prop.construction_year or 0,
            "latitude": float(prop.latitude) if prop.latitude else 0.0,
            "longitude": float(prop.longitude) if prop.longitude else 0.0,
            "is_furnished": 1 if prop.is_furnished else 0,
        }
        # Feature flags
        prop_features = {f.feature for f in (prop.features or [])}
        for flag in PRICE_FEATURE_FLAGS:
            row[f"feat_{flag}"] = 1 if flag in prop_features else 0
        rows.append(row)

    df = pd.DataFrame(rows)
    return df


def train_price_model(
    df: pd.DataFrame,
    listing_type: str = "sale",
    seed: int = DEFAULT_SEED,
) -> dict:
    """Train a price estimator for the given listing type."""
    model_name = MODEL_PRICE_SALE if listing_type == "sale" else MODEL_PRICE_RENT
    listing_df = df[df["listing_type"] == listing_type].copy()

    report_rows = {
        "total_properties": len(df),
        f"{listing_type}_properties": len(listing_df),
    }

    if len(listing_df) < MIN_ROWS_PRICE:
        logger.warning(
            "Insufficient data for %s price model: %d rows (need %d)",
            listing_type,
            len(listing_df),
            MIN_ROWS_PRICE,
        )
        metadata = {
            "model_name": model_name,
            "status": "insufficient_training_data",
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "training_rows": len(listing_df),
            "minimum_required": MIN_ROWS_PRICE,
            "compatibility_version": ARTIFACT_COMPAT_VERSION,
            "model_version": "0.0.0",
            "metrics": {},
            "target_definition": "property.price",
            "data_date_range": "N/A",
        }
        save_artifact(model_name, model=None, metadata=metadata)
        report = generate_training_report(
            model_name=model_name,
            status="insufficient_training_data",
            row_counts=report_rows,
            failure_reason=f"Only {len(listing_df)} {listing_type} properties available (minimum: {MIN_ROWS_PRICE})",
        )
        save_report(report, f"{model_name}_training_report.md")
        return {"status": "insufficient_training_data", "model_name": model_name, "rows": len(listing_df)}

    # Prepare features and target
    feature_cols = PRICE_CATEGORICAL + PRICE_NUMERIC + PRICE_BOOLEAN + [f"feat_{f}" for f in PRICE_FEATURE_FLAGS]
    X = listing_df[feature_cols].copy()
    y = listing_df["price"].values

    # Fill NaN
    X[PRICE_NUMERIC] = X[PRICE_NUMERIC].fillna(0)
    X[PRICE_BOOLEAN] = X[PRICE_BOOLEAN].fillna(0)
    for col in PRICE_CATEGORICAL:
        X[col] = X[col].fillna("Unknown")

    # Split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=seed
    )

    # Preprocessor (shared by both algorithms)
    categorical_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    numeric_transformer = StandardScaler()

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", categorical_transformer, PRICE_CATEGORICAL),
            ("num", numeric_transformer, PRICE_NUMERIC + PRICE_BOOLEAN + [f"feat_{f}" for f in PRICE_FEATURE_FLAGS]),
        ],
        remainder="drop",
    )

    # ── Algorithm 1: GradientBoostingRegressor ──
    gb_model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        random_state=seed,
    )
    gb_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", gb_model),
    ])

    logger.info("Training GradientBoostingRegressor for %s on %d rows...", listing_type, len(X_train))
    gb_pipeline.fit(X_train, y_train)
    gb_pred = gb_pipeline.predict(X_val)
    gb_metrics = regression_metrics(y_val, gb_pred, groups=X_val["city"].values, group_name="city")

    # ── Algorithm 2: RandomForestRegressor ──
    rf_model = RandomForestRegressor(
        n_estimators=300,
        max_depth=15,
        min_samples_leaf=3,
        random_state=seed,
        n_jobs=-1,
    )
    rf_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", rf_model),
    ])

    logger.info("Training RandomForestRegressor for %s on %d rows...", listing_type, len(X_train))
    rf_pipeline.fit(X_train, y_train)
    rf_pred = rf_pipeline.predict(X_val)
    rf_metrics = regression_metrics(y_val, rf_pred, groups=X_val["city"].values, group_name="city")

    # ── Select best algorithm by R² (higher is better) ──
    gb_r2 = gb_metrics.get("r2") or 0.0
    rf_r2 = rf_metrics.get("r2") or 0.0
    logger.info("Algorithm comparison — GradientBoosting R²=%.4f vs RandomForest R²=%.4f", gb_r2, rf_r2)

    if rf_r2 > gb_r2:
        pipeline = rf_pipeline
        metrics = rf_metrics
        y_pred = rf_pred
        winning_algo = "RandomForestRegressor"
        losing_algo = "GradientBoostingRegressor"
        losing_r2 = gb_r2
    else:
        pipeline = gb_pipeline
        metrics = gb_metrics
        y_pred = gb_pred
        winning_algo = "GradientBoostingRegressor"
        losing_algo = "RandomForestRegressor"
        losing_r2 = rf_r2

    logger.info("Winner: %s (R²=%.4f over %s R²=%.4f)", winning_algo, max(gb_r2, rf_r2), losing_algo, losing_r2)

    residuals = (y_val - y_pred).tolist()

    # Feature importance
    try:
        fitted_model = pipeline.named_steps["model"]
        fitted_pre = pipeline.named_steps["preprocessor"]
        feature_names_out = []
        for name, transformer, cols in fitted_pre.transformers_:
            if name == "cat":
                feature_names_out.extend(transformer.get_feature_names_out(cols))
            else:
                feature_names_out.extend(cols)
        importances = fitted_model.feature_importances_
        importance_pairs = list(zip(feature_names_out, importances))
        importance_pairs.sort(key=lambda x: x[1], reverse=True)
        important_features = [name for name, _ in importance_pairs[:10]]
    except Exception:
        important_features = ["area_sqm", "city", "property_type"]

    feature_schema = build_feature_schema(PRICE_ALL_FEATURES)

    metadata = {
        "model_name": model_name,
        "status": "ready",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_rows": len(X_train),
        "validation_rows": len(X_val),
        "model_version": "1.0.0",
        "compatibility_version": ARTIFACT_COMPAT_VERSION,
        "metrics": metrics,
        "target_definition": "property.price",
        "data_date_range": "CSV import (data_clean1.csv)",
        "important_features": important_features,
        "residuals": residuals[:500],  # Store subset for prediction intervals
        "seed": seed,
        "winning_algorithm": winning_algo,
        "algorithm_comparison": {
            "selection_metric": "r2",
            "GradientBoostingRegressor": {"r2": gb_r2},
            "RandomForestRegressor": {"r2": rf_r2},
            "runner_up": losing_algo,
            "runner_up_r2": losing_r2,
        },
    }

    save_artifact(
        model_name=model_name,
        model=pipeline,
        preprocessor=None,  # pipeline includes preprocessor
        feature_schema=feature_schema,
        metadata=metadata,
    )

    save_metrics(metrics, Path(f"ml/metadata/{model_name}_metrics.json"))

    # Also save algorithm comparison to a separate file for easy inspection
    comparison_data = {
        "winning_algorithm": winning_algo,
        "selection_metric": "r2",
        "GradientBoostingRegressor": {"r2": gb_r2, "metrics": gb_metrics},
        "RandomForestRegressor": {"r2": rf_r2, "metrics": rf_metrics},
    }
    save_metrics(comparison_data, Path(f"ml/metadata/{model_name}_algorithm_comparison.json"))

    # Generate model card
    card = generate_model_card(
        model_name=model_name,
        purpose=f"Estimate listing price for {listing_type} properties",
        target="property.price (TND)",
        training_data={
            "rows": len(X_train),
            "date_range": "CSV import (data_clean1.csv)",
            "source": "Database (CSV-imported Tunisian property listings)",
        },
        evaluation_data={
            "rows": len(X_val),
            "split": "80/20 train/validation",
        },
        metrics=metrics,
        limitations=[
            "Trained on CSV-imported data that may not represent all Tunisian markets",
            "No rental listings in training data (rent model will need more data)",
            "Does not account for market conditions, seasonality, or economic factors",
            "Estimate is advisory only — not a professional valuation",
        ],
        prohibited_uses=[
            "Do not use as a substitute for professional property valuation",
            "Do not use to automatically set or override agent-entered prices",
            "Do not use for mortgage lending decisions",
        ],
        fallback="Median price per m² of comparable properties in the same city and property type",
        retraining_recommendation="Retrain monthly or when new property data is imported",
        model_version="1.0.0",
        status="technical_demo",
    )
    save_report(card, f"{model_name}_model_card.md")

    report = generate_training_report(
        model_name=model_name,
        status="ready",
        row_counts=report_rows,
        split_sizes={"train": len(X_train), "validation": len(X_val)},
        metrics=metrics,
        artifact_paths={
            "model": f"ml/artifacts/{model_name}.joblib",
            "metadata": f"ml/metadata/{model_name}_metadata.json",
        },
    )
    save_report(report, f"{model_name}_training_report.md")

    logger.info("Training complete for %s: MAE=%.2f, R²=%.4f", model_name, metrics["mae"], metrics["r2"])
    return {"status": "ready", "model_name": model_name, "rows": len(X_train), "metrics": metrics}


def run(db_session=None) -> dict:
    """Main entry point for training price models."""
    if db_session is None:
        from app.database.session import SessionLocal
        db_session = SessionLocal()

    try:
        df = load_price_data(db_session)
        results = {}
        results["sale"] = train_price_model(df, "sale")
        results["rent"] = train_price_model(df, "rent")
        return results
    finally:
        if db_session is not None:
            db_session.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = run()
    print(json.dumps(result, indent=2, default=str))
    sys.exit(0)
