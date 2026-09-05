from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class UserSignUp(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    redirect_url: Optional[str] = None



class UserLogin(BaseModel):
    username_or_email: Optional[str] = Field(None, description="Email address or username")
    email: Optional[str] = None
    password: str


class TokenResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user_id: UUID
    email: str
    email_confirmed: bool = True
    message: Optional[str] = None


class ResendConfirmationRequest(BaseModel):
    email: EmailStr
    redirect_url: Optional[str] = None
