from unittest.mock import patch
from fastapi.testclient import TestClient
from tests.conftest import TEST_USER_ID

GROUP_ID = "11111111-1111-1111-1111-111111111111"

MOCK_GROUP = {
    "id": GROUP_ID,
    "name": "Weebs",
    "cover_image_url": "https://example.com/cover.jpg",
    "created_by": TEST_USER_ID,
    "created_at": "2026-08-01T00:00:00Z",
    "updated_at": "2026-08-01T00:00:00Z",
    "members": [],
}


def test_create_group(authenticated_client: TestClient):
    """Authenticated user creates a new group."""
    with patch("app.api.v1.groups.group_service.create_group", return_value=MOCK_GROUP):
        response = authenticated_client.post(
            "/api/v1/groups",
            json={"name": "Weebs", "cover_image_url": "https://example.com/cover.jpg"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == GROUP_ID
        assert data["name"] == "Weebs"


def test_list_my_groups(authenticated_client: TestClient):
    """Retrieve groups the authenticated user belongs to."""
    with patch("app.api.v1.groups.group_service.get_user_groups", return_value=[MOCK_GROUP]):
        response = authenticated_client.get("/api/v1/groups")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == GROUP_ID


def test_get_group_details_as_member(authenticated_client: TestClient):
    """Member fetches group details."""
    with patch("app.services.groups.get_member_role", return_value="member"), \
         patch("app.api.v1.groups.group_service.get_full_group_details", return_value=MOCK_GROUP):
        response = authenticated_client.get(f"/api/v1/groups/{GROUP_ID}")
        assert response.status_code == 200
        assert response.json()["id"] == GROUP_ID


def test_add_member_requires_admin(authenticated_client: TestClient):
    """Regular member attempting to add a user receives 403 Forbidden."""
    with patch("app.services.groups.get_member_role", return_value="member"):
        response = authenticated_client.post(
            f"/api/v1/groups/{GROUP_ID}/members",
            json={"user_id": "22222222-2222-2222-2222-222222222222", "role": "member"},
        )
        assert response.status_code == 403
        assert "Only group admins can perform this action." in response.json()["detail"]


def test_remove_member_self_success(authenticated_client: TestClient):
    """User removing themselves from a group succeeds with 204 No Content."""
    with patch("app.services.groups.get_member_role", return_value="member"), \
         patch("app.api.v1.groups.group_service.remove_group_member", return_value=True):
        response = authenticated_client.delete(
            f"/api/v1/groups/{GROUP_ID}/members/{TEST_USER_ID}"
        )
        assert response.status_code == 204


def test_promote_member_to_admin_as_admin(authenticated_client: TestClient):
    """Group admin promotes a member to admin."""
    mock_member_response = {
        "id": "33333333-3333-3333-3333-333333333333",
        "group_id": GROUP_ID,
        "user_id": "22222222-2222-2222-2222-222222222222",
        "role": "admin",
        "joined_at": "2026-08-01T00:00:00Z",
        "profile": None,
    }
    with patch("app.services.groups.get_member_role", return_value="admin"), \
         patch("app.api.v1.groups.group_service.update_group_member_role", return_value=mock_member_response):
        response = authenticated_client.patch(
            f"/api/v1/groups/{GROUP_ID}/members/22222222-2222-2222-2222-222222222222",
            json={"role": "admin"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "admin"
