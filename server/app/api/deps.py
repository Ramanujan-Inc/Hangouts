from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client
import jwt

from app.core.config import settings
from app.core.supabase import get_supabase_client

security = HTTPBearer(auto_error=False)


def get_db() -> Client:
    """Dependency for obtaining a fresh Supabase client per request."""
    return get_supabase_client()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Client = Depends(get_db),
) -> dict:
    """Dependency that extracts and validates the Bearer JWT token from request headers.

    1. Attempts fast local cryptographic decoding (<1ms) if SUPABASE_JWT_SECRET is set.
    2. Falls back to Supabase auth API verification if local decoding is skipped or fails.

    Returns a user dictionary containing 'id', 'email', and 'user_metadata'.
    Raises HTTP 401 Unauthorized if invalid or missing.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # 1. Fast local verification using JWT secret if configured (<1ms, no network call)
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
            user_id = payload.get("sub")
            email = payload.get("email")
            user_metadata = payload.get("user_metadata", {})
            if user_id:
                return {
                    "id": str(user_id),
                    "email": email,
                    "user_metadata": user_metadata,
                }
        except Exception:
            pass

    # 2. Fallback verification via Supabase auth API
    try:
        user_response = db.auth.get_user(token)
        if user_response and user_response.user:
            return {
                "id": str(user_response.user.id),
                "email": user_response.user.email,
                "user_metadata": user_response.user.user_metadata,
            }
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication token or token expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_group_access():
    """Dependency that validates active group membership.

    Usage:
        Depends(require_group_access()) -> Requires active ('accepted') member status
    """
    def dependency(
        group_id: str,
        current_user: dict = Depends(get_current_user),
        db: Client = Depends(get_db),
    ) -> str:
        from app.services import groups as group_service
        from app.core.exceptions import ForbiddenError

        status = group_service.get_member_status(db=db, group_id=group_id, user_id=current_user["id"])
        if not status or status.lower() != "accepted":
            raise ForbiddenError("You are not an active member of this group.")

        return status

    return dependency


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Client = Depends(get_db),
) -> Optional[dict]:
    """Dependency that extracts user if Bearer token is provided, or returns None if omitted/invalid."""
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user(credentials=credentials, db=db)
    except HTTPException:
        return None





