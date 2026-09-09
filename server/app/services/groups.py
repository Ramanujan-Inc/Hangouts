import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models.group import Group, GroupMember
from app.models.profile import Profile
from app.schemas.group import GroupCreate, GroupUpdate
from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError, BadRequestError
from app.core.storage import upload_file_bytes, get_public_url
from app.services.media import ALLOWED_IMAGE_MIME_TYPES


def _member_to_dict(member: GroupMember) -> Dict[str, Any]:
    prof_dict = None
    if member.user:
        prof_dict = {
            "id": str(member.user.id),
            "username": member.user.username,
            "email": member.user.email,
            "avatar_url": member.user.avatar_url,
            "created_at": member.user.created_at.isoformat(),
            "updated_at": member.user.updated_at.isoformat(),
        }
    return {
        "id": str(member.id),
        "group_id": str(member.group_id),
        "user_id": str(member.user_id),
        "status": member.status,
        "invited_by": str(member.invited_by) if member.invited_by else None,
        "joined_at": member.joined_at.isoformat(),
        "profile": prof_dict,
    }


def _group_to_dict(group: Group, user_status: Optional[str] = None) -> Dict[str, Any]:
    members_list = [_member_to_dict(m) for m in group.members] if group.members else []
    return {
        "id": str(group.id),
        "name": group.name,
        "cover_image_url": group.cover_image_url,
        "invite_code": group.invite_code,
        "created_by": str(group.created_by) if group.created_by else None,
        "created_at": group.created_at.isoformat(),
        "updated_at": group.updated_at.isoformat(),
        "user_status": user_status,
        "members": members_list,
    }


def upload_group_cover_image(db: Session, file: UploadFile) -> Dict[str, str]:
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


def create_group(db: Session, group_create: GroupCreate, user_id: str) -> Dict[str, Any]:
    """Create a new group and assign the creator as the initial accepted member."""
    creator_uuid = uuid.UUID(str(user_id))
    invite_code = uuid.uuid4().hex[:12]

    group = Group(
        name=group_create.name,
        cover_image_url=group_create.cover_image_url,
        invite_code=invite_code,
        created_by=creator_uuid,
    )
    db.add(group)
    db.flush()

    member = GroupMember(
        group_id=group.id,
        user_id=creator_uuid,
        status="accepted",
        invited_by=creator_uuid,
    )
    db.add(member)
    db.flush()

    return _group_to_dict(group, user_status="accepted")


