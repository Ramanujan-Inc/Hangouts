import uuid
from typing import Dict, Any
import pytest
from fastapi.testclient import TestClient


def test_create_hangout(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Authenticated user creates a new hangout and is added as participant."""
    payload = {
        "title": "Weekend BBQ",
        "description": "Barbecue party at the park",
        "hangout_date": "2026-08-15",
        "hangout_time": "14:00:00",
        "location_name": "Central Park",
        "latitude": 40.785091,
        "longitude": -73.968285,
        "cover_photo_url": "https://example.com/bbq.jpg",
    }
    response = authenticated_client.post("/api/v1/hangouts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["title"] == "Weekend BBQ"
    assert data["created_by"] == primary_user["id"]
    assert data["creator"]["id"] == primary_user["id"]
    assert isinstance(data["participants"], list)
    assert len(data["participants"]) >= 1
    assert any(p["user_id"] == primary_user["id"] for p in data["participants"])


def test_list_hangouts_filter(authenticated_client: TestClient):
    """Filter hangouts using search query q and exact date."""
    unique_str = uuid.uuid4().hex[:6]
    title1 = f"Coffee Catchup {unique_str}"
    location1 = f"Starbucks Main St {unique_str}"
    date1 = "2026-09-01"

    create_res1 = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": title1,
            "location_name": location1,
            "hangout_date": date1,
        },
    )
    assert create_res1.status_code == 201
    h1_id = create_res1.json()["id"]

    title2 = f"Movie Night {unique_str}"
    location2 = f"Cinema Plaza {unique_str}"
    date2 = "2026-09-05"

    create_res2 = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": title2,
            "location_name": location2,
            "hangout_date": date2,
        },
    )
    assert create_res2.status_code == 201
    h2_id = create_res2.json()["id"]

    # Filter by q matching title
    res_q = authenticated_client.get(f"/api/v1/hangouts?q={unique_str}")
    assert res_q.status_code == 200
    q_data = res_q.json()
    q_ids = [h["id"] for h in q_data]
    assert h1_id in q_ids
    assert h2_id in q_ids

    # Filter by date
    res_date = authenticated_client.get(f"/api/v1/hangouts?date={date1}")
    assert res_date.status_code == 200
    date_data = res_date.json()
    date_ids = [h["id"] for h in date_data]
    assert h1_id in date_ids
    assert h2_id not in date_ids


def test_get_hangout_details(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Fetch detailed hangout by ID with creator profile and participants."""
    create_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": "Board Games",
            "hangout_date": "2026-10-10",
        },
    )
    hangout_id = create_res.json()["id"]

    response = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == hangout_id
    assert data["creator"]["id"] == primary_user["id"]
    assert len(data["participants"]) >= 1


def test_get_hangout_not_found(authenticated_client: TestClient):
    """GET non-existent hangout returns 404."""
    random_id = str(uuid.uuid4())
    response = authenticated_client.get(f"/api/v1/hangouts/{random_id}")
    assert response.status_code == 404


def test_update_hangout_creator_vs_non_creator(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Creator can update hangout; non-creator receives 403 Forbidden."""
    create_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": "Original Title",
            "hangout_date": "2026-08-20",
        },
    )
    hangout_id = create_res.json()["id"]

    # Non-creator attempts to update
    sec_response = client.patch(
        f"/api/v1/hangouts/{hangout_id}",
        json={"title": "Hacked Title"},
        headers=secondary_user["headers"],
    )
    assert sec_response.status_code == 403

    # Creator updates
    creator_response = authenticated_client.patch(
        f"/api/v1/hangouts/{hangout_id}",
        json={"title": "Updated Title"},
    )
    assert creator_response.status_code == 200
    assert creator_response.json()["title"] == "Updated Title"


def test_delete_hangout_creator_vs_non_creator(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Creator can delete hangout; non-creator receives 403 Forbidden."""
    create_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": "To Be Deleted",
            "hangout_date": "2026-08-22",
        },
    )
    hangout_id = create_res.json()["id"]

    # Non-creator attempts to delete
    sec_response = client.delete(
        f"/api/v1/hangouts/{hangout_id}",
        headers=secondary_user["headers"],
    )
    assert sec_response.status_code == 403

    # Creator deletes
    del_response = authenticated_client.delete(f"/api/v1/hangouts/{hangout_id}")
    assert del_response.status_code == 204

    # Verify deletion
    get_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}")
    assert get_res.status_code == 404


def test_add_and_remove_participant(
    client: TestClient,
    authenticated_client: TestClient,
    primary_user: Dict[str, Any],
    secondary_user: Dict[str, Any],
    create_test_user: Any,
):
    """Test participant invitation, self-removal, and creator kick."""
    third_user = create_test_user(display_name="Third User")

    create_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": "Party Time",
            "hangout_date": "2026-09-15",
        },
    )
    hangout_id = create_res.json()["id"]

    # 1. Non-participant (third_user) attempts to invite someone -> 403 Forbidden
    unauth_invite = client.post(
        f"/api/v1/hangouts/{hangout_id}/participants",
        json={"user_id": secondary_user["id"]},
        headers=third_user["headers"],
    )
    assert unauth_invite.status_code == 403

    # 2. Active participant (primary_user/creator) invites secondary_user -> 201 Created
    invite_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/participants",
        json={"user_id": secondary_user["id"]},
    )
    assert invite_res.status_code == 201
    assert invite_res.json()["user_id"] == secondary_user["id"]

    # Now secondary_user invites third_user (as an active participant) -> 201 Created
    sec_invite_res = client.post(
        f"/api/v1/hangouts/{hangout_id}/participants",
        json={"user_id": third_user["id"]},
        headers=secondary_user["headers"],
    )
    assert sec_invite_res.status_code == 201

    # 3. Unauthorized user (third_user) tries to kick secondary_user -> 403 Forbidden
    unauth_kick = client.delete(
        f"/api/v1/hangouts/{hangout_id}/participants/{secondary_user['id']}",
        headers=third_user["headers"],
    )
    assert unauth_kick.status_code == 403

    # 4. Self-removal (third_user leaves) -> 204 No Content
    leave_res = client.delete(
        f"/api/v1/hangouts/{hangout_id}/participants/{third_user['id']}",
        headers=third_user["headers"],
    )
    assert leave_res.status_code == 204

    # 5. Creator kicks secondary_user -> 204 No Content
    kick_res = authenticated_client.delete(
        f"/api/v1/hangouts/{hangout_id}/participants/{secondary_user['id']}"
    )
    assert kick_res.status_code == 204
