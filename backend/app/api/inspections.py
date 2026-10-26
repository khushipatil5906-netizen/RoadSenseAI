import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.report import RoadReport
from backend.app.models.inspection import Inspection
from backend.app.models.history import RepairHistory
from backend.app.schemas.inspection import InspectionCreate, InspectionResponse, HistoryResponse
from backend.app.schemas.report import ReportStatusUpdate, ReportResponse
from backend.app.api.deps import require_inspector, get_current_user
from backend.app.services.priority_service import calculate_priority_score

router = APIRouter()

VALID_STATUSES = [
    "submitted",
    "under_review",
    "inspection_scheduled",
    "repair_recommended",
    "repair_in_progress",
    "resolved",
    "rejected",
    "duplicate"
]

@router.post("/{report_id}/inspections", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def create_inspection(
    report_id: int,
    insp_in: InspectionCreate,
    db: Session = Depends(get_db),
    inspector: User = Depends(require_inspector)
):
    report = db.query(RoadReport).filter(RoadReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found.")

    inspection = Inspection(
        report_id=report.id,
        inspector_id=inspector.id,
        inspection_notes=insp_in.inspection_notes.strip(),
        verified_severity=insp_in.verified_severity,
        recommendation=insp_in.recommendation.strip(),
        inspection_date=datetime.now(timezone.utc)
    )
    db.add(inspection)

    prev_status = report.status
    report.verified_severity = insp_in.verified_severity
    new_status = insp_in.new_status or "repair_recommended"
    if new_status not in VALID_STATUSES:
        new_status = "repair_recommended"

    report.status = new_status
    report.updated_at = datetime.now(timezone.utc)

    # Recalculate priority with verified severity
    p_calc = calculate_priority_score(
        severity=insp_in.verified_severity,
        traffic_level=report.traffic_level,
        rainfall_exposure=report.rainfall_exposure,
        road_importance=report.road_importance,
        road_category=report.road_category
    )
    report.priority_score = p_calc["priority_score"]
    report.priority_band = p_calc["priority_band"]
    report.priority_breakdown_json = json.dumps(p_calc["breakdown"])
    report.is_provisional_priority = p_calc["is_provisional"]

    # History log
    h = RepairHistory(
        report_id=report.id,
        previous_status=prev_status,
        new_status=new_status,
        changed_by=inspector.id,
        notes=f"Inspection logged. Verified severity: {insp_in.verified_severity}. Rec: {insp_in.recommendation}"
    )
    db.add(h)

    db.commit()
    db.refresh(inspection)
    return inspection

@router.patch("/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    status_update: ReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_inspector)
):
    report = db.query(RoadReport).filter(RoadReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found.")

    new_st = status_update.status.lower().strip()
    if new_st not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{new_st}'. Must be one of: {', '.join(VALID_STATUSES)}"
        )

    prev_status = report.status
    report.status = new_st
    report.updated_at = datetime.now(timezone.utc)

    # Log to audit history
    h = RepairHistory(
        report_id=report.id,
        previous_status=prev_status,
        new_status=new_st,
        changed_by=current_user.id,
        notes=status_update.notes.strip() if status_update.notes else f"Status updated to {new_st}."
    )
    db.add(h)

    db.commit()
    db.refresh(report)
    return report

@router.get("/{report_id}/history", response_model=List[HistoryResponse])
def get_report_history(report_id: int, db: Session = Depends(get_db)):
    report = db.query(RoadReport).filter(RoadReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found.")

    history = (
        db.query(RepairHistory)
        .filter(RepairHistory.report_id == report_id)
        .order_by(RepairHistory.created_at.desc())
        .all()
    )
    return history

@router.get("/{report_id}/inspections", response_model=List[InspectionResponse])
def get_report_inspections(report_id: int, db: Session = Depends(get_db)):
    report = db.query(RoadReport).filter(RoadReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found.")

    inspections = (
        db.query(Inspection)
        .filter(Inspection.report_id == report_id)
        .order_by(Inspection.inspection_date.desc())
        .all()
    )
    return inspections
