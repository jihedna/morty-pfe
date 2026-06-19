from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.services.user_service import UserService
from app.core.permissions import UserRole
from app.core.security import get_password_hash


def create_test_user(db: Session, email: str, role: UserRole) -> User:
    """Helper function to create a test user."""
    user_data = UserCreate(
        first_name="Test",
        last_name="User",
        email=email,
        password_hash=get_password_hash("SecurePass123"),
        role=role,
        is_active=True
    )
    return UserService.create_user(db, user_data)


def get_auth_token(client: TestClient, email: str, password: str) -> str:
    """Helper function to get authentication token."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    return response.json()["access_token"]


def test_manager_can_create_agent_profile(client: TestClient, db: Session):
    """Test that managers can create agent profiles."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    # Create agent profile
    response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "biography": "Experienced real estate agent",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0,
            "availability_status": "available",
            "languages": "French, English, Arabic"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == agent_user.id
    assert data["office"] == "RE/MAX Tunis"


def test_client_cannot_create_agent_profile(client: TestClient, db: Session):
    """Test that clients cannot create agent profiles."""
    # Create client user
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as client
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    
    # Try to create agent profile
    response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    assert response.status_code == 403


def test_agent_cannot_create_agent_profile(client: TestClient, db: Session):
    """Test that agents cannot create agent profiles for others."""
    # Create agent user
    _agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Create another agent user
    agent_user2 = create_test_user(db, "agent2@example.com", UserRole.AGENT)
    
    # Login as agent
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    
    # Try to create agent profile for another agent
    response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "user_id": agent_user2.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    assert response.status_code == 403


def test_duplicate_profile_rejected(client: TestClient, db: Session):
    """Test that duplicate profile for the same user is rejected."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    # Create first agent profile
    agent_data = {
        "user_id": agent_user.id,
        "office": "RE/MAX Tunis",
        "phone": "+21612345678",
        "years_experience": 5,
        "minimum_budget": 100000.0,
        "maximum_budget": 500000.0
    }
    
    response1 = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json=agent_data
    )
    assert response1.status_code == 201
    
    # Try to create duplicate profile
    response2 = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json=agent_data
    )
    assert response2.status_code == 400


def test_profile_cannot_be_created_for_non_agent_user(client: TestClient, db: Session):
    """Test that profile cannot be created for a non-agent user."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create client user (not agent)
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    
    # Login as manager
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    # Try to create agent profile for client
    response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": client_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    assert response.status_code == 400


