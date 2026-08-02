from unittest.mock import patch
from fastapi.testclient import TestClient
from tests.conftest import TEST_USER_ID

MOCK_PROFILE = {
    "id": TEST_USER_ID,
    "email": "testuser@example.com",
    "display_name": "Test User",
    "avatar_url": None,
    "created_at": "2026-08-01T00:00:00Z",
    "updated_at": "2026-08-01T00:00:00Z",
}


def test_get_current_user_profile(authenticated_client: TestClient):
    """Retrieve profile of authenticated user."""
    with patch("app.api.v1.profiles.profile_service.get_profile_by_id", return_value=MOCK_PROFILE):
        response = authenticated_client.get("/api/v1/profiles/me")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TEST_USER_ID
        assert data["email"] == "testuser@example.com"
        assert data["display_name"] == "Test User"


def test_update_current_user_profile(authenticated_client: TestClient):
    """Update profile display_name."""
    updated_mock = {**MOCK_PROFILE, "display_name": "Updated Name"}
    with patch("app.api.v1.profiles.profile_service.update_profile", return_value=updated_mock):
        response = authenticated_client.patch(
            "/api/v1/profiles/me",
            json={"display_name": "Updated Name"},
        )
        assert response.status_code == 200
        assert response.json()["display_name"] == "Updated Name"


def test_get_profile_by_id_success(authenticated_client: TestClient):
    """Fetch public profile by UUID."""
    with patch("app.api.v1.profiles.profile_service.get_profile_by_id", return_value=MOCK_PROFILE):
        response = authenticated_client.get(f"/api/v1/profiles/{TEST_USER_ID}")
        assert response.status_code == 200
        assert response.json()["id"] == TEST_USER_ID


def test_get_profile_by_id_not_found(authenticated_client: TestClient):
    """Fetch non-existent profile returns 404."""
    with patch("app.api.v1.profiles.profile_service.get_profile_by_id", return_value=None):
        response = authenticated_client.get("/api/v1/profiles/00000000-0000-0000-0000-999999999999")
        assert response.status_code == 404
        assert response.json()["detail"] == "User profile not found."
