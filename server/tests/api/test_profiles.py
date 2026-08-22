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
    assert data["username"] == primary_user["username"]


def test_update_current_user_profile(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Update profile username in real database."""
    new_name = "Updated Username"
    response = authenticated_client.patch(
        "/api/v1/profiles/me",
        json={"username": new_name},
    )
    assert response.status_code == 200
    assert response.json()["username"] == new_name

    # Confirm update persisted
    me_response = authenticated_client.get("/api/v1/profiles/me")
    assert me_response.json()["username"] == new_name


def test_get_profile_by_id_success(authenticated_client: TestClient, secondary_user: Dict[str, Any]):
    """Fetch public profile by UUID from real database."""
    response = authenticated_client.get(f"/api/v1/profiles/{secondary_user['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == secondary_user["id"]
    assert data["username"] == secondary_user["username"]


def test_get_profile_by_id_not_found(authenticated_client: TestClient):
    """Fetch non-existent profile returns 404."""
    random_uuid = str(uuid.uuid4())
    response = authenticated_client.get(f"/api/v1/profiles/{random_uuid}")
    assert response.status_code == 404
    assert response.json()["detail"] == "User profile not found."


def test_get_profile_by_username_success(authenticated_client: TestClient, secondary_user: Dict[str, Any]):
    """Fetch public profile by exact username from real database."""
    response = authenticated_client.get(f"/api/v1/profiles/{secondary_user['username']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == secondary_user["id"]
    assert data["username"] == secondary_user["username"]


def test_get_profile_by_username_not_found(authenticated_client: TestClient):
    """Fetch non-existent username returns 404."""
    response = authenticated_client.get("/api/v1/profiles/nonexistentuser123987")
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


def test_upload_avatar_success(authenticated_client: TestClient):
    """Upload custom avatar image file and confirm profile is updated."""
    import io
    fake_avatar_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x48" + b"A" * 100
    file_payload = ("my_avatar.jpg", io.BytesIO(fake_avatar_bytes), "image/jpeg")
    response = authenticated_client.post(
        "/api/v1/profiles/avatar",
        files={"file": file_payload},
    )
    assert response.status_code == 201
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("http")

    # Confirm avatar_url updated on /profiles/me
    me_res = authenticated_client.get("/api/v1/profiles/me")
    assert me_res.status_code == 200
    assert me_res.json()["avatar_url"] == data["url"]


def test_upload_avatar_invalid_mime_type(authenticated_client: TestClient):
    """Uploading a non-image file type returns 400 Bad Request."""
    import io
    fake_txt_bytes = b"Hello world text file"
    file_payload = ("document.txt", io.BytesIO(fake_txt_bytes), "text/plain")
    response = authenticated_client.post(
        "/api/v1/profiles/avatar",
        files={"file": file_payload},
    )
    assert response.status_code == 400
    assert "Invalid image type" in response.json()["detail"]




