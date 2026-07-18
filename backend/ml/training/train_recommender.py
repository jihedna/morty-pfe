"""Train the hybrid property recommendation model.

Combines content-based property similarity with weighted user interactions.
Falls back to insufficient_training_data when interaction data is inadequate.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import TruncatedSVD

from ml.config import (
    ARTIFACT_COMPAT_VERSION,
    DEFAULT_SEED,
    INTERACTION_WEIGHTS,
    MIN_ROWS_RECOMMENDER_INTERACTIONS,
    MIN_ROWS_RECOMMENDER_PROPERTIES,
    MIN_ROWS_RECOMMENDER_USERS,
    MODEL_RECOMMENDER,
)
from ml.evaluation.metrics import recommendation_metrics, save_metrics
from ml.evaluation.reports import generate_model_card, generate_training_report, save_report
from ml.feature_definitions import (
    PROPERTY_BOOLEAN,
    PROPERTY_CATEGORICAL,
    PROPERTY_FEATURE_FLAGS,
    PROPERTY_NUMERIC,
    build_feature_schema,
)
from ml.inference.model_loader import save_artifact

logger = logging.getLogger(__name__)


def load_recommender_data(db_session) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load property and interaction data for recommender training."""
    from app.models.property import Property, PropertyStatus
    from app.models.property_favorite import PropertyFavorite
    from app.models.user_interaction import UserInteraction

    # Properties
    properties = (
        db_session.query(Property)
        .filter(Property.status == PropertyStatus.AVAILABLE.value)
        .all()
    )

    prop_rows = []
    for prop in properties:
        row = {
            "property_id": str(prop.id),
            "price": float(prop.price) if prop.price else 0,
            "area_sqm": float(prop.area_sqm) if prop.area_sqm else 0,
            "bedrooms": prop.bedrooms or 0,
            "bathrooms": prop.bathrooms or 0,
            "rooms": prop.rooms or 0,
            "floor_number": prop.floor_number or 0,
            "total_floors": prop.total_floors or 0,
            "construction_year": prop.construction_year or 0,
            "latitude": float(prop.latitude) if prop.latitude else 0.0,
            "longitude": float(prop.longitude) if prop.longitude else 0.0,
            "city": prop.city or "Unknown",
            "district": prop.district or "Unknown",
            "property_type": prop.property_type or "unknown",
            "listing_type": prop.listing_type or "sale",
            "is_furnished": 1 if prop.is_furnished else 0,
            "is_featured": 1 if prop.is_featured else 0,
        }
        prop_features = {f.feature for f in (prop.features or [])}
        for flag in PROPERTY_FEATURE_FLAGS:
            row[f"feat_{flag}"] = 1 if flag in prop_features else 0
        prop_rows.append(row)

    prop_df = pd.DataFrame(prop_rows)

    # Interactions
    interactions = db_session.query(UserInteraction).all()

    inter_rows = []
    for inter in interactions:
        if inter.property_id is None:
            continue
        weight = INTERACTION_WEIGHTS.get(inter.event_type, 1)
        inter_rows.append({
            "user_id": str(inter.user_id),
            "property_id": str(inter.property_id),
            "event_type": inter.event_type,
            "weight": weight,
            "occurred_at": inter.occurred_at.isoformat() if inter.occurred_at else None,
        })

    # Also use favorites as interactions
    favorites = db_session.query(PropertyFavorite).all()
    for fav in favorites:
        inter_rows.append({
            "user_id": str(fav.user_id),
            "property_id": str(fav.property_id),
            "event_type": "favorite_add",
            "weight": INTERACTION_WEIGHTS["favorite_add"],
            "occurred_at": fav.created_at.isoformat() if fav.created_at else None,
        })

    inter_df = pd.DataFrame(inter_rows)
    return prop_df, inter_df


