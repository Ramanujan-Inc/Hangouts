from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from supabase import Client
from app.core.config import settings
from app.schemas.auth import UserSignUp, UserLogin


def sign_up_user(db: Client, user_in: UserSignUp) -> Dict[str, Any]:
    """Register user in Supabase Auth (profile is initialized via DB trigger)."""
    username_val = (user_in.username or user_in.email.split("@")[0]).strip()

    # Check if username is already taken (case-insensitive)
    existing_profile = db.table("profiles").select("id").ilike("username", username_val).execute()
    if existing_profile.data and len(existing_profile.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken.",
        )

    avatar_url_val = user_in.avatar_url or "/avatars/mika.svg"
    redirect_target = (user_in.redirect_url or f"{settings.FRONTEND_URL}/auth/callback").strip()

    try:
        auth_response = db.auth.sign_up(
            {
                "email": user_in.email,
                "password": user_in.password,
                "options": {
                    "data": {
                        "username": username_val,
                        "avatar_url": avatar_url_val,
                    },
                    "email_redirect_to": redirect_target,
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
    has_session = bool(auth_response.session and auth_response.session.access_token)
    access_token = auth_response.session.access_token if has_session else None
    email_confirmed = bool(auth_response.user.email_confirmed_at or has_session)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "email": email,
        "email_confirmed": email_confirmed,
        "message": "Registration successful. Please check your email to confirm your account." if not email_confirmed else None,
    }


def login_user(db: Client, user_in: UserLogin) -> Dict[str, Any]:
    """Authenticate user with email or username and password against Supabase Auth."""
    identifier = (user_in.username_or_email or user_in.email or "").strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username is required.",
        )

    target_email = identifier
    if "@" not in identifier:
        # Lookup user's registered email by username in profiles table
        profile_res = db.table("profiles").select("email").ilike("username", identifier).execute()
        if profile_res.data and len(profile_res.data) > 0:
            target_email = profile_res.data[0]["email"]

    try:
        auth_response = db.auth.sign_in_with_password(
            {
                "email": target_email,
                "password": user_in.password,
            }
        )
    except Exception as e:
        err_msg = str(e).lower()
        if "email not confirmed" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not confirmed. Please check your inbox or resend the confirmation link.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )

    if not auth_response.user or not auth_response.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )

    user_id = str(auth_response.user.id)
    email = auth_response.user.email

    return {
        "access_token": auth_response.session.access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "email": email,
        "email_confirmed": True,
        "message": None,
    }


def resend_confirmation_email(db: Client, email: str, redirect_url: Optional[str] = None) -> Dict[str, str]:
    """Resend signup confirmation email via Supabase Auth."""
    redirect_target = (redirect_url or f"{settings.FRONTEND_URL}/auth/callback").strip()
    try:
        db.auth.resend({
            "type": "signup",
            "email": email,
            "options": {
                "email_redirect_to": redirect_target,
            },
        })
    except Exception as e:
        err_msg = str(e)
        if "rate limit" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait a few moments before trying again.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to resend confirmation email: {err_msg}",
        )
    return {"message": "Confirmation email resent successfully."}
