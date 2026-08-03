import uuid
from typing import Dict, Any
from fastapi.testclient import TestClient


def test_get_current_user_profile(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Retrieve profile of authenticated user from real database."""
    response = authenticated_client.get("/api/v1/profiles/me")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == primary_user["id"]
    assert data["email"] == primary_user["email"]
    assert data["display_name"] == primary_user["display_name"]


def test_update_current_user_profile(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Update profile display_name in real database."""
    new_name = "Updated Display Name"
    response = authenticated_client.patch(
        "/api/v1/profiles/me",
        json={"display_name": new_name},
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == new_name

    # Confirm update persisted
    me_response = authenticated_client.get("/api/v1/profiles/me")
    assert me_response.json()["display_name"] == new_name


def test_get_profile_by_id_success(authenticated_client: TestClient, secondary_user: Dict[str, Any]):
    """Fetch public profile by UUID from real database."""
    response = authenticated_client.get(f"/api/v1/profiles/{secondary_user['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == secondary_user["id"]
    assert data["display_name"] == secondary_user["display_name"]


def test_get_profile_by_id_not_found(authenticated_client: TestClient):
    """Fetch non-existent profile returns 404."""
    random_uuid = str(uuid.uuid4())
    response = authenticated_client.get(f"/api/v1/profiles/{random_uuid}")
    assert response.status_code == 404
    assert response.json()["detail"] == "User profile not found."


def test_update_current_user_profile_avatar_url(authenticated_client: TestClient):
    """Update profile avatar_url in real database."""
    avatar_url = "https://example.com/avatar.png"
    response = authenticated_client.patch(
        "/api/v1/profiles/me",
        json={"avatar_url": avatar_url},
    )
    assert response.status_code == 200
    assert response.json()["avatar_url"] == avatar_url


def test_update_profile_empty_body_returns_existing(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Updating profile with empty JSON body returns existing profile."""
    response = authenticated_client.patch(
        "/api/v1/profiles/me",
        json={},
    )
    assert response.status_code == 200
    assert response.json()["id"] == primary_user["id"]


