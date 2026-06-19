from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.services.user_service import UserService
from app.services.agent_service import AgentService
from app.schemas.agent import AgentCreate
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


def create_test_agent(db: Session, email: str) -> tuple[User, dict]:
    """Helper function to create a test user with agent profile."""
    user = create_test_user(db, email, UserRole.AGENT)
    agent_data = AgentCreate(
        user_id=user.id,
        office="RE/MAX Tunis",
        phone="+21612345678",
        years_experience=5,
        minimum_budget=100000.0,
        maximum_budget=500000.0
    )
    agent = AgentService.create_agent(db, agent_data)
    return user, agent


def get_auth_token(client: TestClient, email: str, password: str) -> str:
    """Helper function to get authentication token."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    return response.json()["access_token"]


def test_public_can_list_available_properties(client: TestClient, db: Session):
    """Test that public users can list available properties."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create an available property
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Modern Apartment",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    # Public can list without auth
    response = client.get("/api/v1/properties")
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 1
    assert properties[0]["status"] == "available"


def test_public_can_view_available_property(client: TestClient, db: Session):
    """Test that public users can view an available property."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create an available property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Modern Apartment",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Public can view without auth
    response = client.get(f"/api/v1/properties/{property_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "available"


def test_draft_properties_hidden_publicly(client: TestClient, db: Session):
    """Test that draft properties are hidden from public."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create a draft property
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Draft Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "draft",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    # Public list should be empty
    response = client.get("/api/v1/properties")
    assert response.status_code == 200
    assert len(response.json()) == 0


def test_archived_properties_hidden_publicly(client: TestClient, db: Session):
    """Test that archived properties are hidden from public."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create and archive a property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Archived Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]
    client.delete(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    # Public list should be empty
    response = client.get("/api/v1/properties")
    assert response.status_code == 200
    assert len(response.json()) == 0


def test_sold_properties_hidden_publicly(client: TestClient, db: Session):
    """Test that sold properties are hidden from public."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create a sold property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Sold Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "sold",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Public should get 404
    response = client.get(f"/api/v1/properties/{property_id}")
    assert response.status_code == 404


def test_unknown_property_returns_404(client: TestClient, db: Session):
    """Test that unknown property returns 404."""
    response = client.get("/api/v1/properties/nonexistent-id")
    assert response.status_code == 404


def test_agent_can_create_property_for_themselves(client: TestClient, db: Session):
    """Test that agents can create properties for themselves."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    assert response.status_code == 201
    assert response.json()["agent_id"] == _agent.id


def test_client_cannot_create_property(client: TestClient, db: Session):
    """Test that clients cannot create properties."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    assert response.status_code == 403


def test_agent_cannot_create_for_another_agent(client: TestClient, db: Session):
    """Test that agents cannot create properties for other agents."""
    agent_user1, _agent1 = create_test_agent(db, "agent1@example.com")
    agent_user2, _agent2 = create_test_agent(db, "agent2@example.com")

    agent_token = get_auth_token(client, "agent1@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "agent_id": _agent2.id,
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    assert response.status_code == 403


def test_manager_can_create_for_any_agent(client: TestClient, db: Session):
    """Test that managers can create properties for any agent."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Manager Created Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    assert response.status_code == 201
    assert response.json()["agent_id"] == _agent.id


def test_invalid_agent_id_rejected(client: TestClient, db: Session):
    """Test that invalid agent ID is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": "nonexistent-agent-id",
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    assert response.status_code == 404


def test_zero_or_negative_price_rejected(client: TestClient, db: Session):
    """Test that zero or negative price is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 0.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    assert response.status_code == 422


def test_zero_or_negative_area_rejected(client: TestClient, db: Session):
    """Test that zero or negative area is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 0.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    assert response.status_code == 422


def test_invalid_latitude_rejected(client: TestClient, db: Session):
    """Test that invalid latitude is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
            "latitude": 91.0,
            "longitude": 10.0
        }
    )

    assert response.status_code == 422


def test_invalid_longitude_rejected(client: TestClient, db: Session):
    """Test that invalid longitude is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
            "latitude": 36.0,
            "longitude": 181.0
        }
    )

    assert response.status_code == 422


def test_only_one_coordinate_rejected(client: TestClient, db: Session):
    """Test that providing only one coordinate is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
            "latitude": 36.0
        }
    )

    assert response.status_code == 422


def test_bedrooms_greater_than_rooms_rejected(client: TestClient, db: Session):
    """Test that bedrooms greater than rooms is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 2,
            "bedrooms": 3,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    assert response.status_code == 422


