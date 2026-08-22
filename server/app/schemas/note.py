from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.schemas.profile import ProfileResponse


class NoteBase(BaseModel):
    content: str
    color: str = "butter"
    is_shared: bool = True


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    color: Optional[str] = None
    is_shared: Optional[bool] = None


class NoteResponse(NoteBase):
    id: UUID
    hangout_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    author: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)
