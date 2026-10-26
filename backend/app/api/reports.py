import json
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from backend.app.core.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.report import RoadReport
from backend.app.models.history import RepairHistory
from backend.app.schemas.report import ReportResponse, ReportListResponse, ReportStatusUpdate
from backend.app.api.deps import get_optional_user, get_current_user, require_inspector
from backend.app.services.storage_service import validate_image_upload, save_image_file
from backend.app.services.priority_service import calculate_priority_score
from backend.app.services.ml_service import ml_service

router = APIRouter()

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    damage_type: str = Form("pothole"),
    latitude: float = Form(...),
    longitude: float = Form(...),
    location_description: Optional[str] = Form(None),
    road_name: Optional[str] = Form(None),
    road_category: Optional[str] = Form("Local/Collector"),
    traffic_level: Optional[int] = Form(None),
    rainfall_exposure: Optional[float] = Form(None),
    road_importance: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # Validate coordinate bounds
    if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Latitude and Longitude values are out of bounds.")

    image_path = None
    annotated_path = None
    detected_defects_json = None
    feature_summary_json = None
    predicted_severity = "Pending"
    model_confidence = None
    model_version = None

    if image and image.filename:
        contents = await image.read()
        validate_image_upload(image, contents)
        ext = image.filename.split(".")[-1].lower() if "." in image.filename else "jpg"
        image_path, _ = save_image_file(contents, ext=ext)

        # Run automated AI defect detection & Random Forest severity classification
        try:
            analysis = ml_service.analyze_image_and_predict(contents)
            predicted_severity = analysis["predicted_severity"]
            model_confidence = analysis["confidence"]
            model_version = analysis["model_version"]
            annotated_path = analysis.get("annotated_image_url")
            detected_defects_json = json.dumps(analysis.get("detections", []))
            feature_summary_json = json.dumps(analysis.get("features_used", {}))
        except Exception as e:
            print(f"[create_report] AI inference fallback: {e}")
            predicted_severity = "Medium"  # Safe provisional fallback

    # Compute transparent priority score
    p_calc = calculate_priority_score(
        severity=predicted_severity if predicted_severity != "Pending" else None,
        traffic_level=traffic_level,
        rainfall_exposure=rainfall_exposure,
        road_importance=road_importance,
        road_category=road_category
    )

    reporter_id = current_user.id if current_user else None
    new_report = RoadReport(
        reporter_id=reporter_id,
        title=title.strip(),
        description=description.strip() if description else None,
        damage_type=damage_type,
        latitude=latitude,
        longitude=longitude,
        location_description=location_description.strip() if location_description else None,
        road_name=road_name.strip() if road_name else None,
        road_category=road_category or "Local/Collector",
        traffic_level=traffic_level,
        rainfall_exposure=rainfall_exposure,
        road_importance=road_importance,
        image_path=image_path,
        annotated_image_path=annotated_path,
        detected_defects_json=detected_defects_json,
        feature_summary_json=feature_summary_json,
        predicted_severity=predicted_severity,
        model_confidence=model_confidence,
        model_version=model_version,
        priority_score=p_calc["priority_score"],
        priority_band=p_calc["priority_band"],
        priority_breakdown_json=json.dumps(p_calc["breakdown"]),
        is_provisional_priority=p_calc["is_provisional"],
        status="submitted",
        is_demo=False,
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Initial history log
    h = RepairHistory(
        report_id=new_report.id,
        previous_status=None,
        new_status="submitted",
        changed_by=reporter_id,
        notes="Road damage incident report submitted."
    )
    db.add(h)
    db.commit()

    return new_report

@router.get("", response_model=ReportListResponse)
def list_reports(
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    damage_type: Optional[str] = Query(None),
    road_category: Optional[str] = Query(None),
    locality: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(RoadReport)

    if severity:
        query = query.filter(
            or_(
                RoadReport.predicted_severity == severity,
                RoadReport.verified_severity == severity
            )
        )
    if status_filter:
        query = query.filter(RoadReport.status == status_filter)
    if damage_type:
        query = query.filter(RoadReport.damage_type == damage_type)
    if road_category:
        query = query.filter(RoadReport.road_category == road_category)
    if locality:
        query = query.filter(RoadReport.location_description.ilike(f"%{locality}%"))
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                RoadReport.title.ilike(s),
                RoadReport.description.ilike(s),
                RoadReport.road_name.ilike(s),
                RoadReport.location_description.ilike(s)
            )
        )

    total = query.count()
    items = query.order_by(desc(RoadReport.created_at)).offset(skip).limit(limit).all()
    return {"total": total, "items": items}

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(RoadReport).filter(RoadReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found.")
    return report

@router.post("/{report_id}/images", response_model=ReportResponse)
async def upload_report_image(
    report_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(RoadReport).filter(RoadReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Road report not found.")

    contents = await image.read()
    validate_image_upload(image, contents)
    ext = image.filename.split(".")[-1].lower() if "." in image.filename else "jpg"
    image_path, _ = save_image_file(contents, ext=ext)

    report.image_path = image_path

    # Run AI analysis
    try:
        analysis = ml_service.analyze_image_and_predict(contents)
        report.predicted_severity = analysis["predicted_severity"]
        report.model_confidence = analysis["confidence"]
        report.model_version = analysis["model_version"]
        report.annotated_image_path = analysis.get("annotated_image_url")
        report.detected_defects_json = json.dumps(analysis.get("detections", []))
        report.feature_summary_json = json.dumps(analysis.get("features_used", {}))

        # Recalculate priority
        p_calc = calculate_priority_score(
            severity=report.predicted_severity,
            traffic_level=report.traffic_level,
            rainfall_exposure=report.rainfall_exposure,
            road_importance=report.road_importance,
            road_category=report.road_category
        )
        report.priority_score = p_calc["priority_score"]
        report.priority_band = p_calc["priority_band"]
        report.priority_breakdown_json = json.dumps(p_calc["breakdown"])
    except Exception as e:
        print(f"[upload_report_image] AI inference error: {e}")

    report.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    return report
