import pytest
from typing import Generator
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user


TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
TEST_USER_EMAIL = "testuser@example.com"


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Yields a TestClient instance and clears dependency overrides post-test."""
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_user() -> dict:
    """Standard mock authenticated user dict."""
    return {
        "id": TEST_USER_ID,
        "email": TEST_USER_EMAIL,
        "user_metadata": {"full_name": "Test User"},
    }


@pytest.fixture
def authenticated_client(client: TestClient, mock_user: dict) -> TestClient:
    """TestClient with get_current_user dependency overridden for authentication."""
    app.dependency_overrides[get_current_user] = lambda: mock_user
    return client
