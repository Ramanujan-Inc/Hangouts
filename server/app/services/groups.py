from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from supabase import Client
from app.schemas.group import GroupCreate, GroupUpdate
import uuid
from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError, BadRequestError
from app.core.storage import upload_file_bytes, get_public_url
from app.services.media import ALLOWED_IMAGE_MIME_TYPES


def upload_group_cover_image(db: Client, file: UploadFile) -> Dict[str, str]:
    """Upload a custom group cover photo to public R2 storage and return its CDN URL."""
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise BadRequestError(
            f"Invalid image type '{content_type}'. Allowed types are {', '.join(ALLOWED_IMAGE_MIME_TYPES)}."
        )
    file_bytes = file.file.read()
    filename = file.filename or "group_cover.jpg"
    safe_filename = filename.replace(" ", "_")
    object_key = f"{settings.ENVIRONMENT}/covers/grp_{uuid.uuid4()}_{safe_filename}"

    upload_file_bytes(
        bucket=settings.R2_BUCKET_AVATARS,
        key=object_key,
        file_bytes=file_bytes,
        content_type=content_type,
    )
    url = get_public_url(bucket=settings.R2_BUCKET_AVATARS, key=object_key)
    return {"url": url}


def create_group(db: Client, group_create: GroupCreate, user_id: str) -> Dict[str, Any]:
    """Create a new group and assign the creator as the initial accepted member."""
    now = datetime.now(timezone.utc).isoformat()
    group_data = {
        "name": group_create.name,
        "cover_image_url": group_create.cover_image_url,
        "created_by": user_id,
        "created_at": now,
        "updated_at": now,
    }

    # 1. Insert into groups table
    response = db.table("groups").insert(group_data).execute()
    if not response.data or len(response.data) == 0:
        raise Exception("Failed to create group.")

    group = response.data[0]
    group_id = group["id"]

    # 2. Add creator as accepted member in group_members
    member_data = {
        "group_id": group_id,
        "user_id": user_id,
        "status": "accepted",
        "invited_by": user_id,
        "joined_at": now,
    }
    db.table("group_members").insert(member_data).execute()

    return group