def test_floor_greater_than_total_floors_rejected(client: TestClient, db: Session):
    """Test that floor number greater than total floors is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "floor_number": 5,
            "total_floors": 3,
            "city": "Tunis"
        }
    )

    assert response.status_code == 422


def test_future_construction_year_rejected(client: TestClient, db: Session):
    """Test that future construction year is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "construction_year": 2030,
            "city": "Tunis"
        }
    )

    assert response.status_code == 422


def test_invalid_property_type_rejected(client: TestClient, db: Session):
    """Test that invalid property type is rejected."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Test Property",
            "property_type": "invalid_type",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    assert response.status_code == 422


def test_agent_can_update_own_property(client: TestClient, db: Session):
    """Test that agents can update their own properties."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Update property
    response = client.patch(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "Updated Property",
            "price": 300000.0
        }
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated Property"


def test_agent_cannot_update_another_agent_property(client: TestClient, db: Session):
    """Test that agents cannot update another agent's property."""
    agent_user1, _agent1 = create_test_agent(db, "agent1@example.com")
    agent_user2, _agent2 = create_test_agent(db, "agent2@example.com")

    agent_token1 = get_auth_token(client, "agent1@example.com", "SecurePass123")
    agent_token2 = get_auth_token(client, "agent2@example.com", "SecurePass123")

    # Create property as agent1
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token1}"},
        json={
            "title": "Agent1 Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Try to update as agent2
    response = client.patch(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {agent_token2}"},
        json={
            "title": "Hacked Property"
        }
    )

    assert response.status_code == 403


def test_agent_cannot_change_agent_id(client: TestClient, db: Session):
    """Test that agents cannot change agent_id."""
    agent_user1, _agent1 = create_test_agent(db, "agent1@example.com")
    agent_user2, _agent2 = create_test_agent(db, "agent2@example.com")

    agent_token1 = get_auth_token(client, "agent1@example.com", "SecurePass123")

    # Create property as agent1
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token1}"},
        json={
            "title": "Agent1 Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Try to change agent_id
    response = client.patch(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {agent_token1}"},
        json={
            "agent_id": _agent2.id
        }
    )

    assert response.status_code == 200
    # agent_id should not have changed
    assert response.json()["agent_id"] == _agent1.id


def test_agent_cannot_set_is_featured(client: TestClient, db: Session):
    """Test that agents cannot set is_featured."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Try to set is_featured
    response = client.patch(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "is_featured": True
        }
    )

    assert response.status_code == 200
    assert response.json()["is_featured"] is False


def test_manager_can_update_any_property(client: TestClient, db: Session):
    """Test that managers can update any property."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create property as agent
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "Agent Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Update as manager
    response = client.patch(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "title": "Manager Updated",
            "is_featured": True
        }
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Manager Updated"
    assert response.json()["is_featured"] is True


def test_manager_can_reassign_property(client: TestClient, db: Session):
    """Test that managers can reassign properties."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user1, _agent1 = create_test_agent(db, "agent1@example.com")
    agent_user2, _agent2 = create_test_agent(db, "agent2@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create property for agent1
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent1.id,
            "title": "Agent1 Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Reassign to agent2
    response = client.patch(
        f"/api/v1/properties/{property_id}/assign-agent",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent2.id
        }
    )

    assert response.status_code == 200
    assert response.json()["agent_id"] == _agent2.id


def test_partial_updates_preserve_fields(client: TestClient, db: Session):
    """Test that partial updates preserve unspecified fields."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]
    original_price = create_response.json()["price"]

    # Update only title
    response = client.patch(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "Updated Title"
        }
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"
    assert response.json()["price"] == original_price


def test_agent_can_change_draft_to_available(client: TestClient, db: Session):
    """Test that agents can change draft to available."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create draft property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "draft",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Change to available
    response = client.patch(
        f"/api/v1/properties/{property_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "status": "available"
        }
    )

    assert response.status_code == 200
    assert response.json()["status"] == "available"
    assert response.json()["published_at"] is not None


def test_agent_cannot_mark_property_sold(client: TestClient, db: Session):
    """Test that agents cannot mark property as sold."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create available property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Try to mark as sold
    response = client.patch(
        f"/api/v1/properties/{property_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "status": "sold"
        }
    )

    assert response.status_code == 403


