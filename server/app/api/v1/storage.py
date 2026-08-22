from fastapi import APIRouter, Depends
from supabase import Client
from app.api.deps import get_current_user, get_db
from app.schemas.storage import StorageUsageResponse
from app.services import storage as storage_service

router = APIRouter()


@router.get("/usage", response_model=StorageUsageResponse)
def get_storage_usage(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Retrieve the current user's storage quota usage and limit in bytes."""
    return storage_service.get_user_storage_usage(
        db=db,
        user_id=current_user["id"],
    )
