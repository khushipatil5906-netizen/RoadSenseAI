import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath("."))

def run_sanity_check():
    print("Testing backend sanity check...")
    from backend.app.core.database import Base, engine, SessionLocal
    from backend.app.core.config import settings
    from backend.app.services.ml_service import ml_service
    from backend.app.models.user import User
    from backend.app.models.report import RoadReport
    from backend.app.services.seed_data import seed_database
    from backend.app.main import app

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)

    user_count = db.query(User).count()
    report_count = db.query(RoadReport).count()
    db.close()

    print(f"Database OK: {user_count} users, {report_count} reports.")
    print(f"ML Service OK: available={ml_service.is_available()}")
    if ml_service.is_available():
        info = ml_service.get_info()
        print(f"Model: {info.get('model_name')}, version={info.get('model_version')}")
        test_pred = ml_service.predict_from_features({
            "damage_count": 2,
            "pothole_count": 1,
            "alligator_crack_count": 0,
            "longitudinal_crack_count": 1,
            "transverse_crack_count": 0,
            "total_bbox_area_ratio": 0.08,
            "largest_bbox_area_ratio": 0.06
        })
        print(f"Sample prediction: severity={test_pred['predicted_severity']}, confidence={test_pred['confidence']}")

    print("ALL BACKEND SANITY CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_sanity_check()
