import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, UploadFile
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.profile import Profile
from app.schemas.profile import ProfileUpdate
from app.core.config import settings
from app.core.exceptions import BadRequestError
from app.core.storage import upload_file_bytes, get_avatar_public_url
from app.services.media import ALLOWED_IMAGE_MIME_TYPES


def _profile_to_dict(profile: Profile) -> Dict[str, Any]:
    return {
        "id": str(profile.id),
        "username": profile.username,
        "email": profile.email,
        "avatar_url": profile.avatar_url,
        "created_at": profile.created_at.isoformat(),
        "updated_at": profile.updated_at.isoformat(),
    }


def upload_user_avatar(db: Session, user_id: str, file: UploadFile) -> Dict[str, str]:
    """Upload custom avatar image to the public R2 avatars bucket and update user profile avatar_url."""
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise BadRequestError(
            f"Invalid image type '{content_type}'. Allowed types are {', '.join(ALLOWED_IMAGE_MIME_TYPES)}."
        )
    file_bytes = file.file.read()

    filename = file.filename or "avatar.jpg"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    safe_ext = ext if ext in ["jpg", "jpeg", "png", "webp", "gif", "heic"] else "jpg"
    timestamp = int(datetime.now(timezone.utc).timestamp())
    object_key = f"{settings.ENVIRONMENT}/usr_{user_id}_{timestamp}.{safe_ext}"

    upload_file_bytes(
        bucket=settings.R2_BUCKET_AVATARS,
        key=object_key,
        file_bytes=file_bytes,
        content_type=content_type,
    )

    public_url = get_avatar_public_url(object_key)
    update_profile(
        db=db,
        profile_id=user_id,
        profile_update=ProfileUpdate(avatar_url=public_url),
    )
    return {"url": public_url}


def get_profile_by_id(db: Session, profile_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a profile record by UUID."""
    try:
        profile_uuid = uuid.UUID(str(profile_id))
    except (ValueError, AttributeError):
        return None
    profile = db.get(Profile, profile_uuid)
    if profile:
        return _profile_to_dict(profile)
    return None


def get_profile_by_username(db: Session, username: str) -> Optional[Dict[str, Any]]:
    """Fetch a profile record by exact username (case-insensitive)."""
    if not username or not username.strip():
        return None
    profile = db.scalar(
        select(Profile).where(func.lower(Profile.username) == username.strip().lower())
    )
    if profile:
        return _profile_to_dict(profile)
    return None


def get_profile_by_identifier(db: Session, identifier: str) -> Optional[Dict[str, Any]]:
    """Fetch a profile record by UUID or exact username (case-insensitive)."""
    if not identifier or not identifier.strip():
        return None

    trimmed = identifier.strip()
    try:
        uuid.UUID(trimmed)
        by_id = get_profile_by_id(db, trimmed)
        if by_id:
            return by_id
    except (ValueError, AttributeError):
        pass

    return get_profile_by_username(db, trimmed)


def update_profile(
    db: Session,
    profile_id: str,
    profile_update: ProfileUpdate,
) -> Dict[str, Any]:
    """Update profile attributes for a given profile ID."""
    try:
        profile_uuid = uuid.UUID(str(profile_id))
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

    profile = db.get(Profile, profile_uuid)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

    update_data = profile_update.model_dump(exclude_unset=True)
    if not update_data:
        return _profile_to_dict(profile)

    if "username" in update_data and update_data["username"]:
        username_val = update_data["username"].strip()
        existing = db.scalar(
            select(Profile.id).where(
                func.lower(Profile.username) == username_val.lower(),
                Profile.id != profile_uuid,
            )
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken.",
            )
        profile.username = username_val

    if "avatar_url" in update_data:
        profile.avatar_url = update_data["avatar_url"]

    profile.updated_at = datetime.now(timezone.utc)
    db.flush()
    return _profile_to_dict(profile)
