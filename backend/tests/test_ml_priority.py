import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))
from backend.app.main import app
from backend.app.services.priority_service import calculate_priority_score
from backend.app.services.ml_service import ml_service

client = TestClient(app)

def test_priority_score_calculation():
    # 0.50 * 5.0 (High) + 0.20 * 4.0 + 0.10 * 4.0 + 0.20 * 4.0 = 2.5 + 0.8 + 0.4 + 0.8 = 4.5
    res = calculate_priority_score(
        severity="High",
        traffic_level=4,
        rainfall_exposure=200.0,
        road_importance=4,
        road_category="Major Arterial"
    )
    assert res["priority_score"] == 4.5
    assert res["priority_band"] == "High"
    assert res["is_provisional"] is False

def test_priority_missing_values_provisional():
    # Missing all parameters: should flag provisional
    res = calculate_priority_score(
        severity=None,
        traffic_level=None,
        rainfall_exposure=None,
        road_importance=None
    )
    assert res["is_provisional"] is True
    assert len(res["breakdown"]["warnings"]) >= 3

def test_model_info_endpoint():
    response = client.get("/api/model/info")
    assert response.status_code == 200
    info = response.json()
    assert "model_version" in info
    assert "feature_schema" in info
    assert "limitations" in info

def test_model_metrics_endpoint():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    metrics = response.json()
    assert "accuracy" in metrics
    assert "confusion_matrix" in metrics
    assert metrics["accuracy"] > 0.85

def test_export_reports_csv():
    response = client.get("/api/exports/reports.csv")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    content = response.text
    assert "Report ID,Title,Damage Type" in content
