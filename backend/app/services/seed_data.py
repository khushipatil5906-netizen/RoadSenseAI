"""
Database seeder for RoadSense AI.
Populates standard demonstration users and realistic road damage reports
with geographic coordinates, defect features, priority scores, and lifecycle logs.
"""

import os
import json
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw
from sqlalchemy.orm import Session

from backend.app.core.security import hash_password
from backend.app.core.config import settings
from backend.app.models.user import User, UserRole
from backend.app.models.report import RoadReport
from backend.app.models.inspection import Inspection
from backend.app.models.history import RepairHistory
from backend.app.models.model_version import ModelVersion
from backend.app.services.priority_service import calculate_priority_score

def create_sample_road_images():
    """Generates realistic placeholder road image files in uploads directory if missing."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    sample_images = {}
    
    types = {
        "pothole": (60, 60, 65, "Pothole Defect - Deep Cavity"),
        "alligator": (70, 70, 72, "Alligator / Fatigue Crack Mesh"),
        "longitudinal": (80, 80, 85, "Longitudinal Joint Crack"),
        "transverse": (85, 85, 90, "Transverse Thermal Fracture"),
    }
    
    for name, (r, g, b, text) in types.items():
        fname = f"sample_{name}.jpg"
        disk_path = os.path.join(settings.UPLOAD_DIR, fname)
        if not os.path.exists(disk_path):
            img = Image.new("RGB", (640, 480), color=(r, g, b))
            draw = ImageDraw.Draw(img)
            # Draw asphalt texture lines
            for i in range(10, 470, 25):
                draw.line([(0, i), (640, i + 10)], fill=(r - 15, g - 15, b - 15), width=2)
            # Draw defect representation
            if name == "pothole":
                draw.ellipse([220, 180, 420, 320], fill=(25, 25, 28), outline=(15, 15, 18), width=3)
            elif name == "alligator":
                for x in range(180, 440, 40):
                    draw.line([(x, 150), (x + 30, 350)], fill=(20, 20, 25), width=3)
                    draw.line([(180, x - 30), (440, x + 20)], fill=(20, 20, 25), width=2)
            elif name == "longitudinal":
                draw.line([(310, 50), (330, 430)], fill=(20, 20, 25), width=4)
            else:
                draw.line([(50, 240), (590, 250)], fill=(20, 20, 25), width=4)
                
            draw.rectangle([10, 10, 380, 40], fill=(0, 0, 0))
            draw.text((20, 18), f"RoadSense AI: {text}", fill=(255, 255, 255))
            img.save(disk_path, "JPEG", quality=90)
            
        sample_images[name] = f"/uploads/{fname}"
        
    return sample_images

def seed_database(db: Session):
    """Seeds initial demonstration data if database is empty or requested."""
    # Check if users already exist
    inspector = db.query(User).filter(User.email == "inspector@roadsense.gov").first()
    if not inspector:
        inspector = User(
            name="Eng. Rajesh Sharma (Lead Inspector)",
            email="inspector@roadsense.gov",
            password_hash=hash_password("RoadSense123!"),
            role=UserRole.INSPECTOR.value
        )
        db.add(inspector)

    admin = db.query(User).filter(User.email == "admin@roadsense.gov").first()
    if not admin:
        admin = User(
            name="Municipal Admin Officer",
            email="admin@roadsense.gov",
            password_hash=hash_password("RoadSense123!"),
            role=UserRole.ADMIN.value
        )
        db.add(admin)

    citizen = db.query(User).filter(User.email == "citizen@example.com").first()
    if not citizen:
        citizen = User(
            name="Priya Patel",
            email="citizen@example.com",
            password_hash=hash_password("RoadSense123!"),
            role=UserRole.CITIZEN.value
        )
        db.add(citizen)

    db.commit()
    db.refresh(inspector)
    db.refresh(citizen)

    # Check if reports exist
    existing_reports_count = db.query(RoadReport).count()
    if existing_reports_count > 0:
        return

    sample_imgs = create_sample_road_images()
    now = datetime.now(timezone.utc)

    # Realistic demonstration road reports with realistic municipal coordinates
    # Using real coordinate clusters (e.g. Mumbai / Pune urban corridor & arterial roads)
    sample_reports_data = [
        {
            "title": "Severe Pothole Cluster near Metro Station Gate 3",
            "description": "Deep multi-cavity pothole causing severe vehicle deceleration and bottoming out. Rainwater pooling observed during morning showers.",
            "damage_type": "pothole",
            "latitude": 19.1176,
            "longitude": 72.8465,
            "location_description": "Andheri Kurla Road, near Western Express Metro Station",
            "road_name": "Andheri Kurla Link Road",
            "road_category": "Major Arterial",
            "traffic_level": 5,
            "rainfall_exposure": 210.0,
            "road_importance": 5,
            "predicted_severity": "High",
            "model_confidence": 0.94,
            "image_type": "pothole",
            "status": "inspection_scheduled",
            "days_ago": 4,
        },
        {
            "title": "Wide Fatigue Alligator Cracking on Bus Corridor",
            "description": "Extensive interlocking mesh of alligator cracks along the inner wheel path. Sub-base subsidence evident.",
            "damage_type": "alligator_crack",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "location_description": "Bandra Kurla Complex (BKC) Connector",
            "road_name": "BKC Central Avenue",
            "road_category": "Major Arterial",
            "traffic_level": 4,
            "rainfall_exposure": 180.0,
            "road_importance": 4,
            "predicted_severity": "High",
            "model_confidence": 0.91,
            "image_type": "alligator",
            "status": "repair_in_progress",
            "days_ago": 12,
        },
        {
            "title": "Deep Pothole at Highway Flyover Descent",
            "description": "Hazardous road defect situated right at the flyover expansion joint descent. Immediate hazard for two-wheelers.",
            "damage_type": "pothole",
            "latitude": 19.1860,
            "longitude": 72.8485,
            "location_description": "Malad West Flyover Northbound Ramp",
            "road_name": "SV Road",
            "road_category": "Major Arterial",
            "traffic_level": 5,
            "rainfall_exposure": 160.0,
            "road_importance": 4,
            "predicted_severity": "High",
            "model_confidence": 0.96,
            "image_type": "pothole",
            "status": "repair_recommended",
            "days_ago": 2,
        },
        {
            "title": "Continuous Longitudinal Joint Crack",
            "description": "Long crack running parallel to center pavement seam. Crack width approx 15-20mm.",
            "damage_type": "longitudinal_crack",
            "latitude": 19.0178,
            "longitude": 72.8478,
            "location_description": "Near Shivaji Park North Gate, Dadar",
            "road_name": "Cadell Road",
            "road_category": "Secondary Arterial",
            "traffic_level": 3,
            "rainfall_exposure": 110.0,
            "road_importance": 3,
            "predicted_severity": "Medium",
            "model_confidence": 0.84,
            "image_type": "longitudinal",
            "status": "under_review",
            "days_ago": 6,
        },
        {
            "title": "Transverse Thermal Contraction Joint Separation",
            "description": "Perpendicular transverse crack spanning across full single carriageway lane.",
            "damage_type": "transverse_crack",
            "latitude": 19.1360,
            "longitude": 72.9300,
            "location_description": "LBS Marg, Vikhroli West",
            "road_name": "Lal Bahadur Shastri Marg",
            "road_category": "Secondary Arterial",
            "traffic_level": 4,
            "rainfall_exposure": 95.0,
            "road_importance": 3,
            "predicted_severity": "Medium",
            "model_confidence": 0.82,
            "image_type": "transverse",
            "status": "submitted",
            "days_ago": 1,
        },
        {
            "title": "Surface Pothole on Residential Society Access Lane",
            "description": "Shallow pothole forming around municipal stormwater manhole ring.",
            "damage_type": "pothole",
            "latitude": 19.2183,
            "longitude": 72.9781,
            "location_description": "Panch Pakhadi, Thane West",
            "road_name": "Service Road Lane 4",
            "road_category": "Local/Collector",
            "traffic_level": 2,
            "rainfall_exposure": 80.0,
            "road_importance": 2,
            "predicted_severity": "Medium",
            "model_confidence": 0.88,
            "image_type": "pothole",
            "status": "resolved",
            "days_ago": 20,
        },
        {
            "title": "Minor Longitudinal Hairline Cracking",
            "description": "Fine hairline cracks after recent resurfacing. No aggregate loss or raveling noticed.",
            "damage_type": "longitudinal_crack",
            "latitude": 18.9220,
            "longitude": 72.8346,
            "location_description": "Colaba Causeway, Fort Ward",
            "road_name": "Shahid Bhagat Singh Road",
            "road_category": "Local/Collector",
            "traffic_level": 2,
            "rainfall_exposure": 45.0,
            "road_importance": 2,
            "predicted_severity": "Low",
            "model_confidence": 0.89,
            "image_type": "longitudinal",
            "status": "submitted",
            "days_ago": 3,
        },
        {
            "title": "Isolated Transverse Crack Near School Crossing",
            "description": "Small transverse crack before speed breaker. Pavement structural integrity remains stable.",
            "damage_type": "transverse_crack",
            "latitude": 19.0435,
            "longitude": 72.8890,
            "location_description": "Chembur East, Near St. Anthony High School",
            "road_name": "Central Avenue Road",
            "road_category": "Local/Collector",
            "traffic_level": 2,
            "rainfall_exposure": 40.0,
            "road_importance": 2,
            "predicted_severity": "Low",
            "model_confidence": 0.91,
            "image_type": "transverse",
            "status": "resolved",
            "days_ago": 25,
        }
    ]

    for item in sample_reports_data:
        p_calc = calculate_priority_score(
            severity=item["predicted_severity"],
            traffic_level=item["traffic_level"],
            rainfall_exposure=item["rainfall_exposure"],
            road_importance=item["road_importance"],
            road_category=item["road_category"]
        )

        created_dt = now - timedelta(days=item["days_ago"])
        rep = RoadReport(
            reporter_id=citizen.id,
            title=item["title"],
            description=item["description"],
            damage_type=item["damage_type"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            location_description=item["location_description"],
            road_name=item["road_name"],
            road_category=item["road_category"],
            traffic_level=item["traffic_level"],
            rainfall_exposure=item["rainfall_exposure"],
            road_importance=item["road_importance"],
            image_path=sample_imgs.get(item["image_type"]),
            annotated_image_path=sample_imgs.get(item["image_type"]),
            predicted_severity=item["predicted_severity"],
            model_confidence=item["model_confidence"],
            model_version="v1.2.0-rf-rdd2022",
            priority_score=p_calc["priority_score"],
            priority_band=p_calc["priority_band"],
            priority_breakdown_json=json.dumps(p_calc["breakdown"]),
            is_provisional_priority=p_calc["is_provisional"],
            status=item["status"],
            is_demo=True,
            created_at=created_dt,
            updated_at=created_dt + timedelta(hours=6)
        )
        db.add(rep)
        db.flush()

        # Add initial submission history
        h1 = RepairHistory(
            report_id=rep.id,
            previous_status=None,
            new_status="submitted",
            changed_by=citizen.id,
            notes="Report initially submitted by citizen reporter via mobile portal.",
            created_at=created_dt
        )
        db.add(h1)

        # If status moved forward, add inspection and subsequent history
        if item["status"] in ["inspection_scheduled", "repair_recommended", "repair_in_progress", "resolved"]:
            h2 = RepairHistory(
                report_id=rep.id,
                previous_status="submitted",
                new_status="under_review",
                changed_by=inspector.id,
                notes="Triage review completed. Damage photograph and priority score verified.",
                created_at=created_dt + timedelta(days=1)
            )
            db.add(h2)

            insp = Inspection(
                report_id=rep.id,
                inspector_id=inspector.id,
                inspection_notes=f"Field verification conducted. Damage confirmed as {item['predicted_severity']} severity. Measurement logs recorded.",
                verified_severity=item["predicted_severity"],
                recommendation="Cold bitumen patch and compaction recommended within 48 hours.",
                inspection_date=created_dt + timedelta(days=1, hours=4),
                created_at=created_dt + timedelta(days=1, hours=4)
            )
            db.add(insp)
            rep.verified_severity = item["predicted_severity"]

        if item["status"] in ["repair_in_progress", "resolved"]:
            h3 = RepairHistory(
                report_id=rep.id,
                previous_status="repair_recommended",
                new_status="repair_in_progress",
                changed_by=inspector.id,
                notes="Road maintenance contractor crew dispatched with cold asphalt mix.",
                created_at=created_dt + timedelta(days=3)
            )
            db.add(h3)

        if item["status"] == "resolved":
            h4 = RepairHistory(
                report_id=rep.id,
                previous_status="repair_in_progress",
                new_status="resolved",
                changed_by=inspector.id,
                notes="Patch repair finalized, compacted, and traffic lane reopened successfully.",
                created_at=created_dt + timedelta(days=5)
            )
            db.add(h4)

    db.commit()
    print("[Seed] Successfully seeded initial demo users and realistic road reports.")
