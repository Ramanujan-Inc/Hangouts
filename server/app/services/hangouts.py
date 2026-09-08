import mimetypes
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from supabase import Client
from app.schemas.hangout import HangoutCreate, HangoutUpdate
import uuid
from app.core.config import settings
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.core.storage import (
    upload_file_bytes,
    get_public_url,
    generate_presigned_upload_url,
    generate_presigned_download_url,
)
from app.services.media import ALLOWED_IMAGE_MIME_TYPES


def _sign_cover_url(url: Optional[str]) -> Optional[str]:
    """Attach temporary signed download URL for private R2 cover photo items."""
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://") or url.startswith("/"):
        return url
    return generate_presigned_download_url(bucket=settings.R2_BUCKET_MEDIA, key=url)


def prepare_hangout_cover_upload(filename: str, content_type: str) -> Dict[str, str]:
    """Generate a presigned PUT upload URL for direct client-to-storage cover photo upload."""
    if not content_type or content_type == "application/octet-stream":
        guessed, _ = mimetypes.guess_type(filename or "")
        if guessed:
            content_type = guessed

    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise BadRequestError(
            f"Invalid image type '{content_type}'. Allowed types are {', '.join(ALLOWED_IMAGE_MIME_TYPES)}."
        )

    safe_filename = filename.replace(" ", "_") if filename else "hangout_cover.jpg"
    object_key = f"{settings.ENVIRONMENT}/covers/hng_{uuid.uuid4()}_{safe_filename}"

    upload_url = generate_presigned_upload_url(
        bucket=settings.R2_BUCKET_AVATARS,
        key=object_key,
        content_type=content_type,
        expires_in=600,
    )
    public_url = get_public_url(bucket=settings.R2_BUCKET_AVATARS, key=object_key)

    return {
        "upload_url": upload_url,
        "public_url": public_url,
    }


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
    if hangout_dict.get("external_album_url"):
        hangout_dict["external_album_url"] = str(hangout_dict["external_album_url"])

    invite_code = uuid.uuid4().hex[:12]
    short_id = uuid.uuid4().hex[:8]
    hangout_dict["invite_code"] = invite_code
    hangout_dict["short_id"] = short_id
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


def resolve_hangout_id(db: Client, hangout_id: str) -> str:
    """Resolve a full UUID or short_id to the canonical UUID of the hangout."""
    try:
        uuid.UUID(str(hangout_id))
        return str(hangout_id)
    except (ValueError, AttributeError):
        pass

    clean_id = str(hangout_id).strip()
    res = db.table("hangouts").select("id").eq("short_id", clean_id).execute()
    if res.data and len(res.data) > 0:
        return str(res.data[0]["id"])

    if "-" in clean_id:
        cand = clean_id.rsplit("-", 1)[-1]
        res = db.table("hangouts").select("id").eq("short_id", cand).execute()
        if res.data and len(res.data) > 0:
            return str(res.data[0]["id"])

    raise NotFoundError("Hangout not found.")


