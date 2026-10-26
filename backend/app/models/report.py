from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class RoadReport(Base):
    __tablename__ = "road_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    damage_type = Column(String(80), nullable=False)  # pothole, alligator_crack, longitudinal_crack, transverse_crack, multi_damage
    
    # Coordinates & Locality
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    location_description = Column(String(255), nullable=True)
    road_name = Column(String(180), nullable=True)
    road_category = Column(String(80), default="Local/Collector", nullable=False)  # Highway/Expressway, Major Arterial, Secondary Arterial, Local/Collector
    
    # Priority score components (1 to 5 scale or explicit missing)
    traffic_level = Column(Integer, nullable=True)  # 1 to 5 (1=Very Low, 5=Extremely Heavy)
    rainfall_exposure = Column(Float, nullable=True)  # mm/month or 1-5 scale
    road_importance = Column(Integer, nullable=True)  # 1 to 5 (1=Local Alley, 5=Emergency/Critical Transit Corridor)
    
    # Media paths
    image_path = Column(String(255), nullable=True)
    annotated_image_path = Column(String(255), nullable=True)
    detected_defects_json = Column(Text, nullable=True)
    
    # AI ML Model Inference
    predicted_severity = Column(String(30), default="Pending", nullable=False)  # Low, Medium, High, Pending
    model_confidence = Column(Float, nullable=True)  # 0.0 to 1.0
    model_version = Column(String(80), nullable=True)
    feature_summary_json = Column(Text, nullable=True)
    
    # Engineering Verification
    verified_severity = Column(String(30), nullable=True)  # Low, Medium, High
    
    # Priority Engine
    priority_score = Column(Float, nullable=True, index=True)  # 0.0 to 5.0
    priority_band = Column(String(30), nullable=True)  # Lower, Medium, High
    priority_breakdown_json = Column(Text, nullable=True)
    is_provisional_priority = Column(Boolean, default=False)
    
    # Operational Lifecycle Status
    status = Column(String(50), default="submitted", index=True, nullable=False)
    # Lifecycle: submitted -> under_review -> inspection_scheduled -> repair_recommended -> repair_in_progress -> resolved (or rejected, duplicate)
    
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    reporter = relationship("User", back_populates="reports")
    inspections = relationship("Inspection", back_populates="report", cascade="all, delete-orphan")
    history = relationship("RepairHistory", back_populates="report", cascade="all, delete-orphan")
