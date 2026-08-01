from typing import Dict, Any
from fastapi import HTTPException, status
from supabase import Client
from app.schemas.auth import UserSignUp, UserLogin


def sign_up_user(db: Client, user_in: UserSignUp) -> Dict[str, Any]:
    """Register user in Supabase Auth (profile is initialized via DB trigger)."""
    try:
        auth_response = db.auth.sign_up(
            {
                "email": user_in.email,
                "password": user_in.password,
                "options": {
                    "data": {
                        "display_name": user_in.display_name,
                        "avatar_url": user_in.avatar_url,
                    }
                },
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}",
        )

    if not auth_response.user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user account.",
        )

    user_id = str(auth_response.user.id)
    email = auth_response.user.email
    access_token = auth_response.session.access_token if auth_response.session else ""

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "email": email,
    }


def login_user(db: Client, user_in: UserLogin) -> Dict[str, Any]:
    """Authenticate user with email/password against Supabase Auth."""
    try:
        auth_response = db.auth.sign_in_with_password(
            {
                "email": user_in.email,
                "password": user_in.password,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}",
        )

    if not auth_response.user or not auth_response.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id = str(auth_response.user.id)
    email = auth_response.user.email

    return {
        "access_token": auth_response.session.access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "email": email,
    }
