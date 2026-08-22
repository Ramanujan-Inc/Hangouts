from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, Query, status
from supabase import Client
from app.api.deps import get_current_user, get_db
from app.schemas.media import MediaResponse
from app.services import media as media_service

router = APIRouter()


@router.post("/hangouts/{id}/media", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
def upload_media(
    id: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    is_shared: bool = Form(True),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Upload a photo or video to a hangout's gallery."""
    return media_service.upload_media(
        db=db,
        hangout_id=id,
        user_id=current_user["id"],
        file=file,
        caption=caption,
        is_shared=is_shared,
    )


import json

@router.post("/hangouts/{id}/media/bulk", response_model=List[MediaResponse], status_code=status.HTTP_201_CREATED)
def upload_bulk_media(
    id: str,
    files: List[UploadFile] = File(...),
    captions: Optional[List[str]] = Form(None),
    captions_json: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    is_shared: bool = Form(True),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Upload multiple photos or videos to a hangout's gallery in batch with individual or global captions."""
    resolved_captions = captions
    if captions_json:
        try:
            resolved_captions = json.loads(captions_json)
        except Exception:
            pass

    return media_service.upload_bulk_media(
        db=db,
        hangout_id=id,
        user_id=current_user["id"],
        files=files,
        captions=resolved_captions,
        caption=caption,
        is_shared=is_shared,
    )


@router.get("/hangouts/{id}/media", response_model=List[MediaResponse])
def list_hangout_media(
    id: str,
    type: Optional[str] = Query(None, description="Filter by media type ('photo' or 'video')"),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Retrieve media gallery items for a hangout with privacy filtering."""
    return media_service.get_hangout_media(
        db=db,
        hangout_id=id,
        user_id=current_user["id"],
        media_type_filter=type,
    )


@router.post("/media/{media_id}/favorite", response_model=MediaResponse)
def favorite_media(
    media_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Add media item to user's favorites."""
    return media_service.favorite_media(
        db=db,
        media_id=media_id,
        user_id=current_user["id"],
    )


@router.delete("/media/{media_id}/favorite", response_model=MediaResponse)
def unfavorite_media(
    media_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Remove media item from user's favorites."""
    return media_service.unfavorite_media(
        db=db,
        media_id=media_id,
        user_id=current_user["id"],
    )


@router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(
    media_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Delete a media item (uploader only)."""
    media_service.delete_media(
        db=db,
        media_id=media_id,
        user_id=current_user["id"],
    )
