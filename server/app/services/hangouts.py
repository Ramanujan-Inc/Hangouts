from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from supabase import Client
from app.schemas.hangout import HangoutCreate, HangoutUpdate
import uuid
from app.core.config import settings
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.core.storage import upload_file_bytes, get_public_url
from app.services.media import ALLOWED_IMAGE_MIME_TYPES


def upload_hangout_cover_image(db: Client, file: UploadFile) -> Dict[str, str]:
    """Upload a custom hangout cover photo to public R2 storage and return its CDN URL."""
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise BadRequestError(
            f"Invalid image type '{content_type}'. Allowed types are {', '.join(ALLOWED_IMAGE_MIME_TYPES)}."
        )
    file_bytes = file.file.read()
    filename = file.filename or "hangout_cover.jpg"
    safe_filename = filename.replace(" ", "_")
    object_key = f"{settings.ENVIRONMENT}/covers/hng_{uuid.uuid4()}_{safe_filename}"

    upload_file_bytes(
        bucket=settings.R2_BUCKET_AVATARS,
        key=object_key,
        file_bytes=file_bytes,
        content_type=content_type,
    )
    url = get_public_url(bucket=settings.R2_BUCKET_AVATARS, key=object_key)
    return {"url": url}


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


def get_hangout_by_id(db: Client, hangout_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Fetch detailed hangout view with creator profile and participant list, validating user access."""
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

    if user_id:
        is_creator = str(hangout.get("created_by")) == str(user_id)
        is_participant = any(str(p.get("user_id")) == str(user_id) for p in participants)
        is_group_member = False
        if hangout.get("group_id"):
            member_res = (
                db.table("group_members")
                .select("status")
                .eq("group_id", str(hangout["group_id"]))
                .eq("user_id", str(user_id))
                .eq("status", "accepted")
                .execute()
            )
            is_group_member = bool(member_res.data and len(member_res.data) > 0)

        if not (is_creator or is_participant or is_group_member):
            raise ForbiddenError("You do not have access to view this hangout.")

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


def get_user_hangout_ids(db: Client, user_id: str) -> List[str]:
    """Fetch all hangout IDs where the user is a participant or creator."""
    part_res = db.table("hangout_participants").select("hangout_id").eq("user_id", str(user_id)).execute()
    hangout_ids = [p["hangout_id"] for p in (part_res.data or [])]

    created_res = db.table("hangouts").select("id").eq("created_by", str(user_id)).execute()
    if created_res.data:
        for h in created_res.data:
            if h["id"] not in hangout_ids:
                hangout_ids.append(h["id"])

    return hangout_ids


def get_hangouts(
    db: Client,
    user_id: Optional[str] = None,
    q: Optional[str] = None,
    hangout_name: Optional[str] = None,
    location_name: Optional[str] = None,
    date: Optional[str] = None,
    group_name: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Search & filter hangouts using user_id, hangout_name, location_name, date, group_name, or comprehensive omnisearch q."""
    query = db.table("hangouts").select("*")

    if user_id:
        user_hangout_ids = get_user_hangout_ids(db, user_id)
        if not user_hangout_ids:
            return []
        query = query.in_("id", user_hangout_ids)

    if hangout_name:
        query = query.ilike("title", f"%{hangout_name}%")
    if location_name:
        query = query.ilike("location_name", f"%{location_name}%")
    if q and not (hangout_name or location_name):
        clean_q = q.strip()
        or_parts = [
            f"title.ilike.%{clean_q}%",
            f"description.ilike.%{clean_q}%",
            f"location_name.ilike.%{clean_q}%",
        ]

        # Search matching groups
        groups_res = db.table("groups").select("id").ilike("name", f"%{clean_q}%").execute()
        if groups_res.data:
            for g in groups_res.data:
                or_parts.append(f"group_id.eq.{g['id']}")

        # Search matching participants/creator usernames
        profiles_res = db.table("profiles").select("id").ilike("username", f"%{clean_q}%").execute()
        if profiles_res.data:
            user_ids = [p["id"] for p in profiles_res.data]
            part_res = db.table("hangout_participants").select("hangout_id").in_("user_id", user_ids).execute()
            if part_res.data:
                for p in part_res.data:
                    or_parts.append(f"id.eq.{p['hangout_id']}")

        query = query.or_(",".join(or_parts))

    if date:
        date_str = str(date).strip()
        if len(date_str) == 10 and date_str.count("-") == 2:
            query = query.eq("hangout_date", date_str)
        elif len(date_str) == 7 and date_str.count("-") == 1:
            query = query.gte("hangout_date", f"{date_str}-01").lte("hangout_date", f"{date_str}-31")
        elif len(date_str) == 4 and date_str.isdigit():
            query = query.gte("hangout_date", f"{date_str}-01-01").lte("hangout_date", f"{date_str}-12-31")
        else:
            query = query.eq("hangout_date", date_str)
    if group_name:
        groups_res = db.table("groups").select("id").ilike("name", f"%{group_name}%").execute()
        group_ids = [g["id"] for g in groups_res.data] if groups_res.data else []
        if group_ids:
            query = query.in_("group_id", group_ids)
        else:
            return []

    response = query.order("hangout_date", desc=True).execute()

    hangouts = response.data if response.data else []

    # Populate creator and participants for each hangout
    for hangout in hangouts:
        creator_res = db.table("profiles").select("*").eq("id", hangout["created_by"]).execute()
        hangout["creator"] = creator_res.data[0] if creator_res.data else None
        hangout["participants"] = get_hangout_participants(db=db, hangout_id=hangout["id"])

    return hangouts


def get_hangouts_map(
    db: Client,
    user_id: Optional[str] = None,
    group_id: Optional[str] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lng: Optional[float] = None,
    max_lng: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Fetch hangouts with non-null latitude and longitude, optionally filtered by user, group_id and bounding box."""
    query = db.table("hangouts").select("*").not_.is_("latitude", "null").not_.is_("longitude", "null")

    if user_id:
        user_hangout_ids = get_user_hangout_ids(db, user_id)
        if not user_hangout_ids:
            return []
        query = query.in_("id", user_hangout_ids)

    if group_id:
        query = query.eq("group_id", str(group_id))
    if min_lat is not None:
        query = query.gte("latitude", min_lat)
    if max_lat is not None:
        query = query.lte("latitude", max_lat)
    if min_lng is not None:
        query = query.gte("longitude", min_lng)
    if max_lng is not None:
        query = query.lte("longitude", max_lng)

    response = query.order("hangout_date", desc=True).execute()
    hangouts = response.data if response.data else []

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


def upsert_hangout_rating(
    db: Client,
    hangout_id: str,
    user_id: str,
    rating: int,
) -> Dict[str, Any]:
    """Upsert individual rating for a hangout."""
    if not (1 <= rating <= 5):
        raise BadRequestError("Rating must be between 1 and 5.")
    get_hangout_by_id(db=db, hangout_id=hangout_id, user_id=user_id)
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "hangout_id": str(hangout_id),
        "user_id": str(user_id),
        "rating": rating,
        "updated_at": now,
    }
    res = db.table("hangout_ratings").upsert(data, on_conflict="hangout_id,user_id").execute()
    if not res.data or len(res.data) == 0:
        raise Exception("Failed to save rating.")
    return res.data[0]


def get_user_hangout_rating(
    db: Client,
    hangout_id: str,
    user_id: str,
) -> Optional[Dict[str, Any]]:
    """Get the current user's individual rating for a hangout."""
    get_hangout_by_id(db=db, hangout_id=hangout_id, user_id=user_id)
    res = (
        db.table("hangout_ratings")
        .select("*")
        .eq("hangout_id", str(hangout_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    return res.data[0] if res.data and len(res.data) > 0 else None
