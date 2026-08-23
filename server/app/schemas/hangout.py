from datetime import date, time, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.schemas.profile import ProfileResponse


class HangoutBase(BaseModel):
    title: str
    description: Optional[str] = None
    hangout_date: date
    hangout_time: Optional[time] = None
    location_name: Optional[str] = None
    formatted_address: Optional[str] = None
    place_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    cover_photo_url: Optional[str] = None
    group_id: Optional[UUID] = None


class HangoutCreate(HangoutBase):
    pass


class HangoutUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    hangout_date: Optional[date] = None
    hangout_time: Optional[time] = None
    location_name: Optional[str] = None
    formatted_address: Optional[str] = None
    place_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    cover_photo_url: Optional[str] = None
    group_id: Optional[UUID] = None


class ParticipantCreate(BaseModel):
    user_id: UUID


class ParticipantResponse(BaseModel):
    id: UUID
    hangout_id: UUID
    user_id: UUID
    profile: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class HangoutResponse(HangoutBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    creator: Optional[ProfileResponse] = None
    participants: Optional[List[ParticipantResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class MemoryResponse(HangoutResponse):
    years_ago: int
    days_diff: Optional[int] = 0


class RatingCreate(BaseModel):
    rating: int


class RatingResponse(BaseModel):
    id: UUID
    hangout_id: UUID
    user_id: UUID
    rating: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

