from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class UserSignUp(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    display_name: str
    avatar_url: Optional[str] = None



class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    email: str
