from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.api.deps import get_current_user, get_db
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services import profiles as profile_service

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
def read_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Retrieve profile of the currently authenticated user."""
    profile = profile_service.get_profile_by_id(db=db, profile_id=current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )
    return profile


@router.patch("/me", response_model=ProfileResponse)
def update_current_user_profile(
    profile_update: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Update profile information of the currently authenticated user."""
    updated_profile = profile_service.update_profile(
        db=db,
        profile_id=current_user["id"],
        profile_update=profile_update,
    )
    return updated_profile


@router.get("/{profile_id}", response_model=ProfileResponse)
def read_user_profile_by_id(
    profile_id: str,
    db: Client = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Fetch public user profile by UUID."""
    profile = profile_service.get_profile_by_id(db=db, profile_id=profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )
    return profile
