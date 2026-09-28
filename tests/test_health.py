"""Health endpoint contract tests."""


def test_health_json_keys(client):
    """Ensure health endpoint provides expected service monitoring keys."""
    res = client.get("/health")
    assert res.status_code == 200
    payload = res.get_json()
    assert "status" in payload
    assert "service" in payload
    assert "database" in payload
    assert "timestamp" in payload
