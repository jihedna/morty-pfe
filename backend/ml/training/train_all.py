"""CLI command for training ML models.

Usage:
    python -m ml.training.train_all                    # Train all models
    python -m ml.training.train_all --model price      # Train only price estimator
    python -m ml.training.train_all --model lead       # Train only lead conversion
    python -m ml.training.train_all --model recommender # Train only recommender
"""

from __future__ import annotations

import argparse
import json
import logging
import sys


def main():
    parser = argparse.ArgumentParser(description="Train ML models for RE/MAX Smile AI")
    parser.add_argument(
        "--model",
        choices=["all", "price", "lead", "recommender"],
        default="all",
        help="Which model to train (default: all)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42)",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    results = {}

    if args.model in ("all", "price"):
        from ml.training.train_price_estimator import run as run_price
        logger = logging.getLogger("train_price")
        logger.info("=== Training Price Estimator ===")
        try:
            results["price"] = run_price()
        except Exception as e:
            logger.error("Price training failed: %s", e)
            results["price"] = {"status": "failed", "error": str(e)}

    if args.model in ("all", "lead"):
        from ml.training.train_lead_conversion import run as run_lead
        logger = logging.getLogger("train_lead")
        logger.info("=== Training Lead Conversion ===")
        try:
            results["lead"] = run_lead()
        except Exception as e:
            logger.error("Lead training failed: %s", e)
            results["lead"] = {"status": "failed", "error": str(e)}

    if args.model in ("all", "recommender"):
        from ml.training.train_recommender import run as run_recommender
        logger = logging.getLogger("train_recommender")
        logger.info("=== Training Recommender ===")
        try:
            results["recommender"] = run_recommender()
        except Exception as e:
            logger.error("Recommender training failed: %s", e)
            results["recommender"] = {"status": "failed", "error": str(e)}

    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    print(json.dumps(results, indent=2, default=str))

    sys.exit(0)


if __name__ == "__main__":
    main()
