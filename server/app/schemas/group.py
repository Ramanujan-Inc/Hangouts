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
    role: str
    joined_at: datetime
    profile: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class GroupMemberAdd(BaseModel):
    user_id: UUID
    role: str = "member"


class GroupMemberRoleUpdate(BaseModel):
    role: str = "admin"



class GroupResponse(GroupBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    members: Optional[List[GroupMemberResponse]] = None

    model_config = ConfigDict(from_attributes=True)
