# Model Card: price_estimator_sale

## Purpose
Estimate listing price for sale properties

## Target
property.price (TND)

## Status
technical_demo

## Model Version
1.0.0

## Training Data
- Rows: 485
- Date range: CSV import (data_clean1.csv)
- Source: Database (CSV-imported Tunisian property listings)

## Evaluation Data
- Rows: 122
- Split: 80/20 train/validation

## Metrics
```json
{
  "mae": 20800613.876996193,
  "rmse": 226278545.93960848,
  "r2": -0.00831197257188565,
  "median_ae": 147270.2590561319,
  "mape": 1847.2454701267084,
  "error_by_city": {
    "Ain Zaghouan": {
      "mae": 81096.30386271798,
      "rmse": 115983.50364687046,
      "count": 9
    },
    "Ariana Ville": {
      "mae": 113199.90625686804,
      "rmse": 154257.62434100796,
      "count": 2
    },
    "Bizerte Nord": {
      "mae": 429346.1569968212,
      "rmse": 642135.3127405082,
      "count": 3
    },
    "Borj Louzir": {
      "mae": 149616.3968016902,
      "rmse": 171594.8149457962,
      "count": 3
    },
    "Chotrana": {
      "mae": 107111.27564165073,
      "rmse": 125213.85213826825,
      "count": 3
    },
    "Djerba - Ajim": {
      "mae": 842840.2407864421,
      "rmse": 1431724.4599273189,
      "count": 3
    },
    "Djerba - Houmt Souk": {
      "mae": 363377.47814023495,
      "rmse": 656787.0770775963,
      "count": 17
    },
    "Djerba - Midoun": {
      "mae": 231979.86464990233,
      "rmse": 290012.0761298173,
      "count": 6
    },
    "Ennasr 1-2": {
      "mae": 121443.37773810845,
      "rmse": 229103.18830871157,
      "count": 8
    },
    "Gammarth": {
      "mae": 152856.3487430305,
      "rmse": 154621.79786756125,
      "count": 2
    },
    "Hammamet": {
      "mae": 152770.93876080506,
      "rmse": 172376.93741747062,
      "count": 4
    },
    "Jardins de Carthage": {
      "mae": 112931.75171473759,
      "rmse": 127302.1613009515,
      "count": 4
    },
    "Kal\u00e2at el-Andalous": {
      "mae": 174959.93731487868,
      "rmse": 175583.58295236444,
      "count": 2
    },
    "K\u00e9libia": {
      "mae": 336667.66589905025,
      "rmse": 459286.1673321458,
      "count": 2
    },
    "L'Aouina": {
      "mae": 331193.18436900835,
      "rmse": 616426.8485440835,
      "count": 5
    },
    "La Marsa": {
      "mae": 892276.9774637651,
      "rmse": 985780.5787640754,
      "count": 5
    },
    "La Soukra": {
      "mae": 558309.5851839257,
      "rmse": 862131.4432230813,
      "count": 8
    },
    "Mutuelle Ville": {
      "mae": 584509.2832300385,
      "rmse": 691527.6556825578,
      "count": 3
    },
    "Sidi Daoud": {
      "mae": 201632.36641665472,
      "rmse": 251119.10972108477,
      "count": 2
    }
  }
}
```

## Limitations
- Trained on CSV-imported data that may not represent all Tunisian markets
- No rental listings in training data (rent model will need more data)
- Does not account for market conditions, seasonality, or economic factors
- Estimate is advisory only — not a professional valuation

## Prohibited Uses
- Do not use as a substitute for professional property valuation
- Do not use to automatically set or override agent-entered prices
- Do not use for mortgage lending decisions

## Fallback
Median price per m² of comparable properties in the same city and property type

## Retraining Recommendation
Retrain monthly or when new property data is imported

## Generated At
2026-07-25T14:12:18.402155+00:00
