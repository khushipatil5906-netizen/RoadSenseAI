# Hand-Labeled Validation Protocol

## Purpose
To evaluate the severity classifier against true independent human engineering assessments rather than synthetic proxy labels.

## Instructions for Annotators
1. Place road inspection images in `images/` directory matching the `image_id`.
2. Three independent inspectors fill `rater1_severity`, `rater2_severity`, and `rater3_severity` with one of: `Low`, `Medium`, or `High`.
3. Save this CSV without altering the `image_id` column.
4. Run `python -m backend.ml.evaluate_validation` to compute Fleiss' Kappa inter-rater agreement and model evaluation metrics.
