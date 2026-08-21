import io
from typing import Dict, Any
import pytest
from fastapi.testclient import TestClient


def _create_test_hangout(client: TestClient) -> str:
    """Helper fixture to create a hangout and return its ID."""
    payload = {
        "title": "Media Test Hangout",
        "description": "Hangout for testing media uploads",
        "hangout_date": "2026-08-20",
        "location_name": "Beach Resort",
    }
    res = client.post("/api/v1/hangouts", json=payload)
    assert res.status_code == 201
    return res.json()["id"]


def test_upload_photo_and_video(authenticated_client: TestClient, primary_user: Dict[str, Any]):
    """Upload valid photo (image/jpeg) and video (video/mp4) to hangout gallery."""
    hangout_id = _create_test_hangout(authenticated_client)

    # 1. Upload photo
    fake_photo_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x48"
    photo_file = ("vacation.jpg", io.BytesIO(fake_photo_bytes), "image/jpeg")
    photo_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": photo_file},
        data={"caption": "Sunset at the beach", "is_shared": "true"},
    )
    assert photo_res.status_code == 201
    photo_data = photo_res.json()
    assert photo_data["hangout_id"] == hangout_id
    assert photo_data["uploaded_by"] == primary_user["id"]
    assert photo_data["media_type"] == "photo"
    assert photo_data["caption"] == "Sunset at the beach"
    assert photo_data["is_shared"] is True
    assert photo_data["uploader"]["id"] == primary_user["id"]

    # 2. Upload video
    fake_video_bytes = b"\x00\x00\x00\x1cftypisom\x00\x00\x02\x00isomiso2mp41"
    video_file = ("clip.mp4", io.BytesIO(fake_video_bytes), "video/mp4")
    video_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": video_file},
        data={"caption": "Beach volleyball match", "is_shared": "true"},
    )
    assert video_res.status_code == 201
    video_data = video_res.json()
    assert video_data["media_type"] == "video"
    assert video_data["caption"] == "Beach volleyball match"


def test_upload_invalid_mime_type(authenticated_client: TestClient):
    """Reject uploads with non-image and non-video MIME types (e.g. application/pdf)."""
    hangout_id = _create_test_hangout(authenticated_client)

    pdf_file = ("document.pdf", io.BytesIO(b"%PDF-1.4 test data"), "application/pdf")
    res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": pdf_file},
    )
    assert res.status_code == 400
    assert "Unsupported file type" in res.json()["detail"]


def test_list_hangout_media_privacy(
    authenticated_client: TestClient,
    primary_user: Dict[str, Any],
    secondary_user: Dict[str, Any],
):
    """Enforce privacy filtering: is_shared = false items are hidden from non-uploader participants."""
    hangout_id = _create_test_hangout(authenticated_client)

    # Primary user uploads one shared media and one private media
    fake_img = b"\xFF\xD8\xFF\xE0\x00\x10JFIF"
    authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": ("public.jpg", io.BytesIO(fake_img), "image/jpeg")},
        data={"caption": "Public Photo", "is_shared": "true"},
    )

    authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": ("private.jpg", io.BytesIO(fake_img), "image/jpeg")},
        data={"caption": "Private Photo", "is_shared": "false"},
    )

    # Primary user (owner) lists media -> sees both items (2)
    owner_list_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}/media")
    assert owner_list_res.status_code == 200
    owner_items = owner_list_res.json()
    assert len(owner_items) == 2

    # Secondary user lists media -> sees only public item (1)
    other_list_res = authenticated_client.get(
        f"/api/v1/hangouts/{hangout_id}/media",
        headers=secondary_user["headers"],
    )
    assert other_list_res.status_code == 200
    other_items = other_list_res.json()
    assert len(other_items) == 1
    assert other_items[0]["caption"] == "Public Photo"


def test_favorite_and_unfavorite_media(authenticated_client: TestClient):
    """Toggle media item favorite count."""
    hangout_id = _create_test_hangout(authenticated_client)

    fake_img = b"\xFF\xD8\xFF\xE0\x00\x10JFIF"
    upload_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": ("fav.jpg", io.BytesIO(fake_img), "image/jpeg")},
    )
    media_id = upload_res.json()["id"]

    # 1. Favorite
    fav_res = authenticated_client.post(f"/api/v1/media/{media_id}/favorite")
    assert fav_res.status_code == 200
    assert fav_res.json()["favorites_count"] == 1

    # 2. Unfavorite
    unfav_res = authenticated_client.delete(f"/api/v1/media/{media_id}/favorite")
    assert unfav_res.status_code == 200
    assert unfav_res.json()["favorites_count"] == 0


def test_delete_media_owner_vs_non_owner(
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Only original uploader can delete media item."""
    hangout_id = _create_test_hangout(authenticated_client)

    fake_img = b"\xFF\xD8\xFF\xE0\x00\x10JFIF"
    upload_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": ("del.jpg", io.BytesIO(fake_img), "image/jpeg")},
    )
    media_id = upload_res.json()["id"]

    # Secondary user attempts deletion -> 403 Forbidden
    forbidden_res = authenticated_client.delete(
        f"/api/v1/media/{media_id}",
        headers=secondary_user["headers"],
    )
    assert forbidden_res.status_code == 403

    # Primary user (uploader) deletes -> 204 No Content
    delete_res = authenticated_client.delete(f"/api/v1/media/{media_id}")
    assert delete_res.status_code == 204
