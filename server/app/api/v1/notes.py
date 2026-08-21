from typing import List
from fastapi import APIRouter, Depends, status
from supabase import Client
from app.api.deps import get_current_user, get_db
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.services import notes as notes_service

router = APIRouter()


@router.post(
    "/hangouts/{id}/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a note for a hangout",
)
def create_note(
    id: str,
    note_create: NoteCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Create a note (shared or private) for a specific hangout."""
    return notes_service.create_note(
        db=db,
        hangout_id=id,
        user_id=current_user["id"],
        note_create=note_create,
    )


@router.get(
    "/hangouts/{id}/notes",
    response_model=List[NoteResponse],
    summary="Get notes for a hangout",
)
def list_hangout_notes(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Retrieve notes for a hangout. Private notes are visible only to the author."""
    return notes_service.get_hangout_notes(
        db=db,
        hangout_id=id,
        user_id=current_user["id"],
    )


@router.get(
    "/notes/my-notes",
    response_model=List[NoteResponse],
    summary="Get all notes created by current user",
)
def list_my_notes(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Retrieve all notes created by the current user across all hangouts, ordered by newest first."""
    return notes_service.get_my_notes(
        db=db,
        user_id=current_user["id"],
    )


@router.patch(
    "/notes/{note_id}",
    response_model=NoteResponse,
    summary="Update a note",
)
def update_note(
    note_id: str,
    note_update: NoteUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Update a note's content or sharing privacy (author only)."""
    return notes_service.update_note(
        db=db,
        note_id=note_id,
        user_id=current_user["id"],
        note_update=note_update,
    )


@router.delete(
    "/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a note",
)
def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Delete a note (author only)."""
    notes_service.delete_note(
        db=db,
        note_id=note_id,
        user_id=current_user["id"],
    )
