# ML Infrastructure — RE/MAX Smile AI

## Overview

The ML system provides three additive models that enhance the existing rule-based
business logic. **All models have safe fallbacks** — the application works correctly
even when no model is trained.

## Models

| Model | Purpose | Algorithms Compared | Selection Metric | Fallback |
|-------|---------|---------------------|------------------|----------|
| Property Recommender | Recommend properties to clients | KNN (cosine) vs TruncatedSVD (collaborative) | hit_rate@5 | Popularity-based ranking |
| Lead Conversion Predictor | Predict conversion probability for search requests | GradientBoostingClassifier vs RandomForestClassifier | ROC-AUC | Rule-based heuristic |
| Sale Price Estimator | Estimate listing price for sale properties | GradientBoostingRegressor vs RandomForestRegressor | R² | Median price per m² |
| Rent Price Estimator | Estimate monthly rent for rental properties | GradientBoostingRegressor vs RandomForestRegressor | R² | Median price per m² |

Each model trains **two algorithms** on the same train/validation split, evaluates both, and **saves the best-performing one**. The winning algorithm name and comparison metrics are stored in the model metadata.

## Architecture

```
backend/ml/
├── __init__.py
├── config.py                  # ML configuration constants
├── feature_definitions.py     # Feature lists for all models
├── artifacts/                 # Trained model artifacts (.joblib)
├── data/                      # Training data exports
├── metadata/                  # Model metadata and metrics (.json)
├── training/
│   ├── train_all.py           # CLI entry point for training all models
│   ├── train_price_estimator.py
│   ├── train_lead_conversion.py
│   └── train_recommender.py
├── evaluation/
│   ├── metrics.py             # Evaluation metric computation
│   └── reports.py             # Model cards and training reports
└── inference/
    ├── model_loader.py        # Safe artifact loading with validation
    ├── recommender.py         # Recommendation inference
    ├── lead_conversion.py     # Lead conversion prediction inference
    └── price_estimator.py     # Price estimation inference
```

## Training

### Prerequisites

```bash
cd backend
pip install -r requirements.txt
```

### Train all models

```bash
python -m ml.training.train_all
```

### Train a specific model

```bash
python -m ml.training.train_all --model price
python -m ml.training.train_all --model lead
python -m ml.training.train_all --model recommender
```

### Training output

- Model artifacts: `ml/artifacts/{model_name}.joblib`
- Metadata: `ml/metadata/{model_name}_metadata.json`
- Metrics: `ml/metadata/{model_name}_metrics.json`
- Model cards: `ml/metadata/{model_name}_model_card.md`
- Training reports: `ml/metadata/{model_name}_training_report.md`

## API Endpoints

All endpoints are under `/api/v1/ml`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/recommendations` | GET | Any user | Get property recommendations |
| `/leads/{request_id}/conversion-prediction` | GET | Agent/Manager | Get lead conversion prediction |
| `/price-estimation` | POST | Any user | Estimate property listing price |
| `/models` | GET | Manager | List all ML models with status |
| `/models/{model_name}` | GET | Manager | Get specific model status |
| `/models/{model_name}/metrics` | GET | Manager | Get model evaluation metrics |

## Interaction Tracking

User interactions are tracked via the `UserInteraction` model and `InteractionTrackingService`.

### Tracked events

- `property_view` — when a user views a property detail page
- `favorite_add` / `favorite_remove` — when a user adds/removes a favorite
- `appointment_requested` / `appointment_confirmed` / `appointment_completed` / `appointment_cancelled`
- `conversation_created` / `message_sent`
- `saved_search` / `agent_contact`
- `contract_completed` / `property_sold` / `property_rented` / `property_price_changed`

### Integration points

- `favorites.py` — tracks favorite add/remove
- `properties.py` — tracks property views (public detail page)
- `property_appointments.py` — tracks appointment creation and status changes
- `messaging.py` — tracks conversation creation and message sending

## Safe Fallbacks

Every ML model has a rule-based fallback that activates when:
1. No model artifact exists (status: `not_trained`)
2. Insufficient training data (status: `insufficient_training_data`)
3. Model loading fails (compatibility version mismatch, schema mismatch)
4. Prediction throws an exception

Fallbacks are non-blocking — the application continues to function normally.

## Responsible ML

- **Disclaimers**: All ML predictions include disclaimers and experimental labels
- **Prohibited uses**: Model cards document what each model should NOT be used for
- **No sensitive data**: Interaction tracking does not log message contents, passwords, or tokens
- **Advisory only**: Price estimates never automatically override agent-entered prices
- **Human oversight**: Lead conversion predictions are additive to the existing lead score
- **Model cards**: Each model has a generated model card with limitations and prohibited uses

## Model Registry

The `MLModelRegistryService` provides metadata for all registered models:
- Model status (ready, not_trained, insufficient_training_data)
- Training metadata (rows, date range, version)
- Evaluation metrics
- Target definition

Managers can view model status via the ML Models Dashboard at `/admin/ml-models`.