def test_manager_can_mark_property_sold(client: TestClient, db: Session):
    """Test that managers can mark property as sold."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create available property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Mark as sold
    response = client.patch(
        f"/api/v1/properties/{property_id}/status",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "status": "sold"
        }
    )

    assert response.status_code == 200
    assert response.json()["status"] == "sold"


def test_invalid_status_transition_rejected(client: TestClient, db: Session):
    """Test that invalid status transition is rejected."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create sold property (manager only, but testing transition logic)
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "sold",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Agent tries to change from sold to available (invalid)
    response = client.patch(
        f"/api/v1/properties/{property_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "status": "available"
        }
    )

    assert response.status_code == 400


def test_delete_archives_property(client: TestClient, db: Session):
    """Test that DELETE archives instead of physically deleting."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Delete property
    response = client.delete(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    assert response.status_code == 204

    # Property should still exist but be archived
    get_response = client.get("/api/v1/properties/me/listings", headers={"Authorization": f"Bearer {agent_token}"})
    assert get_response.status_code == 200
    assert get_response.json()[0]["status"] == "archived"


def test_owner_agent_can_add_image(client: TestClient, db: Session):
    """Test that owner agent can add an image."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Add image
    response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "image_url": "https://example.com/image.jpg",
            "alt_text": "Property image",
            "position": 0
        }
    )

    assert response.status_code == 201
    assert response.json()["image_url"] == "https://example.com/image.jpg"


def test_another_agent_cannot_add_image(client: TestClient, db: Session):
    """Test that another agent cannot add an image."""
    agent_user1, _agent1 = create_test_agent(db, "agent1@example.com")
    agent_user2, _agent2 = create_test_agent(db, "agent2@example.com")

    agent_token1 = get_auth_token(client, "agent1@example.com", "SecurePass123")
    agent_token2 = get_auth_token(client, "agent2@example.com", "SecurePass123")

    # Create property as agent1
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token1}"},
        json={
            "title": "Agent1 Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Try to add image as agent2
    response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers={"Authorization": f"Bearer {agent_token2}"},
        json={
            "image_url": "https://example.com/image.jpg",
            "alt_text": "Property image",
            "position": 0
        }
    )

    assert response.status_code == 403


def test_manager_can_add_image(client: TestClient, db: Session):
    """Test that manager can add an image."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create property as agent
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "Agent Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Add image as manager
    response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "image_url": "https://example.com/image.jpg",
            "alt_text": "Property image",
            "position": 0
        }
    )

    assert response.status_code == 201


def test_invalid_image_url_rejected(client: TestClient, db: Session):
    """Test that invalid image URL is rejected."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Try to add invalid URL
    response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "image_url": "invalid-url",
            "alt_text": "Property image",
            "position": 0
        }
    )

    assert response.status_code == 422


def test_first_image_becomes_primary(client: TestClient, db: Session):
    """Test that first image becomes primary."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Add first image without setting primary
    response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "image_url": "https://example.com/image1.jpg",
            "alt_text": "Property image",
            "position": 0,
            "is_primary": False
        }
    )

    assert response.status_code == 201
    assert response.json()["is_primary"] is True


def test_setting_new_primary_clears_old(client: TestClient, db: Session):
    """Test that setting a new primary image clears the old primary."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Add first image
    image1_response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "image_url": "https://example.com/image1.jpg",
            "alt_text": "Property image 1",
            "position": 0
        }
    )

    image1_id = image1_response.json()["id"]

    # Add second image as primary
    image2_response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "image_url": "https://example.com/image2.jpg",
            "alt_text": "Property image 2",
            "position": 1,
            "is_primary": True
        }
    )

    assert image2_response.json()["is_primary"] is True

    # Check first image is no longer primary
    property_response = client.get("/api/v1/properties/me/listings", headers={"Authorization": f"Bearer {agent_token}"})
    images = property_response.json()[0]["images"]
    image1 = next(img for img in images if img["id"] == image1_id)
    assert image1["is_primary"] is False


