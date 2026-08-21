from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from supabase import Client
from app.api.deps import get_current_user, get_db
from app.schemas.hangout import MemoryResponse
from app.services import memories as memories_service

router = APIRouter()


@router.get("/on-this-day", response_model=List[MemoryResponse])
def get_on_this_day_memories(
    date: Optional[date] = Query(
        None,
        description="Target date in YYYY-MM-DD format. Defaults to current date.",
    ),
    group_id: Optional[str] = Query(
        None,
        description="Filter memories by group UUID.",
    ),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Retrieve 'On This Day' memories for historical hangouts matching the month and day."""
    return memories_service.get_memories_on_this_day(
        db=db,
        target_date=date,
        group_id=group_id,
    )
