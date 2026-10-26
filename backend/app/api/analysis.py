import os
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.api.deps import require_admin
from backend.app.schemas.analysis import (
    TabularPredictRequest,
    PredictResponse,
    ModelInfoResponse,
    ModelMetricsResponse
)
from backend.app.services.ml_service import ml_service
from backend.app.services.storage_service import validate_image_upload
from backend.ml.train import train_and_evaluate

router = APIRouter()

@router.post("/predict-severity", response_model=PredictResponse)
async def predict_severity(
    image: Optional[UploadFile] = File(None),
    tabular: Optional[str] = Body(None),
):
    """
    Predicts road damage severity using:
    A) Uploaded image: runs computer vision defect localization + Random Forest severity classifier.
    B) Tabular defect features: runs Random Forest classifier directly on RDD2022 feature schema.
    """
    if image and image.filename:
        contents = await image.read()
        validate_image_upload(image, contents)
        result = ml_service.analyze_image_and_predict(contents)
        return result

    if tabular:
        try:
            feat_dict = json.loads(tabular)
            result = ml_service.predict_from_features(feat_dict)
            return result
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in tabular features body.")

    raise HTTPException(status_code=400, detail="Either an image file or tabular defect features must be provided.")

@router.get("/info", response_model=ModelInfoResponse)
def get_model_info():
    """Returns model metadata, architecture, features, and validation details."""
    info = ml_service.get_info()
    if not ml_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Model not yet configured. Please run training pipeline."
        )
    return info

@router.get("/metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    """Returns evaluated accuracy, baseline comparison, and confusion matrix."""
    info = ml_service.get_info()
    if not ml_service.is_available() or "metrics" not in info:
        raise HTTPException(
            status_code=503,
            detail="Model metrics unavailable. Model has not been evaluated."
        )
    m = info["metrics"]
    return {
        "model_version": info.get("model_version", "v1.0.0"),
        "accuracy": m["accuracy"],
        "agreement_with_heuristic_labels": m.get("agreement_with_heuristic_labels", m["accuracy"]),
        "label_source": info.get("label_source", m.get("label_source", "Heuristic engineering proxy rules derived from RDD2022 distributions")),
        "limitations": info.get("limitations", []),
        "baseline_accuracy": m["baseline_accuracy"],
        "f1_macro": m["f1_macro"],
        "f1_weighted": m["f1_weighted"],
        "precision_macro": m["precision_macro"],
        "recall_macro": m["recall_macro"],
        "per_class": m["per_class"],
        "confusion_matrix": m["confusion_matrix"],
        "confusion_matrix_labels": m["confusion_matrix_labels"],
    }

@router.get("/comparison")
def get_model_comparison():
    """Returns model benchmark comparison results (cross-validation, tuning, baselines)."""
    reports_dir = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "reports")
    comp_file = os.path.join(reports_dir, "model_comparison.json")
    if os.path.exists(comp_file):
        try:
            with open(comp_file, "r") as f:
                return json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed loading comparison report: {e}")
    raise HTTPException(status_code=404, detail="Model comparison report has not been generated yet.")

@router.get("/validation")
def get_validation_results():
    """Returns human validation evaluation results if file exists."""
    reports_dir = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "reports")
    val_file = os.path.join(reports_dir, "validation_results.json")
    if os.path.exists(val_file):
        try:
            with open(val_file, "r") as f:
                return json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed loading validation results: {e}")
    raise HTTPException(status_code=404, detail="Validation results not available yet.")


@router.post("/admin/retrain")
def retrain_model(current_admin = Depends(require_admin)):
    """Restricted endpoint: Retrains Random Forest model on RDD2022 dataset."""
    try:
        new_version = f"v{datetime.now().strftime('%Y%m%d-%H%M')}-rf-rdd2022"
        metadata = train_and_evaluate(model_version=new_version)
        ml_service._load_model()
        return {
            "message": "Model retrained and updated successfully.",
            "model_version": metadata["model_version"],
            "accuracy": metadata["metrics"]["accuracy"],
            "f1_macro": metadata["metrics"]["f1_macro"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model retraining failed: {str(e)}")
