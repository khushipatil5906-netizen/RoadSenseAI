import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["ml_service_active"] is True

def test_login_inspector():
    response = client.post(
        "/api/auth/login",
        json={"email": "inspector@roadsense.gov", "password": "RoadSense123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "inspector"

def test_login_invalid():
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "WrongPassword"}
    )
    assert response.status_code == 401

def test_register_citizen():
    import uuid
    rand_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        "/api/auth/register",
        json={"name": "Test Citizen", "email": rand_email, "password": "Password123!"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "citizen"

def test_disallow_public_admin_registration():
    import uuid
    rand_email = f"hacker_{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        "/api/auth/register",
        json={"name": "Fake Admin", "email": rand_email, "password": "Password123!", "role": "admin"}
    )
    assert response.status_code == 403
