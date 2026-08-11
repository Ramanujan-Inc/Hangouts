from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.schemas.profile import ProfileResponse


class MediaBase(BaseModel):
    url: str
    thumbnail_url: str
    caption: Optional[str] = None
    media_type: Literal["photo", "video"] = "photo"
    favorites_count: int = 0
    is_shared: bool = True


class MediaCreate(MediaBase):
    hangout_id: UUID


class MediaUpdate(BaseModel):
    caption: Optional[str] = None
    media_type: Optional[Literal["photo", "video"]] = None
    favorites_count: Optional[int] = None
    is_shared: Optional[bool] = None


class MediaResponse(MediaBase):
    id: UUID
    hangout_id: UUID
    uploaded_by: UUID
    created_at: datetime
    uploader: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class MediaFavoriteCreate(BaseModel):
    media_id: UUID


class MediaFavoriteResponse(BaseModel):
    id: UUID
    media_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
