from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

class ReportCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    damage_type: str = "pothole"
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_description: Optional[str] = None
    road_name: Optional[str] = None
    road_category: Optional[str] = "Local/Collector"
    traffic_level: Optional[int] = Field(None, ge=1, le=5)
    rainfall_exposure: Optional[float] = Field(None, ge=0.0)
    road_importance: Optional[int] = Field(None, ge=1, le=5)

class ReportStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reporter_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    damage_type: str
    latitude: float
    longitude: float
    location_description: Optional[str] = None
    road_name: Optional[str] = None
    road_category: str
    traffic_level: Optional[int] = None
    rainfall_exposure: Optional[float] = None
    road_importance: Optional[int] = None
    image_path: Optional[str] = None
    annotated_image_path: Optional[str] = None
    detected_defects_json: Optional[str] = None
    predicted_severity: str
    model_confidence: Optional[float] = None
    model_version: Optional[str] = None
    feature_summary_json: Optional[str] = None
    verified_severity: Optional[str] = None
    priority_score: Optional[float] = None
    priority_band: Optional[str] = None
    priority_breakdown_json: Optional[str] = None
    is_provisional_priority: bool = False
    status: str
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime

class ReportListResponse(BaseModel):
    total: int
    items: List[ReportResponse]
