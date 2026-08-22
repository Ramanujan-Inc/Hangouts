from fastapi.testclient import TestClient


def test_health_check_returns_200(client: TestClient):
    """Verify /health endpoint responds with 200 and operational details."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "project" in data
    assert "version" in data


def test_404_not_found_route(client: TestClient):
    """Verify non-existent route returns 404."""
    response = client.get("/non-existent-path-12345")
    assert response.status_code == 404
