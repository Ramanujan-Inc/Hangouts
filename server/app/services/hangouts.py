import mimetypes
import uuid
from datetime import datetime, timezone, date as date_type, time as time_type
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models.hangout import Hangout, HangoutParticipant, HangoutRating
from app.models.group import Group, GroupMember
from app.models.profile import Profile
from app.models.media import Media, MediaFavorite
from app.models.note import Note
from app.models.expense import Expense
from app.schemas.hangout import HangoutCreate, HangoutUpdate
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


def _hangout_to_dict(hangout: Hangout, participants: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    creator_dict = None
    if hangout.creator:
        creator_dict = {
            "id": str(hangout.creator.id),
            "username": hangout.creator.username,
            "email": hangout.creator.email,
            "avatar_url": hangout.creator.avatar_url,
            "created_at": hangout.creator.created_at.isoformat(),
            "updated_at": hangout.creator.updated_at.isoformat(),
        }

    parts_list = participants
    if parts_list is None and hasattr(hangout, "participants") and hangout.participants:
        parts_list = []
        for p in hangout.participants:
            prof = None
            if p.user:
                prof = {
                    "id": str(p.user.id),
                    "username": p.user.username,
                    "email": p.user.email,
                    "avatar_url": p.user.avatar_url,
                    "created_at": p.user.created_at.isoformat(),
                    "updated_at": p.user.updated_at.isoformat(),
                }
            parts_list.append({
                "id": str(p.id),
                "hangout_id": str(p.hangout_id),
                "user_id": str(p.user_id),
                "profile": prof,
            })

    return {
        "id": str(hangout.id),
        "group_id": str(hangout.group_id) if hangout.group_id else None,
        "title": hangout.title,
        "description": hangout.description,
        "hangout_date": str(hangout.hangout_date),
        "hangout_time": str(hangout.hangout_time) if hangout.hangout_time else None,
        "location_name": hangout.location_name,
        "formatted_address": hangout.formatted_address,
        "place_id": hangout.place_id,
        "latitude": float(hangout.latitude) if hangout.latitude is not None else None,
        "longitude": float(hangout.longitude) if hangout.longitude is not None else None,
        "cover_photo_url": _sign_cover_url(hangout.cover_photo_url),
        "external_album_url": hangout.external_album_url,
        "invite_code": hangout.invite_code,
        "short_id": hangout.short_id or str(hangout.id)[:8],
        "created_by": str(hangout.created_by),
        "created_at": hangout.created_at.isoformat(),
        "updated_at": hangout.updated_at.isoformat(),
        "creator": creator_dict,
        "participants": parts_list or [],
    }


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


def upload_hangout_cover_image(db: Session, file: UploadFile) -> Dict[str, str]:
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


def create_hangout(db: Session, hangout_create: HangoutCreate, user_id: str) -> Dict[str, Any]:
    """Create a new hangout and automatically add the creator as a participant."""
    u_uuid = uuid.UUID(str(user_id))
    group_uuid = uuid.UUID(str(hangout_create.group_id)) if hangout_create.group_id else None

    invite_code = uuid.uuid4().hex[:12]
    short_id = uuid.uuid4().hex[:8]

    hangout = Hangout(
        group_id=group_uuid,
        title=hangout_create.title,
        description=hangout_create.description,
        hangout_date=hangout_create.hangout_date,
        hangout_time=hangout_create.hangout_time,
        location_name=hangout_create.location_name,
        formatted_address=hangout_create.formatted_address,
        place_id=hangout_create.place_id,
        latitude=hangout_create.latitude,
        longitude=hangout_create.longitude,
        cover_photo_url=hangout_create.cover_photo_url,
        external_album_url=str(hangout_create.external_album_url) if hangout_create.external_album_url else None,
        invite_code=invite_code,
        short_id=short_id,
        created_by=u_uuid,
    )
    db.add(hangout)
    db.flush()

    participant = HangoutParticipant(
        hangout_id=hangout.id,
        user_id=u_uuid,
    )
    db.add(participant)
    db.flush()

    return get_hangout_by_id(db=db, hangout_id=str(hangout.id))


def resolve_hangout_id(db: Session, hangout_id: str) -> str:
    """Resolve a full UUID or short_id to the canonical UUID of the hangout."""
    try:
        uuid.UUID(str(hangout_id))
        return str(hangout_id)
    except (ValueError, AttributeError):
        pass

    clean_id = str(hangout_id).strip()
    h_id = db.scalar(select(Hangout.id).where(Hangout.short_id == clean_id))
    if h_id:
        return str(h_id)

    if "-" in clean_id:
        cand = clean_id.rsplit("-", 1)[-1]
        h_id = db.scalar(select(Hangout.id).where(Hangout.short_id == cand))
        if h_id:
            return str(h_id)

    raise NotFoundError("Hangout not found.")


def get_hangout_by_id(db: Session, hangout_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Fetch detailed hangout view with creator profile and participant list, validating user access."""
    is_uuid = False
    clean_id = str(hangout_id).strip()
    try:
        target_uuid = uuid.UUID(clean_id)
        is_uuid = True
    except (ValueError, AttributeError):
        is_uuid = False

    query = (
        select(Hangout)
        .options(
            joinedload(Hangout.creator),
            selectinload(Hangout.participants).joinedload(HangoutParticipant.user),
        )
    )

    if is_uuid:
        hangout = db.scalar(query.where(Hangout.id == target_uuid))
    else:
        hangout = db.scalar(query.where(Hangout.short_id == clean_id))
        if not hangout and "-" in clean_id:
            cand = clean_id.rsplit("-", 1)[-1]
            hangout = db.scalar(query.where(Hangout.short_id == cand))

    if not hangout:
        raise NotFoundError("Hangout not found.")

    if not hangout.short_id:
        hangout.short_id = str(hangout.id)[:8]
        db.flush()

    if user_id:
        u_uuid = uuid.UUID(str(user_id))
        is_creator = hangout.created_by == u_uuid
        is_participant = any(p.user_id == u_uuid for p in hangout.participants)

        is_group_member = False
        if not (is_creator or is_participant) and hangout.group_id:
            m_status = db.scalar(
                select(GroupMember.status).where(
                    GroupMember.group_id == hangout.group_id,
                    GroupMember.user_id == u_uuid,
                    GroupMember.status == "accepted",
                )
            )
            is_group_member = bool(m_status)

        if not (is_creator or is_participant or is_group_member):
            raise ForbiddenError("You do not have access to view this hangout.")

    return _hangout_to_dict(hangout)


def get_hangout_participants(db: Session, hangout_id: str) -> List[Dict[str, Any]]:
    """Fetch all participants of a hangout with profile details."""
    try:
        h_uuid = uuid.UUID(str(hangout_id))
    except (ValueError, AttributeError):
        return []

    participants = db.scalars(
        select(HangoutParticipant)
        .options(joinedload(HangoutParticipant.user))
        .where(HangoutParticipant.hangout_id == h_uuid)
    ).all()

    result = []
    for p in participants:
        prof_dict = None
        if p.user:
            prof_dict = {
                "id": str(p.user.id),
                "username": p.user.username,
                "email": p.user.email,
                "avatar_url": p.user.avatar_url,
                "created_at": p.user.created_at.isoformat(),
                "updated_at": p.user.updated_at.isoformat(),
            }
        result.append({
            "id": str(p.id),
            "hangout_id": str(p.hangout_id),
            "user_id": str(p.user_id),
            "profile": prof_dict,
        })
    return result


def get_user_hangout_ids(db: Session, user_id: str) -> List[str]:
    """Fetch all hangout IDs where the user is a participant or creator."""
    try:
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        return []

    part_ids = db.scalars(
        select(HangoutParticipant.hangout_id).where(HangoutParticipant.user_id == u_uuid)
    ).all()

    created_ids = db.scalars(
        select(Hangout.id).where(Hangout.created_by == u_uuid)
    ).all()

    all_ids = set([str(hid) for hid in part_ids] + [str(hid) for hid in created_ids])
    return list(all_ids)


def get_hangouts(
    db: Session,
    user_id: Optional[str] = None,
    q: Optional[str] = None,
    hangout_name: Optional[str] = None,
    location_name: Optional[str] = None,
    date: Optional[str] = None,
    group_name: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Search & filter hangouts using single-query relational join."""
    query = (
        select(Hangout)
        .options(
            joinedload(Hangout.creator),
            selectinload(Hangout.participants).joinedload(HangoutParticipant.user),
        )
    )

    if user_id:
        user_hangout_ids = get_user_hangout_ids(db, user_id)
        if not user_hangout_ids:
            return []
        h_uuids = [uuid.UUID(hid) for hid in user_hangout_ids]
        query = query.where(Hangout.id.in_(h_uuids))

    if hangout_name:
        query = query.where(Hangout.title.ilike(f"%{hangout_name}%"))
    if location_name:
        query = query.where(Hangout.location_name.ilike(f"%{location_name}%"))

    if q and not (hangout_name or location_name):
        clean_q = q.strip()
        or_conditions = [
            Hangout.title.ilike(f"%{clean_q}%"),
            Hangout.description.ilike(f"%{clean_q}%"),
            Hangout.location_name.ilike(f"%{clean_q}%"),
        ]

        g_ids = db.scalars(select(Group.id).where(Group.name.ilike(f"%{clean_q}%"))).all()
        if g_ids:
            or_conditions.append(Hangout.group_id.in_(g_ids))

        matching_user_ids = db.scalars(select(Profile.id).where(Profile.username.ilike(f"%{clean_q}%"))).all()
        if matching_user_ids:
            part_h_ids = db.scalars(
                select(HangoutParticipant.hangout_id).where(HangoutParticipant.user_id.in_(matching_user_ids))
            ).all()
            if part_h_ids:
                or_conditions.append(Hangout.id.in_(part_h_ids))

        query = query.where(or_(*or_conditions))

    if date:
        date_str = str(date).strip()
        try:
            if len(date_str) == 10 and date_str.count("-") == 2:
                query = query.where(Hangout.hangout_date == datetime.strptime(date_str, "%Y-%m-%d").date())
            elif len(date_str) == 7 and date_str.count("-") == 1:
                start_d = datetime.strptime(f"{date_str}-01", "%Y-%m-%d").date()
                end_d = datetime.strptime(f"{date_str}-28", "%Y-%m-%d").date()
                # Use year/month bounds
                import calendar
                year, month = map(int, date_str.split("-"))
                last_day = calendar.monthrange(year, month)[1]
                query = query.where(
                    Hangout.hangout_date >= date_type(year, month, 1),
                    Hangout.hangout_date <= date_type(year, month, last_day),
                )
            elif len(date_str) == 4 and date_str.isdigit():
                y = int(date_str)
                query = query.where(
                    Hangout.hangout_date >= date_type(y, 1, 1),
                    Hangout.hangout_date <= date_type(y, 12, 31),
                )
            else:
                query = query.where(Hangout.hangout_date == datetime.strptime(date_str, "%Y-%m-%d").date())
        except Exception:
            pass

    if group_name:
        group_ids = db.scalars(select(Group.id).where(Group.name.ilike(f"%{group_name}%"))).all()
        if group_ids:
            query = query.where(Hangout.group_id.in_(group_ids))
        else:
            return []

    query = query.order_by(Hangout.hangout_date.desc())
    hangouts = db.scalars(query).all()
    return [_hangout_to_dict(h) for h in hangouts]


def get_timeline_feed(
    db: Session,
    user_id: str,
    q: Optional[str] = None,
    hangout_name: Optional[str] = None,
    location_name: Optional[str] = None,
    date: Optional[str] = None,
    group_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Retrieve consolidated feed data for the timeline page in a single request."""
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
    db: Session,
    user_id: Optional[str] = None,
    group_id: Optional[str] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lng: Optional[float] = None,
    max_lng: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Fetch hangouts with coordinates using single-query relational join."""
    query = (
        select(Hangout)
        .options(
            joinedload(Hangout.creator),
            selectinload(Hangout.participants).joinedload(HangoutParticipant.user),
        )
        .where(Hangout.latitude.isnot(None), Hangout.longitude.isnot(None))
    )

    if user_id:
        user_hangout_ids = get_user_hangout_ids(db, user_id)
        if not user_hangout_ids:
            return []
        h_uuids = [uuid.UUID(hid) for hid in user_hangout_ids]
        query = query.where(Hangout.id.in_(h_uuids))

    if group_id:
        try:
            g_uuid = uuid.UUID(str(group_id))
            query = query.where(Hangout.group_id == g_uuid)
        except (ValueError, AttributeError):
            return []

    if min_lat is not None:
        query = query.where(Hangout.latitude >= min_lat)
    if max_lat is not None:
        query = query.where(Hangout.latitude <= max_lat)
    if min_lng is not None:
        query = query.where(Hangout.longitude >= min_lng)
    if max_lng is not None:
        query = query.where(Hangout.longitude <= max_lng)

    query = query.order_by(Hangout.hangout_date.desc())
    hangouts = db.scalars(query).all()
    return [_hangout_to_dict(h) for h in hangouts]


def update_hangout(
    db: Session,
    hangout_id: str,
    hangout_update: HangoutUpdate,
    user_id: str,
) -> Dict[str, Any]:
    """Update hangout details (creator only)."""
    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    u_uuid = uuid.UUID(str(user_id))

    hangout = db.scalar(
        select(Hangout)
        .options(
            joinedload(Hangout.creator),
            selectinload(Hangout.participants).joinedload(HangoutParticipant.user),
        )
        .where(Hangout.id == h_uuid)
    )
    if not hangout:
        raise NotFoundError("Hangout not found.")

    if hangout.created_by != u_uuid:
        raise ForbiddenError("Only the creator can update this hangout.")

    update_dict = hangout_update.model_dump(mode="json", exclude_unset=True)
    if not update_dict:
        return _hangout_to_dict(hangout)

    for field, val in update_dict.items():
        if hasattr(hangout, field):
            setattr(hangout, field, val)

    hangout.updated_at = datetime.now(timezone.utc)
    db.flush()
    return _hangout_to_dict(hangout)


def delete_hangout(db: Session, hangout_id: str, user_id: str) -> None:
    """Delete a hangout (creator only)."""
    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    u_uuid = uuid.UUID(str(user_id))

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    if hangout.created_by != u_uuid:
        raise ForbiddenError("Only the creator can delete this hangout.")

    db.delete(hangout)
    db.flush()


def add_participant(
    db: Session,
    hangout_id: str,
    target_user_id: str,
    requesting_user_id: str,
) -> Dict[str, Any]:
    """Add participant to hangout (allowed by any active participant or creator)."""
    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    target_uuid = uuid.UUID(str(target_user_id))
    req_uuid = uuid.UUID(str(requesting_user_id))

    hangout = db.scalar(
        select(Hangout)
        .options(selectinload(Hangout.participants).joinedload(HangoutParticipant.user))
        .where(Hangout.id == h_uuid)
    )
    if not hangout:
        raise NotFoundError("Hangout not found.")

    is_participant_or_creator = (
        hangout.created_by == req_uuid
        or any(p.user_id == req_uuid for p in hangout.participants)
    )
    if not is_participant_or_creator:
        raise ForbiddenError("Only active participants can invite new members to this hangout.")

    existing = next((p for p in hangout.participants if p.user_id == target_uuid), None)
    if existing:
        prof = None
        if existing.user:
            prof = {
                "id": str(existing.user.id),
                "username": existing.user.username,
                "email": existing.user.email,
                "avatar_url": existing.user.avatar_url,
                "created_at": existing.user.created_at.isoformat(),
                "updated_at": existing.user.updated_at.isoformat(),
            }
        return {
            "id": str(existing.id),
            "hangout_id": str(existing.hangout_id),
            "user_id": str(existing.user_id),
            "profile": prof,
        }

    new_part = HangoutParticipant(
        hangout_id=h_uuid,
        user_id=target_uuid,
    )
    db.add(new_part)
    db.flush()
    db.refresh(new_part, attribute_names=["user"])

    prof = None
    if new_part.user:
        prof = {
            "id": str(new_part.user.id),
            "username": new_part.user.username,
            "email": new_part.user.email,
            "avatar_url": new_part.user.avatar_url,
            "created_at": new_part.user.created_at.isoformat(),
            "updated_at": new_part.user.updated_at.isoformat(),
        }

    return {
        "id": str(new_part.id),
        "hangout_id": str(new_part.hangout_id),
        "user_id": str(new_part.user_id),
        "profile": prof,
    }


def remove_participant(
    db: Session,
    hangout_id: str,
    target_user_id: str,
    requesting_user_id: str,
) -> None:
    """Remove participant (creator can kick; participants can leave/remove self)."""
    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    target_uuid = uuid.UUID(str(target_user_id))
    req_uuid = uuid.UUID(str(requesting_user_id))

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    is_self_removal = target_uuid == req_uuid
    is_creator = hangout.created_by == req_uuid

    if not (is_self_removal or is_creator):
        raise ForbiddenError("You do not have permission to remove this participant.")

    part = db.scalar(
        select(HangoutParticipant).where(
            HangoutParticipant.hangout_id == h_uuid,
            HangoutParticipant.user_id == target_uuid,
        )
    )
    if part:
        db.delete(part)
        db.flush()


def upsert_hangout_rating(
    db: Session,
    hangout_id: str,
    user_id: str,
    rating: int,
) -> Dict[str, Any]:
    """Upsert individual rating for a hangout."""
    if not (1 <= rating <= 5):
        raise BadRequestError("Rating must be between 1 and 5.")

    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    u_uuid = uuid.UUID(str(user_id))

    existing = db.scalar(
        select(HangoutRating).where(
            HangoutRating.hangout_id == h_uuid,
            HangoutRating.user_id == u_uuid,
        )
    )
    now = datetime.now(timezone.utc)
    if existing:
        existing.rating = rating
        existing.updated_at = now
    else:
        existing = HangoutRating(
            hangout_id=h_uuid,
            user_id=u_uuid,
            rating=rating,
            created_at=now,
            updated_at=now,
        )
        db.add(existing)

    db.flush()
    return {
        "id": str(existing.id),
        "hangout_id": str(existing.hangout_id),
        "user_id": str(existing.user_id),
        "rating": existing.rating,
        "created_at": existing.created_at.isoformat(),
        "updated_at": existing.updated_at.isoformat(),
    }


def get_user_hangout_rating(
    db: Session,
    hangout_id: str,
    user_id: str,
) -> Optional[Dict[str, Any]]:
    """Get the current user's individual rating for a hangout."""
    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    u_uuid = uuid.UUID(str(user_id))

    rating = db.scalar(
        select(HangoutRating).where(
            HangoutRating.hangout_id == h_uuid,
            HangoutRating.user_id == u_uuid,
        )
    )
    if not rating:
        return None

    return {
        "id": str(rating.id),
        "hangout_id": str(rating.hangout_id),
        "user_id": str(rating.user_id),
        "rating": rating.rating,
        "created_at": rating.created_at.isoformat(),
        "updated_at": rating.updated_at.isoformat(),
    }


def get_hangout_by_invite_code(db: Session, invite_code: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve public sanitized hangout preview by invite code using single relational query."""
    clean_code = invite_code.strip()
    hangout = db.scalar(
        select(Hangout)
        .options(
            joinedload(Hangout.creator),
            selectinload(Hangout.participants),
        )
        .where(Hangout.invite_code == clean_code)
    )
    if not hangout:
        raise NotFoundError("Hangout invite link not found or expired.")

    creator_dict = None
    if hangout.creator:
        creator_dict = {
            "id": str(hangout.creator.id),
            "username": hangout.creator.username,
            "email": hangout.creator.email,
            "avatar_url": hangout.creator.avatar_url,
            "created_at": hangout.creator.created_at.isoformat(),
            "updated_at": hangout.creator.updated_at.isoformat(),
        }

    is_participant = False
    if user_id:
        u_uuid = uuid.UUID(str(user_id))
        is_participant = (
            hangout.created_by == u_uuid
            or any(p.user_id == u_uuid for p in hangout.participants)
        )

    return {
        "id": str(hangout.id),
        "title": hangout.title,
        "description": hangout.description,
        "hangout_date": str(hangout.hangout_date),
        "hangout_time": str(hangout.hangout_time) if hangout.hangout_time else None,
        "location_name": hangout.location_name,
        "formatted_address": hangout.formatted_address,
        "cover_photo_url": _sign_cover_url(hangout.cover_photo_url),
        "invite_code": hangout.invite_code,
        "short_id": hangout.short_id or str(hangout.id)[:8],
        "creator": creator_dict,
        "participant_count": len(hangout.participants),
        "is_participant": is_participant,
    }


def join_hangout_by_invite_code(db: Session, invite_code: str, user_id: str) -> Dict[str, Any]:
    """Join a hangout using its unique invite code."""
    clean_code = invite_code.strip()
    hangout = db.scalar(
        select(Hangout)
        .options(selectinload(Hangout.participants))
        .where(Hangout.invite_code == clean_code)
    )
    if not hangout:
        raise NotFoundError("Hangout invite link not found or expired.")

    u_uuid = uuid.UUID(str(user_id))
    is_already_participant = (
        hangout.created_by == u_uuid
        or any(p.user_id == u_uuid for p in hangout.participants)
    )

    if not is_already_participant:
        part = HangoutParticipant(
            hangout_id=hangout.id,
            user_id=u_uuid,
        )
        db.add(part)
        db.flush()
        db.expire(hangout, ["participants"])

    return get_hangout_by_id(db=db, hangout_id=str(hangout.id), user_id=user_id)


def get_hangout_full_details(db: Session, hangout_id: str, user_id: str) -> Dict[str, Any]:
    """Fetch complete hangout data package sequentially on existing connection with in-memory summary."""
    from app.services.media import _sign_media_item, _media_to_dict
    from app.services.notes import _note_to_dict
    from app.services.expenses import compute_expense_summary_from_data, _expense_to_dict

    hangout_dict = get_hangout_by_id(db=db, hangout_id=hangout_id, user_id=user_id)
    canonical_id = hangout_dict["id"]
    h_uuid = uuid.UUID(canonical_id)
    u_uuid = uuid.UUID(str(user_id))

    # Rating
    rating_val = db.scalar(
        select(HangoutRating.rating).where(
            HangoutRating.hangout_id == h_uuid,
            HangoutRating.user_id == u_uuid,
        )
    )
    user_rating = rating_val if rating_val is not None else 4

    # Media
    media_records = db.scalars(
        select(Media)
        .options(joinedload(Media.uploader))
        .where(Media.hangout_id == h_uuid)
        .order_by(Media.created_at.desc())
    ).all()

    visible_media = [
        m for m in media_records
        if m.is_shared or m.uploaded_by == u_uuid
    ]
    favorited_m_ids = set()
    if visible_media:
        m_ids = [m.id for m in visible_media]
        favorited_m_ids = set(
            db.scalars(
                select(MediaFavorite.media_id).where(
                    MediaFavorite.media_id.in_(m_ids),
                    MediaFavorite.user_id == u_uuid,
                )
            ).all()
        )

    media_items = [
        _sign_media_item(_media_to_dict(m, is_favorited=(m.id in favorited_m_ids)))
        for m in visible_media
    ]

    # Notes
    notes_records = db.scalars(
        select(Note)
        .options(joinedload(Note.creator))
        .where(Note.hangout_id == h_uuid)
        .order_by(Note.created_at.desc())
    ).all()
    notes_items = [
        _note_to_dict(n)
        for n in notes_records
        if n.is_shared or n.created_by == u_uuid
    ]

    # Expenses
    expenses_records = db.scalars(
        select(Expense)
        .options(joinedload(Expense.payer))
        .where(Expense.hangout_id == h_uuid)
        .order_by(Expense.created_at.asc())
    ).all()
    raw_expenses = [_expense_to_dict(e) for e in expenses_records]
    visible_expenses = [
        e for e in raw_expenses
        if e["split_type"] != "personal" or e["paid_by"] == str(user_id)
    ]

    # Expense summary
    summary_data = compute_expense_summary_from_data(
        hangout_id=canonical_id,
        all_expenses=raw_expenses,
        participants=hangout_dict.get("participants") or [],
        creator_id=hangout_dict.get("created_by"),
        user_id=user_id,
    )

    return {
        "hangout": hangout_dict,
        "media": media_items,
        "rating": user_rating,
        "notes": notes_items,
        "expenses": visible_expenses,
        "expense_summary": summary_data,
    }
