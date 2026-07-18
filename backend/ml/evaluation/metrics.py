"""Evaluation metrics for classification, regression, and recommendation models."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from sklearn.metrics import (
    brier_score_loss,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    median_absolute_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)


def classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray | None = None,
    threshold: float = 0.5,
) -> dict:
    """Return a dict of classification metrics."""
    y_pred_binary = (y_prob >= threshold).astype(int) if y_prob is not None else y_pred

    metrics: dict = {
        "threshold": threshold,
        "precision": float(precision_score(y_true, y_pred_binary, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred_binary, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred_binary, zero_division=0)),
    }

    if y_prob is not None:
        metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else None
        metrics["brier_score"] = float(brier_score_loss(y_true, y_prob))
        metrics["pr_auc"] = _pr_auc(y_true, y_prob)

    cm = confusion_matrix(y_true, y_pred_binary)
    metrics["confusion_matrix"] = cm.tolist()
    return metrics


def _pr_auc(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Compute precision-recall AUC."""
    from sklearn.metrics import average_precision_score

    return float(average_precision_score(y_true, y_prob))


def regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    groups: np.ndarray | None = None,
    group_name: str | None = None,
) -> dict:
    """Return a dict of regression metrics."""
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    r2 = float(r2_score(y_true, y_pred))
    med_ae = float(median_absolute_error(y_true, y_pred))

    # MAPE — only where y_true is not near zero
    mask = np.abs(y_true) > 1e-6
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100) if mask.any() else None

    metrics: dict = {
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
        "median_ae": med_ae,
        "mape": mape,
    }

    if groups is not None and group_name:
        unique_groups = np.unique(groups)
        per_group: dict[str, dict] = {}
        for g in unique_groups:
            g_mask = groups == g
            if g_mask.sum() < 2:
                continue
            per_group[str(g)] = {
                "mae": float(mean_absolute_error(y_true[g_mask], y_pred[g_mask])),
                "rmse": float(np.sqrt(np.mean((y_true[g_mask] - y_pred[g_mask]) ** 2))),
                "count": int(g_mask.sum()),
            }
        metrics[f"error_by_{group_name}"] = per_group

    return metrics


def recommendation_metrics(
    recommended: list[list[str]],
    relevant: list[set[str]],
    k: int = 5,
    catalog_size: int = 0,
) -> dict:
    """Compute recommendation metrics: Precision@K, Recall@K, HitRate@K, NDCG@K."""
    precision_sum = 0.0
    recall_sum = 0.0
    hits = 0
    ndcg_sum = 0.0
    n_users = len(recommended)

    if n_users == 0:
        return {"precision_at_k": 0, "recall_at_k": 0, "hit_rate_at_k": 0, "ndcg_at_k": 0, "catalog_coverage": 0}

    all_recommended = set()
    for recs, rel in zip(recommended, relevant):
        recs_k = recs[:k]
        if not rel:
            continue
        hit_set = set(recs_k) & rel
        precision_sum += len(hit_set) / max(len(recs_k), 1)
        recall_sum += len(hit_set) / max(len(rel), 1)
        if hit_set:
            hits += 1
        # NDCG@K
        dcg = sum(1.0 / np.log2(i + 2) for i, r in enumerate(recs_k) if r in rel)
        idcg = sum(1.0 / np.log2(i + 2) for i in range(min(len(rel), k)))
        ndcg_sum += dcg / idcg if idcg > 0 else 0
        all_recommended.update(recs_k)

    return {
        "precision_at_k": precision_sum / n_users,
        "recall_at_k": recall_sum / n_users,
        "hit_rate_at_k": hits / n_users,
        "ndcg_at_k": ndcg_sum / n_users,
        "catalog_coverage": len(all_recommended) / catalog_size if catalog_size > 0 else 0,
    }


def save_metrics(metrics: dict, path: Path) -> None:
    """Save metrics dict as JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, default=str)
