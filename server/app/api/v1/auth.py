from fastapi import APIRouter, Depends, status
from supabase import Client
from app.api.deps import get_db
from app.schemas.auth import UserSignUp, UserLogin, TokenResponse
from app.services import auth as auth_service

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(
    user_in: UserSignUp,
    db: Client = Depends(get_db),
):
    """Register a new user and initialize profile record."""
    return auth_service.sign_up_user(db=db, user_in=user_in)


@router.post("/login", response_model=TokenResponse)
def login(
    user_in: UserLogin,
    db: Client = Depends(get_db),
):
    """Authenticate user with email/password and return Bearer token."""
    return auth_service.login_user(db=db, user_in=user_in)
