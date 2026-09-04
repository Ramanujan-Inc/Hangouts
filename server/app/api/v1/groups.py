from typing import List, Optional
from fastapi import APIRouter, Depends, status, File, UploadFile
from supabase import Client
from app.api.deps import (
    get_current_user,
    get_optional_current_user,
    get_db,
    require_group_access,
)
from app.schemas.group import (
    GroupCreate,
    GroupResponse,
    GroupMemberAdd,
    GroupMemberResponse,
    GroupInviteRespond,
    GroupInviteResponse,
    GroupJoinPreviewResponse,
)
from app.services import groups as group_service
from app.core.exceptions import ForbiddenError

router = APIRouter()


@router.post("/cover", response_model=dict, status_code=status.HTTP_201_CREATED)
def upload_group_cover(
    file: UploadFile = File(...),
    _: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Upload a custom group cover photo to storage and return its public URL."""
    return group_service.upload_group_cover_image(db=db, file=file)


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_new_group(
    group_create: GroupCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Create a new group. The authenticated user is set as the initial accepted member."""
    return group_service.create_group(
        db=db,
        group_create=group_create,
        user_id=current_user["id"],
    )


@router.get("", response_model=List[GroupResponse])
def list_my_groups(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """List all groups the currently authenticated user is an accepted member of."""
    return group_service.get_user_groups(db=db, user_id=current_user["id"])


@router.get("/invites", response_model=List[GroupInviteResponse])
def list_my_group_invites(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """List all pending group invitations for the current user."""
    return group_service.get_user_group_invites(
        db=db,
        user_id=current_user["id"],
    )


@router.get("/join/{invite_code}", response_model=GroupJoinPreviewResponse)
def get_group_join_preview(
    invite_code: str,
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: Client = Depends(get_db),
):
    """Get public preview of a group by its invite code."""
    user_id = current_user["id"] if current_user else None
    return group_service.get_group_by_invite_code(db=db, invite_code=invite_code, user_id=user_id)


@router.post("/join/{invite_code}", response_model=GroupResponse)
def join_group_via_invite(
    invite_code: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Join a group using its invite code (authenticated)."""
    return group_service.join_group_by_invite_code(
        db=db,
        invite_code=invite_code,
        user_id=current_user["id"],
    )


@router.get("/{group_id}", response_model=GroupResponse)
def get_group_details(
    group_id: str,
    _: str = Depends(require_group_access()),
    db: Client = Depends(get_db),
):
    """Get detailed information for a specific group, including member list."""
    return group_service.get_full_group_details(db=db, group_id=group_id)


@router.post("/{group_id}/members", response_model=GroupMemberResponse)
def invite_member_to_group(
    group_id: str,
    member_add: GroupMemberAdd,
    _: str = Depends(require_group_access()),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Invite a user to a group by their username (Any active group member can invite)."""
    return group_service.add_group_member(
        db=db,
        group_id=group_id,
        inviter_id=current_user["id"],
        username=member_add.username,
    )


@router.post("/{group_id}/invites/respond", response_model=GroupMemberResponse)
def respond_to_invite(
    group_id: str,
    respond_data: GroupInviteRespond,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Accept or decline a pending group invitation."""
    return group_service.respond_to_group_invite(
        db=db,
        group_id=group_id,
        user_id=current_user["id"],
        action=respond_data.action,
    )


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member_from_group(
    group_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Remove a member from a group (Self-removal only)."""
    if current_user["id"] != user_id:
        raise ForbiddenError("Members can only remove themselves from a group.")

    group_service.remove_group_member(
        db=db,
        group_id=group_id,
        current_user_id=current_user["id"],
        target_user_id=user_id,
    )