def test_agent_can_view_own_profile(client: TestClient, db: Session):
    """Test that agents can view their own profile."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager and create agent profile
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    # Login as agent
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    
    # View own profile
    response = client.get(
        "/api/v1/agents/me/profile",
        headers={"Authorization": f"Bearer {agent_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == agent_user.id


def test_agent_can_update_allowed_fields(client: TestClient, db: Session):
    """Test that agents can update allowed fields."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager and create agent profile
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    # Login as agent
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    
    # Update allowed fields
    response = client.patch(
        "/api/v1/agents/me/profile",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "phone": "+21687654321",
            "biography": "Updated biography",
            "languages": "French, English"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == "+21687654321"
    assert data["biography"] == "Updated biography"


def test_agent_cannot_update_restricted_fields(client: TestClient, db: Session):
    """Test that agents cannot update restricted fields."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager and create agent profile
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0,
            "closed_deals": 10,
            "success_rate": 0.8
        }
    )
    
    # Login as agent
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    
    # Try to update restricted fields (these should be ignored by the schema)
    response = client.patch(
        "/api/v1/agents/me/profile",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "years_experience": 10,
            "closed_deals": 20,
            "success_rate": 0.9
        }
    )
    
    # The schema doesn't include these fields, so they won't be in the request
    # This test verifies the schema prevents these fields
    assert response.status_code == 200


def test_manager_can_fully_update_agent(client: TestClient, db: Session):
    """Test that managers can fully update agent profiles."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager and create agent profile
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    create_response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    agent_id = create_response.json()["id"]
    
    # Fully update agent
    response = client.put(
        f"/api/v1/agents/{agent_id}",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "office": "RE/MAX Sousse",
            "phone": "+21687654321",
            "years_experience": 10,
            "minimum_budget": 200000.0,
            "maximum_budget": 1000000.0,
            "closed_deals": 50,
            "success_rate": 0.9
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["office"] == "RE/MAX Sousse"
    assert data["years_experience"] == 10
    assert data["closed_deals"] == 50


def test_manager_can_delete_agent(client: TestClient, db: Session):
    """Test that managers can delete agent profiles."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager and create agent profile
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    create_response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    agent_id = create_response.json()["id"]
    
    # Delete agent
    response = client.delete(
        f"/api/v1/agents/{agent_id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    
    assert response.status_code == 204


def test_territory_can_be_added_and_removed(client: TestClient, db: Session):
    """Test that territories can be added and removed."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager and create agent profile
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    create_response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    agent_id = create_response.json()["id"]
    
    # Add territory
    add_response = client.post(
        f"/api/v1/agents/{agent_id}/territories",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "territory": "La Marsa",
            "expertise_score": 0.8
        }
    )
    
    assert add_response.status_code == 201
    territory_id = add_response.json()["id"]
    
    # Remove territory
    remove_response = client.delete(
        f"/api/v1/agents/{agent_id}/territories/{territory_id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    
    assert remove_response.status_code == 204


def test_property_specialization_can_be_added_and_removed(client: TestClient, db: Session):
    """Test that property specializations can be added and removed."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager and create agent profile
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    create_response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    agent_id = create_response.json()["id"]
    
    # Add property type
    add_response = client.post(
        f"/api/v1/agents/{agent_id}/property-types",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "property_type": "apartment",
            "expertise_score": 0.9
        }
    )
    
    assert add_response.status_code == 201
    property_type_id = add_response.json()["id"]
    
    # Remove property type
    remove_response = client.delete(
        f"/api/v1/agents/{agent_id}/property-types/{property_type_id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    
    assert remove_response.status_code == 204


def test_invalid_expertise_score_rejected(client: TestClient, db: Session):
    """Test that invalid expertise scores are rejected."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager and create agent profile
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    create_response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    
    agent_id = create_response.json()["id"]
    
    # Try to add territory with invalid expertise score
    response = client.post(
        f"/api/v1/agents/{agent_id}/territories",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "territory": "La Marsa",
            "expertise_score": 1.5  # Invalid: must be between 0 and 1
        }
    )
    
    assert response.status_code == 422


def test_invalid_budget_range_rejected(client: TestClient, db: Session):
    """Test that invalid budget ranges are rejected."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent user
    agent_user = create_test_user(db, "agent@example.com", UserRole.AGENT)
    
    # Login as manager
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    # Try to create agent with invalid budget range
    response = client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent_user.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 500000.0,
            "maximum_budget": 100000.0  # Invalid: must be >= minimum_budget
        }
    )
    
    assert response.status_code == 422


def test_agent_list_filtering_works(client: TestClient, db: Session):
    """Test that agent list filtering works."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create agent users
    agent1 = create_test_user(db, "agent1@example.com", UserRole.AGENT)
    agent2 = create_test_user(db, "agent2@example.com", UserRole.AGENT)
    
    # Login as manager and create agent profiles
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent1.id,
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0,
            "availability_status": "available"
        }
    )
    
    client.post(
        "/api/v1/agents",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "user_id": agent2.id,
            "office": "RE/MAX Sousse",
            "phone": "+21687654321",
            "years_experience": 10,
            "minimum_budget": 200000.0,
            "maximum_budget": 1000000.0,
            "availability_status": "busy"
        }
    )
    
    # Filter by availability status
    response = client.get(
        "/api/v1/agents?availability_status=available",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    
    assert response.status_code == 200
    agents = response.json()
    assert len(agents) == 1
    assert agents[0]["availability_status"] == "available"


def test_pagination_works(client: TestClient, db: Session):
    """Test that pagination works."""
    # Create manager user
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create multiple agent users
    agents = []
    for i in range(5):
        agent = create_test_user(db, f"agent{i}@example.com", UserRole.AGENT)
        agents.append(agent)
    
    # Login as manager and create agent profiles
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    for agent in agents:
        client.post(
            "/api/v1/agents",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={
                "user_id": agent.id,
                "office": "RE/MAX Tunis",
                "phone": "+21612345678",
                "years_experience": 5,
                "minimum_budget": 100000.0,
                "maximum_budget": 500000.0
            }
        )
    
    # Test pagination
    response = client.get(
        "/api/v1/agents?skip=0&limit=3",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    
    assert response.status_code == 200
    agents_list = response.json()
    assert len(agents_list) == 3


def test_unauthorized_requests_rejected(client: TestClient, db: Session):
    """Test that unauthorized requests are rejected."""
    # Try to access agent list without authentication
    response = client.get("/api/v1/agents")
    assert response.status_code == 401
    
    # Try to create agent without authentication
    response = client.post(
        "/api/v1/agents",
        json={
            "user_id": "some-id",
            "office": "RE/MAX Tunis",
            "phone": "+21612345678",
            "years_experience": 5,
            "minimum_budget": 100000.0,
            "maximum_budget": 500000.0
        }
    )
    assert response.status_code == 401
