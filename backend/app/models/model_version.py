from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.core.database import Base

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(80), unique=True, nullable=False)
    dataset_reference = Column(String(255), nullable=False)
    feature_schema_json = Column(Text, nullable=False)
    metrics_json = Column(Text, nullable=False)
    artifact_reference = Column(String(255), nullable=False)
    validation_status = Column(String(50), default="VALIDATED", nullable=False)
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
