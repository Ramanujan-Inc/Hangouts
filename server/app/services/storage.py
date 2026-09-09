from typing import Dict, Any
import uuid
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import PayloadTooLargeError
from app.models.media import Media


def get_user_storage_usage(db: Session, user_id: str) -> Dict[str, Any]:
    """Calculate the total uploaded storage byte usage and percentage for a given user."""
    user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    total = db.scalar(
        select(func.coalesce(func.sum(Media.file_size_bytes), 0)).where(Media.uploaded_by == user_uuid)
    )
    used_bytes = int(total or 0)
    max_bytes = settings.MAX_USER_STORAGE_BYTES
    percentage_used = round((used_bytes / max_bytes) * 100, 2) if max_bytes > 0 else 0.0

    return {
        "used_bytes": used_bytes,
        "max_bytes": max_bytes,
        "percentage_used": percentage_used,
    }


def check_storage_quota(db: Session, user_id: str, new_file_bytes: int) -> None:
    """Verify that adding new_file_bytes does not exceed the user's maximum storage quota."""
    usage = get_user_storage_usage(db, user_id)
    if usage["used_bytes"] + new_file_bytes > usage["max_bytes"]:
        raise PayloadTooLargeError(
            f"Storage quota exceeded. Uploading this file ({new_file_bytes} bytes) "
            f"would exceed your total limit of {usage['max_bytes']} bytes "
            f"(currently using {usage['used_bytes']} bytes)."
        )
