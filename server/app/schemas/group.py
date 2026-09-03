from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.schemas.profile import ProfileResponse


class GroupBase(BaseModel):
    name: str
    cover_image_url: Optional[str] = None


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    cover_image_url: Optional[str] = None


class GroupMemberResponse(BaseModel):
    id: UUID
    group_id: UUID
    user_id: UUID
    status: str = "accepted"
    invited_by: Optional[UUID] = None
    joined_at: datetime
    profile: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class GroupMemberAdd(BaseModel):
    username: str


class GroupInviteRespond(BaseModel):
    action: str  # "accept" or "decline"



class GroupResponse(GroupBase):
    id: UUID
    invite_code: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    members: Optional[List[GroupMemberResponse]] = None

    model_config = ConfigDict(from_attributes=True)


class GroupInviteResponse(BaseModel):
    id: UUID
    group_id: UUID
    status: str = "pending"
    joined_at: datetime
    group: Optional[GroupResponse] = None
    inviter: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class GroupJoinPreviewResponse(BaseModel):
    id: UUID
    name: str
    cover_image_url: Optional[str] = None
    invite_code: str
    created_at: datetime
    creator: Optional[ProfileResponse] = None
    member_count: int = 0
    user_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

