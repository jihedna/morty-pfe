# Machine Learning Models and Training

## Overview

RE/MAX Smile AI uses scikit-learn models to improve property recommendations, price estimation, lead-conversion prediction, and agent-to-property matching. The trained models are additive: the application keeps working through deterministic fallbacks when an artifact is missing, incompatible, or trained on insufficient data.

The trainable registry contains four artifact names:

| Artifact | Task | Candidate algorithms | Winner selected by |
|---|---|---|---|
| `property_recommender` | Rank properties for a client | Cosine KNN, Truncated SVD | Hit rate at 5 |
| `lead_conversion` | Predict whether a request converts | Gradient Boosting, Random Forest | ROC-AUC |
| `price_estimator_sale` | Estimate a sale price | Gradient Boosting, Random Forest | R-squared |
| `price_estimator_rent` | Estimate monthly rent | Gradient Boosting, Random Forest | R-squared |

The agent-property matcher also uses KNN, but it is fitted on the current property catalogue at inference time and is not produced by the training CLI.

## Shared training design

- Python libraries: pandas, NumPy, scikit-learn, and joblib
- Default random seed: `42`
- Categorical preprocessing: `OneHotEncoder(handle_unknown="ignore")`
- Numeric preprocessing: `StandardScaler`
- Artifact compatibility version: `1.0`
- Database access: the same SQLAlchemy/PostgreSQL models used by the API
- Saved schema: each artifact records its ordered feature list so inference can reject incompatible artifacts
- Responsible features: names, contact details, message text, credentials, and sensitive demographic attributes are explicitly prohibited

Training outputs are written below `backend/ml/`:

```text
artifacts/{model_name}.joblib
metadata/{model_name}_metadata.json
metadata/{model_name}_metrics.json
metadata/{model_name}_algorithm_comparison.json
metadata/{model_name}_model_card.md
metadata/{model_name}_training_report.md
```

## Property recommender

### Training data

The recommender loads active property records plus user interaction history and favorites. Property content includes city, district, property/listing type, price, area, rooms, bedrooms, bathrooms, floor data, construction year, coordinates, furnishing/featured flags, and amenity flags such as parking, elevator, balcony, garden, pool, heating, security, and accessibility.

Implicit feedback is converted to relevance weights. The configured signals include property view (`1`), search click (`2`), saved-search match (`3`), favorite (`4`), agent contact/conversation (`5`), requested appointment (`7`), confirmed appointment (`9`), and completed transaction (`15`).

Training requires at least 100 users, 500 properties, and 1,000 interactions. If any threshold is not met, metadata is saved with `insufficient_training_data` and inference uses popularity ranking.

### Algorithms and evaluation

1. Property numeric features are standardized and a content-based `NearestNeighbors` model is fitted with cosine distance, brute-force search, and at most 20 neighbors.
2. A user-item interaction matrix is built and a collaborative `TruncatedSVD` model is fitted with up to 20 components.
3. Both candidates are evaluated with leave-one-out evaluation per user at `k=5`.
4. Precision@5, recall@5, hit rate@5, NDCG@5, and catalogue coverage are recorded.
5. The candidate with the higher hit rate@5 is saved.

During inference, already interacted-with properties are excluded where appropriate. If no trained model can be loaded, available properties are ranked by popularity signals.

## Lead-conversion predictor

### Target and data

The binary target represents conversion within 90 days of creation. The label hierarchy uses the strongest available event: completed contract, completed appointment, confirmed appointment, or an appointment request combined with an active conversation.

Features cover:

- Request: property/listing type, city, urgency, budgets, completeness, bedrooms, bathrooms, area, and request age
- Engagement: property views, favorites, saved searches, conversations, messages, appointment requests, account age, and recent activity
- Assigned agent: response time, workload, appointment completion rate, and historical conversion rate

Training requires at least 500 total examples, including 50 positive and 50 negative labels.

### Training and evaluation

1. Missing categorical values are encoded and numeric features are scaled.
2. Data is split 80/20 using a stratified split and seed `42`.
3. `GradientBoostingClassifier` is trained with 200 estimators, depth 4, and learning rate 0.1.
4. `RandomForestClassifier` is trained with 300 trees, depth 10, minimum leaf size 5, balanced class weights, and parallel workers.
5. Both candidates use a 0.5 classification threshold. Accuracy, precision, recall, F1, ROC-AUC, confusion values, and related classification metrics are recorded.
6. The candidate with the higher validation ROC-AUC is saved.

