from datetime import datetime, timezone
from typing import Optional, Dict, Any
from supabase import Client
from app.schemas.profile import ProfileUpdate


def get_profile_by_id(db: Client, profile_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a profile record by UUID."""
    response = db.table("profiles").select("*").eq("id", profile_id).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


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
        raise Exception("Profile not found.")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    response = (
        db.table("profiles")
        .update(update_data)
        .eq("id", profile_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    raise Exception("Failed to update profile.")
