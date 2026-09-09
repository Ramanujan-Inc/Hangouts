from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.profile import Profile
from app.core.config import settings
from app.core.supabase import get_supabase_client
from app.schemas.auth import UserSignUp, UserLogin


def sign_up_user(db: Session, user_in: UserSignUp) -> Dict[str, Any]:
    """Register user in Supabase Auth (profile is initialized via DB trigger)."""
    username_val = (user_in.username or user_in.email.split("@")[0]).strip()

    # Check if username is already taken (case-insensitive) via direct SQL
    existing_id = db.scalar(
        select(Profile.id).where(func.lower(Profile.username) == username_val.lower())
    )
    if existing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken.",
        )

    # Check if email is already registered via direct SQL
    existing_email = db.scalar(
        select(Profile.id).where(func.lower(Profile.email) == user_in.email.lower())
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed: Email is already registered.",
        )

    avatar_url_val = user_in.avatar_url or "/avatars/mika.svg"
    redirect_target = (user_in.redirect_url or f"{settings.FRONTEND_URL}/auth/callback").strip()

    supabase = get_supabase_client()
    try:
        auth_response = supabase.auth.sign_up(
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
        err_msg = str(e)
        if "rate limit" in err_msg.lower():
            try:
                admin_user = supabase.auth.admin.create_user({
                    "email": user_in.email,
                    "password": user_in.password,
                    "email_confirm": True,
                    "user_metadata": {
                        "username": username_val,
                        "avatar_url": avatar_url_val,
                    },
                })
                auth_response = supabase.auth.sign_in_with_password({
                    "email": user_in.email,
                    "password": user_in.password,
                })
            except Exception as admin_err:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Registration failed: {str(admin_err)}",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration failed: {err_msg}",
            )

    if not auth_response.user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user account.",
        )

    if auth_response.user.identities is not None and len(auth_response.user.identities) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed: Email is already registered.",
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


def login_user(db: Session, user_in: UserLogin) -> Dict[str, Any]:
    """Authenticate user with email or username and password against Supabase Auth."""
    identifier = (user_in.username_or_email or user_in.email or "").strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username is required.",
        )

    target_email = identifier
    if "@" not in identifier:
        # Lookup user's registered email by username in profiles table via direct SQL
        profile_email = db.scalar(
            select(Profile.email).where(func.lower(Profile.username) == identifier.lower())
        )
        if profile_email:
            target_email = profile_email

    supabase = get_supabase_client()
    auth_response = None
    for attempt in range(3):
        try:
            auth_response = supabase.auth.sign_in_with_password(
                {
                    "email": target_email,
                    "password": user_in.password,
                }
            )
            break
        except Exception as e:
            err_msg = str(e).lower()
            if "email not confirmed" in err_msg:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Email not confirmed. Please check your inbox or resend the confirmation link.",
                )
            if ("rate limit" in err_msg or "too many requests" in err_msg or "429" in err_msg) and attempt < 2:
                import time
                time.sleep(1.0 * (attempt + 1))
                continue
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


def resend_confirmation_email(db: Session, email: str, redirect_url: Optional[str] = None) -> Dict[str, str]:
    """Resend signup confirmation email via Supabase Auth."""
    redirect_target = (redirect_url or f"{settings.FRONTEND_URL}/auth/callback").strip()
    supabase = get_supabase_client()
    try:
        supabase.auth.resend({
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


def get_oauth_authorization_url(provider: str = "google", redirect_to: Optional[str] = None) -> Dict[str, str]:
    """Generate Supabase OAuth authorization URL for the requested provider."""
    from urllib.parse import quote

    callback_target = (redirect_to or f"{settings.FRONTEND_URL}/auth/callback").strip()
    encoded_target = quote(callback_target, safe="")
    base_url = settings.SUPABASE_URL.rstrip("/")
    auth_url = f"{base_url}/auth/v1/authorize?provider={provider}&redirect_to={encoded_target}"
    return {
        "url": auth_url,
        "provider": provider,
    }
