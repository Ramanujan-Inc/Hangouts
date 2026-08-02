from typing import List
from fastapi import APIRouter, Depends, status
from supabase import Client
from app.api.deps import (
    get_current_user,
    get_db,
    require_group_access,
)
from app.schemas.group import (
    GroupCreate,
    GroupResponse,
    GroupMemberAdd,
    GroupMemberResponse,
    GroupMemberRoleUpdate,
)
from app.services import groups as group_service
from app.core.exceptions import ForbiddenError

router = APIRouter()


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_new_group(
    group_create: GroupCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Create a new group. The authenticated user is set as the initial admin."""
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
    """List all groups the currently authenticated user belongs to."""
    return group_service.get_user_groups(db=db, user_id=current_user["id"])


@router.get("/{group_id}", response_model=GroupResponse)
def get_group_details(
    group_id: str,
    _: str = Depends(require_group_access()),
    db: Client = Depends(get_db),
):
    """Get detailed information for a specific group, including member list."""
    return group_service.get_full_group_details(db=db, group_id=group_id)


@router.post("/{group_id}/members", response_model=GroupMemberResponse)
def add_member_to_group(
    group_id: str,
    member_add: GroupMemberAdd,
    _: str = Depends(require_group_access(require_admin=True)),
    db: Client = Depends(get_db),
):
    """Add a new member to a group (Admin only)."""
    return group_service.add_group_member(
        db=db,
        group_id=group_id,
        target_user_id=str(member_add.user_id),
        role=member_add.role,
    )


@router.patch("/{group_id}/members/{user_id}", response_model=GroupMemberResponse)
def promote_member_to_admin(
    group_id: str,
    user_id: str,
    role_update: GroupMemberRoleUpdate,
    _: str = Depends(require_group_access(require_admin=True)),
    db: Client = Depends(get_db),
):
    """Promote a group member to admin (Admin only). Demotion is not permitted."""
    return group_service.update_group_member_role(
        db=db,
        group_id=group_id,
        target_user_id=user_id,
        new_role=role_update.role,
    )


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member_from_group(
    group_id: str,
    user_id: str,
    role: str = Depends(require_group_access()),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Remove a member from a group (Admin only, or user removing themselves)."""
    if current_user["id"] != user_id and role.lower() != "admin":
        raise ForbiddenError("Only group admins can remove other members from the group.")

    group_service.remove_group_member(db=db, group_id=group_id, target_user_id=user_id)
