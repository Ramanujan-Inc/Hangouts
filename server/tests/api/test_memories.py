import uuid
from datetime import datetime, timezone, date
from typing import Dict, Any
import pytest
from fastapi.testclient import TestClient


def test_get_memories_on_this_day_default(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Memories endpoint returns historical hangouts matching today's month & day from past years."""
    today = datetime.now(timezone.utc).date()
    past_year = today.year - 1
    
    # Handle Feb 29 leap year edge cases gracefully
    try:
        past_date = date(past_year, today.month, today.day).isoformat()
    except ValueError:
        past_date = date(past_year, today.month, today.day - 1).isoformat()

    unique_str = uuid.uuid4().hex[:6]
    past_title = f"Anniversary Hangout {unique_str}"
    current_title = f"Today's Fresh Hangout {unique_str}"

    # 1. Create a hangout 1 year ago today
    res_past = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": past_title,
            "location_name": "Historic Cafe",
            "hangout_date": past_date,
        },
    )
    assert res_past.status_code == 201
    past_id = res_past.json()["id"]

    # 2. Create a hangout today (current year)
    res_current = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": current_title,
            "location_name": "Modern Lounge",
            "hangout_date": today.isoformat(),
        },
    )
    assert res_current.status_code == 201
    current_id = res_current.json()["id"]

    # 3. Query on-this-day memories without date parameter (defaults to today)
    response = authenticated_client.get("/api/v1/memories/on-this-day")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    past_matches = [m for m in data if m["id"] == past_id]
    current_matches = [m for m in data if m["id"] == current_id]

    assert len(past_matches) == 1
    memory = past_matches[0]
    assert memory["title"] == past_title
    assert memory["years_ago"] == 1
    assert "creator" in memory
    assert memory["creator"]["id"] == primary_user["id"]
    assert "participants" in memory
    assert len(memory["participants"]) >= 1

    # Current year hangouts should not be counted as historical memories
    assert len(current_matches) == 0


def test_get_memories_on_this_day_custom_date(authenticated_client: TestClient):
    """Memories endpoint correctly filters historical hangouts based on query date."""
    unique_str = uuid.uuid4().hex[:6]

    # Create 2-years-ago and 3-years-ago hangouts
    res_2024 = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Ramen 2024 {unique_str}",
            "location_name": "Tokyo Ramen",
            "hangout_date": "2024-05-15",
        },
    )
    assert res_2024.status_code == 201
    id_2024 = res_2024.json()["id"]

    res_2023 = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Ramen 2023 {unique_str}",
            "location_name": "Tokyo Ramen",
            "hangout_date": "2023-05-15",
        },
    )
    assert res_2023.status_code == 201
    id_2023 = res_2023.json()["id"]

    # Query memories for May 15, 2026
    response = authenticated_client.get("/api/v1/memories/on-this-day?date=2026-05-15")
    assert response.status_code == 200
    data = response.json()

    match_2024 = [m for m in data if m["id"] == id_2024]
    match_2023 = [m for m in data if m["id"] == id_2023]

    assert len(match_2024) == 1
    assert match_2024[0]["years_ago"] == 2

    assert len(match_2023) == 1
    assert match_2023[0]["years_ago"] == 3


def test_get_memories_on_this_day_group_filter(authenticated_client: TestClient):
    """Memories endpoint filters by group_id when provided."""
    unique_str = uuid.uuid4().hex[:6]

    # 1. Create a group
    group_res = authenticated_client.post(
        "/api/v1/groups",
        json={"name": f"Memory Group {unique_str}"},
    )
    assert group_res.status_code == 201
    group_id = group_res.json()["id"]

    # 2. Hangout with group
    group_hangout = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Group Memory {unique_str}",
            "hangout_date": "2025-04-10",
            "group_id": group_id,
        },
    )
    assert group_hangout.status_code == 201
    group_hangout_id = group_hangout.json()["id"]

    # 3. Hangout without group on the same date
    solo_hangout = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Solo Memory {unique_str}",
            "hangout_date": "2025-04-10",
        },
    )
    assert solo_hangout.status_code == 201
    solo_hangout_id = solo_hangout.json()["id"]

    # 4. Query with group_id filter
    res = authenticated_client.get(f"/api/v1/memories/on-this-day?date=2026-04-10&group_id={group_id}")
    assert res.status_code == 200
    data = res.json()

    match_group = [m for m in data if m["id"] == group_hangout_id]
    match_solo = [m for m in data if m["id"] == solo_hangout_id]

    assert len(match_group) == 1
    assert len(match_solo) == 0


def test_get_memories_empty(authenticated_client: TestClient):
    """Querying a date with no past hangouts returns an empty list."""
    res = authenticated_client.get("/api/v1/memories/on-this-day?date=2026-12-31")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_get_memories_user_isolation(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Ensure memories only return historical hangouts for the specific user."""
    unique_str = uuid.uuid4().hex[:6]
    test_date = "2024-03-15"

    # Primary user creates historical hangout on 2024-03-15
    res_past = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Memory Isolation Test {unique_str}",
            "location_name": "Old Cafe",
            "hangout_date": test_date,
        },
    )
    assert res_past.status_code == 201
    past_id = res_past.json()["id"]

    # Secondary user queries memories for that date: should NOT see primary's hangout
    sec_mem_res = client.get(
        f"/api/v1/memories/on-this-day?date=2026-03-15",
        headers=secondary_user["headers"],
    )
    assert sec_mem_res.status_code == 200
    sec_matches = [m for m in sec_mem_res.json() if m["id"] == past_id]
    assert len(sec_matches) == 0

    # Primary user queries memories for that date: sees it
    pri_mem_res = authenticated_client.get("/api/v1/memories/on-this-day?date=2026-03-15")
    assert pri_mem_res.status_code == 200
    pri_matches = [m for m in pri_mem_res.json() if m["id"] == past_id]
    assert len(pri_matches) == 1

    # Add secondary user as participant
    invite_res = authenticated_client.post(
        f"/api/v1/hangouts/{past_id}/participants",
        json={"user_id": secondary_user["id"]},
    )
    assert invite_res.status_code == 201

    # Secondary user now sees the memory
    sec_mem_res_after = client.get(
        f"/api/v1/memories/on-this-day?date=2026-03-15",
        headers=secondary_user["headers"],
    )
    assert sec_mem_res_after.status_code == 200
    sec_matches_after = [m for m in sec_mem_res_after.json() if m["id"] == past_id]
    assert len(sec_matches_after) == 1


def test_get_memories_weekly_window(authenticated_client: TestClient):
    """Ensure hangouts within ±3 days of target anniversary are captured in memories."""
    unique_str = uuid.uuid4().hex[:6]

    # Create a historical hangout on 2024-08-21 (2 days before Aug 23)
    res_past = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Sunset Walk {unique_str}",
            "location_name": "Manila Bay",
            "hangout_date": "2024-08-21",
        },
    )
    assert res_past.status_code == 201
    past_id = res_past.json()["id"]

    # Query memories for Aug 23, 2026 (target date is 2 days after the anniversary Aug 21)
    res = authenticated_client.get("/api/v1/memories/on-this-day?date=2026-08-23")
    assert res.status_code == 200
    matches = [m for m in res.json() if m["id"] == past_id]
    assert len(matches) == 1
    assert matches[0]["years_ago"] == 2
    assert matches[0]["days_diff"] == -2
