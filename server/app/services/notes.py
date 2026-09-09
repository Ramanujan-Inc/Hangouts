import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.models.note import Note
from app.models.hangout import Hangout
from app.models.profile import Profile
from app.schemas.note import NoteCreate, NoteUpdate
from app.core.exceptions import NotFoundError, ForbiddenError


def _note_to_dict(note: Note) -> Dict[str, Any]:
    author_dict = None
    if note.creator:
        author_dict = {
            "id": str(note.creator.id),
            "username": note.creator.username,
            "email": note.creator.email,
            "avatar_url": note.creator.avatar_url,
            "created_at": note.creator.created_at.isoformat(),
            "updated_at": note.creator.updated_at.isoformat(),
        }
    return {
        "id": str(note.id),
        "hangout_id": str(note.hangout_id),
        "created_by": str(note.created_by),
        "content": note.content,
        "color": note.color,
        "is_shared": note.is_shared,
        "created_at": note.created_at.isoformat(),
        "updated_at": note.updated_at.isoformat(),
        "author": author_dict,
    }


def create_note(
    db: Session,
    hangout_id: str,
    user_id: str,
    note_create: NoteCreate,
) -> Dict[str, Any]:
    """Create a new note within a hangout."""
    try:
        h_uuid = uuid.UUID(str(hangout_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Hangout not found.")

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    note = Note(
        hangout_id=h_uuid,
        created_by=u_uuid,
        content=note_create.content,
        color=note_create.color or "butter",
        is_shared=note_create.is_shared,
    )
    db.add(note)
    db.flush()
    db.refresh(note, attribute_names=["creator"])
    return _note_to_dict(note)


def get_hangout_notes(
    db: Session,
    hangout_id: str,
    user_id: str,
) -> List[Dict[str, Any]]:
    """Retrieve notes for a specific hangout, enforcing privacy rules (private notes visible only to author)."""
    try:
        h_uuid = uuid.UUID(str(hangout_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Hangout not found.")

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    notes = db.scalars(
        select(Note)
        .options(joinedload(Note.creator))
        .where(Note.hangout_id == h_uuid)
        .order_by(Note.created_at.desc())
    ).all()

    visible_notes = []
    for note in notes:
        if not note.is_shared and note.created_by != u_uuid:
            continue
        visible_notes.append(_note_to_dict(note))

    return visible_notes


def get_my_notes(
    db: Session,
    user_id: str,
) -> List[Dict[str, Any]]:
    """Retrieve all notes created by current user across all hangouts, ordered by created_at DESC."""
    try:
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        return []

    notes = db.scalars(
        select(Note)
        .options(joinedload(Note.creator))
        .where(Note.created_by == u_uuid)
        .order_by(Note.created_at.desc())
    ).all()

    return [_note_to_dict(note) for note in notes]


def update_note(
    db: Session,
    note_id: str,
    user_id: str,
    note_update: NoteUpdate,
) -> Dict[str, Any]:
    """Update a note's content or sharing status (author only)."""
    try:
        n_uuid = uuid.UUID(str(note_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Note not found.")

    note = db.scalar(
        select(Note).options(joinedload(Note.creator)).where(Note.id == n_uuid)
    )
    if not note:
        raise NotFoundError("Note not found.")

    if note.created_by != u_uuid:
        raise ForbiddenError("Only the author can update this note.")

    if note_update.content is not None:
        note.content = note_update.content
    if note_update.color is not None:
        note.color = note_update.color
    if note_update.is_shared is not None:
        note.is_shared = note_update.is_shared

    note.updated_at = datetime.now(timezone.utc)
    db.flush()
    return _note_to_dict(note)


def delete_note(
    db: Session,
    note_id: str,
    user_id: str,
) -> None:
    """Delete a note (author only)."""
    try:
        n_uuid = uuid.UUID(str(note_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Note not found.")

    note = db.get(Note, n_uuid)
    if not note:
        raise NotFoundError("Note not found.")

    if note.created_by != u_uuid:
        raise ForbiddenError("Only the author can delete this note.")

    db.delete(note)
    db.flush()
