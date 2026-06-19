from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services.user_service import UserService
from app.core.permissions import UserRole


def test_client_rejection_from_agent_only_route(client: TestClient, db: Session):
    """Test that clients cannot access agent-only endpoints."""
    # Create client user
    UserService.create_client_user(
        db,
        email="client@example.com",
        first_name="Client",
        last_name="User",
        password="SecurePass123"
    )
    
    # Login as client
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "client@example.com",
            "password": "SecurePass123"
        }
    )
    token = login_response.json()["access_token"]
    
    # Try to access agent-only endpoint
    response = client.get(
        "/api/v1/users/agent-area",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert "Insufficient permissions" in response.json()["detail"]


def test_client_rejection_from_manager_only_route(client: TestClient, db: Session):
    """Test that clients cannot access manager-only endpoints."""
    # Create client user
    UserService.create_client_user(
        db,
        email="client@example.com",
        first_name="Client",
        last_name="User",
        password="SecurePass123"
    )
    
    # Login as client
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "client@example.com",
            "password": "SecurePass123"
        }
    )
    token = login_response.json()["access_token"]
    
    # Try to access manager-only endpoint
    response = client.get(
        "/api/v1/users/manager-area",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert "Insufficient permissions" in response.json()["detail"]


def test_manager_access_to_manager_only_route(client: TestClient, db: Session):
    """Test that managers can access manager-only endpoints."""
    # Create manager user (manually for testing)
    from app.schemas.user import UserCreate
    manager_data = UserCreate(
        first_name="Manager",
        last_name="User",
        email="manager@example.com",
        password_hash="hashed_password",
        role=UserRole.MANAGER,
        is_active=True
    )
    UserService.create_user(db, manager_data)
    
    # Update the user's password hash to a valid hash
    from app.core.security import get_password_hash
    manager_user = UserService.get_user_by_email(db, "manager@example.com")
    manager_user.password_hash = get_password_hash("SecurePass123")
    db.commit()
    
    # Login as manager
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "manager@example.com",
            "password": "SecurePass123"
        }
    )
    token = login_response.json()["access_token"]
    
    # Access manager-only endpoint
    response = client.get(
        "/api/v1/users/manager-area",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to the manager area"