def get_user_groups(db: Client, user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all accepted groups that the specified user belongs to, including member list."""
    response = (
        db.table("group_members")
        .select("status, invited_by, joined_at, groups(*)")
        .eq("user_id", user_id)
        .eq("status", "accepted")
        .execute()
    )

    groups = []
    if response.data:
        for item in response.data:
            group_info = item.get("groups")
            if group_info:
                group_info["user_status"] = item.get("status")
                group_info["members"] = get_group_members(db=db, group_id=group_info["id"])
                groups.append(group_info)
    return groups


def get_user_group_invites(db: Client, user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all pending group invitations for the specified user."""
    response = (
        db.table("group_members")
        .select("id, group_id, user_id, status, invited_by, joined_at")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .execute()
    )
    invites = []
    if response.data:
        for item in response.data:
            group_res = db.table("groups").select("*").eq("id", item["group_id"]).execute()
            group_info = group_res.data[0] if group_res.data and len(group_res.data) > 0 else None

            inviter_id = item.get("invited_by")
            inviter_profile = None
            if inviter_id:
                prof_res = db.table("profiles").select("*").eq("id", inviter_id).execute()
                if prof_res.data and len(prof_res.data) > 0:
                    inviter_profile = prof_res.data[0]

            invites.append({
                "id": item["id"],
                "group_id": item["group_id"],
                "status": item["status"],
                "joined_at": item["joined_at"],
                "group": group_info,
                "inviter": inviter_profile,
            })
    return invites


def get_group_by_id(db: Client, group_id: str) -> Optional[Dict[str, Any]]:
    """Fetch group details by group UUID."""
    response = db.table("groups").select("*").eq("id", group_id).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def get_full_group_details(db: Client, group_id: str) -> Dict[str, Any]:
    """Fetch group details by ID including member list. Raises NotFoundError if group doesn't exist."""
    group = get_group_by_id(db=db, group_id=group_id)
    if not group:
        raise NotFoundError("Group not found.")

    members = get_group_members(db=db, group_id=group_id)
    group["members"] = members
    return group


def get_group_members(db: Client, group_id: str) -> List[Dict[str, Any]]:
    """Fetch all members of a group with profile information."""
    response = (
        db.table("group_members")
        .select("id, group_id, user_id, status, invited_by, joined_at")
        .eq("group_id", group_id)
        .execute()
    )

    members = []
    if response.data:
        for item in response.data:
            prof_res = db.table("profiles").select("*").eq("id", item["user_id"]).execute()
            profile = prof_res.data[0] if prof_res.data and len(prof_res.data) > 0 else None

            member = {
                "id": item["id"],
                "group_id": item["group_id"],
                "user_id": item["user_id"],
                "status": item.get("status", "accepted"),
                "invited_by": item.get("invited_by"),
                "joined_at": item["joined_at"],
                "profile": profile,
            }
            members.append(member)
    return members


def get_member_status(db: Client, group_id: str, user_id: str) -> Optional[str]:
    """Check user's status in a specific group. Returns 'accepted', 'pending', 'declined', or None."""
    response = (
        db.table("group_members")
        .select("status")
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]["status"]
    return None


def add_group_member(
    db: Client,
    group_id: str,
    inviter_id: str,
    username: str,
) -> Dict[str, Any]:
    """Invite a user to a group (sets status to 'pending') by their unique username."""
    if not username or not username.strip():
        raise ValueError("Username must be provided.")

    profile_res = db.table("profiles").select("id").ilike("username", username.strip()).execute()
    if not profile_res.data or len(profile_res.data) == 0:
        raise NotFoundError(f"User with username '{username}' not found.")
    
    target_user_id = str(profile_res.data[0]["id"])

    existing_status = get_member_status(db, group_id, target_user_id)
    if existing_status == "accepted":
        raise ValueError("User is already a member of this group.")
    if existing_status == "pending":
        raise ValueError("User has already been invited to this group.")

    now = datetime.now(timezone.utc).isoformat()
    member_data = {
        "group_id": group_id,
        "user_id": target_user_id,
        "status": "pending",
        "invited_by": inviter_id,
        "joined_at": now,
    }
    response = db.table("group_members").insert(member_data).execute()
    if response.data and len(response.data) > 0:
        new_member = response.data[0]
        prof_res = db.table("profiles").select("*").eq("id", target_user_id).execute()
        if prof_res.data and len(prof_res.data) > 0:
            new_member["profile"] = prof_res.data[0]
        return new_member
    raise Exception("Failed to invite member to group.")


def respond_to_group_invite(
    db: Client,
    group_id: str,
    user_id: str,
    action: str,
) -> Dict[str, Any]:
    """Accept or decline a group invitation."""
    existing_status = get_member_status(db, group_id, user_id)
    if existing_status != "pending":
        raise ValueError("No pending invitation found for this group.")

    action_lower = action.lower()
    if action_lower not in ["accept", "decline"]:
        raise ValueError("Invalid action. Must be 'accept' or 'decline'.")

    new_status = "accepted" if action_lower == "accept" else "declined"
    response = (
        db.table("group_members")
        .update({"status": new_status})
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    raise Exception("Failed to respond to group invitation.")


def remove_group_member(
    db: Client,
    group_id: str,
    current_user_id: str,
    target_user_id: str,
) -> bool:
    """Remove a user from a group. Strictly allows self-removal only."""
    if current_user_id != target_user_id:
        raise ForbiddenError("Members can only remove themselves from a group.")

    existing_status = get_member_status(db, group_id, target_user_id)
    if not existing_status:
        raise ValueError("User is not a member of this group.")

    db.table("group_members").delete().eq("group_id", group_id).eq("user_id", target_user_id).execute()
    return True
