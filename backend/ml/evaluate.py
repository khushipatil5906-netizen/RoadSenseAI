"""
Model evaluation and verification script for RoadSense AI.
Evaluates persisted model artifact against test set and generates performance summary.
"""

import os
import json
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from backend.ml.rdd_annotation_parser import FEATURE_COLUMNS
from backend.ml.prepare_dataset import DATA_DIR
from backend.ml.train import MODELS_DIR

def run_evaluation():
    model_path = os.path.join(MODELS_DIR, "severity_rf_model.joblib")
    metadata_path = os.path.join(MODELS_DIR, "model_metadata.json")
    test_path = os.path.join(DATA_DIR, "test.csv")
    
    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Model artifact not found at {model_path}. Run train.py first.")
        
    model = joblib.load(model_path)
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
        
    test_df = pd.read_csv(test_path)
    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df["severity"]
    
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    classes = ["Low", "Medium", "High"]
    cm = confusion_matrix(y_test, y_pred, labels=classes)
    
    print("=" * 60)
    print("ROADSENSE AI — MODEL EVALUATION SUMMARY")
    print(f"Model Version: {metadata.get('model_version')}")
    print(f"Algorithm:     {metadata.get('algorithm')}")
    print(f"Dataset:       {metadata.get('dataset_source')}")
    print(f"Test Accuracy: {acc * 100:.2f}%")
    print("-" * 60)
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=classes, digits=4))
    print("Confusion Matrix:")
    print(pd.DataFrame(cm, index=[f"True {c}" for c in classes], columns=[f"Pred {c}" for c in classes]))
    print("=" * 60)

if __name__ == "__main__":
    run_evaluation()
