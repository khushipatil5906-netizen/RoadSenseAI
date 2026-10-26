import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))
from backend.app.main import app

client = TestClient(app)

def test_list_reports():
    response = client.get("/api/reports")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 1
    # Check item schema
    first = data["items"][0]
    assert "title" in first
    assert "latitude" in first
    assert "predicted_severity" in first
    assert "priority_score" in first

def test_create_valid_report():
    response = client.post(
        "/api/reports",
        data={
            "title": "Severe Pothole on Sector 5 Highway Crossing",
            "description": "Deep asphalt hollow after monsoon rain.",
            "damage_type": "pothole",
            "latitude": 19.1234,
            "longitude": 72.8567,
            "road_name": "Sector 5 Cross Road",
            "road_category": "Major Arterial",
            "traffic_level": 4,
            "rainfall_exposure": 180.0,
            "road_importance": 4,
        }
    )
    assert response.status_code == 201
    rep = response.json()
    assert rep["title"] == "Severe Pothole on Sector 5 Highway Crossing"
    assert rep["priority_score"] is not None
    assert rep["priority_band"] in ["Lower", "Medium", "High"]

def test_reject_out_of_bounds_coordinates():
    response = client.post(
        "/api/reports",
        data={
            "title": "Invalid Coordinates Test",
            "damage_type": "pothole",
            "latitude": 190.0,  # Invalid (> 90)
            "longitude": 72.0,
        }
    )
    assert response.status_code == 400
