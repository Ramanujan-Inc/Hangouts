from datetime import date, time, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, HttpUrl
from app.schemas.profile import ProfileResponse
from app.schemas.group import GroupResponse
from app.schemas.media import MediaResponse
from app.schemas.note import NoteResponse
from app.schemas.expense import ExpenseResponse, ExpenseSummaryResponse


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
    external_album_url: Optional[HttpUrl] = None
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
    external_album_url: Optional[HttpUrl] = None
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
    invite_code: Optional[str] = None
    short_id: Optional[str] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    creator: Optional[ProfileResponse] = None
    participants: Optional[List[ParticipantResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class HangoutJoinPreviewResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    hangout_date: date
    hangout_time: Optional[time] = None
    location_name: Optional[str] = None
    formatted_address: Optional[str] = None
    cover_photo_url: Optional[str] = None
    invite_code: str
    short_id: Optional[str] = None
    creator: Optional[ProfileResponse] = None
    participant_count: int = 0
    is_participant: bool = False

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


class HangoutFullResponse(BaseModel):
    hangout: HangoutResponse
    media: List[MediaResponse] = []
    rating: Optional[int] = 4
    notes: List[NoteResponse] = []
    expenses: List[ExpenseResponse] = []
    expense_summary: Optional[ExpenseSummaryResponse] = None

    model_config = ConfigDict(from_attributes=True)


class TimelineFeedResponse(BaseModel):
    hangouts: List[HangoutResponse] = []
    groups: List[GroupResponse] = []
    memory: Optional[MemoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


class CoverUploadRequest(BaseModel):
    filename: str
    content_type: str


class CoverUploadResponse(BaseModel):
    upload_url: str
    public_url: str



