from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models.report import RoadReport
from backend.app.models.inspection import Inspection
from backend.app.schemas.analytics import OverviewStats, CategoryCount, TrendPoint

router = APIRouter()

@router.get("/overview", response_model=OverviewStats)
def get_overview_statistics(db: Session = Depends(get_db)):
    total = db.query(RoadReport).count()
    awaiting = db.query(RoadReport).filter(RoadReport.status.in_(["submitted", "under_review"])).count()
    inspections_pending = db.query(RoadReport).filter(RoadReport.status == "inspection_scheduled").count()
    repairs_active = db.query(RoadReport).filter(RoadReport.status.in_(["repair_recommended", "repair_in_progress"])).count()
    resolved = db.query(RoadReport).filter(RoadReport.status == "resolved").count()

    # Severity distribution
    sev_counts = db.query(RoadReport.predicted_severity, func.count(RoadReport.id)).group_by(RoadReport.predicted_severity).all()
    sev_dict = {"Low": 0, "Medium": 0, "High": 0}
    for s, c in sev_counts:
        if s in sev_dict:
            sev_dict[s] = c
        elif s:
            sev_dict[s] = c

    # Priority band distribution
    pb_counts = db.query(RoadReport.priority_band, func.count(RoadReport.id)).group_by(RoadReport.priority_band).all()
    pb_dict = {"Lower": 0, "Medium": 0, "High": 0}
    for pb, c in pb_counts:
        if pb in pb_dict:
            pb_dict[pb] = c
        elif pb:
            pb_dict[pb] = c

    # Average turnaround days for resolved reports
    resolved_reports = db.query(RoadReport).filter(RoadReport.status == "resolved").all()
    avg_turnaround = 0.0
    if resolved_reports:
        days_list = [
            max(0.1, (r.updated_at - r.created_at).total_seconds() / 86400.0)
            for r in resolved_reports if r.updated_at and r.created_at
        ]
        if days_list:
            avg_turnaround = round(sum(days_list) / len(days_list), 1)

    return {
        "total_reports": total,
        "awaiting_review": awaiting,
        "inspections_pending": inspections_pending,
        "repairs_in_progress": repairs_active,
        "resolved_repairs": resolved,
        "severity_breakdown": sev_dict,
        "priority_band_breakdown": pb_dict,
        "avg_turnaround_days": avg_turnaround
    }

@router.get("/severity", response_model=List[CategoryCount])
def get_severity_breakdown(db: Session = Depends(get_db)):
    counts = db.query(RoadReport.predicted_severity, func.count(RoadReport.id)).group_by(RoadReport.predicted_severity).all()
    return [{"category": s or "Unassigned", "count": c} for s, c in counts]

@router.get("/damage-types", response_model=List[CategoryCount])
def get_damage_type_breakdown(db: Session = Depends(get_db)):
    counts = db.query(RoadReport.damage_type, func.count(RoadReport.id)).group_by(RoadReport.damage_type).all()
    return [{"category": d or "Unknown", "count": c} for d, c in counts]

@router.get("/trends", response_model=List[TrendPoint])
def get_report_trends(days: int = 14, db: Session = Depends(get_db)):
    """Computes submissions and resolved reports trend over the past N days."""
    now = datetime.now(timezone.utc)
    points = []
    
    for i in range(days - 1, -1, -1):
        target_date = (now - timedelta(days=i)).date()
        date_str = target_date.strftime("%b %d")
        
        # Reports created on this date
        start = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
        end = datetime.combine(target_date, datetime.max.time(), tzinfo=timezone.utc)
        
        created_count = db.query(RoadReport).filter(RoadReport.created_at >= start, RoadReport.created_at <= end).count()
        resolved_count = db.query(RoadReport).filter(
            RoadReport.status == "resolved",
            RoadReport.updated_at >= start,
            RoadReport.updated_at <= end
        ).count()
        
        points.append({
            "date": date_str,
            "reports": created_count,
            "resolved": resolved_count
        })
        
    return points

@router.get("/repair-priority")
def get_priority_queue(limit: int = 10, db: Session = Depends(get_db)):
    """Returns top repair priority candidates awaiting action."""
    records = (
        db.query(RoadReport)
        .filter(RoadReport.status.notin_(["resolved", "rejected", "duplicate"]))
        .order_by(RoadReport.priority_score.desc().nullslast())
        .limit(limit)
        .all()
    )
    return records
