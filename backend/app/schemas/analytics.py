from typing import List, Dict, Any
from pydantic import BaseModel

class OverviewStats(BaseModel):
    total_reports: int
    awaiting_review: int
    inspections_pending: int
    repairs_in_progress: int
    resolved_repairs: int
    severity_breakdown: Dict[str, int]
    priority_band_breakdown: Dict[str, int]
    avg_turnaround_days: float

class CategoryCount(BaseModel):
    category: str
    count: int

class TrendPoint(BaseModel):
    date: str
    reports: int
    resolved: int
