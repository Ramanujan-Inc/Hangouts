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
    assert "You are not an active member of this group." in response.json()["detail"]


def test_invite_group_member_success(
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
    primary_user: Dict[str, Any],
):
    """Group member successfully invites another user."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Outdoors Club"},
    )
    group_id = create_res.json()["id"]

    response = authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["group_id"] == group_id
    assert data["user_id"] == secondary_user["id"]
    assert data["status"] == "pending"
    assert data["invited_by"] == primary_user["id"]


def test_respond_to_invite_accept(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Invited user accepts a group invitation."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Music Jam"},
    )
    group_id = create_res.json()["id"]

    # Invite secondary user
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"]},
    )

    # Secondary user accepts invite
    sec_client = client
    sec_client.headers.update(secondary_user["headers"])

    response = sec_client.post(
        f"/api/v1/groups/{group_id}/invites/respond",
        json={"action": "accept"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "accepted"


def test_respond_to_invite_decline(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Invited user declines a group invitation."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Book Club"},
    )
    group_id = create_res.json()["id"]

    # Invite secondary user
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"]},
    )

    # Secondary user declines invite
    sec_client = client
    sec_client.headers.update(secondary_user["headers"])

    response = sec_client.post(
        f"/api/v1/groups/{group_id}/invites/respond",
        json={"action": "decline"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "declined"


def test_invite_group_member_duplicate_returns_400(
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Inviting a user who already has a pending or accepted membership returns 400."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Movie Guild"},
    )
    group_id = create_res.json()["id"]

    # First invite succeeds
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"]},
    )

    # Second invite fails
    response = authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"]},
    )
    assert response.status_code == 400
    assert "already been invited" in response.json()["detail"]


def test_remove_member_other_user_returns_403(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Attempting to remove another user receives 403 Forbidden."""
    create_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": "Coding Sprint"},
    )
    group_id = create_res.json()["id"]

    # Invite secondary user
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"]},
    )

    # Primary user tries to remove secondary user
    response = authenticated_client.delete(
        f"/api/v1/groups/{group_id}/members/{secondary_user['id']}"
    )
    assert response.status_code == 403
    assert "Members can only remove themselves" in response.json()["detail"]


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

    # Primary user invites secondary_user
    authenticated_client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"user_id": secondary_user["id"]},
    )

    # Secondary user accepts
    sec_client = client
    sec_client.headers.update(secondary_user["headers"])
    sec_client.post(
        f"/api/v1/groups/{group_id}/invites/respond",
        json={"action": "accept"},
    )

    # Secondary user removes themselves (leaves group)
    response = sec_client.delete(
        f"/api/v1/groups/{group_id}/members/{secondary_user['id']}"
    )
    assert response.status_code == 204
