import uuid
from fastapi.testclient import TestClient
from supabase import Client


def test_missing_auth_header_returns_401(client: TestClient):
    """Protected endpoints must return 401 when Authorization header is missing."""
    response = client.get("/api/v1/profiles/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing authentication token."


def test_invalid_bearer_token_returns_401(client: TestClient):
    """Protected endpoints must return 401 when token is invalid or expired."""
    response = client.get(
        "/api/v1/profiles/me",
        headers={"Authorization": "Bearer invalid.mock.token"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid authentication token or token expired."


def test_signup_route_success(client: TestClient, db: Client):
    """Test user registration endpoint against real local Supabase Auth & triggers."""
    email = f"signup_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecretPassword123!"
    display_name = "New Signup User"

    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": password,
            "display_name": display_name,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == email

    user_id = data["user_id"]

    # Verify DB trigger `handle_new_user` created the profile record automatically
    profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
    assert len(profile_res.data) == 1
    assert profile_res.data[0]["display_name"] == display_name
    assert profile_res.data[0]["email"] == email

    # Clean up user from auth
    db.auth.admin.delete_user(user_id)


def test_login_route_success(client: TestClient, create_test_user):
    """Test user login endpoint against real local Supabase Auth."""
    email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    password = "MySecurePassword123!"
    user = create_test_user(email=email, password=password)

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user_id"] == user["id"]


def test_signup_short_password_returns_422(client: TestClient):
    """Signup must return 422 Unprocessable Entity when password is under 8 characters."""
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "shortpw@example.com",
            "password": "short",
            "display_name": "Short Pass User",
        },
    )
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("password" in err["loc"] for err in errors)


def test_signup_duplicate_email_returns_400(client: TestClient, create_test_user):
    """Signup must return 400 Bad Request when registering an existing email."""
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    create_test_user(email=email, password="ValidPassword123!")

    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": email,
            "password": "AnotherPassword123!",
            "display_name": "Duplicate Email User",
        },
    )
    assert response.status_code == 400
    assert "Registration failed" in response.json()["detail"]


def test_login_wrong_password_returns_401(client: TestClient, create_test_user):
    """Login with wrong password must return 401 Unauthorized."""
    email = f"wrongpw_{uuid.uuid4().hex[:8]}@example.com"
    create_test_user(email=email, password="CorrectPassword123!")

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "WrongPassword123!",
        },
    )
    assert response.status_code == 401
    assert "Login failed" in response.json()["detail"]


def test_login_non_existent_email_returns_401(client: TestClient):
    """Login with non-existent email must return 401 Unauthorized."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": f"nonexistent_{uuid.uuid4().hex[:8]}@example.com",
            "password": "SomePassword123!",
        },
    )
    assert response.status_code == 401
    assert "Login failed" in response.json()["detail"]



