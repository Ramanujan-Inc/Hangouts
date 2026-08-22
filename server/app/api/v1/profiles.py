from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from supabase import Client
from app.api.deps import get_current_user, get_db
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services import profiles as profile_service

router = APIRouter()


@router.post("/avatar", response_model=dict, status_code=status.HTTP_201_CREATED)
def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Upload a custom user avatar photo to storage, update the profile, and return the new avatar URL."""
    return profile_service.upload_user_avatar(
        db=db,
        user_id=current_user["id"],
        file=file,
    )


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



@router.get("/{identifier}", response_model=ProfileResponse)
def read_user_profile(
    identifier: str,
    db: Client = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Fetch public user profile by UUID or exact username."""
    profile = profile_service.get_profile_by_identifier(db=db, identifier=identifier)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )
    return profile
