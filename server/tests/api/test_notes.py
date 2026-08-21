import uuid
from typing import Dict, Any
import pytest
from fastapi.testclient import TestClient


def _create_test_hangout(client: TestClient) -> str:
    """Helper function to create a test hangout and return its ID."""
    payload = {
        "title": "Notes Test Hangout",
        "description": "Hangout for testing notes CRUD and privacy",
        "hangout_date": "2026-08-25",
        "location_name": "Cafe Central",
    }
    res = client.post("/api/v1/hangouts", json=payload)
    assert res.status_code == 201
    return res.json()["id"]


def test_create_and_get_hangout_notes(
    authenticated_client: TestClient,
    primary_user: Dict[str, Any],
):
    """Test creating a shared note and retrieving it via hangout notes endpoint."""
    hangout_id = _create_test_hangout(authenticated_client)

    note_payload = {
        "content": "Bring board games and snacks!",
        "is_shared": True,
    }
    create_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/notes",
        json=note_payload,
    )
    assert create_res.status_code == 201
    note_data = create_res.json()
    assert note_data["hangout_id"] == hangout_id
    assert note_data["created_by"] == primary_user["id"]
    assert note_data["content"] == "Bring board games and snacks!"
    assert note_data["is_shared"] is True
    assert note_data["author"]["id"] == primary_user["id"]
    assert "created_at" in note_data
    assert "updated_at" in note_data

    # Retrieve hangout notes
    list_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}/notes")
    assert list_res.status_code == 200
    notes = list_res.json()
    assert len(notes) >= 1
    assert any(n["id"] == note_data["id"] for n in notes)


def test_private_note_privacy_isolation(
    authenticated_client: TestClient,
    primary_user: Dict[str, Any],
    secondary_user: Dict[str, Any],
):
    """Private notes (is_shared=False) must only be visible to the author."""
    hangout_id = _create_test_hangout(authenticated_client)

    # 1. Primary user creates a private note
    private_note_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/notes",
        json={"content": "Secret gift idea for John", "is_shared": False},
    )
    assert private_note_res.status_code == 201
    private_note_id = private_note_res.json()["id"]

    # 2. Primary user creates a shared note
    shared_note_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/notes",
        json={"content": "Public agenda for everyone", "is_shared": True},
    )
    assert shared_note_res.status_code == 201
    shared_note_id = shared_note_res.json()["id"]

    # 3. Secondary user fetches hangout notes
    sec_res = authenticated_client.get(
        f"/api/v1/hangouts/{hangout_id}/notes",
        headers=secondary_user["headers"],
    )
    assert sec_res.status_code == 200
    sec_notes = sec_res.json()
    sec_note_ids = [n["id"] for n in sec_notes]

    assert shared_note_id in sec_note_ids
    assert private_note_id not in sec_note_ids

    # 4. Primary user fetches hangout notes and sees BOTH
    prim_res = authenticated_client.get(f"/api/v1/hangouts/{hangout_id}/notes")
    assert prim_res.status_code == 200
    prim_notes = prim_res.json()
    prim_note_ids = [n["id"] for n in prim_notes]

    assert shared_note_id in prim_note_ids
    assert private_note_id in prim_note_ids


def test_get_my_notes(
    authenticated_client: TestClient,
    primary_user: Dict[str, Any],
    secondary_user: Dict[str, Any],
):
    """GET /api/v1/notes/my-notes returns all notes authored by the current user across hangouts."""
    hangout_1_id = _create_test_hangout(authenticated_client)
    hangout_2_id = _create_test_hangout(authenticated_client)

    note_1_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_1_id}/notes",
        json={"content": "Note in Hangout 1", "is_shared": True},
    )
    assert note_1_res.status_code == 201

    note_2_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_2_id}/notes",
        json={"content": "Private note in Hangout 2", "is_shared": False},
    )
    assert note_2_res.status_code == 201

    # Fetch my-notes
    my_notes_res = authenticated_client.get("/api/v1/notes/my-notes")
    assert my_notes_res.status_code == 200
    my_notes = my_notes_res.json()

    created_ids = {note_1_res.json()["id"], note_2_res.json()["id"]}
    retrieved_ids = {n["id"] for n in my_notes}
    assert created_ids.issubset(retrieved_ids)

    for note in my_notes:
        assert note["created_by"] == primary_user["id"]
        assert note["author"]["id"] == primary_user["id"]

    # Secondary user calling my-notes should not see primary user's notes
    sec_my_notes_res = authenticated_client.get(
        "/api/v1/notes/my-notes",
        headers=secondary_user["headers"],
    )
    assert sec_my_notes_res.status_code == 200
    sec_retrieved_ids = {n["id"] for n in sec_my_notes_res.json()}
    assert not created_ids.intersection(sec_retrieved_ids)


