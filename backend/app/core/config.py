import os

class Settings:
    PROJECT_NAME: str = "RoadSense AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "roadsense-ai-super-secret-production-key-2026-ml-proj")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (defaults to local SQLite, configurable for PostgreSQL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./roadsense.db")
    
    # Upload storage
    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "uploads"
    )
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # ML Models
    ML_MODEL_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "ml", "saved_models"
    )
    
    # Demo mode setting
    DEMO_MODE_ENABLED: bool = os.getenv("DEMO_MODE", "true").lower() in ["true", "1", "yes"]

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