def test_deleting_primary_promotes_another(client: TestClient, db: Session):
    """Test that deleting primary image promotes another image."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Add two images
    image1_response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "image_url": "https://example.com/image1.jpg",
            "alt_text": "Property image 1",
            "position": 0
        }
    )

    image1_id = image1_response.json()["id"]

    _image2_response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "image_url": "https://example.com/image2.jpg",
            "alt_text": "Property image 2",
            "position": 1
        }
    )

    # Delete primary image
    client.delete(
        f"/api/v1/properties/{property_id}/images/{image1_id}",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    # Check second image is now primary
    property_response = client.get("/api/v1/properties/me/listings", headers={"Authorization": f"Bearer {agent_token}"})
    images = property_response.json()[0]["images"]
    assert len(images) == 1
    assert images[0]["is_primary"] is True


def test_image_cannot_be_deleted_through_wrong_property(client: TestClient, db: Session):
    """Test that image cannot be deleted through another property's URL."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create two properties
    prop1_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "Property 1",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    prop2_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "Property 2",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    prop1_id = prop1_response.json()["id"]
    prop2_id = prop2_response.json()["id"]

    # Add image to property 1
    image_response = client.post(
        f"/api/v1/properties/{prop1_id}/images",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "image_url": "https://example.com/image.jpg",
            "alt_text": "Property image",
            "position": 0
        }
    )

    image_id = image_response.json()["id"]

    # Try to delete through property 2's URL
    response = client.delete(
        f"/api/v1/properties/{prop2_id}/images/{image_id}",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    assert response.status_code == 404


def test_owner_agent_can_add_feature(client: TestClient, db: Session):
    """Test that owner agent can add a feature."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Add feature
    response = client.post(
        f"/api/v1/properties/{property_id}/features",
        headers={"Authorization": f"Bearer {agent_token}"},
        json="parking"
    )

    assert response.status_code == 201


def test_manager_can_add_feature(client: TestClient, db: Session):
    """Test that manager can add a feature."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create property as agent
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "Agent Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Add feature as manager
    response = client.post(
        f"/api/v1/properties/{property_id}/features",
        headers={"Authorization": f"Bearer {manager_token}"},
        json="elevator"
    )

    assert response.status_code == 201


def test_duplicate_feature_rejected(client: TestClient, db: Session):
    """Test that duplicate feature is rejected."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Add feature
    client.post(
        f"/api/v1/properties/{property_id}/features",
        headers={"Authorization": f"Bearer {agent_token}"},
        json="parking"
    )

    # Try to add same feature again
    response = client.post(
        f"/api/v1/properties/{property_id}/features",
        headers={"Authorization": f"Bearer {agent_token}"},
        json="parking"
    )

    assert response.status_code == 400


def test_feature_can_be_removed(client: TestClient, db: Session):
    """Test that feature can be removed."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "My Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    property_id = create_response.json()["id"]

    # Add feature
    feature_response = client.post(
        f"/api/v1/properties/{property_id}/features",
        headers={"Authorization": f"Bearer {agent_token}"},
        json="parking"
    )

    feature_id = feature_response.json()["features"][0]["id"]

    # Remove feature
    response = client.delete(
        f"/api/v1/properties/{property_id}/features/{feature_id}",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    assert response.status_code == 204


def test_feature_cannot_be_removed_through_wrong_property(client: TestClient, db: Session):
    """Test that feature cannot be removed through another property's URL."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create two properties
    prop1_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "Property 1",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    prop2_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "title": "Property 2",
            "property_type": "apartment",
            "listing_type": "sale",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    prop1_id = prop1_response.json()["id"]
    prop2_id = prop2_response.json()["id"]

    # Add feature to property 1
    feature_response = client.post(
        f"/api/v1/properties/{prop1_id}/features",
        headers={"Authorization": f"Bearer {agent_token}"},
        json="parking"
    )

    feature_id = feature_response.json()["features"][0]["id"]

    # Try to remove through property 2's URL
    response = client.delete(
        f"/api/v1/properties/{prop2_id}/features/{feature_id}",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    assert response.status_code == 404


def test_property_type_filtering_works(client: TestClient, db: Session):
    """Test that property-type filtering works."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create apartment
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Apartment",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    # Create villa
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Villa",
            "property_type": "villa",
            "listing_type": "sale",
            "status": "available",
            "price": 500000.0,
            "area_sqm": 300.0,
            "rooms": 5,
            "bedrooms": 4,
            "bathrooms": 3,
            "city": "Tunis"
        }
    )

    # Filter by apartment
    response = client.get("/api/v1/properties?property_type=apartment")
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 1
    assert properties[0]["property_type"] == "apartment"


