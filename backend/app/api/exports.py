import csv
import io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.report import RoadReport

router = APIRouter()

@router.get("/reports.csv")
def export_reports_csv(db: Session = Depends(get_db)):
    """Exports all road reports to a CSV file for municipal engineering audits."""
    reports = db.query(RoadReport).order_by(RoadReport.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Report ID",
        "Title",
        "Damage Type",
        "Latitude",
        "Longitude",
        "Location Description",
        "Road Name",
        "Road Category",
        "Traffic Level (1-5)",
        "Rainfall Exposure (mm)",
        "Road Importance (1-5)",
        "Predicted Severity",
        "Verified Severity",
        "Model Confidence",
        "Priority Score (0-5)",
        "Priority Band",
        "Status",
        "Is Demo",
        "Created At (UTC)",
        "Last Updated (UTC)",
    ])

    for r in reports:
        writer.writerow([
            r.id,
            r.title,
            r.damage_type,
            r.latitude,
            r.longitude,
            r.location_description or "",
            r.road_name or "",
            r.road_category,
            r.traffic_level or "N/A",
            r.rainfall_exposure or "N/A",
            r.road_importance or "N/A",
            r.predicted_severity,
            r.verified_severity or "Pending",
            f"{int((r.model_confidence or 0) * 100)}%" if r.model_confidence else "N/A",
            f"{r.priority_score:.2f}" if r.priority_score is not None else "N/A",
            r.priority_band or "N/A",
            r.status,
            "YES" if r.is_demo else "NO",
            r.created_at.isoformat() if r.created_at else "",
            r.updated_at.isoformat() if r.updated_at else "",
        ])

    csv_data = output.getvalue()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"roadsense_reports_{timestamp}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
