"""Verification tests proving CaseBridge boots cleanly."""


def test_app_creation(app):
    """Test that the application factory instantiates without errors."""
    assert app is not None
    assert app.config["TESTING"] is True
    assert app.config["WTF_CSRF_ENABLED"] is False


def test_health_check(client):
    """Test that the /health endpoint responds with 200 OK and valid JSON."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert data["service"] == "CaseBridge"
    assert "timestamp" in data
