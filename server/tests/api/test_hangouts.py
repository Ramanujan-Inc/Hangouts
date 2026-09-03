import uuid
from typing import Dict, Any
import pytest
from fastapi.testclient import TestClient
from app.main import app



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

    # Filter by q matching title & description
    res_q = authenticated_client.get(f"/api/v1/hangouts?q={unique_str}")
    assert res_q.status_code == 200
    q_data = res_q.json()
    q_ids = [h["id"] for h in q_data]
    assert h1_id in q_ids
    assert h2_id in q_ids

    # Filter by hangout_name
    res_name = authenticated_client.get(f"/api/v1/hangouts?hangout_name=Coffee Catchup {unique_str}")
    assert res_name.status_code == 200
    name_ids = [h["id"] for h in res_name.json()]
    assert h1_id in name_ids
    assert h2_id not in name_ids

    # Filter by location_name
    res_loc = authenticated_client.get(f"/api/v1/hangouts?location_name=Cinema Plaza {unique_str}")
    assert res_loc.status_code == 200
    loc_ids = [h["id"] for h in res_loc.json()]
    assert h2_id in loc_ids
    assert h1_id not in loc_ids

    # Filter by group_name
    group_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": f"Cool Pals {unique_str}"},
    )
    assert group_res.status_code == 201
    created_group_id = group_res.json()["id"]

    group_hangout_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Group Outing {unique_str}",
            "hangout_date": "2026-09-10",
            "group_id": created_group_id,
        },
    )
    assert group_hangout_res.status_code == 201
    group_h_id = group_hangout_res.json()["id"]

    res_group_name = authenticated_client.get(f"/api/v1/hangouts?group_name=Cool Pals {unique_str}")
    assert res_group_name.status_code == 200
    grp_ids = [h["id"] for h in res_group_name.json()]
    assert group_h_id in grp_ids
    assert h1_id not in grp_ids


def test_get_hangout_details(
    client: TestClient,
    authenticated_client: TestClient,
    primary_user: Dict[str, Any],
    secondary_user: Dict[str, Any],
):
    """Fetch detailed hangout by ID with creator profile and participants (enforcing access control)."""
    create_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": "Board Games",
            "hangout_date": "2026-10-10",
        },
    )
    hangout_id = create_res.json()["id"]

    # Creator (participant) fetches hangout details -> 200 OK
    response = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == hangout_id
    assert data["creator"]["id"] == primary_user["id"]
    assert len(data["participants"]) >= 1

    # Non-participant attempts to fetch hangout details -> 403 Forbidden
    non_part_res = client.get(f"/api/v1/hangouts/{hangout_id}", headers=secondary_user["headers"])
    assert non_part_res.status_code == 403

    # Add secondary user as participant -> now 200 OK
    invite_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/participants",
        json={"user_id": secondary_user["id"]},
    )
    assert invite_res.status_code == 201

    sec_res = client.get(f"/api/v1/hangouts/{hangout_id}", headers=secondary_user["headers"])
    assert sec_res.status_code == 200


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
    third_user = create_test_user(username="Third User")

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


def test_upload_hangout_cover(authenticated_client: TestClient):
    """Test uploading a hangout cover photo."""
    file_content = b"fake-jpeg-image-bytes"
    res = authenticated_client.post(
        "/api/v1/hangouts/cover",
        files={"file": ("cover.jpg", file_content, "image/jpeg")},
    )
    assert res.status_code == 201
    assert "url" in res.json()
    assert res.json()["url"].startswith("http")


def test_list_hangouts_user_isolation(
    client: TestClient,
    authenticated_client: TestClient,
    primary_user: Dict[str, Any],
    secondary_user: Dict[str, Any],
):
    """Ensure timeline/hangouts list only returns hangouts of the specific user."""
    unique_str = uuid.uuid4().hex[:6]

    # Primary user creates Hangout A
    res_a = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Primary Hangout {unique_str}",
            "hangout_date": "2026-09-01",
        },
    )
    assert res_a.status_code == 201
    hangout_a_id = res_a.json()["id"]

    # Secondary user creates Hangout B
    res_b = client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Secondary Hangout {unique_str}",
            "hangout_date": "2026-09-02",
        },
        headers=secondary_user["headers"],
    )
    assert res_b.status_code == 201
    hangout_b_id = res_b.json()["id"]

    # Primary user lists hangouts: sees Hangout A, does NOT see Hangout B
    list_a = authenticated_client.get(f"/api/v1/hangouts?q={unique_str}")
    assert list_a.status_code == 200
    a_ids = [h["id"] for h in list_a.json()]
    assert hangout_a_id in a_ids
    assert hangout_b_id not in a_ids

    # Secondary user lists hangouts: sees Hangout B, does NOT see Hangout A
    list_b = client.get(f"/api/v1/hangouts?q={unique_str}", headers=secondary_user["headers"])
    assert list_b.status_code == 200
    b_ids = [h["id"] for h in list_b.json()]
    assert hangout_b_id in b_ids
    assert hangout_a_id not in b_ids

    # Primary user adds secondary user to Hangout A
    invite_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_a_id}/participants",
        json={"user_id": secondary_user["id"]},
    )
    assert invite_res.status_code == 201

    # Secondary user now sees both Hangout A and Hangout B
    list_b_updated = client.get(f"/api/v1/hangouts?q={unique_str}", headers=secondary_user["headers"])
    assert list_b_updated.status_code == 200
    b_updated_ids = [h["id"] for h in list_b_updated.json()]
    assert hangout_a_id in b_updated_ids
    assert hangout_b_id in b_updated_ids


