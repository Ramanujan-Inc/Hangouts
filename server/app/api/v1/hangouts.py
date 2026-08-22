from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from supabase import Client
from app.api.deps import get_current_user, get_db
from app.schemas.hangout import (
    HangoutCreate,
    HangoutUpdate,
    HangoutResponse,
    ParticipantCreate,
    ParticipantResponse,
)
from app.services import hangouts as hangout_service

router = APIRouter()


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
        group_id=group_id,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lng=min_lng,
        max_lng=max_lng,
    )


@router.get("/{id}", response_model=HangoutResponse)
def get_hangout_details(
    id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Get detailed hangout information with creator profile and participant list."""
    return hangout_service.get_hangout_by_id(db=db, hangout_id=id)


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