def train_recommender(
    prop_df: pd.DataFrame,
    inter_df: pd.DataFrame,
    seed: int = DEFAULT_SEED,
) -> dict:
    """Train the hybrid property recommender."""
    n_users = inter_df["user_id"].nunique() if len(inter_df) > 0 else 0
    n_properties = len(prop_df)
    n_interactions = len(inter_df)

    report_rows = {
        "properties": n_properties,
        "users_with_interactions": n_users,
        "total_interactions": n_interactions,
    }

    if (
        n_users < MIN_ROWS_RECOMMENDER_USERS
        or n_properties < MIN_ROWS_RECOMMENDER_PROPERTIES
        or n_interactions < MIN_ROWS_RECOMMENDER_INTERACTIONS
    ):
        logger.warning(
            "Insufficient data for recommender: %d users, %d properties, %d interactions",
            n_users,
            n_properties,
            n_interactions,
        )
        metadata = {
            "model_name": MODEL_RECOMMENDER,
            "status": "insufficient_training_data",
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "training_rows": n_interactions,
            "properties": n_properties,
            "users": n_users,
            "minimum_users": MIN_ROWS_RECOMMENDER_USERS,
            "minimum_properties": MIN_ROWS_RECOMMENDER_PROPERTIES,
            "minimum_interactions": MIN_ROWS_RECOMMENDER_INTERACTIONS,
            "compatibility_version": ARTIFACT_COMPAT_VERSION,
            "model_version": "0.0.0",
            "metrics": {},
            "target_definition": "property relevance score for user",
            "data_date_range": "N/A",
        }
        save_artifact(MODEL_RECOMMENDER, model=None, metadata=metadata)
        report = generate_training_report(
            model_name=MODEL_RECOMMENDER,
            status="insufficient_training_data",
            row_counts=report_rows,
            failure_reason=(
                f"Need {MIN_ROWS_RECOMMENDER_USERS} users, "
                f"{MIN_ROWS_RECOMMENDER_PROPERTIES} properties, "
                f"{MIN_ROWS_RECOMMENDER_INTERACTIONS} interactions. "
                f"Got {n_users}, {n_properties}, {n_interactions}."
            ),
        )
        save_report(report, f"{MODEL_RECOMMENDER}_training_report.md")
        return {"status": "insufficient_training_data", "users": n_users, "properties": n_properties, "interactions": n_interactions}

    # Build property feature matrix
    feature_cols = PROPERTY_NUMERIC + PROPERTY_BOOLEAN + [f"feat_{f}" for f in PROPERTY_FEATURE_FLAGS]
    X_props = prop_df[feature_cols].fillna(0).values

    # Normalize
    scaler = StandardScaler()
    X_props_scaled = scaler.fit_transform(X_props)

    # Build user-property interaction matrix
    user_item_matrix = inter_df.pivot_table(
        index="user_id",
        columns="property_id",
        values="weight",
        aggfunc="sum",
        fill_value=0,
    )

    prop_ids = prop_df["property_id"].tolist()

    # ── Algorithm 1: KNN (content-based with cosine similarity) ──
    knn = NearestNeighbors(n_neighbors=min(20, len(prop_df)), metric="cosine", algorithm="brute")
    knn.fit(X_props_scaled)
    logger.info("Trained KNN content-based model with %d properties", len(prop_df))

    # ── Algorithm 2: TruncatedSVD (collaborative filtering) ──
    n_components = min(20, min(user_item_matrix.shape) - 1) if min(user_item_matrix.shape) > 1 else 2
    n_components = max(2, n_components)
    svd = TruncatedSVD(n_components=n_components, random_state=seed)
    svd.fit(user_item_matrix.values)
    logger.info("Trained TruncatedSVD collaborative model with %d components", n_components)

    # Evaluate both algorithms: leave-one-out per user
    # ── KNN evaluation ──
    knn_recommended = []
    knn_relevant = []

    for user_id in user_item_matrix.index:
        user_interactions = inter_df[inter_df["user_id"] == user_id].sort_values("occurred_at")
        if len(user_interactions) < 2:
            continue

        held_out = user_interactions.iloc[-1]["property_id"]
        train_interactions = user_interactions.iloc[:-1]
        interacted_props = set(train_interactions["property_id"].tolist())

        # Build user vector from training interactions
        user_vector = np.zeros(X_props_scaled.shape[1])
        for _, row in train_interactions.iterrows():
            pid = row["property_id"]
            if pid in prop_ids:
                idx = prop_ids.index(pid)
                user_vector += X_props_scaled[idx] * row["weight"]

        if np.linalg.norm(user_vector) == 0:
            continue

        distances, indices = knn.kneighbors(user_vector.reshape(1, -1), n_neighbors=min(10, len(prop_df)))
        recs = [prop_ids[idx] for idx in indices[0] if prop_ids[idx] not in interacted_props]

        knn_recommended.append(recs)
        knn_relevant.append({held_out})

    knn_metrics = recommendation_metrics(
        recommended=knn_recommended,
        relevant=knn_relevant,
        k=5,
        catalog_size=n_properties,
    ) if knn_recommended else {"precision_at_k": 0, "recall_at_k": 0, "hit_rate_at_k": 0, "ndcg_at_k": 0, "catalog_coverage": 0}

    # ── SVD evaluation ──
    svd_recommended = []
    svd_relevant = []

    for user_id in user_item_matrix.index:
        user_interactions = inter_df[inter_df["user_id"] == user_id].sort_values("occurred_at")
        if len(user_interactions) < 2:
            continue

        held_out = user_interactions.iloc[-1]["property_id"]
        train_interactions = user_interactions.iloc[:-1]
        interacted_props = set(train_interactions["property_id"].tolist())

        # Reconstruct user vector from SVD latent factors
        user_idx = list(user_item_matrix.index).index(user_id)
        user_latent = svd.transform(user_item_matrix.values[user_idx:user_idx + 1])
        reconstructed = user_latent @ svd.components_

        # Score properties by reconstructed preference
        prop_scores = []
        for j, pid in enumerate(user_item_matrix.columns):
            if pid in interacted_props:
                continue
            if pid in prop_ids:
                prop_scores.append((reconstructed[0, j], pid))

        prop_scores.sort(reverse=True)
        recs = [pid for _, pid in prop_scores[:10]]

        svd_recommended.append(recs)
        svd_relevant.append({held_out})

    svd_metrics = recommendation_metrics(
        recommended=svd_recommended,
        relevant=svd_relevant,
        k=5,
        catalog_size=n_properties,
    ) if svd_recommended else {"precision_at_k": 0, "recall_at_k": 0, "hit_rate_at_k": 0, "ndcg_at_k": 0, "catalog_coverage": 0}

    # ── Select best algorithm by hit_rate@k ──
    knn_hr = knn_metrics.get("hit_rate_at_k", 0)
    svd_hr = svd_metrics.get("hit_rate_at_k", 0)
    logger.info("Algorithm comparison — KNN hit_rate@5=%.4f vs SVD hit_rate@5=%.4f", knn_hr, svd_hr)

    if svd_hr > knn_hr:
        winning_model = svd
        winning_algo = "TruncatedSVD"
        losing_algo = "KNN"
        metrics = svd_metrics
        losing_hr = knn_hr
    else:
        winning_model = knn
        winning_algo = "KNN"
        losing_algo = "TruncatedSVD"
        metrics = knn_metrics
        losing_hr = svd_hr

    logger.info("Winner: %s (hit_rate@5=%.4f over %s hit_rate@5=%.4f)", winning_algo, max(knn_hr, svd_hr), losing_algo, losing_hr)

    feature_schema = build_feature_schema(feature_cols)

    metadata = {
        "model_name": MODEL_RECOMMENDER,
        "status": "ready",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_rows": n_interactions,
        "properties": n_properties,
        "users": n_users,
        "model_version": "1.0.0",
        "compatibility_version": ARTIFACT_COMPAT_VERSION,
        "metrics": metrics,
        "target_definition": "property relevance score for user (hybrid content + interaction)",
        "data_date_range": "N/A",
        "interaction_weights": INTERACTION_WEIGHTS,
        "seed": seed,
        "winning_algorithm": winning_algo,
        "algorithm_comparison": {
            "selection_metric": "hit_rate_at_k",
            "KNN": {"hit_rate_at_k": knn_hr},
            "TruncatedSVD": {"hit_rate_at_k": svd_hr},
            "runner_up": losing_algo,
            "runner_up_hit_rate_at_k": losing_hr,
        },
    }

    save_artifact(
        model_name=MODEL_RECOMMENDER,
        model=winning_model,
        preprocessor=scaler,
        feature_schema=feature_schema,
        metadata=metadata,
    )

    save_metrics(metrics, Path(f"ml/metadata/{MODEL_RECOMMENDER}_metrics.json"))

    # Also save algorithm comparison to a separate file for easy inspection
    comparison_data = {
        "winning_algorithm": winning_algo,
        "selection_metric": "hit_rate_at_k",
        "KNN": {"hit_rate_at_k": knn_hr, "metrics": knn_metrics},
        "TruncatedSVD": {"hit_rate_at_k": svd_hr, "metrics": svd_metrics},
    }
    save_metrics(comparison_data, Path(f"ml/metadata/{MODEL_RECOMMENDER}_algorithm_comparison.json"))

    card = generate_model_card(
        model_name=MODEL_RECOMMENDER,
        purpose="Recommend relevant properties to clients based on preferences and interactions",
        target="Property relevance score (cosine similarity in content + interaction space)",
        training_data={
            "rows": n_interactions,
            "date_range": "N/A",
            "source": "Database (user interactions, favorites, property features)",
        },
        evaluation_data={
            "rows": len(recommended_list),
            "split": "Leave-one-out per user",
        },
        metrics=metrics,
        limitations=[
            "Cold-start problem for new users with no interaction history",
            "Limited interaction data reduces recommendation quality",
            "Content-based features may not capture all user preferences",
            "Does not account for temporal preferences or seasonality",
        ],
        prohibited_uses=[
            "Do not use to exclude properties from client search results",
            "Do not use as the sole source of property discovery",
            "Do not expose recommendation scores to clients",
        ],
        fallback="Popularity-based ranking (featured properties first, then by recency)",
        retraining_recommendation="Retrain weekly once interaction tracking accumulates sufficient data",
        model_version="1.0.0",
        status="technical_demo",
    )
    save_report(card, f"{MODEL_RECOMMENDER}_model_card.md")

    report = generate_training_report(
        model_name=MODEL_RECOMMENDER,
        status="ready",
        row_counts=report_rows,
        metrics=metrics,
    )
    save_report(report, f"{MODEL_RECOMMENDER}_training_report.md")

    logger.info("Recommender training complete: P@5=%.4f, HR@5=%.4f", metrics["precision_at_k"], metrics["hit_rate_at_k"])
    return {"status": "ready", "users": n_users, "properties": n_properties, "interactions": n_interactions, "metrics": metrics}


def run(db_session=None) -> dict:
    """Main entry point."""
    if db_session is None:
        from app.database.session import SessionLocal
        db_session = SessionLocal()

    try:
        prop_df, inter_df = load_recommender_data(db_session)
        return train_recommender(prop_df, inter_df)
    finally:
        db_session.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = run()
    print(json.dumps(result, indent=2, default=str))
    sys.exit(0)
