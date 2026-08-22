from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, UploadFile
from supabase import Client
from app.schemas.profile import ProfileUpdate
from app.core.exceptions import BadRequestError
from app.services.media import _upload_to_storage, ALLOWED_IMAGE_MIME_TYPES


def upload_user_avatar(db: Client, user_id: str, file: UploadFile) -> Dict[str, str]:
    """Upload custom avatar image to storage and update user profile avatar_url."""
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise BadRequestError(
            f"Invalid image type '{content_type}'. Allowed types are {', '.join(ALLOWED_IMAGE_MIME_TYPES)}."
        )
    file_bytes = file.file.read()
    url = _upload_to_storage(db, file_bytes, file.filename or "avatar.jpg", content_type)
    update_profile(
        db=db,
        profile_id=user_id,
        profile_update=ProfileUpdate(avatar_url=url),
    )
    return {"url": url}



def get_profile_by_id(db: Client, profile_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a profile record by UUID."""
    response = db.table("profiles").select("*").eq("id", profile_id).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def get_profile_by_username(db: Client, username: str) -> Optional[Dict[str, Any]]:
    """Fetch a profile record by exact username (case-insensitive)."""
    if not username or not username.strip():
        return None
    response = db.table("profiles").select("*").ilike("username", username.strip()).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def get_profile_by_identifier(db: Client, identifier: str) -> Optional[Dict[str, Any]]:
    """Fetch a profile record by UUID or exact username (case-insensitive)."""
    if not identifier or not identifier.strip():
        return None

    trimmed = identifier.strip()

    # If identifier looks like a UUID, check ID first
    try:
        import uuid
        uuid.UUID(trimmed)
        by_id = get_profile_by_id(db, trimmed)
        if by_id:
            return by_id
    except (ValueError, AttributeError):
        pass

    # Check by exact username
    return get_profile_by_username(db, trimmed)


def update_profile(
    db: Client,
    profile_id: str,
    profile_update: ProfileUpdate,
) -> Dict[str, Any]:
    """Update profile attributes for a given profile ID."""
    update_data = profile_update.model_dump(exclude_unset=True)
    if not update_data:
        existing = get_profile_by_id(db, profile_id)
        if existing:
            return existing
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

    if "username" in update_data and update_data["username"]:
        username_val = update_data["username"].strip()
        existing = (
            db.table("profiles")
            .select("id")
            .ilike("username", username_val)
            .neq("id", profile_id)
            .execute()
        )
        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken.",
            )
        update_data["username"] = username_val

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        response = (
            db.table("profiles")
            .update(update_data)
            .eq("id", profile_id)
            .execute()
        )
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update profile: {str(e)}",
        )

    if response.data and len(response.data) > 0:
        return response.data[0]
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Failed to update profile.",
    )
