from typing import Dict, Any
from supabase import Client
from app.core.config import settings
from app.core.exceptions import PayloadTooLargeError


def get_user_storage_usage(db: Client, user_id: str) -> Dict[str, Any]:
    """Calculate the total uploaded storage byte usage and percentage for a given user."""
    res = db.table("media").select("file_size_bytes").eq("uploaded_by", user_id).execute()
    items = res.data or []
    
    used_bytes = sum(int(item.get("file_size_bytes") or 0) for item in items)
    max_bytes = settings.MAX_USER_STORAGE_BYTES
    percentage_used = round((used_bytes / max_bytes) * 100, 2) if max_bytes > 0 else 0.0

    return {
        "used_bytes": used_bytes,
        "max_bytes": max_bytes,
        "percentage_used": percentage_used,
    }


def check_storage_quota(db: Client, user_id: str, new_file_bytes: int) -> None:
    """Verify that adding new_file_bytes does not exceed the user's maximum storage quota."""
    usage = get_user_storage_usage(db, user_id)
    if usage["used_bytes"] + new_file_bytes > usage["max_bytes"]:
        raise PayloadTooLargeError(
            f"Storage quota exceeded. Uploading this file ({new_file_bytes} bytes) "
            f"would exceed your total limit of {usage['max_bytes']} bytes "
            f"(currently using {usage['used_bytes']} bytes)."
        )
