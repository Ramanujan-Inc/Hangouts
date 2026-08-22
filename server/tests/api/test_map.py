import uuid
from typing import Dict, Any
import pytest
from fastapi.testclient import TestClient


def test_get_hangouts_map(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Spatial map endpoint returns hangouts with latitude and longitude."""
    unique_str = uuid.uuid4().hex[:6]
    title = f"Map Pin Test {unique_str}"
    
    # 1. Create hangout with coordinates
    create_res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": title,
            "location_name": "Manila Bay Walk",
            "latitude": 14.5764,
            "longitude": 120.9782,
            "hangout_date": "2026-08-20",
        },
    )
    assert create_res.status_code == 201
    hangout_id = create_res.json()["id"]

    # 2. Query map endpoint
    response = authenticated_client.get("/api/v1/hangouts/map")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # Check that our created hangout is in the response and has latitude/longitude
    matching = [h for h in data if h["id"] == hangout_id]
    assert len(matching) == 1
    target = matching[0]
    assert target["latitude"] == 14.5764
    assert target["longitude"] == 120.9782
    assert target["location_name"] == "Manila Bay Walk"
    assert "creator" in target
    assert "participants" in target


def test_get_hangouts_map_bounding_box(authenticated_client: TestClient):
    """Spatial map endpoint filters hangouts within bounding box coordinates."""
    unique_str = uuid.uuid4().hex[:6]
    
    # Inside bounding box (Manila)
    create_inside = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Inside Bounding Box {unique_str}",
            "location_name": "Intramuros",
            "latitude": 14.5896,
            "longitude": 120.9747,
            "hangout_date": "2026-08-21",
        },
    )
    assert create_inside.status_code == 201
    inside_id = create_inside.json()["id"]

    # Outside bounding box (Cebu)
    create_outside = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Outside Bounding Box {unique_str}",
            "location_name": "Cebu IT Park",
            "latitude": 10.3273,
            "longitude": 123.9070,
            "hangout_date": "2026-08-22",
        },
    )
    assert create_outside.status_code == 201
    outside_id = create_outside.json()["id"]

    # Query with Manila bounding box (min_lat=14.0, max_lat=15.0, min_lng=120.0, max_lng=121.0)
    response = authenticated_client.get(
        "/api/v1/hangouts/map?min_lat=14.0&max_lat=15.0&min_lng=120.0&max_lng=121.0"
    )
    assert response.status_code == 200
    data = response.json()
    
    matching_inside = [h for h in data if h["id"] == inside_id]
    matching_outside = [h for h in data if h["id"] == outside_id]
    
    assert len(matching_inside) == 1
    assert len(matching_outside) == 0


def test_get_hangouts_map_user_isolation(
    client: TestClient,
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Spatial map endpoint only returns map pins for the specific user."""
    unique_str = uuid.uuid4().hex[:6]

    # Primary user creates hangout with coordinates
    res = authenticated_client.post(
        "/api/v1/hangouts",
        json={
            "title": f"Map Isolation Test {unique_str}",
            "location_name": "Rizal Park",
            "latitude": 14.5831,
            "longitude": 120.9794,
            "hangout_date": "2026-08-25",
        },
    )
    assert res.status_code == 201
    hangout_id = res.json()["id"]

    # Secondary user queries map: should NOT see primary's pin
    sec_map_res = client.get("/api/v1/hangouts/map", headers=secondary_user["headers"])
    assert sec_map_res.status_code == 200
    sec_matches = [h for h in sec_map_res.json() if h["id"] == hangout_id]
    assert len(sec_matches) == 0

    # Primary user queries map: sees pin
    pri_map_res = authenticated_client.get("/api/v1/hangouts/map")
    assert pri_map_res.status_code == 200
    pri_matches = [h for h in pri_map_res.json() if h["id"] == hangout_id]
    assert len(pri_matches) == 1
