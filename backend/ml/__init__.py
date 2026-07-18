"""Machine-learning foundation for RE/MAX Smile AI.

This package contains training, evaluation, and inference code for three
baseline ML systems:

1. Hybrid property recommendation (content-based + interaction weighting)
2. Lead-conversion prediction (classification)
3. Property listing-price estimation (regression)

All models are trained offline via CLI commands.  At runtime the inference
modules load saved artifacts and fall back to existing rule-based services
when artifacts are missing or incompatible.
"""