def test_rate_hangout_and_get_rating(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Test user rating submission and retrieval for a hangout."""
    # Create a hangout
    h_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": "Rating Test Hangout",
            "hangout_date": "2026-08-22",
        },
    )
    assert h_res.status_code == 201
    hangout_id = h_res.json()["id"]

    # Submit rating (e.g. 5)
    rate_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/ratings",
        json={"rating": 5},
    )
    assert rate_res.status_code == 200
    rate_data = rate_res.json()
    assert rate_data["hangout_id"] == hangout_id
    assert rate_data["user_id"] == primary_user["id"]
    assert rate_data["rating"] == 5

    # Retrieve user's rating
    get_rate_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}/ratings")
    assert get_rate_res.status_code == 200
    get_data = get_rate_res.json()
    assert get_data["rating"] == 5

    # Update rating (e.g. 4)
    update_rate_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/ratings",
        json={"rating": 4},
    )
    assert update_rate_res.status_code == 200
    assert update_rate_res.json()["rating"] == 4


def test_hangout_invite_code_generated(authenticated_client: TestClient):
    """Creating a hangout generates a valid invite_code."""
    response = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": "Invite Code Hangout",
            "hangout_date": "2026-09-10",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "invite_code" in data
    assert data["invite_code"] is not None
    assert len(data["invite_code"]) >= 8


def test_get_hangout_join_preview(authenticated_client: TestClient):
    """Public and unauthenticated clients can preview hangout by invite code."""
    create_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": "Public Preview Hangout",
            "hangout_date": "2026-09-15",
            "location_name": "Central Park",
        },
    )
    invite_code = create_res.json()["invite_code"]

    # Unauthenticated request with fresh client
    with TestClient(app) as unauth_client:
        response = unauth_client.get(f"/api/v1/hangouts/join/{invite_code}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Public Preview Hangout"
        assert data["invite_code"] == invite_code
        assert data["participant_count"] == 1
        assert data["is_participant"] is False

    # Authenticated creator viewing preview reports is_participant as True
    auth_res = authenticated_client.get(f"/api/v1/hangouts/join/{invite_code}")
    assert auth_res.status_code == 200
    assert auth_res.json()["is_participant"] is True


def test_join_hangout_via_invite_code(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Authenticated secondary user joins a hangout using invite code."""
    create_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": "Secret Sunset Picnic",
            "hangout_date": "2026-09-20",
        },
    )
    invite_code = create_res.json()["invite_code"]
    hangout_id = create_res.json()["id"]

    sec_client = client
    sec_client.headers.update(secondary_user["headers"])

    # Secondary user does not have access to view hangout directly initially (403)
    detail_res = sec_client.get(f"/api/v1/hangouts/{hangout_id}")
    assert detail_res.status_code == 403

    # But can view the sanitized public preview
    preview_res = sec_client.get(f"/api/v1/hangouts/join/{invite_code}")
    assert preview_res.status_code == 200
    assert preview_res.json()["is_participant"] is False

    # Join hangout via invite code
    join_res = sec_client.post(f"/api/v1/hangouts/join/{invite_code}")
    assert join_res.status_code == 200
    data = join_res.json()
    assert any(p["user_id"] == secondary_user["id"] for p in data["participants"])

    # Now secondary user can access full hangout details
    detail_res2 = sec_client.get(f"/api/v1/hangouts/{hangout_id}")
    assert detail_res2.status_code == 200

    # Preview now reports is_participant as True
    preview_res2 = sec_client.get(f"/api/v1/hangouts/join/{invite_code}")
    assert preview_res2.status_code == 200
    assert preview_res2.json()["is_participant"] is True

    # Idempotent re-join succeeds cleanly
    rejoin_res = sec_client.post(f"/api/v1/hangouts/join/{invite_code}")
    assert rejoin_res.status_code == 200


def test_join_hangout_invalid_code_returns_404(authenticated_client: TestClient):
    """Attempting to preview or join with invalid code returns 404."""
    with TestClient(app) as unauth_client:
        preview_res = unauth_client.get("/api/v1/hangouts/join/invalidcode123")
        assert preview_res.status_code == 404

    join_res = authenticated_client.post("/api/v1/hangouts/join/invalidcode123")
    assert join_res.status_code == 404

