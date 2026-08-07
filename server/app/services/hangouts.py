from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from supabase import Client
from app.schemas.hangout import HangoutCreate, HangoutUpdate
from app.core.exceptions import NotFoundError, ForbiddenError


def create_hangout(db: Client, hangout_create: HangoutCreate, user_id: str) -> Dict[str, Any]:
    """Create a new hangout and automatically add the creator as a participant."""
    now = datetime.now(timezone.utc).isoformat()
    hangout_dict = hangout_create.model_dump()
    
    # Convert date/time/UUID objects to strings if needed
    if hangout_dict.get("hangout_date"):
        hangout_dict["hangout_date"] = str(hangout_dict["hangout_date"])
    if hangout_dict.get("hangout_time"):
        hangout_dict["hangout_time"] = str(hangout_dict["hangout_time"])
    if hangout_dict.get("group_id"):
        hangout_dict["group_id"] = str(hangout_dict["group_id"])

    hangout_dict["created_by"] = user_id
    hangout_dict["created_at"] = now
    hangout_dict["updated_at"] = now

    # 1. Insert into hangouts table
    response = db.table("hangouts").insert(hangout_dict).execute()
    if not response.data or len(response.data) == 0:
        raise Exception("Failed to create hangout.")

    hangout_data = response.data[0]
    hangout_id = hangout_data["id"]

    # 2. Add creator as initial participant
    participant_data = {
        "hangout_id": hangout_id,
        "user_id": user_id,
    }
    db.table("hangout_participants").insert(participant_data).execute()

    return get_hangout_by_id(db=db, hangout_id=hangout_id)


def get_hangout_by_id(db: Client, hangout_id: str) -> Dict[str, Any]:
    """Fetch detailed hangout view with creator profile and participant list."""
    response = db.table("hangouts").select("*").eq("id", hangout_id).execute()
    if not response.data or len(response.data) == 0:
        raise NotFoundError("Hangout not found.")

    hangout = response.data[0]

    # Fetch creator profile
    creator_res = db.table("profiles").select("*").eq("id", hangout["created_by"]).execute()
    hangout["creator"] = creator_res.data[0] if creator_res.data else None

    # Fetch participants with profiles
    participants = get_hangout_participants(db=db, hangout_id=hangout_id)
    hangout["participants"] = participants

    return hangout


def get_hangout_participants(db: Client, hangout_id: str) -> List[Dict[str, Any]]:
    """Fetch all participants of a hangout with profile details."""
    response = (
        db.table("hangout_participants")
        .select("id, hangout_id, user_id, profile:profiles!hangout_participants_user_id_fkey(*)")
        .eq("hangout_id", hangout_id)
        .execute()
    )

    participants = []
    if response.data:
        for item in response.data:
            participant = {
                "id": item["id"],
                "hangout_id": item["hangout_id"],
                "user_id": item["user_id"],
                "profile": item.get("profile"),
            }
            participants.append(participant)
    return participants


def get_hangouts(
    db: Client,
    q: Optional[str] = None,
    date: Optional[str] = None,
    group_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Search & filter hangouts using ILIKE match on title/location_name, exact date, and group_id."""
    query = db.table("hangouts").select("*")

    if q:
        query = query.or_(f"title.ilike.%{q}%,location_name.ilike.%{q}%")
    if date:
        query = query.eq("hangout_date", str(date))
    if group_id:
        query = query.eq("group_id", str(group_id))

    response = query.order("hangout_date", desc=True).execute()

    hangouts = response.data if response.data else []

    # Populate creator and participants for each hangout
    for hangout in hangouts:
        creator_res = db.table("profiles").select("*").eq("id", hangout["created_by"]).execute()
        hangout["creator"] = creator_res.data[0] if creator_res.data else None
        hangout["participants"] = get_hangout_participants(db=db, hangout_id=hangout["id"])

    return hangouts


def update_hangout(
    db: Client,
    hangout_id: str,
    hangout_update: HangoutUpdate,
    user_id: str,
) -> Dict[str, Any]:
    """Update hangout details (creator only)."""
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id)

    if str(hangout["created_by"]) != str(user_id):
        raise ForbiddenError("Only the creator can update this hangout.")

    update_dict = hangout_update.model_dump(exclude_unset=True)
    if not update_dict:
        return hangout

    if update_dict.get("hangout_date"):
        update_dict["hangout_date"] = str(update_dict["hangout_date"])
    if update_dict.get("hangout_time"):
        update_dict["hangout_time"] = str(update_dict["hangout_time"])
    if update_dict.get("group_id"):
        update_dict["group_id"] = str(update_dict["group_id"])

    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    db.table("hangouts").update(update_dict).eq("id", hangout_id).execute()
    return get_hangout_by_id(db=db, hangout_id=hangout_id)


def delete_hangout(db: Client, hangout_id: str, user_id: str) -> None:
    """Delete a hangout (creator only)."""
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id)

    if str(hangout["created_by"]) != str(user_id):
        raise ForbiddenError("Only the creator can delete this hangout.")

    db.table("hangouts").delete().eq("id", hangout_id).execute()


def add_participant(
    db: Client,
    hangout_id: str,
    target_user_id: str,
    requesting_user_id: str,
) -> Dict[str, Any]:
    """Add participant to hangout (allowed by any active participant or creator)."""
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id)

    # Check if requesting user is active participant or creator
    participants = hangout.get("participants", [])
    is_participant_or_creator = (
        str(hangout["created_by"]) == str(requesting_user_id)
        or any(str(p["user_id"]) == str(requesting_user_id) for p in participants)
    )

    if not is_participant_or_creator:
        raise ForbiddenError("Only active participants can invite new members to this hangout.")

    # Check if target user is already a participant
    existing = [p for p in participants if str(p["user_id"]) == str(target_user_id)]
    if existing:
        return existing[0]

    # Insert into hangout_participants
    participant_data = {
        "hangout_id": hangout_id,
        "user_id": str(target_user_id),
    }
    res = db.table("hangout_participants").insert(participant_data).execute()
    if not res.data or len(res.data) == 0:
        raise Exception("Failed to add participant.")

    new_participant = res.data[0]
    profile_res = db.table("profiles").select("*").eq("id", str(target_user_id)).execute()
    new_participant["profile"] = profile_res.data[0] if profile_res.data else None

    return new_participant


def remove_participant(
    db: Client,
    hangout_id: str,
    target_user_id: str,
    requesting_user_id: str,
) -> None:
    """Remove participant (creator can kick; participants can leave/remove self)."""
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id)

    is_self_removal = str(target_user_id) == str(requesting_user_id)
    is_creator = str(hangout["created_by"]) == str(requesting_user_id)

    if not (is_self_removal or is_creator):
        raise ForbiddenError("You do not have permission to remove this participant.")

    db.table("hangout_participants").delete().eq("hangout_id", hangout_id).eq("user_id", str(target_user_id)).execute()