def get_user_groups(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all accepted groups that the specified user belongs to, including member list."""
    try:
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        return []

    memberships = db.scalars(
        select(GroupMember)
        .options(
            joinedload(GroupMember.group).options(
                selectinload(Group.members).joinedload(GroupMember.user)
            )
        )
        .where(GroupMember.user_id == u_uuid, GroupMember.status == "accepted")
    ).all()

    groups = []
    for m in memberships:
        if m.group:
            # Ensure invite_code exists
            if not m.group.invite_code:
                m.group.invite_code = uuid.uuid4().hex[:12]
                db.flush()
            groups.append(_group_to_dict(m.group, user_status=m.status))

    return groups


def get_user_group_invites(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all pending group invitations for the specified user with joined group and inviter profiles."""
    try:
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        return []

    pending_memberships = db.scalars(
        select(GroupMember)
        .options(
            joinedload(GroupMember.group),
            joinedload(GroupMember.inviter),
        )
        .where(GroupMember.user_id == u_uuid, GroupMember.status == "pending")
    ).all()

    invites = []
    for m in pending_memberships:
        inviter_dict = None
        if m.inviter:
            inviter_dict = {
                "id": str(m.inviter.id),
                "username": m.inviter.username,
                "email": m.inviter.email,
                "avatar_url": m.inviter.avatar_url,
                "created_at": m.inviter.created_at.isoformat(),
                "updated_at": m.inviter.updated_at.isoformat(),
            }
        group_dict = None
        if m.group:
            group_dict = {
                "id": str(m.group.id),
                "name": m.group.name,
                "cover_image_url": m.group.cover_image_url,
                "invite_code": m.group.invite_code,
                "created_by": str(m.group.created_by) if m.group.created_by else None,
                "created_at": m.group.created_at.isoformat(),
                "updated_at": m.group.updated_at.isoformat(),
            }
        invites.append({
            "id": str(m.id),
            "group_id": str(m.group_id),
            "status": m.status,
            "joined_at": m.joined_at.isoformat(),
            "group": group_dict,
            "inviter": inviter_dict,
        })
    return invites


def get_group_by_id(db: Session, group_id: str) -> Optional[Dict[str, Any]]:
    """Fetch group details by group UUID."""
    try:
        g_uuid = uuid.UUID(str(group_id))
    except (ValueError, AttributeError):
        return None

    group = db.get(Group, g_uuid)
    if not group:
        return None

    if not group.invite_code:
        group.invite_code = uuid.uuid4().hex[:12]
        db.flush()

    return _group_to_dict(group)


def get_full_group_details(db: Session, group_id: str) -> Dict[str, Any]:
    """Fetch group details by ID including member list. Raises NotFoundError if group doesn't exist."""
    try:
        g_uuid = uuid.UUID(str(group_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Group not found.")

    group = db.scalar(
        select(Group)
        .options(selectinload(Group.members).joinedload(GroupMember.user))
        .where(Group.id == g_uuid)
    )
    if not group:
        raise NotFoundError("Group not found.")

    if not group.invite_code:
        group.invite_code = uuid.uuid4().hex[:12]
        db.flush()

    return _group_to_dict(group)


def get_group_members(db: Session, group_id: str) -> List[Dict[str, Any]]:
    """Fetch all members of a group with profile information."""
    try:
        g_uuid = uuid.UUID(str(group_id))
    except (ValueError, AttributeError):
        return []

    members = db.scalars(
        select(GroupMember)
        .options(joinedload(GroupMember.user))
        .where(GroupMember.group_id == g_uuid)
        .order_by(GroupMember.joined_at)
    ).all()

    return [_member_to_dict(m) for m in members]


def get_member_status(db: Session, group_id: str, user_id: str) -> Optional[str]:
    """Check user's status in a specific group. Returns 'accepted', 'pending', 'declined', or None."""
    try:
        g_uuid = uuid.UUID(str(group_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        return None

    status = db.scalar(
        select(GroupMember.status).where(
            GroupMember.group_id == g_uuid,
            GroupMember.user_id == u_uuid,
        )
    )
    return status


def add_group_member(
    db: Session,
    group_id: str,
    inviter_id: str,
    username: str,
) -> Dict[str, Any]:
    """Invite a user to a group (sets status to 'pending') by their unique username."""
    if not username or not username.strip():
        raise ValueError("Username must be provided.")

    try:
        g_uuid = uuid.UUID(str(group_id))
        inviter_uuid = uuid.UUID(str(inviter_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Group not found.")

    target_profile = db.scalar(
        select(Profile).where(func.lower(Profile.username) == username.strip().lower())
    )
    if not target_profile:
        raise NotFoundError(f"User with username '{username}' not found.")

    existing_status = get_member_status(db, str(g_uuid), str(target_profile.id))
    if existing_status == "accepted":
        raise ValueError("User is already a member of this group.")
    if existing_status == "pending":
        raise ValueError("User has already been invited to this group.")

    member = GroupMember(
        group_id=g_uuid,
        user_id=target_profile.id,
        status="pending",
        invited_by=inviter_uuid,
    )
    db.add(member)
    db.flush()
    db.refresh(member, attribute_names=["user"])
    return _member_to_dict(member)


def respond_to_group_invite(
    db: Session,
    group_id: str,
    user_id: str,
    action: str,
) -> Dict[str, Any]:
    """Accept or decline a group invitation."""
    try:
        g_uuid = uuid.UUID(str(group_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        raise ValueError("No pending invitation found for this group.")

    member = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == g_uuid,
            GroupMember.user_id == u_uuid,
            GroupMember.status == "pending",
        )
    )
    if not member:
        raise ValueError("No pending invitation found for this group.")

    action_lower = action.lower()
    if action_lower not in ["accept", "decline"]:
        raise ValueError("Invalid action. Must be 'accept' or 'decline'.")

    member.status = "accepted" if action_lower == "accept" else "declined"
    db.flush()
    return _member_to_dict(member)


def remove_group_member(
    db: Session,
    group_id: str,
    current_user_id: str,
    target_user_id: str,
) -> bool:
    """Remove a user from a group. Strictly allows self-removal only."""
    if current_user_id != target_user_id:
        raise ForbiddenError("Members can only remove themselves from a group.")

    try:
        g_uuid = uuid.UUID(str(group_id))
        t_uuid = uuid.UUID(str(target_user_id))
    except (ValueError, AttributeError):
        raise ValueError("User is not a member of this group.")

    member = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == g_uuid,
            GroupMember.user_id == t_uuid,
        )
    )
    if not member:
        raise ValueError("User is not a member of this group.")

    db.delete(member)
    db.flush()
    return True


def get_group_by_invite_code(db: Session, invite_code: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve public group preview by invite code."""
    clean_code = invite_code.strip()
    group = db.scalar(
        select(Group)
        .options(joinedload(Group.creator))
        .where(Group.invite_code == clean_code)
    )
    if not group:
        raise NotFoundError("Group invite link not found or expired.")

    member_count = db.scalar(
        select(func.count(GroupMember.id)).where(
            GroupMember.group_id == group.id,
            GroupMember.status == "accepted",
        )
    ) or 0

    creator_dict = None
    if group.creator:
        creator_dict = {
            "id": str(group.creator.id),
            "username": group.creator.username,
            "email": group.creator.email,
            "avatar_url": group.creator.avatar_url,
            "created_at": group.creator.created_at.isoformat(),
            "updated_at": group.creator.updated_at.isoformat(),
        }

    user_status = None
    if user_id:
        user_status = get_member_status(db, str(group.id), str(user_id))

    return {
        "id": str(group.id),
        "name": group.name,
        "cover_image_url": group.cover_image_url,
        "invite_code": group.invite_code,
        "created_at": group.created_at.isoformat(),
        "creator": creator_dict,
        "member_count": int(member_count),
        "user_status": user_status,
    }


def join_group_by_invite_code(db: Session, invite_code: str, user_id: str) -> Dict[str, Any]:
    """Join a group using its unique invite code."""
    clean_code = invite_code.strip()
    group = db.scalar(select(Group).where(Group.invite_code == clean_code))
    if not group:
        raise NotFoundError("Group invite link not found or expired.")

    u_uuid = uuid.UUID(str(user_id))
    existing_member = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group.id,
            GroupMember.user_id == u_uuid,
        )
    )

    if existing_member:
        if existing_member.status != "accepted":
            existing_member.status = "accepted"
            existing_member.joined_at = datetime.now(timezone.utc)
            db.flush()
    else:
        new_member = GroupMember(
            group_id=group.id,
            user_id=u_uuid,
            status="accepted",
            invited_by=None,
        )
        db.add(new_member)
        db.flush()

    return get_full_group_details(db, str(group.id))
