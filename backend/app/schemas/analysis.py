from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class TabularPredictRequest(BaseModel):
    damage_count: int = Field(..., ge=0)
    pothole_count: int = Field(0, ge=0)
    alligator_crack_count: int = Field(0, ge=0)
    longitudinal_crack_count: int = Field(0, ge=0)
    transverse_crack_count: int = Field(0, ge=0)
    total_bbox_area_ratio: float = Field(..., ge=0.0, le=1.0)
    largest_bbox_area_ratio: float = Field(..., ge=0.0, le=1.0)

class DetectionItem(BaseModel):
    class_name: str
    display_name: str
    confidence: float
    box: List[int]
    normalized_box: List[float]
    color: str

class PredictResponse(BaseModel):
    predicted_severity: str
    confidence: float
    probabilities: Dict[str, float]
    features_used: Dict[str, Any]
    model_version: str
    detections: Optional[List[Dict[str, Any]]] = None
    annotated_image_url: Optional[str] = None
    explanation: str
    shap_contributions: Optional[Dict[str, float]] = None
    limitations: str

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    algorithm: str
    dataset_source: str
    dataset_samples: Dict[str, int]
    feature_schema: List[str]
    feature_importances: Dict[str, float]
    supported_classes: List[str]
    training_date: str
    last_validation_date: str
    validation_status: str
    label_source: Optional[str] = None
    limitations: List[str]

class ModelMetricsResponse(BaseModel):
    model_version: str
    accuracy: float
    agreement_with_heuristic_labels: Optional[float] = None
    label_source: Optional[str] = None
    limitations: Optional[List[str]] = None
    baseline_accuracy: float
    f1_macro: float
    f1_weighted: float
    precision_macro: float
    recall_macro: float
    per_class: Dict[str, Any]
    confusion_matrix: List[List[int]]
    confusion_matrix_labels: List[str]
