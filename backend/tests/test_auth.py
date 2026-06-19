from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.schemas.auth import UserRegister
from app.services.user_service import UserService


def test_successful_registration(client: TestClient, db: Session):
    """Test successful user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "password": "SecurePass123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    # Verify user was created in database
    user = UserService.get_user_by_email(db, "john.doe@example.com")
    assert user is not None
    assert user.email == "john.doe@example.com"
    assert user.role.value == "client"


def test_duplicate_email_rejection(client: TestClient, db: Session):
    """Test that duplicate email is rejected."""
    # Create first user
    user_data = UserRegister(
        first_name="John",
        last_name="Doe",
        email="john.doe@example.com",
        password="SecurePass123"
    )
    UserService.create_client_user(
        db,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        password=user_data.password
    )
    
    # Try to register with same email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "john.doe@example.com",
            "password": "AnotherPass123"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_invalid_email_rejection(client: TestClient):
    """Test that invalid email format is rejected."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "John",
            "last_name": "Doe",
            "email": "invalid-email",
            "password": "SecurePass123"
        }
    )
    assert response.status_code == 422


def test_weak_password_rejection(client: TestClient):
    """Test that weak password is rejected."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "password": "weak"
        }
    )
    assert response.status_code == 422


def test_successful_login(client: TestClient, db: Session):
    """Test successful user login."""
    # Create user first
    UserService.create_client_user(
        db,
        email="login@example.com",
        first_name="Login",
        last_name="User",
        password="SecurePass123"
    )
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "SecurePass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_incorrect_password_rejection(client: TestClient, db: Session):
    """Test that incorrect password is rejected."""
    # Create user first
    UserService.create_client_user(
        db,
        email="login@example.com",
        first_name="Login",
        last_name="User",
        password="SecurePass123"
    )
    
    # Try to login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "WrongPassword123"
        }
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_accessing_auth_me_with_valid_token(client: TestClient, db: Session):
    """Test accessing /auth/me with a valid token."""
    # Create user and get token
    UserService.create_client_user(
        db,
        email="auth@example.com",
        first_name="Auth",
        last_name="User",
        password="SecurePass123"
    )
    
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "auth@example.com",
            "password": "SecurePass123"
        }
    )
    token = login_response.json()["access_token"]
    
    # Access /auth/me with token
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "auth@example.com"
    assert "password_hash" not in data


def test_accessing_protected_route_without_token(client: TestClient):
    """Test accessing protected route without token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
