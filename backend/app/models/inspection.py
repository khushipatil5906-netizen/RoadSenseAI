from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("road_reports.id"), nullable=False, index=True)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    inspection_notes = Column(Text, nullable=False)
    verified_severity = Column(String(30), nullable=False)  # Low, Medium, High
    recommendation = Column(String(120), nullable=False)    # e.g. "Immediate patching", "Cold milling & resurfacing", "Routine monitoring"
    inspection_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("RoadReport", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections")
