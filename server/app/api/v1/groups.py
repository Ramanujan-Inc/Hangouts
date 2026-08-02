from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.api.deps import get_current_user, get_db
from app.schemas.group import (
    GroupCreate,
    GroupResponse,
    GroupMemberAdd,
    GroupMemberResponse,
    GroupMemberRoleUpdate,
)
from app.services import groups as group_service

router = APIRouter()


def check_group_access(db: Client, group_id: str, user_id: str, require_admin: bool = False) -> str:
    """Helper to verify group existence and user membership/role with clear error messages."""
    group = group_service.get_group_by_id(db=db, group_id=group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found.",
        )

    role = group_service.get_member_role(db=db, group_id=group_id, user_id=user_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this group.",
        )

    if require_admin and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admins can perform this action.",
        )

    return role


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_new_group(
    group_create: GroupCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Create a new group. The authenticated user is set as the initial admin."""
    try:
        group = group_service.create_group(
            db=db,
            group_create=group_create,
            user_id=current_user["id"],
        )
        return group
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
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
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Get detailed information for a specific group, including member list."""
    check_group_access(db=db, group_id=group_id, user_id=current_user["id"], require_admin=False)

    group = group_service.get_group_by_id(db=db, group_id=group_id)
    members = group_service.get_group_members(db=db, group_id=group_id)
    group["members"] = members
    return group


@router.post("/{group_id}/members", response_model=GroupMemberResponse)
def add_member_to_group(
    group_id: str,
    member_add: GroupMemberAdd,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Add a new member to a group (Admin only)."""
    check_group_access(db=db, group_id=group_id, user_id=current_user["id"], require_admin=True)

    try:
        new_member = group_service.add_group_member(
            db=db,
            group_id=group_id,
            target_user_id=str(member_add.user_id),
            role=member_add.role,
        )
        return new_member
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.patch("/{group_id}/members/{user_id}", response_model=GroupMemberResponse)
def promote_member_to_admin(
    group_id: str,
    user_id: str,
    role_update: GroupMemberRoleUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Promote a group member to admin (Admin only). Demotion is not permitted."""
    check_group_access(db=db, group_id=group_id, user_id=current_user["id"], require_admin=True)

    try:
        updated_member = group_service.update_group_member_role(
            db=db,
            group_id=group_id,
            target_user_id=user_id,
            new_role=role_update.role,
        )
        return updated_member
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member_from_group(
    group_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Remove a member from a group (Admin only, or user removing themselves)."""
    role = check_group_access(db=db, group_id=group_id, user_id=current_user["id"], require_admin=False)

    # User can remove themselves, or an admin can remove any user
    if current_user["id"] != user_id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only group admins can remove other members from the group.",
        )

    try:
        group_service.remove_group_member(
            db=db, group_id=group_id, target_user_id=user_id
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
