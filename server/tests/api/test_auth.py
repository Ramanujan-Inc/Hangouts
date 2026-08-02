from unittest.mock import patch
from fastapi.testclient import TestClient


def test_missing_auth_header_returns_401(client: TestClient):
    """Protected endpoints must return 401 when Authorization header is missing."""
    response = client.get("/api/v1/profiles/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing authentication token."


def test_invalid_bearer_token_returns_401(client: TestClient):
    """Protected endpoints must return 401 when token is invalid or expired."""
    response = client.get(
        "/api/v1/profiles/me",
        headers={"Authorization": "Bearer invalid.mock.token"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid authentication token or token expired."


def test_signup_route_success(client: TestClient):
    """Test user registration endpoint with mocked auth service."""
    mock_token_response = {
        "access_token": "mock_access_token_123",
        "token_type": "bearer",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "email": "newuser@example.com",
    }

    with patch("app.api.v1.auth.auth_service.sign_up_user", return_value=mock_token_response):
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "newuser@example.com",
                "password": "SecretPassword123!",
                "display_name": "New User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["access_token"] == "mock_access_token_123"
        assert data["token_type"] == "bearer"


def test_login_route_success(client: TestClient):
    """Test user login endpoint with mocked auth service."""
    mock_token_response = {
        "access_token": "mock_access_token_456",
        "token_type": "bearer",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "email": "user@example.com",
    }

    with patch("app.api.v1.auth.auth_service.login_user", return_value=mock_token_response):
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "user@example.com",
                "password": "SecretPassword123!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "mock_access_token_456"
