import io
from typing import Dict, Any
import pytest
from fastapi.testclient import TestClient
from app.core.config import settings


def _create_test_hangout(client: TestClient) -> str:
    """Helper fixture to create a hangout and return its ID."""
    payload = {
        "title": "Storage Test Hangout",
        "description": "Hangout for testing storage quotas",
        "hangout_date": "2026-08-21",
        "location_name": "Mountain Cabin",
    }
    res = client.post("/api/v1/hangouts", json=payload)
    assert res.status_code == 201
    return res.json()["id"]


def test_get_storage_usage_initial(authenticated_client: TestClient):
    """Initial storage usage for a fresh user should be 0 bytes and 0%."""
    res = authenticated_client.get("/api/v1/storage/usage")
    assert res.status_code == 200
    data = res.json()
    assert data["used_bytes"] == 0
    assert data["max_bytes"] == settings.MAX_USER_STORAGE_BYTES
    assert data["percentage_used"] == 0.0


def test_storage_usage_accumulates_after_upload(authenticated_client: TestClient):
    """Uploading media increments total byte usage and updates percentage."""
    hangout_id = _create_test_hangout(authenticated_client)

    # 1. Upload photo
    fake_photo_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x48" + b"A" * 100
    photo_file = ("photo.jpg", io.BytesIO(fake_photo_bytes), "image/jpeg")
    upload_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": photo_file},
        data={"caption": "Test Quota Photo"},
    )
    assert upload_res.status_code == 201
    uploaded_media = upload_res.json()
    assert uploaded_media["file_size_bytes"] == len(fake_photo_bytes)

    # 2. Check storage usage endpoint
    usage_res = authenticated_client.get("/api/v1/storage/usage")
    assert usage_res.status_code == 200
    usage_data = usage_res.json()
    assert usage_data["used_bytes"] == len(fake_photo_bytes)
    assert usage_data["max_bytes"] == settings.MAX_USER_STORAGE_BYTES
    expected_pct = round((len(fake_photo_bytes) / settings.MAX_USER_STORAGE_BYTES) * 100, 2)
    assert usage_data["percentage_used"] == expected_pct


def test_storage_quota_blocks_upload_when_exceeded(authenticated_client: TestClient, monkeypatch: pytest.MonkeyPatch):
    """Upload is rejected with 413 Payload Too Large when file exceeds quota limit."""
    hangout_id = _create_test_hangout(authenticated_client)

    # Set artificially tiny limit of 50 bytes
    monkeypatch.setattr(settings, "MAX_USER_STORAGE_BYTES", 50)

    fake_photo_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF" + b"X" * 100  # 106 bytes > 50 bytes
    photo_file = ("large_photo.jpg", io.BytesIO(fake_photo_bytes), "image/jpeg")
    upload_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": photo_file},
    )
    assert upload_res.status_code == 413
    assert "Storage quota exceeded" in upload_res.json()["detail"]


def test_delete_media_frees_storage_quota(authenticated_client: TestClient):
    """Deleting a media item reduces the user's used bytes accordingly."""
    hangout_id = _create_test_hangout(authenticated_client)

    fake_photo_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF" + b"B" * 50
    photo_file = ("temp_photo.jpg", io.BytesIO(fake_photo_bytes), "image/jpeg")
    upload_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/media",
        files={"file": photo_file},
    )
    assert upload_res.status_code == 201
    media_id = upload_res.json()["id"]

    # Verify usage is positive
    usage_res1 = authenticated_client.get("/api/v1/storage/usage")
    assert usage_res1.json()["used_bytes"] >= len(fake_photo_bytes)

    # Delete media
    del_res = authenticated_client.delete(f"/api/v1/media/{media_id}")
    assert del_res.status_code == 204

    # Verify usage decreased
    usage_res2 = authenticated_client.get("/api/v1/storage/usage")
    assert usage_res2.json()["used_bytes"] == 0
