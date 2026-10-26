from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class InspectionCreate(BaseModel):
    inspection_notes: str = Field(..., min_length=5)
    verified_severity: str = Field(..., pattern="^(Low|Medium|High)$")
    recommendation: str = Field(..., min_length=3)
    new_status: Optional[str] = "repair_recommended"

class InspectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_id: int
    inspector_id: int
    inspection_notes: str
    verified_severity: str
    recommendation: str
    inspection_date: datetime
    created_at: datetime

class HistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_id: int
    previous_status: Optional[str] = None
    new_status: str
    changed_by: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