def get_hangout_by_id(db: Client, hangout_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Fetch detailed hangout view with creator profile and participant list, validating user access."""
    is_uuid = False
    try:
        uuid.UUID(str(hangout_id))
        is_uuid = True
    except (ValueError, AttributeError):
        is_uuid = False

    clean_id = str(hangout_id).strip()
    select_clause = (
        "*, creator:profiles!hangouts_created_by_fkey(*), "
        "participants:hangout_participants(id, hangout_id, user_id, profile:profiles!hangout_participants_user_id_fkey(*))"
    )

    if is_uuid:
        response = db.table("hangouts").select(select_clause).eq("id", clean_id).execute()
    else:
        response = db.table("hangouts").select(select_clause).eq("short_id", clean_id).execute()
        if not response.data and "-" in clean_id:
            cand = clean_id.rsplit("-", 1)[-1]
            response = db.table("hangouts").select(select_clause).eq("short_id", cand).execute()

    if not response.data or len(response.data) == 0:
        raise NotFoundError("Hangout not found.")

    hangout = response.data[0]
    canonical_id = hangout["id"]

    # Ensure short_id exists in response
    if not hangout.get("short_id"):
        hangout["short_id"] = str(canonical_id)[:8]

    # Verify access permissions
    if user_id:
        is_creator = str(hangout.get("created_by")) == str(user_id)
        participants = hangout.get("participants") or []
        is_participant = any(str(p.get("user_id")) == str(user_id) for p in participants)

        is_group_member = False
        if not (is_creator or is_participant) and hangout.get("group_id"):
            m_res = (
                db.table("group_members")
                .select("status")
                .eq("group_id", str(hangout["group_id"]))
                .eq("user_id", str(user_id))
                .eq("status", "accepted")
                .execute()
            )
            is_group_member = bool(m_res.data and len(m_res.data) > 0)

        if not (is_creator or is_participant or is_group_member):
            raise ForbiddenError("You do not have access to view this hangout.")

    if hangout.get("cover_photo_url"):
        hangout["cover_photo_url"] = _sign_cover_url(hangout["cover_photo_url"])

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
    """Search & filter hangouts using single-query relational join."""
    query = db.table("hangouts").select(
        "*, creator:profiles!hangouts_created_by_fkey(*), "
        "participants:hangout_participants(id, hangout_id, user_id, profile:profiles!hangout_participants_user_id_fkey(*))"
    )

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

    for h in hangouts:
        if not h.get("short_id") and h.get("id"):
            h["short_id"] = str(h["id"])[:8]
        if h.get("cover_photo_url"):
            h["cover_photo_url"] = _sign_cover_url(h["cover_photo_url"])

    return hangouts


def get_timeline_feed(
    db: Client,
    user_id: str,
    q: Optional[str] = None,
    hangout_name: Optional[str] = None,
    location_name: Optional[str] = None,
    date: Optional[str] = None,
    group_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Retrieve consolidated feed data for the timeline page in a single request:
    hangouts, user groups, and 'On This Day' anniversary memory.
    """
    from app.services.groups import get_user_groups
    from app.services.memories import find_anniversary_memories

    hangouts = get_hangouts(
        db=db,
        user_id=user_id,
        q=q,
        hangout_name=hangout_name,
        location_name=location_name,
        date=date,
        group_name=group_name,
    )

    groups = get_user_groups(db=db, user_id=user_id)

    # Compute anniversary memory in-memory from hangouts without extra DB queries
    memory = None
    if not (q or hangout_name or location_name or date or group_name):
        memories = find_anniversary_memories(hangouts)
        if memories:
            memory = memories[0]

    return {
        "hangouts": hangouts,
        "groups": groups,
        "memory": memory,
    }


def get_hangouts_map(
    db: Client,
    user_id: Optional[str] = None,
    group_id: Optional[str] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lng: Optional[float] = None,
    max_lng: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Fetch hangouts with coordinates using single-query relational join."""
    query = (
        db.table("hangouts")
        .select(
            "*, creator:profiles!hangouts_created_by_fkey(*), "
            "participants:hangout_participants(id, hangout_id, user_id, profile:profiles!hangout_participants_user_id_fkey(*))"
        )
        .not_.is_("latitude", "null")
        .not_.is_("longitude", "null")
    )

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

    for h in hangouts:
        if not h.get("short_id") and h.get("id"):
            h["short_id"] = str(h["id"])[:8]
        if h.get("cover_photo_url"):
            h["cover_photo_url"] = _sign_cover_url(h["cover_photo_url"])

    return hangouts



def update_hangout(
    db: Client,
    hangout_id: str,
    hangout_update: HangoutUpdate,
    user_id: str,
) -> Dict[str, Any]:
    """Update hangout details (creator only)."""
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id)
    canonical_id = hangout["id"]

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
    if "external_album_url" in update_dict and update_dict["external_album_url"] is not None:
        update_dict["external_album_url"] = str(update_dict["external_album_url"])

    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    db.table("hangouts").update(update_dict).eq("id", canonical_id).execute()
    return get_hangout_by_id(db=db, hangout_id=canonical_id)


def delete_hangout(db: Client, hangout_id: str, user_id: str) -> None:
    """Delete a hangout (creator only)."""
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id)
    canonical_id = hangout["id"]

    if str(hangout["created_by"]) != str(user_id):
        raise ForbiddenError("Only the creator can delete this hangout.")

    db.table("hangouts").delete().eq("id", canonical_id).execute()


def add_participant(
    db: Client,
    hangout_id: str,
    target_user_id: str,
    requesting_user_id: str,
) -> Dict[str, Any]:
    """Add participant to hangout (allowed by any active participant or creator)."""
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id)
    canonical_id = hangout["id"]

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
        "hangout_id": canonical_id,
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
    canonical_id = hangout["id"]

    is_self_removal = str(target_user_id) == str(requesting_user_id)
    is_creator = str(hangout["created_by"]) == str(requesting_user_id)

    if not (is_self_removal or is_creator):
        raise ForbiddenError("You do not have permission to remove this participant.")

    db.table("hangout_participants").delete().eq("hangout_id", canonical_id).eq("user_id", str(target_user_id)).execute()


def upsert_hangout_rating(
    db: Client,
    hangout_id: str,
    user_id: str,
    rating: int,
) -> Dict[str, Any]:
    """Upsert individual rating for a hangout."""
    if not (1 <= rating <= 5):
        raise BadRequestError("Rating must be between 1 and 5.")
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id, user_id=user_id)
    canonical_id = hangout["id"]
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "hangout_id": str(canonical_id),
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
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id, user_id=user_id)
    canonical_id = hangout["id"]
    res = (
        db.table("hangout_ratings")
        .select("*")
        .eq("hangout_id", str(canonical_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    return res.data[0] if res.data and len(res.data) > 0 else None


def get_hangout_by_invite_code(db: Client, invite_code: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve public sanitized hangout preview by invite code using single relational query."""
    clean_code = invite_code.strip()
    response = (
        db.table("hangouts")
        .select(
            "*, creator:profiles!hangouts_created_by_fkey(*), "
            "participants:hangout_participants(id, user_id)"
        )
        .eq("invite_code", clean_code)
        .execute()
    )
    if not response.data or len(response.data) == 0:
        raise NotFoundError("Hangout invite link not found or expired.")

    hangout = response.data[0]
    participants = hangout.get("participants") or []
    creator = hangout.get("creator")
    participant_count = len(participants)

    is_participant = False
    if user_id:
        is_participant = (
            str(hangout.get("created_by")) == str(user_id)
            or any(str(p.get("user_id")) == str(user_id) for p in participants)
        )

    return {
        "id": hangout["id"],
        "title": hangout["title"],
        "description": hangout.get("description"),
        "hangout_date": hangout["hangout_date"],
        "hangout_time": hangout.get("hangout_time"),
        "location_name": hangout.get("location_name"),
        "formatted_address": hangout.get("formatted_address"),
        "cover_photo_url": _sign_cover_url(hangout.get("cover_photo_url")),
        "invite_code": hangout["invite_code"],
        "short_id": hangout.get("short_id") or str(hangout["id"])[:8],
        "creator": creator,
        "participant_count": participant_count,
        "is_participant": is_participant,
    }


def join_hangout_by_invite_code(db: Client, invite_code: str, user_id: str) -> Dict[str, Any]:
    """Join a hangout using its unique invite code."""
    clean_code = invite_code.strip()
    response = db.table("hangouts").select("*").eq("invite_code", clean_code).execute()
    if not response.data or len(response.data) == 0:
        raise NotFoundError("Hangout invite link not found or expired.")

    hangout = response.data[0]
    hangout_id = hangout["id"]

    # Check if already a participant or creator
    participants = get_hangout_participants(db=db, hangout_id=hangout_id)
    is_already_participant = (
        str(hangout.get("created_by")) == str(user_id)
        or any(str(p.get("user_id")) == str(user_id) for p in participants)
    )

    if not is_already_participant:
        participant_data = {
            "hangout_id": hangout_id,
            "user_id": str(user_id),
        }
        db.table("hangout_participants").insert(participant_data).execute()

    return get_hangout_by_id(db=db, hangout_id=hangout_id, user_id=user_id)


def get_hangout_full_details(db: Client, hangout_id: str, user_id: str) -> Dict[str, Any]:
    """Fetch complete hangout data package sequentially on existing connection with in-memory summary."""
    from app.services.media import _sign_media_item
    from app.services.expenses import compute_expense_summary_from_data

    # 1. Fetch hangout, verify user permission, and get participants + creator in ONE query
    hangout = get_hangout_by_id(db=db, hangout_id=hangout_id, user_id=user_id)
    canonical_id = str(hangout["id"])
    participants = hangout.get("participants") or []
    creator_id = str(hangout.get("created_by")) if hangout.get("created_by") else None

    # 2. Rating
    rating_record = (
        db.table("hangout_ratings")
        .select("rating")
        .eq("hangout_id", canonical_id)
        .eq("user_id", str(user_id))
        .execute()
    )
    user_rating = rating_record.data[0]["rating"] if rating_record.data else 4

    # 3. Media
    media_res = (
        db.table("media")
        .select("*")
        .eq("hangout_id", canonical_id)
        .order("created_at", desc=True)
        .execute()
    )
    raw_items = media_res.data or []
    visible_items = [
        item for item in raw_items
        if item.get("is_shared", True) or str(item.get("uploaded_by")) == str(user_id)
    ]
    media_ids = [item["id"] for item in visible_items if "id" in item]
    favorited_ids = set()
    if media_ids and user_id:
        fav_res = (
            db.table("media_favorites")
            .select("media_id")
            .in_("media_id", media_ids)
            .eq("user_id", str(user_id))
            .execute()
        )
        if fav_res.data:
            favorited_ids = {str(f["media_id"]) for f in fav_res.data}

    for item in visible_items:
        item["is_favorited"] = str(item.get("id")) in favorited_ids

    # 4. Notes
    notes_res = (
        db.table("notes")
        .select("*")
        .eq("hangout_id", canonical_id)
        .order("created_at", desc=True)
        .execute()
    )
    raw_notes = notes_res.data or []
    visible_notes = [
        n for n in raw_notes
        if n.get("is_shared", True) or str(n.get("created_by")) == str(user_id)
    ]

    # 5. Expenses
    expenses_res = (
        db.table("expenses")
        .select("*")
        .eq("hangout_id", canonical_id)
        .order("created_at", desc=False)
        .execute()
    )
    raw_expenses = expenses_res.data or []
    for e in raw_expenses:
        e["total_amount"] = float(e.get("total_amount") or 0)

    visible_expenses = [
        e for e in raw_expenses
        if e.get("split_type") != "personal" or str(e.get("paid_by")) == str(user_id)
    ]

    # 6. Batch-fetch all profiles for media, notes, and expenses in ONE query
    needed_profile_ids = set()
    for m in visible_items:
        if m.get("uploaded_by"):
            needed_profile_ids.add(str(m["uploaded_by"]))
    for n in visible_notes:
        if n.get("created_by"):
            needed_profile_ids.add(str(n["created_by"]))
    for e in visible_expenses:
        if e.get("paid_by"):
            needed_profile_ids.add(str(e["paid_by"]))

    profiles_map = {}
    if needed_profile_ids:
        prof_res = db.table("profiles").select("*").in_("id", list(needed_profile_ids)).execute()
        if prof_res.data:
            profiles_map = {str(p["id"]): p for p in prof_res.data}

    for m in visible_items:
        m["uploader"] = profiles_map.get(str(m.get("uploaded_by")))
    for n in visible_notes:
        n["author"] = profiles_map.get(str(n.get("created_by")))
    for e in visible_expenses:
        e["payer"] = profiles_map.get(str(e.get("paid_by")))

    media_items = [_sign_media_item(item) for item in visible_items]
    notes_items = visible_notes

    # 6. Compute expense summary in-memory instantly (0ms, 0 extra DB roundtrips)
    summary_data = compute_expense_summary_from_data(
        hangout_id=canonical_id,
        all_expenses=raw_expenses,
        participants=participants,
        creator_id=creator_id,
        user_id=user_id,
    )

    return {
        "hangout": hangout,
        "media": media_items,
        "rating": user_rating,
        "notes": notes_items,
        "expenses": visible_expenses,
        "expense_summary": summary_data,
    }


