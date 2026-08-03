import uuid
from typing import Dict, Any
from fastapi.testclient import TestClient


def test_create_group(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Authenticated user creates a new group in real database."""
    response = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Weebs", "cover_image_url": "https://example.com/cover.jpg"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == "Weebs"
    assert data["created_by"] == primary_user["id"]


def test_list_my_groups(authenticated_client: TestClient):
    """Retrieve groups the authenticated user belongs to."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Hangout Crew"},
    )
    group_id = create_res.json()["id"]

    response = authenticated_client.get("/api/v1/groups")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(g["id"] == group_id for g in data)


def test_get_group_details_as_member(authenticated_client: TestClient):
    """Member fetches group details from real database."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Boardgames Night"},
    )
    group_id = create_res.json()["id"]

    response = authenticated_client.get(f"/api/v1/groups/{group_id}")
    assert response.status_code == 200
    assert response.json()["id"] == group_id


def test_get_group_details_non_member_returns_403(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Non-member attempting to view group details receives 403 Forbidden."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Private Club"},
    )
    group_id = create_res.json()["id"]

    sec_client = client
    sec_client.headers.update(secondary_user["headers"])

    response = sec_client.get(f"/api/v1/groups/{group_id}")
    assert response.status_code == 403
    assert "You are not a member of this group." in response.json()["detail"]


def test_add_group_member_as_admin_success(
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Group admin successfully adds a member."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Outdoors Club"},
    )
    group_id = create_res.json()["id"]

    response = authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"], "role": "member"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["group_id"] == group_id
    assert data["user_id"] == secondary_user["id"]
    assert data["role"] == "member"


def test_add_group_member_duplicate_returns_400(
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Adding a user who is already a member returns 400 Bad Request."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Movie Guild"},
    )
    group_id = create_res.json()["id"]

    # First addition succeeds
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"], "role": "member"},
    )

    # Second addition fails
    response = authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"], "role": "member"},
    )
    assert response.status_code == 400
    assert "already a member" in response.json()["detail"]


def test_add_member_requires_admin(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
    create_test_user,
):
    """Regular member attempting to add a user receives 403 Forbidden."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Secret Society"},
    )
    group_id = create_res.json()["id"]

    # Admin adds secondary_user as a regular member
    add_res = authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"], "role": "member"},
    )
    assert add_res.status_code == 200

    # Secondary user tries to add a third user
    third_user = create_test_user()
    sec_client = client
    sec_client.headers.update(secondary_user["headers"])

    response = sec_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": third_user["id"], "role": "member"},
    )
    assert response.status_code == 403
    assert "Only group admins can perform this action." in response.json()["detail"]


def test_admin_removes_another_member_success(
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Group admin removes another member from the group."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Coding Sprint"},
    )
    group_id = create_res.json()["id"]

    # Add secondary user
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"], "role": "member"},
    )

    # Admin removes secondary user
    response = authenticated_client.delete(
        f"/api/v1/groups/{group_id}/members/{secondary_user['id']}"
    )
    assert response.status_code == 204


def test_non_admin_removes_another_member_returns_403(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
    create_test_user,
):
    """Regular member trying to remove someone else receives 403 Forbidden."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Book Circle"},
    )
    group_id = create_res.json()["id"]

    # Add secondary user and third user
    third_user = create_test_user()
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"], "role": "member"},
    )
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": third_user["id"], "role": "member"},
    )

    # Secondary user tries to remove third user
    sec_client = client
    sec_client.headers.update(secondary_user["headers"])

    response = sec_client.delete(
        f"/api/v1/groups/{group_id}/members/{third_user['id']}"
    )
    assert response.status_code == 403
    assert "Only group admins can remove other members" in response.json()["detail"]


def test_remove_member_self_success(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """User removing themselves from a group succeeds with 204 No Content."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Road Trip Group"},
    )
    group_id = create_res.json()["id"]

    # Admin adds secondary_user
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"], "role": "member"},
    )

    # Secondary user removes themselves
    sec_client = client
    sec_client.headers.update(secondary_user["headers"])

    response = sec_client.delete(
        f"/api/v1/groups/{group_id}/members/{secondary_user['id']}"
    )
    assert response.status_code == 204


def test_promote_member_to_admin_as_admin(
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Group admin promotes a member to admin."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Gaming Club"},
    )
    group_id = create_res.json()["id"]

    # Add secondary user as member
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"], "role": "member"},
    )

    # Promote to admin
    response = authenticated_client.patch(
        f"/api/v1/groups/{group_id}/members/{secondary_user['id']}",
        json={"role": "admin"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_promote_member_demotion_returns_400(
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Admin attempting to demote a member receives 400 Bad Request."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Strategy Guild"},
    )
    group_id = create_res.json()["id"]

    # Add secondary user
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"], "role": "member"},
    )

    # Try demoting to member
    response = authenticated_client.patch(
        f"/api/v1/groups/{group_id}/members/{secondary_user['id']}",
        json={"role": "member"},
    )
    assert response.status_code == 400
    assert "Cannot demote" in response.json()["detail"]


