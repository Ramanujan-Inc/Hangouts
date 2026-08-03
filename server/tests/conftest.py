import os
import uuid
import pytest
from typing import Generator, Dict, Any, Callable
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from supabase import create_client, Client

from app.core.supabase import get_supabase_client


@pytest.fixture(scope="session")
def db() -> Client:
    """Provides the Supabase client instance."""
    return get_supabase_client()




@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Yields a clean TestClient instance."""
    with TestClient(app) as test_client:
        yield test_client



@pytest.fixture
def create_test_user(db: Client) -> Generator[Callable[..., Dict[str, Any]], None, None]:
    """Factory fixture to register a real user in local Supabase Auth and perform targeted cleanup."""
    created_users = []

    def _create_user(email: str = None, password: str = "TestPassword123!", display_name: str = "Test User") -> Dict[str, Any]:
        if not email:
            email = f"test_{uuid.uuid4().hex[:8]}@example.com"

        auth_res = db.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "display_name": display_name,
                }
            },
        })

        if not auth_res.user:
            raise RuntimeError("Failed to create test user in Supabase Auth")

        user_id = str(auth_res.user.id)
        created_users.append(user_id)

        access_token = auth_res.session.access_token if auth_res.session else ""
        if not access_token:
            session_res = db.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
            access_token = session_res.session.access_token

        return {
            "id": user_id,
            "email": email,
            "password": password,
            "display_name": display_name,
            "access_token": access_token,
            "headers": {"Authorization": f"Bearer {access_token}"},
        }

    yield _create_user

    for uid in created_users:
        try:
            db.table("groups").delete().eq("created_by", uid).execute()
            db.table("profiles").delete().eq("id", uid).execute()
        except Exception:
            pass






@pytest.fixture
def primary_user(create_test_user: Callable[..., Dict[str, Any]]) -> Dict[str, Any]:
    """Standard primary test user fixture."""
    return create_test_user(display_name="Primary User")


@pytest.fixture
def secondary_user(create_test_user: Callable[..., Dict[str, Any]]) -> Dict[str, Any]:
    """Standard secondary test user fixture for permission testing."""
    return create_test_user(display_name="Secondary User")


@pytest.fixture
def authenticated_client(client: TestClient, primary_user: Dict[str, Any]) -> TestClient:
    """TestClient pre-configured with primary user Authorization headers."""
    client.headers.update(primary_user["headers"])
    return client

