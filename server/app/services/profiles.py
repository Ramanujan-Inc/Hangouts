from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
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