Inference maps probability into low, medium, or high priority bands at `0.35` and `0.65`. If the artifact is unavailable, a heuristic based on budget, location, engagement, and urgency is returned. The prediction supports agent prioritization and does not replace the separate deterministic lead score or human judgment.

## Sale and rent price estimators

### Training data and features

Two regressors are trained independently by filtering properties on `listing_type`: one for sale and one for rent. The target is `property.price`.

Features include city, district, property type, area, bedrooms, bathrooms, rooms, floor, construction year, coordinates, furnished state, and the configured amenity flags. Each listing type requires at least 500 records.

### Training and evaluation

1. Missing categorical values become `Unknown`; numeric missing values are filled before preprocessing.
2. Data is randomly split 80/20 with seed `42`.
3. `GradientBoostingRegressor` is trained with 200 estimators, depth 5, and learning rate 0.1.
4. `RandomForestRegressor` is trained with 300 trees, depth 15, minimum leaf size 3, and parallel workers.
5. Metrics include R-squared, MAE, RMSE, MAPE, and city-level group metrics.
6. The candidate with the higher validation R-squared is saved for that listing type.
7. A sample of validation residuals is stored to support uncertainty ranges during prediction.

When no compatible artifact exists, inference estimates price from the median price per square metre of comparable properties in the same city and property type. Estimates are advisory and never overwrite an agent's listing price automatically.

## Agent-property KNN matcher

The manager-facing agent property recommendation endpoint performs content matching on demand. Current properties are encoded by property type and territory, with price standardized. A brute-force Euclidean `NearestNeighbors` model is fitted to the current catalogue, and the agent query uses specialization, territory, and the midpoint of the agent's budget range. Because it is fitted at request time, it has no joblib artifact or offline evaluation report.

This model is different from client-to-agent matching. Client-to-agent compatibility is a deterministic 0-100 weighted rule: property type 30%, territory 30%, budget overlap 25%, and availability 15%.

## How to train the models

From the project root, prepare the backend and database first:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python seed_database.py
```

Update `.env` with a valid PostgreSQL `DATABASE_URL` and JWT settings. The training scripts query the configured database, so meaningful training requires enough real or approved synthetic history to meet the thresholds above.

Train everything:

```powershell
python -m ml.training.train_all
```

Or train one model family:

```powershell
python -m ml.training.train_all --model recommender
python -m ml.training.train_all --model lead
python -m ml.training.train_all --model price
```

Use a different reproducible seed when needed:

```powershell
python -m ml.training.train_all --seed 123
```

The `price` option trains both sale and rent estimators. The command prints a JSON training summary. A successful model has status `ready`; insufficient datasets produce `insufficient_training_data` rather than an unusable model.

## Validation and deployment

1. Inspect each generated training report, model card, metrics file, and algorithm comparison.
2. Confirm that the winning metric is acceptable on representative validation data and review group metrics for location-specific errors.
3. Keep the `.joblib` file and its metadata together; artifact loading checks the compatibility version and feature schema.
4. Run backend ML tests with `pytest tests/test_ml.py -q` and the complete backend suite before deployment.
5. Start the API and inspect model status through `/api/v1/ml/models` or the manager page `/admin/ml-models`.
6. Monitor data drift and prediction quality, then retrain manually when the property catalogue or user behavior changes materially.

The current project does not schedule automatic retraining, promote models through a remote registry, or provide an API endpoint that triggers training.

## Inference endpoints

| Method and endpoint | Purpose |
|---|---|
| `GET /api/v1/ml/recommendations` | Client property recommendations |
| `GET /api/v1/ml/leads/{request_id}/conversion-prediction` | Agent/manager conversion prediction |
| `POST /api/v1/ml/price-estimation` | Sale or rent estimate |
| `GET /api/v1/ml/models` | Manager model registry |
| `GET /api/v1/ml/models/{model_name}` | Manager model status |
| `GET /api/v1/ml/models/{model_name}/metrics` | Manager evaluation metrics |
| `GET /api/v1/agents/{agent_id}/property-recommendations` | Manager agent-property KNN results |

All predictions are decision-support outputs, not guarantees of property value, investment performance, client conversion, or fair allocation.
