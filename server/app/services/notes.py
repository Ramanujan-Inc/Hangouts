from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from supabase import Client
from app.schemas.note import NoteCreate, NoteUpdate
from app.core.exceptions import NotFoundError, ForbiddenError


def create_note(
    db: Client,
    hangout_id: str,
    user_id: str,
    note_create: NoteCreate,
) -> Dict[str, Any]:
    """Create a new note within a hangout."""
    # 1. Check hangout existence
    hangout_res = db.table("hangouts").select("id").eq("id", hangout_id).execute()
    if not hangout_res.data:
        raise NotFoundError("Hangout not found.")

    now = datetime.now(timezone.utc).isoformat()
    note_dict = {
        "hangout_id": hangout_id,
        "created_by": user_id,
        "content": note_create.content,
        "is_shared": note_create.is_shared,
        "created_at": now,
        "updated_at": now,
    }

    res = db.table("notes").insert(note_dict).execute()
    if not res.data:
        raise Exception("Failed to create note.")

    note_data = res.data[0]

    # Attach author profile
    profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
    if profile_res.data:
        note_data["author"] = profile_res.data[0]

    return note_data


def get_hangout_notes(
    db: Client,
    hangout_id: str,
    user_id: str,
) -> List[Dict[str, Any]]:
    """Retrieve notes for a specific hangout, enforcing privacy rules (private notes visible only to author)."""
    # 1. Check hangout existence
    hangout_res = db.table("hangouts").select("id").eq("id", hangout_id).execute()
    if not hangout_res.data:
        raise NotFoundError("Hangout not found.")

    res = db.table("notes").select("*").eq("hangout_id", hangout_id).order("created_at", desc=True).execute()
    items = res.data or []

    # 2. Filter private items not authored by current user
    visible_items = []
    for item in items:
        if not item.get("is_shared", True) and str(item.get("created_by")) != str(user_id):
            continue
        visible_items.append(item)

    # 3. Attach author profiles
    author_ids = list({item["created_by"] for item in visible_items if "created_by" in item})
    profiles_map = {}
    if author_ids:
        profiles_res = db.table("profiles").select("*").in_("id", author_ids).execute()
        if profiles_res.data:
            profiles_map = {p["id"]: p for p in profiles_res.data}

    for item in visible_items:
        item["author"] = profiles_map.get(item.get("created_by"))

    return visible_items


def get_my_notes(
    db: Client,
    user_id: str,
) -> List[Dict[str, Any]]:
    """Retrieve all notes created by current user across all hangouts, ordered by created_at DESC."""
    res = db.table("notes").select("*").eq("created_by", user_id).order("created_at", desc=True).execute()
    items = res.data or []

    if items:
        profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
        author_profile = profile_res.data[0] if profile_res.data else None
        for item in items:
            item["author"] = author_profile

    return items


def update_note(
    db: Client,
    note_id: str,
    user_id: str,
    note_update: NoteUpdate,
) -> Dict[str, Any]:
    """Update a note's content or sharing status (author only)."""
    note_res = db.table("notes").select("*").eq("id", note_id).execute()
    if not note_res.data:
        raise NotFoundError("Note not found.")

    note_item = note_res.data[0]
    if str(note_item.get("created_by")) != str(user_id):
        raise ForbiddenError("Only the author can update this note.")

    update_dict: Dict[str, Any] = {}
    if note_update.content is not None:
        update_dict["content"] = note_update.content
    if note_update.is_shared is not None:
        update_dict["is_shared"] = note_update.is_shared

    if not update_dict:
        profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
        note_item["author"] = profile_res.data[0] if profile_res.data else None
        return note_item

    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_res = db.table("notes").update(update_dict).eq("id", note_id).execute()
    if not update_res.data:
        raise Exception("Failed to update note.")

    updated_note = update_res.data[0]
    profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
    updated_note["author"] = profile_res.data[0] if profile_res.data else None
    return updated_note


def delete_note(
    db: Client,
    note_id: str,
    user_id: str,
) -> None:
    """Delete a note (author only)."""
    note_res = db.table("notes").select("*").eq("id", note_id).execute()
    if not note_res.data:
        raise NotFoundError("Note not found.")

    note_item = note_res.data[0]
    if str(note_item.get("created_by")) != str(user_id):
        raise ForbiddenError("Only the author can delete this note.")

    db.table("notes").delete().eq("id", note_id).execute()