def test_update_note_author_and_non_author(
    authenticated_client: TestClient,
    primary_user: Dict[str, Any],
    secondary_user: Dict[str, Any],
):
    """Author can edit note; non-author receives 403 Forbidden."""
    hangout_id = _create_test_hangout(authenticated_client)

    note_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/notes",
        json={"content": "Original Content", "is_shared": True},
    )
    assert note_res.status_code == 201
    note_id = note_res.json()["id"]

    # Secondary user attempts update -> 403 Forbidden
    unauthorized_res = authenticated_client.patch(
        f"/api/v1/notes/{note_id}",
        json={"content": "Malicious Content Overwrite"},
        headers=secondary_user["headers"],
    )
    assert unauthorized_res.status_code == 403

    # Primary user updates content and privacy toggle -> 200 OK
    update_res = authenticated_client.patch(
        f"/api/v1/notes/{note_id}",
        json={"content": "Updated Content by Author", "is_shared": False},
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["content"] == "Updated Content by Author"
    assert updated_data["is_shared"] is False
    assert updated_data["author"]["id"] == primary_user["id"]


def test_delete_note_author_and_non_author(
    authenticated_client: TestClient,
    secondary_user: Dict[str, Any],
):
    """Author can delete note; non-author receives 403 Forbidden."""
    hangout_id = _create_test_hangout(authenticated_client)

    note_res = authenticated_client.post(
        f"/api/v1/hangouts/{hangout_id}/notes",
        json={"content": "Temporary note to delete", "is_shared": True},
    )
    assert note_res.status_code == 201
    note_id = note_res.json()["id"]

    # Secondary user attempts deletion -> 403 Forbidden
    unauth_delete_res = authenticated_client.delete(
        f"/api/v1/notes/{note_id}",
        headers=secondary_user["headers"],
    )
    assert unauth_delete_res.status_code == 403

    # Primary user deletes note -> 204 No Content
    delete_res = authenticated_client.delete(f"/api/v1/notes/{note_id}")
    assert delete_res.status_code == 204

    # Subsequent update attempts return 404 Not Found
    subsequent_patch = authenticated_client.patch(
        f"/api/v1/notes/{note_id}",
        json={"content": "Cannot update deleted note"},
    )
    assert subsequent_patch.status_code == 404


def test_note_not_found_and_invalid_hangout(authenticated_client: TestClient):
    """Non-existent hangout or non-existent note operations return 404."""
    fake_uuid = str(uuid.uuid4())

    # Create note on nonexistent hangout
    res = authenticated_client.post(
        f"/api/v1/hangouts/{fake_uuid}/notes",
        json={"content": "Ghost note", "is_shared": True},
    )
    assert res.status_code == 404
    assert "Hangout not found" in res.json()["detail"]

    # Get notes for nonexistent hangout
    res = authenticated_client.get(f"/api/v1/hangouts/{fake_uuid}/notes")
    assert res.status_code == 404

    # Update nonexistent note
    res = authenticated_client.patch(
        f"/api/v1/notes/{fake_uuid}",
        json={"content": "Ghost update"},
    )
    assert res.status_code == 404

    # Delete nonexistent note
    res = authenticated_client.delete(f"/api/v1/notes/{fake_uuid}")
    assert res.status_code == 404
