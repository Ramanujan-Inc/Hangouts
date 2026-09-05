from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, File, UploadFile
from supabase import Client
from app.api.deps import get_current_user, get_optional_current_user, get_db
from app.schemas.hangout import (
    HangoutCreate,
    HangoutUpdate,
    HangoutResponse,
    ParticipantCreate,
    ParticipantResponse,
    RatingCreate,
    RatingResponse,
    HangoutJoinPreviewResponse,
)
from app.services import hangouts as hangout_service

router = APIRouter()


@router.post("/cover", response_model=dict, status_code=status.HTTP_201_CREATED)
def upload_hangout_cover(
    file: UploadFile = File(...),
    _: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Upload a custom hangout cover photo to storage and return its public URL."""
    return hangout_service.upload_hangout_cover_image(db=db, file=file)


@router.post("", response_model=HangoutResponse, status_code=status.HTTP_201_CREATED)
def create_hangout(
    hangout_create: HangoutCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Create a new hangout and automatically add the creator as an initial participant."""
    return hangout_service.create_hangout(
        db=db,
        hangout_create=hangout_create,
        user_id=current_user["id"],
    )


@router.get("", response_model=List[HangoutResponse])
def list_hangouts(
    q: Optional[str] = Query(None, description="General search string for title or location_name"),
    hangout_name: Optional[str] = Query(None, description="Filter by hangout title/name"),
    location_name: Optional[str] = Query(None, description="Filter by location name"),
    date: Optional[str] = Query(None, description="Filter by exact or partial date (YYYY, YYYY-MM, YYYY-MM-DD)"),
    group_name: Optional[str] = Query(None, description="Filter by group name"),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Search & filter hangouts matching hangout_name, location_name, date, group_name, or general q."""
    return hangout_service.get_hangouts(
        db=db,
        user_id=current_user["id"],
        q=q,
        hangout_name=hangout_name,
        location_name=location_name,
        date=date,
        group_name=group_name,
    )


@router.get("/map", response_model=List[HangoutResponse])
def get_hangouts_map(
    group_id: Optional[str] = Query(None, description="Filter by group UUID"),
    min_lat: Optional[float] = Query(None, description="Minimum latitude for bounding box"),
    max_lat: Optional[float] = Query(None, description="Maximum latitude for bounding box"),
    min_lng: Optional[float] = Query(None, description="Minimum longitude for bounding box"),
    max_lng: Optional[float] = Query(None, description="Maximum longitude for bounding box"),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Spatial Map Query returning hangouts with non-null coordinates within optional bounding box."""
    return hangout_service.get_hangouts_map(
        db=db,
        user_id=current_user["id"],
        group_id=group_id,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lng=min_lng,
        max_lng=max_lng,
    )


@router.get("/join/{invite_code}", response_model=HangoutJoinPreviewResponse)
def get_hangout_join_preview(
    invite_code: str,
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: Client = Depends(get_db),
):
    """Get public preview of a hangout by its invite code."""
    user_id = current_user["id"] if current_user else None
    return hangout_service.get_hangout_by_invite_code(db=db, invite_code=invite_code, user_id=user_id)


@router.post("/join/{invite_code}", response_model=HangoutResponse)
def join_hangout_via_invite(
    invite_code: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Join a hangout using its invite code (authenticated)."""
    return hangout_service.join_hangout_by_invite_code(
        db=db,
        invite_code=invite_code,
        user_id=current_user["id"],
    )


@router.get("/{id}", response_model=HangoutResponse)
def get_hangout_details(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Get detailed hangout information by full UUID or 8-character short_id."""
    return hangout_service.get_hangout_by_id(db=db, hangout_id=id, user_id=current_user["id"])


@router.patch("/{id}", response_model=HangoutResponse)
def update_hangout(
    id: str,
    hangout_update: HangoutUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Update hangout details (creator only)."""
    return hangout_service.update_hangout(
        db=db,
        hangout_id=id,
        hangout_update=hangout_update,
        user_id=current_user["id"],
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hangout(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Delete a hangout (creator only)."""
    hangout_service.delete_hangout(
        db=db,
        hangout_id=id,
        user_id=current_user["id"],
    )


@router.post("/{id}/participants", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED)
def add_participant(
    id: str,
    participant_create: ParticipantCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Add a participant to the hangout (allowed by any active participant or creator)."""
    return hangout_service.add_participant(
        db=db,
        hangout_id=id,
        target_user_id=str(participant_create.user_id),
        requesting_user_id=current_user["id"],
    )


@router.delete("/{id}/participants/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_participant(
    id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Remove a participant (creator can kick; participants can leave/remove self)."""
    hangout_service.remove_participant(
        db=db,
        hangout_id=id,
        target_user_id=user_id,
        requesting_user_id=current_user["id"],
    )


@router.post("/{id}/ratings", response_model=RatingResponse, status_code=status.HTTP_200_OK)
def rate_hangout(
    id: str,
    rating_data: RatingCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Set or update user's individual rating (1-5) for a hangout."""
    return hangout_service.upsert_hangout_rating(
        db=db,
        hangout_id=id,
        user_id=current_user["id"],
        rating=rating_data.rating,
    )


@router.get("/{id}/ratings", response_model=Optional[RatingResponse])
def get_hangout_rating(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Get the current user's rating for a hangout."""
    return hangout_service.get_user_hangout_rating(
        db=db,
        hangout_id=id,
        user_id=current_user["id"],
    )
