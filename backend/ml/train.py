"""
Training script for RoadSense AI Road Damage Severity Classifier.
Trains Random Forest model on RDD2022-derived structural defect features.
Evaluates against held-out test split and baseline model.
Saves model artifacts and comprehensive evaluation metadata.
"""

import os
import json
import joblib
from datetime import datetime, timezone
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)

from backend.ml.rdd_annotation_parser import FEATURE_COLUMNS
from backend.ml.prepare_dataset import prepare_and_save_data, DATA_DIR

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")

def train_and_evaluate(model_version: str = "v1.2.0-rf-rdd2022") -> dict:
    """
    Trains Random Forest classifier on tabular RDD2022 road defect features.
    Saves serialized model and detailed metrics.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    train_path = os.path.join(DATA_DIR, "train.csv")
    test_path = os.path.join(DATA_DIR, "test.csv")
    
    if not os.path.exists(train_path) or not os.path.exists(test_path):
        print("Dataset not found. Generating fresh RDD2022 tabular features...")
        prepare_and_save_data()
        
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)
    
    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df["severity"]
    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df["severity"]
    
    classes = ["Low", "Medium", "High"]
    
    # 1. Train Baseline (Dummy classifier)
    baseline = DummyClassifier(strategy="most_frequent")
    baseline.fit(X_train, y_train)
    baseline_pred = baseline.predict(X_test)
    baseline_acc = float(accuracy_score(y_test, baseline_pred))
    
    # 2. Train Random Forest Model
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced"
    )
    rf_model.fit(X_train, y_train)
    
    # 3. Evaluate on held-out test data
    y_pred = rf_model.predict(X_test)
    y_prob = rf_model.predict_proba(X_test)
    
    acc = float(accuracy_score(y_test, y_pred))
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(
        y_test, y_pred, average="macro", zero_division=0
    )
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_test, y_pred, average="weighted", zero_division=0
    )
    
    # Per-class metrics
    class_metrics = {}
    for cls in classes:
        p, r, f, s = precision_recall_fscore_support(
            y_test == cls, y_pred == cls, average="binary", zero_division=0
        )
        class_metrics[cls] = {
            "precision": round(float(p), 4),
            "recall": round(float(r), 4),
            "f1_score": round(float(f), 4),
            "support": int((y_test == cls).sum())
        }
        
    cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()
    
    # Feature Importances
    feat_importances = dict(
        sorted(
            zip(FEATURE_COLUMNS, [round(float(x), 4) for x in rf_model.feature_importances_]),
            key=lambda x: x[1],
            reverse=True
        )
    )
    
    # 4. Serialize Model
    model_filename = "severity_rf_model.joblib"
    model_save_path = os.path.join(MODELS_DIR, model_filename)
    joblib.dump(rf_model, model_save_path)
    
    # 5. Metadata and validation report
    trained_timestamp = datetime.now(timezone.utc).isoformat()
    metadata = {
        "model_name": "RoadSense Severity Random Forest Classifier",
        "model_version": model_version,
        "algorithm": "RandomForestClassifier",
        "dataset_source": "RDD2022 (Road Damage Detection Challenge 2022, Seki Lab / Figshare DOI: 10.6084/m9.figshare.21431547)",
        "dataset_samples": {
            "total": len(train_df) + len(test_df),
            "train": len(train_df),
            "test": len(test_df),
        },
        "feature_schema": FEATURE_COLUMNS,
        "feature_importances": feat_importances,
        "supported_classes": classes,
        "label_source": "Deterministic heuristic engineering rules based on defect counts and bounding box area ratios (proxy labels, not ground truth)",
        "metrics": {
            "accuracy": round(acc, 4),  # Kept for backward compatibility
            "agreement_with_heuristic_labels": round(acc, 4),
            "label_source": "Deterministic heuristic engineering rules based on defect counts and area ratios (proxy labels, not ground truth)",
            "baseline_accuracy": round(baseline_acc, 4),
            "f1_macro": round(float(f1_macro), 4),
            "f1_weighted": round(float(f1_weighted), 4),
            "precision_macro": round(float(prec_macro), 4),
            "recall_macro": round(float(rec_macro), 4),
            "per_class": class_metrics,
            "confusion_matrix": cm,
            "confusion_matrix_labels": classes
        },
        "model_artifact": model_filename,
        "training_date": trained_timestamp,
        "last_validation_date": trained_timestamp,
        "validation_status": "VALIDATED_PROXY",
        "hyperparameters": {
            "n_estimators": 100,
            "max_depth": 8,
            "min_samples_split": 4,
            "min_samples_leaf": 2,
            "class_weight": "balanced"
        },
        "limitations": [
            "Proxy Labels: Severity classes are computed from deterministic heuristic rules, not certified civil engineering ground truth.",
            "Injected Label Noise: Approximately 5% adjacent-border noise was injected during dataset preparation to simulate real-world rater hesitation.",
            "Detector Not Field-Validated: Computer vision defect localization uses edge/morphological heuristics; localization IoU is not validated against certified human bounding boxes.",
            "Dataset Subset: Model is trained on a 1,200-sample tabular representation derived from RDD2022 distributions rather than the full multi-national raw image dataset.",
            "Decision Support Only: RoadSense outputs provide triage guidance to municipal engineers and must not replace on-site physical structural inspections."
        ]
    }
    
    metadata_path = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Model trained and saved to: {model_save_path}")
    print(f"Test Accuracy: {acc*100:.2f}% (Baseline Dummy: {baseline_acc*100:.2f}%)")
    print(f"Macro F1-Score: {f1_macro:.4f}")
    print("Confusion Matrix (Low, Medium, High):", cm)
    return metadata

if __name__ == "__main__":
    train_and_evaluate()
