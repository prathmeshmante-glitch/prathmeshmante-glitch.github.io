import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "V.E.R.A. Core"

def test_system_diagnostics():
    response = client.get("/api/system/diagnostics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "nominal"
    assert data["operator"] == "Prathmesh Mante"
    assert data["github_user"] == "prathmeshmante-glitch"

def test_get_repositories():
    response = client.get("/api/github/repos")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # If network allows, repos should be populated
    if len(data) > 0:
        repo_names = [r["name"] for r in data]
        assert "brandforge" in repo_names or "inkloom" in repo_names

def test_chat_greeting_deterministic():
    payload = {
        "message": "Hello V.E.R.A.",
        "history": [],
        "caller_role": "guest"
    }
    response = client.post("/api/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "V.E.R.A." in data["spoken_reply"] or "Good day" in data["spoken_reply"]
    assert data["mode"] in ["degraded_deterministic", "ai"]

def test_chat_brandforge_inquiry():
    payload = {
        "message": "Explain BrandForge and its architecture",
        "history": [],
        "current_repo": "brandforge"
    }
    response = client.post("/api/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "brandforge" in data["spoken_reply"].lower() or "brandforge" in data["display_reply"].lower()

def test_situational_briefing():
    response = client.get("/api/assistant/briefing")
    assert response.status_code == 200
    data = response.json()
    assert "spoken" in data
    assert "repo_count" in data

def test_memory_lifecycle():
    # 1. Get memory state
    get_res = client.get("/api/memory?scope=visitor")
    assert get_res.status_code == 200
    assert get_res.json()["enabled"] is True

    # 2. Update memory
    post_res = client.post("/api/memory", json={"key": "preferred_voice", "value": "Samantha", "scope": "visitor"})
    assert post_res.status_code == 200
    assert post_res.json()["success"] is True

    # 3. Clear memory
    del_res = client.delete("/api/memory?scope=visitor")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
