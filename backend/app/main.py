import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.models.model_version import ModelVersion
from backend.app.services.seed_data import seed_database
from backend.app.services.ml_service import ml_service

from backend.app.api.auth import router as auth_router
from backend.app.api.reports import router as reports_router
from backend.app.api.analysis import router as analysis_router
from backend.app.api.inspections import router as inspections_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.exports import router as exports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Run startup seeder if database is new or empty
    db = SessionLocal()
    try:
        seed_database(db)

        # Register current model version in DB if available
        if ml_service.is_available() and ml_service.metadata:
            meta = ml_service.metadata
            v_str = meta.get("model_version", "v1.2.0-rf-rdd2022")
            existing_mv = db.query(ModelVersion).filter(ModelVersion.version == v_str).first()
            if not existing_mv:
                mv = ModelVersion(
                    version=v_str,
                    dataset_reference=meta.get("dataset_source", "RDD2022"),
                    feature_schema_json=json.dumps(meta.get("feature_schema", [])),
                    metrics_json=json.dumps(meta.get("metrics", {})),
                    artifact_reference=meta.get("model_artifact", "severity_rf_model.joblib"),
                    validation_status=meta.get("validation_status", "VALIDATED")
                )
                db.add(mv)
                db.commit()
    except Exception as e:
        print(f"[Lifespan Error during DB seeding] {e}")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title="RoadSense AI API",
    description="Backend API for road damage detection, severity prediction, and transparent repair prioritization.",
    version="1.2.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount media uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(reports_router, prefix="/api/reports", tags=["Road Reports"])
app.include_router(inspections_router, prefix="/api/reports", tags=["Inspections & Workflow"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["AI Damage Analysis"])
# Direct aliases for model info as specified in requirements
app.include_router(analysis_router, prefix="/api/model", tags=["Model Information"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics & Visualizations"])
app.include_router(exports_router, prefix="/api/exports", tags=["Data Exports"])

@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "online",
        "service": "RoadSense AI Platform",
        "version": "1.2.0",
        "ml_service_active": ml_service.is_available(),
        "database": "connected"
    }

@app.get("/", tags=["System"])
def root():
    return {
        "message": "Welcome to RoadSense AI API. Visit /docs for the interactive OpenAPI documentation."
    }
