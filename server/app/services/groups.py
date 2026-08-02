from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from supabase import Client
from app.schemas.group import GroupCreate, GroupUpdate


def create_group(db: Client, group_create: GroupCreate, user_id: str) -> Dict[str, Any]:
    """Create a new group and assign the creator as the initial admin member."""
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

    # 2. Add creator as admin in group_members
    member_data = {
        "group_id": group_id,
        "user_id": user_id,
        "role": "admin",
        "joined_at": now,
    }
    db.table("group_members").insert(member_data).execute()

    return group


def get_user_groups(db: Client, user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all groups that the specified user belongs to."""
    # Select group_members filtered by user_id, joining groups details
    response = (
        db.table("group_members")
        .select("role, joined_at, groups(*)")
        .eq("user_id", user_id)
        .execute()
    )
    
    groups = []
    if response.data:
        for item in response.data:
            group_info = item.get("groups")
            if group_info:
                group_info["user_role"] = item.get("role")
                groups.append(group_info)
    return groups


def get_group_by_id(db: Client, group_id: str) -> Optional[Dict[str, Any]]:
    """Fetch group details by group UUID."""
    response = db.table("groups").select("*").eq("id", group_id).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def get_group_members(db: Client, group_id: str) -> List[Dict[str, Any]]:
    """Fetch all members of a group with profile information."""
    response = (
        db.table("group_members")
        .select("id, group_id, user_id, role, joined_at, profiles(*)")
        .eq("group_id", group_id)
        .execute()
    )
    
    members = []
    if response.data:
        for item in response.data:
            member = {
                "id": item["id"],
                "group_id": item["group_id"],
                "user_id": item["user_id"],
                "role": item["role"],
                "joined_at": item["joined_at"],
                "profile": item.get("profiles"),
            }
            members.append(member)
    return members


def get_member_role(db: Client, group_id: str, user_id: str) -> Optional[str]:
    """Check user's role in a specific group. Returns 'admin', 'member', or None if not a member."""
    response = (
        db.table("group_members")
        .select("role")
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]["role"]
    return None





def add_group_member(
    db: Client,
    group_id: str,
    target_user_id: str,
    role: str = "member",
) -> Dict[str, Any]:
    """Add a user to a group with the specified role."""
    # Check if already a member
    existing_role = get_member_role(db, group_id, target_user_id)
    if existing_role:
        raise ValueError("User is already a member of this group.")

    now = datetime.now(timezone.utc).isoformat()
    member_data = {
        "group_id": group_id,
        "user_id": target_user_id,
        "role": role,
        "joined_at": now,
    }
    response = db.table("group_members").insert(member_data).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    raise Exception("Failed to add member to group.")


def remove_group_member(db: Client, group_id: str, target_user_id: str) -> bool:
    """Remove a user from a group."""
    existing_role = get_member_role(db, group_id, target_user_id)
    if not existing_role:
        raise ValueError("User is not a member of this group.")

    db.table("group_members").delete().eq("group_id", group_id).eq("user_id", target_user_id).execute()
    return True


def update_group_member_role(
    db: Client,
    group_id: str,
    target_user_id: str,
    new_role: str = "admin",
) -> Dict[str, Any]:
    """Promote a group member to 'admin' role."""
    if new_role != "admin":
        raise ValueError("Cannot demote an admin or assign invalid roles. Only promotion to 'admin' is allowed.")

    existing_role = get_member_role(db, group_id, target_user_id)
    if not existing_role:
        raise ValueError("User is not a member of this group.")
    if existing_role == "admin":
        raise ValueError("User is already an admin of this group.")

    response = (
        db.table("group_members")
        .update({"role": "admin"})
        .eq("group_id", group_id)
        .eq("user_id", target_user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    raise Exception("Failed to update member role.")


