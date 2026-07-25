# Sale-price diagnostic report

Eligible records: 607; training: 485; validation: 122; seed: 42.

## Target distribution

Minimum: 350.00 TND; maximum: 2,500,000,000.00 TND; median: 500,000.00 TND; mean: 4,862,011.30 TND; standard deviation: 101,446,069.64 TND.

## Validation comparison

| Method | MAE | RMSE | R-squared |
|---|---:|---:|---:|
| training_mean | 20,941,219.86 | 226,272,807.62 | -0.008261 |
| training_median | 20,925,195.55 | 226,296,994.39 | -0.008476 |
| median_price_per_sqm | 25,381,933.73 | 228,846,783.40 | -0.031330 |
| official_random_forest | 20,800,613.88 | 226,278,545.94 | -0.008312 |

The official negative R-squared is retained. The highly skewed target and extreme upper-tail prices dominate squared error; current production readiness remains **not approved**. Full distributions, missing-value proxies, duplicates, regional/property-type counts, price-per-square-meter statistics, residuals, and anonymized largest errors are stored in `sale_price_diagnostics.json`.