def test_listing_type_filtering_works(client: TestClient, db: Session):
    """Test that listing-type filtering works."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create sale property
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "For Sale",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    # Create rent property
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "For Rent",
            "property_type": "apartment",
            "listing_type": "rent",
            "status": "available",
            "price": 1500.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    # Filter by sale
    response = client.get("/api/v1/properties?listing_type=sale")
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 1
    assert properties[0]["listing_type"] == "sale"


def test_price_filtering_works(client: TestClient, db: Session):
    """Test that price filtering works."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create cheap property
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Cheap",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 150000.0,
            "area_sqm": 80.0,
            "rooms": 2,
            "bedrooms": 1,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    # Create expensive property
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Expensive",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 500000.0,
            "area_sqm": 200.0,
            "rooms": 4,
            "bedrooms": 3,
            "bathrooms": 2,
            "city": "Tunis"
        }
    )

    # Filter by minimum price
    response = client.get("/api/v1/properties?minimum_price=200000")
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 1
    assert properties[0]["price"] >= 200000


def test_city_district_filtering_works(client: TestClient, db: Session):
    """Test that city and district filtering work."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create property in Tunis
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Tunis Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
            "district": "La Marsa"
        }
    )

    # Create property in Sousse
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Sousse Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Sousse"
        }
    )

    # Filter by city
    response = client.get("/api/v1/properties?city=Tunis")
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 1
    assert properties[0]["city"] == "Tunis"


def test_feature_filtering_works(client: TestClient, db: Session):
    """Test that feature filtering works."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create property with parking
    prop1_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "With Parking",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    prop1_id = prop1_response.json()["id"]
    client.post(
        f"/api/v1/properties/{prop1_id}/features",
        headers={"Authorization": f"Bearer {manager_token}"},
        json="parking"
    )

    # Create property without parking
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "No Parking",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 200000.0,
            "area_sqm": 100.0,
            "rooms": 2,
            "bedrooms": 1,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    # Filter by feature
    response = client.get("/api/v1/properties?feature=parking")
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 1
    assert properties[0]["title"] == "With Parking"


def test_furnished_filtering_works(client: TestClient, db: Session):
    """Test that furnished filtering works."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create furnished property
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Furnished",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
            "is_furnished": True
        }
    )

    # Create unfurnished property
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Unfurnished",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 200000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
            "is_furnished": False
        }
    )

    # Filter by furnished
    response = client.get("/api/v1/properties?is_furnished=true")
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 1
    assert properties[0]["is_furnished"] is True


def test_map_bounding_box_filtering_works(client: TestClient, db: Session):
    """Test that map bounding-box filtering works."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create property in Tunis (approx 36.8, 10.2)
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Tunis Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
            "latitude": 36.8,
            "longitude": 10.2
        }
    )

    # Create property in Sfax (approx 34.7, 10.8)
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Sfax Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Sfax",
            "latitude": 34.7,
            "longitude": 10.8
        }
    )

    # Filter by bounding box around Tunis
    response = client.get("/api/v1/properties?minimum_latitude=36.0&maximum_latitude=37.0&minimum_longitude=10.0&maximum_longitude=11.0")
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 1
    assert properties[0]["city"] == "Tunis"


def test_pagination_works(client: TestClient, db: Session):
    """Test that pagination works."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create 5 properties
    for i in range(5):
        client.post(
            "/api/v1/properties",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={
                "agent_id": _agent.id,
                "title": f"Property {i}",
                "property_type": "apartment",
                "listing_type": "sale",
                "status": "available",
                "price": 250000.0,
                "area_sqm": 120.0,
                "rooms": 3,
                "bedrooms": 2,
                "bathrooms": 1,
                "city": "Tunis"
            }
        )

    # Test pagination
    response = client.get("/api/v1/properties?skip=0&limit=3")
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 3


def test_sorting_works(client: TestClient, db: Session):
    """Test that sorting works."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create properties with different prices
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Cheap",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 150000.0,
            "area_sqm": 80.0,
            "rooms": 2,
            "bedrooms": 1,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Expensive",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 500000.0,
            "area_sqm": 200.0,
            "rooms": 4,
            "bedrooms": 3,
            "bathrooms": 2,
            "city": "Tunis"
        }
    )

    # Sort by price ascending
    response = client.get("/api/v1/properties?sort_by=price&sort_direction=asc")
    assert response.status_code == 200
    properties = response.json()
    assert properties[0]["price"] < properties[1]["price"]


def test_manager_all_properties_includes_non_public(client: TestClient, db: Session):
    """Test that manager all-properties endpoint includes non-public statuses."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create draft property
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Draft Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "draft",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis"
        }
    )

    # Manager can see draft properties
    response = client.get("/api/v1/properties/admin/all", headers={"Authorization": f"Bearer {manager_token}"})
    assert response.status_code == 200
    properties = response.json()
    assert len(properties) == 1
    assert properties[0]["status"] == "draft"
