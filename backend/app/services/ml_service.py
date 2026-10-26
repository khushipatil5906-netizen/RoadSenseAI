"""
Machine Learning Inference Service for RoadSense AI.
Provides image defect detection, tabular Random Forest severity inference,
and feature explanation.
"""

import os
import json
import joblib
from typing import Dict, Any, Optional, Tuple, List
import pandas as pd
import numpy as np

from backend.app.core.config import settings
from backend.ml.rdd_annotation_parser import FEATURE_COLUMNS
from backend.ml.image_detector import analyze_road_image, generate_annotated_image
from backend.app.services.storage_service import save_image_file

class MLService:
    def __init__(self):
        self.model = None
        self.metadata = None
        self._load_model()

    def _load_model(self):
        model_path = os.path.join(settings.ML_MODEL_DIR, "severity_rf_model.joblib")
        metadata_path = os.path.join(settings.ML_MODEL_DIR, "model_metadata.json")
        
        if os.path.exists(model_path) and os.path.exists(metadata_path):
            try:
                self.model = joblib.load(model_path)
                with open(metadata_path, "r") as f:
                    self.metadata = json.load(f)
                print(f"[MLService] Loaded model: {self.metadata.get('model_version')}")
            except Exception as e:
                print(f"[MLService] Failed loading model: {e}")
                self.model = None
                self.metadata = None
        else:
            print(f"[MLService] Model artifact not found at {model_path}.")

    def is_available(self) -> bool:
        return self.model is not None and self.metadata is not None

    def get_info(self) -> Dict[str, Any]:
        if not self.is_available():
            return {
                "model_name": "RoadSense Severity Random Forest Classifier",
                "model_version": "Not Configured",
                "algorithm": "RandomForestClassifier",
                "dataset_source": "RDD2022",
                "validation_status": "NOT_CONFIGURED",
                "limitations": ["Model artifact not loaded. Run train script or check models directory."]
            }
        return self.metadata

    def predict_from_features(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs severity classification using tabular defect features.
        """
        if not self.is_available():
            return {
                "predicted_severity": "Medium",
                "confidence": 0.50,
                "probabilities": {"Low": 0.25, "Medium": 0.50, "High": 0.25},
                "features_used": features_dict,
                "model_version": "DEMO-FALLBACK",
                "explanation": "Model artifact not loaded; fallback demo prediction used.",
                "limitations": "DEMO MODE: Model unconfigured."
            }

        # Build feature vector in exact required schema order
        row = [float(features_dict.get(col, 0.0)) for col in FEATURE_COLUMNS]
        df_in = pd.DataFrame([row], columns=FEATURE_COLUMNS)

        pred = self.model.predict(df_in)[0]
        probs = self.model.predict_proba(df_in)[0]
        classes = self.model.classes_

        prob_dict = {str(c): round(float(p), 4) for c, p in zip(classes, probs)}
        confidence = prob_dict.get(str(pred), 0.50)

        # Build human-readable explanation
        reasons = []
        potholes = features_dict.get("pothole_count", 0)
        alligator = features_dict.get("alligator_crack_count", 0)
        largest_box = features_dict.get("largest_bbox_area_ratio", 0.0)

        if potholes > 0:
            reasons.append(f"{potholes} localized pothole depression(s) identified")
        if alligator > 0:
            reasons.append(f"{alligator} alligator/fatigue crack network(s) identified")
        if largest_box > 0.08:
            reasons.append(f"significant road area disruption (largest bbox ratio: {largest_box*100:.1f}%)")
        if not reasons:
            reasons.append("minor superficial surface linear cracks with low area footprint")

        explanation = f"Classified as {pred} severity based on: {'; '.join(reasons)}."

        # Compute SHAP feature contributions
        shap_contribs = None
        try:
            from backend.ml.compare_models import explain_prediction
            shap_contribs = explain_prediction(features_dict, model=self.model)
        except Exception as e:
            print(f"[MLService] SHAP computation warning: {e}")

        return {
            "predicted_severity": str(pred),
            "confidence": round(confidence, 4),
            "probabilities": prob_dict,
            "features_used": {col: features_dict.get(col, 0) for col in FEATURE_COLUMNS},
            "model_version": self.metadata.get("model_version", "v1.0.0"),
            "explanation": explanation,
            "shap_contributions": shap_contribs,
            "limitations": "Model uses proxy heuristic labels trained on RDD2022 dataset features. Must be confirmed by human field inspection."
        }

    def analyze_image_and_predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Runs full pipeline:
        1. Computer vision defect localization (bounding boxes, categories)
        2. Generates annotated image visualization
        3. Extracts RDD2022 tabular features
        4. Predicts severity with Random Forest model
        """
        # Step 1: Detect defects
        analysis = analyze_road_image(image_bytes)
        detections = analysis["detections"]
        features = analysis["features"]

        # Step 2: Generate annotated image
        annotated_bytes = generate_annotated_image(image_bytes, detections)
        annotated_url, _ = save_image_file(annotated_bytes, ext=".jpg")

        # Step 3: Tabular prediction
        pred_result = self.predict_from_features(features)
        pred_result["detections"] = detections
        pred_result["annotated_image_url"] = annotated_url

        return pred_result

ml_service = MLService()
