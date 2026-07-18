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
    data = response.json()
    properties = data["properties"]
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
    assert len(response.json()["properties"]) == 0


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
    assert len(response.json()["properties"]) == 0


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
    properties = response.json()["properties"]
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
    properties = response.json()["properties"]
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
    properties = response.json()["properties"]
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
    properties = response.json()["properties"]
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
    properties = response.json()["properties"]
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
    properties = response.json()["properties"]
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
    properties = response.json()["properties"]
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
    properties = response.json()["properties"]
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
    properties = response.json()["properties"]
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


def test_public_list_empty_database(client: TestClient, db: Session):
    """Regression test: GET /api/v1/properties must return 200 with empty list."""
    response = client.get("/api/v1/properties")
    assert response.status_code == 200
    data = response.json()
    assert "properties" in data
    assert isinstance(data["properties"], list)
    assert len(data["properties"]) == 0
    assert data["total"] == 0


def test_public_list_returns_200_and_includes_available_and_reserved(
    client: TestClient, db: Session
):
    """Regression test: public properties list includes available/reserved and excludes hidden."""
    _manager = create_test_user(db, "manager2@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent2@example.com")

    manager_token = get_auth_token(client, "manager2@example.com", "SecurePass123")

    statuses = ["available", "reserved", "sold", "rented", "draft", "archived"]
    expected_public = {"available", "reserved"}

    for i, status in enumerate(statuses):
        client.post(
            "/api/v1/properties",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={
                "agent_id": _agent.id,
                "title": f"Property {status}",
                "property_type": "house",
                "listing_type": "sale",
                "status": status,
                "price": 250000.0,
                "area_sqm": 120.0,
                "rooms": 3,
                "bedrooms": 2,
                "bathrooms": 1,
                "city": "Tunis",
            },
        )

    response = client.get("/api/v1/properties")
    assert response.status_code == 200
    data = response.json()
    assert "properties" in data
    assert "total" in data
    assert "skip" in data
    assert "limit" in data
    properties = data["properties"]
    assert isinstance(properties, list)
    assert len(properties) == 2
    assert data["total"] == 2
    returned_statuses = {p["status"] for p in properties}
    assert returned_statuses == expected_public
    # Verify the response shape expected by the frontend
    for prop in properties:
        assert "id" in prop
        assert "title" in prop
        assert "price" in prop
        assert "property_type" in prop
        assert "status" in prop
        assert "is_featured" in prop
        assert prop["property_type"] == "house"


def test_public_list_excludes_archived_property(client: TestClient, db: Session):
    """Archived properties must be excluded from public list."""
    _manager = create_test_user(db, "manager3@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent3@example.com")

    manager_token = get_auth_token(client, "manager3@example.com", "SecurePass123")

    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "To Archive",
            "property_type": "villa",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
        },
    )
    property_id = create_response.json()["id"]

    client.delete(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {manager_token}"},
    )

    response = client.get("/api/v1/properties")
    assert response.status_code == 200
    assert all(p["id"] != property_id for p in response.json()["properties"])


def test_public_list_house_property_type_serializes(client: TestClient, db: Session):
    """Regression test: 'house' property type must not cause 500 in public list."""
    _manager = create_test_user(db, "manager4@example.com", UserRole.MANAGER)
    agent_user, _agent = create_test_agent(db, "agent4@example.com")

    manager_token = get_auth_token(client, "manager4@example.com", "SecurePass123")

    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Cozy House",
            "property_type": "house",
            "listing_type": "sale",
            "status": "available",
            "price": 250000.0,
            "area_sqm": 120.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
        },
    )

    response = client.get("/api/v1/properties")
    assert response.status_code == 200
    properties = response.json()["properties"]
    assert len(properties) == 1
    assert properties[0]["property_type"] == "house"


def test_map_endpoint_returns_only_public_with_coordinates(client: TestClient, db: Session):
    """Test that the map endpoint returns only public properties with coordinates."""
    _manager = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    _agent_user, _agent = create_test_agent(db, "agent@example.com")

    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create an available property with coordinates
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
            "city": "Tunis",
            "latitude": 36.8065,
            "longitude": 10.1815,
        },
    )

    # Create a draft property without coordinates
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Draft Villa",
            "property_type": "villa",
            "listing_type": "sale",
            "status": "draft",
            "price": 500000.0,
            "area_sqm": 300.0,
            "rooms": 5,
            "bedrooms": 4,
            "bathrooms": 3,
            "city": "Sidi Bou Said",
        },
    )

    # Create a sold property with coordinates (should not be public)
    client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Sold House",
            "property_type": "house",
            "listing_type": "sale",
            "status": "sold",
            "price": 150000.0,
            "area_sqm": 100.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Ariana",
            "latitude": 36.85,
            "longitude": 10.18,
        },
    )

    response = client.get("/api/v1/properties/map")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Modern Apartment"
    assert data[0]["latitude"] == 36.8065
    assert data[0]["longitude"] == 10.1815
    assert "address_line" in data[0]
    assert "city" in data[0]
    assert "district" in data[0]
    assert "governorate" in data[0]
    assert "property_type" in data[0]
    assert "listing_type" in data[0]
    assert "price" in data[0]
    assert "currency" in data[0]
    assert "bedrooms" in data[0]
    assert "bathrooms" in data[0]
    assert "area_sqm" in data[0]


def test_list_and_detail_coordinate_parity(client: TestClient, db: Session):
    """Test that list and detail endpoints return the same coordinates for the same property."""
    # Create manager and agent
    manager_user = create_test_user(db, "coord_parity_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "coord_parity_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "coord_parity_agent@test.com")
    
    # Create a property with specific coordinates
    test_latitude = 36.8521
    test_longitude = 10.1935
    
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Coordinate Parity Test Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 200000.0,
            "area_sqm": 120.0,
            "rooms": 4,
            "bedrooms": 2,
            "bathrooms": 2,
            "city": "Tunis",
            "latitude": test_latitude,
            "longitude": test_longitude,
        },
    )
    assert create_response.status_code == 201
    property_id = create_response.json()["id"]
    
    # Fetch via list endpoint
    list_response = client.get("/api/v1/properties")
    assert list_response.status_code == 200
    list_data = list_response.json()
    
    # Find our property in the list
    list_property = next((p for p in list_data["properties"] if p["id"] == property_id), None)
    assert list_property is not None, "Property not found in list response"
    
    # Fetch via detail endpoint
    detail_response = client.get(f"/api/v1/properties/{property_id}")
    assert detail_response.status_code == 200
    detail_property = detail_response.json()
    
    # Verify coordinate parity
    assert list_property["latitude"] == detail_property["latitude"], \
        f"List latitude {list_property['latitude']} != Detail latitude {detail_property['latitude']}"
    assert list_property["longitude"] == detail_property["longitude"], \
        f"List longitude {list_property['longitude']} != Detail longitude {detail_property['longitude']}"
    
    # Verify they match the original values
    assert list_property["latitude"] == test_latitude
    assert list_property["longitude"] == test_longitude
    assert detail_property["latitude"] == test_latitude
    assert detail_property["longitude"] == test_longitude


def test_map_endpoint_returns_all_filtered_properties(client: TestClient, db: Session):
    """Test that /properties/map returns all matching properties, not just one page."""
    # Create manager and agent
    manager_user = create_test_user(db, "map_endpoint_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "map_endpoint_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "map_endpoint_agent@test.com")
    
    # Create 25 properties (more than one page of 20)
    property_ids = []
    for i in range(25):
        create_response = client.post(
            "/api/v1/properties",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={
                "agent_id": _agent.id,
                "title": f"Map Test Property {i}",
                "property_type": "apartment",
                "listing_type": "sale",
                "status": "available",
                "price": 100000 + (i * 10000),
                "area_sqm": 100.0,
                "rooms": 3,
                "bedrooms": 2,
                "bathrooms": 1,
                "city": "Tunis",
                "latitude": 36.8 + (i * 0.001),
                "longitude": 10.1 + (i * 0.001),
            },
        )
        assert create_response.status_code == 201
        property_ids.append(create_response.json()["id"])
    
    # Fetch map endpoint
    map_response = client.get("/api/v1/properties/map")
    assert map_response.status_code == 200
    map_data = map_response.json()
    
    # Should return all 25 properties, not just first page of 20
    assert len(map_data) == 25, f"Expected 25 properties, got {len(map_data)}"
    
    # Verify all property IDs are present
    map_ids = {p["id"] for p in map_data}
    for prop_id in property_ids:
        assert prop_id in map_ids, f"Property ID {prop_id} not found in map response"
    
    # Verify pagination parameters don't affect map endpoint
    map_with_page = client.get("/api/v1/properties/map?page=2")
    assert map_with_page.status_code == 200
    map_with_page_data = map_with_page.json()
    assert len(map_with_page_data) == 25, "Pagination should not limit map endpoint"


def test_map_endpoint_applies_filters(client: TestClient, db: Session):
    """Test that /properties/map applies the same filters as list endpoint."""
    # Create manager and agent
    manager_user = create_test_user(db, "map_filter_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "map_filter_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "map_filter_agent@test.com")
    
    # Create properties with different cities
    cities = ["Tunis", "Sousse", "Sfax"]
    for city in cities:
        for i in range(5):
            client.post(
                "/api/v1/properties",
                headers={"Authorization": f"Bearer {manager_token}"},
                json={
                    "agent_id": _agent.id,
                    "title": f"Property in {city} {i}",
                    "property_type": "apartment",
                    "listing_type": "sale",
                    "status": "available",
                    "price": 150000,
                    "area_sqm": 100.0,
                    "rooms": 3,
                    "bedrooms": 2,
                    "bathrooms": 1,
                    "city": city,
                    "latitude": 36.8 if city == "Tunis" else (35.8 if city == "Sousse" else 34.7),
                    "longitude": 10.1 if city == "Tunis" else (10.6 if city == "Sousse" else 10.8),
                },
            )
    
    # Filter by city
    tunis_map = client.get("/api/v1/properties/map?city=Tunis")
    assert tunis_map.status_code == 200
    tunis_data = tunis_map.json()
    assert len(tunis_data) == 5
    for prop in tunis_data:
        assert prop["city"] == "Tunis"
    
    # Filter by price range
    price_filtered = client.get("/api/v1/properties/map?minimum_price=150000&maximum_price=150000")
    assert price_filtered.status_code == 200
    price_data = price_filtered.json()
    assert len(price_data) == 15  # All properties have price 150000
    for prop in price_data:
        assert float(prop["price"]) == 150000


def test_search_position_uses_same_filters_as_listing(client: TestClient, db: Session):
    """Test that search-position endpoint uses the same filters as property listing."""
    # Create manager and agent
    manager_user = create_test_user(db, "search_pos_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "search_pos_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "search_pos_agent@test.com")
    
    # Create properties with different characteristics
    property_ids = []
    for i in range(10):
        create_response = client.post(
            "/api/v1/properties",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={
                "agent_id": _agent.id,
                "title": f"Search Position Test {i}",
                "property_type": "apartment" if i % 2 == 0 else "house",
                "listing_type": "sale",
                "status": "available",
                "price": 100000 + (i * 50000),
                "area_sqm": 100.0,
                "rooms": 3,
                "bedrooms": 2,
                "bathrooms": 1,
                "city": "Tunis" if i < 5 else "Sousse",
                "latitude": 36.8 + (i * 0.001),
                "longitude": 10.1 + (i * 0.001),
            },
        )
        assert create_response.status_code == 201
        property_ids.append(create_response.json()["id"])
    
    # Test with city filter
    target_id = property_ids[0]  # First property (Tunis)
    position_response = client.get(f"/api/v1/properties/search-position?property_id={target_id}&city=Tunis")
    assert position_response.status_code == 200
    position_data = position_response.json()
    assert position_data["matched"] is True
    assert position_data["property_id"] == target_id
    
    # Test with property_type filter (index 0 is apartment since i % 2 == 0)
    target_id = property_ids[0]  # First property (apartment)
    position_response = client.get(f"/api/v1/properties/search-position?property_id={target_id}&property_type=apartment")
    assert position_response.status_code == 200
    position_data = position_response.json()
    assert position_data["matched"] is True
    
    # Test with price range filter
    target_id = property_ids[2]  # Third property (price 200000)
    position_response = client.get(f"/api/v1/properties/search-position?property_id={target_id}&minimum_price=150000&maximum_price=250000")
    assert position_response.status_code == 200
    position_data = position_response.json()
    assert position_data["matched"] is True


def test_search_position_uses_same_sorting_as_listing(client: TestClient, db: Session):
    """Test that search-position endpoint uses the same sorting as property listing."""
    # Create manager and agent
    manager_user = create_test_user(db, "search_sort_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "search_sort_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "search_sort_agent@test.com")
    
    # Create properties with same price but different IDs
    property_ids = []
    for i in range(5):
        create_response = client.post(
            "/api/v1/properties",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={
                "agent_id": _agent.id,
                "title": f"Sort Test {i}",
                "property_type": "apartment",
                "listing_type": "sale",
                "status": "available",
                "price": 150000,  # Same price for all
                "area_sqm": 100.0,
                "rooms": 3,
                "bedrooms": 2,
                "bathrooms": 1,
                "city": "Tunis",
                "latitude": 36.8 + (i * 0.001),
                "longitude": 10.1 + (i * 0.001),
            },
        )
        assert create_response.status_code == 201
        property_ids.append(create_response.json()["id"])
    
    # Test with price DESC sorting (should use ID as tie-breaker)
    target_id = property_ids[2]  # Middle property
    position_response = client.get(f"/api/v1/properties/search-position?property_id={target_id}&sort_by=price&sort_direction=desc")
    assert position_response.status_code == 200
    position_data = position_response.json()
    assert position_data["matched"] is True
    
    # Test with price ASC sorting
    position_response = client.get(f"/api/v1/properties/search-position?property_id={target_id}&sort_by=price&sort_direction=asc")
    assert position_response.status_code == 200
    position_data = position_response.json()
    assert position_data["matched"] is True


def test_search_position_stable_id_tiebreaker(client: TestClient, db: Session):
    """Test that ID is used as a stable tie-breaker for identical sort values."""
    # Create manager and agent
    manager_user = create_test_user(db, "tiebreak_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "tiebreak_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "tiebreak_agent@test.com")
    
    # Create properties with identical created_at and price
    property_ids = []
    for i in range(3):
        create_response = client.post(
            "/api/v1/properties",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={
                "agent_id": _agent.id,
                "title": f"Tiebreak Test {i}",
                "property_type": "apartment",
                "listing_type": "sale",
                "status": "available",
                "price": 150000,
                "area_sqm": 100.0,
                "rooms": 3,
                "bedrooms": 2,
                "bathrooms": 1,
                "city": "Tunis",
                "latitude": 36.8 + (i * 0.001),
                "longitude": 10.1 + (i * 0.001),
            },
        )
        assert create_response.status_code == 201
        property_ids.append(create_response.json()["id"])
    
    # Each property should have a deterministic position based on ID
    for i, prop_id in enumerate(property_ids):
        position_response = client.get(f"/api/v1/properties/search-position?property_id={prop_id}")
        assert position_response.status_code == 200
        position_data = position_response.json()
        assert position_data["matched"] is True
        # Position should be consistent (sorted by ID as tie-breaker)
        assert position_data["position"] >= 0


def test_search_position_respects_page_size(client: TestClient, db: Session):
    """Test that page calculation respects the page_size parameter."""
    # Create manager and agent
    manager_user = create_test_user(db, "pagesize_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "pagesize_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "pagesize_agent@test.com")
    
    # Create 25 properties
    property_ids = []
    for i in range(25):
        create_response = client.post(
            "/api/v1/properties",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={
                "agent_id": _agent.id,
                "title": f"Page Size Test {i}",
                "property_type": "apartment",
                "listing_type": "sale",
                "status": "available",
                "price": 100000 + (i * 10000),
                "area_sqm": 100.0,
                "rooms": 3,
                "bedrooms": 2,
                "bathrooms": 1,
                "city": "Tunis",
                "latitude": 36.8 + (i * 0.001),
                "longitude": 10.1 + (i * 0.001),
            },
        )
        assert create_response.status_code == 201
        property_ids.append(create_response.json()["id"])
    
    # Test with page_size=20 (default)
    # Use price sorting for predictable order (lowest price last with DESC)
    target_id = property_ids[0]  # First property (lowest price: 100000)
    position_response = client.get(f"/api/v1/properties/search-position?property_id={target_id}&page_size=20&sort_by=price&sort_direction=desc")
    assert position_response.status_code == 200
    position_data = position_response.json()
    assert position_data["matched"] is True
    # Verify page calculation is correct based on position
    expected_page = (position_data["position"] // 20) + 1
    assert position_data["page"] == expected_page
    
    # Test with page_size=10
    position_response = client.get(f"/api/v1/properties/search-position?property_id={target_id}&page_size=10&sort_by=price&sort_direction=desc")
    assert position_response.status_code == 200
    position_data = position_response.json()
    assert position_data["matched"] is True
    expected_page = (position_data["position"] // 10) + 1
    assert position_data["page"] == expected_page


def test_search_position_property_not_in_filters(client: TestClient, db: Session):
    """Test that property outside active filters returns matched: false."""
    # Create manager and agent
    manager_user = create_test_user(db, "not_in_filter_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "not_in_filter_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "not_in_filter_agent@test.com")
    
    # Create properties in different cities
    tunis_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "Tunis Property",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 150000,
            "area_sqm": 100.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
            "latitude": 36.8,
            "longitude": 10.1,
        },
    )
    assert tunis_response.status_code == 201
    tunis_id = tunis_response.json()["id"]
    
    # Search for Tunis property with Sousse filter
    position_response = client.get(f"/api/v1/properties/search-position?property_id={tunis_id}&city=Sousse")
    assert position_response.status_code == 200
    position_data = position_response.json()
    assert position_data["matched"] is False
    assert position_data["position"] == -1
    assert position_data["page"] == -1


def test_search_position_deleted_property(client: TestClient, db: Session):
    """Test that deleted/private property is handled correctly."""
    # Create manager and agent
    manager_user = create_test_user(db, "deleted_prop_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "deleted_prop_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "deleted_prop_agent@test.com")
    
    # Create a property
    create_response = client.post(
        "/api/v1/properties",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": _agent.id,
            "title": "To Be Deleted",
            "property_type": "apartment",
            "listing_type": "sale",
            "status": "available",
            "price": 150000,
            "area_sqm": 100.0,
            "rooms": 3,
            "bedrooms": 2,
            "bathrooms": 1,
            "city": "Tunis",
            "latitude": 36.8,
            "longitude": 10.1,
        },
    )
    assert create_response.status_code == 201
    property_id = create_response.json()["id"]
    
    # Archive the property (not publicly visible)
    update_response = client.patch(
        f"/api/v1/properties/{property_id}",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={"status": "archived"},
    )
    assert update_response.status_code == 200
    
    # Search for archived property
    position_response = client.get(f"/api/v1/properties/search-position?property_id={property_id}")
    assert position_response.status_code == 200
    position_data = position_response.json()
    assert position_data["matched"] is False  # Archived properties are not public


def test_search_position_returned_page_contains_property(client: TestClient, db: Session):
    """Test that the returned page actually contains the requested property."""
    # Create manager and agent
    manager_user = create_test_user(db, "page_verify_manager@test.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "page_verify_manager@test.com", "SecurePass123")
    
    _user, _agent = create_test_agent(db, "page_verify_agent@test.com")
    
    # Create 50 properties to span multiple pages
    property_ids = []
    for i in range(50):
        create_response = client.post(
            "/api/v1/properties",
            headers={"Authorization": f"Bearer {manager_token}"},
            json={
                "agent_id": _agent.id,
                "title": f"Page Verify Test {i}",
                "property_type": "apartment",
                "listing_type": "sale",
                "status": "available",
                "price": 100000 + (i * 1000),
                "area_sqm": 100.0,
                "rooms": 3,
                "bedrooms": 2,
                "bathrooms": 1,
                "city": "Tunis",
                "latitude": 36.8 + (i * 0.0001),
                "longitude": 10.1 + (i * 0.0001),
            },
        )
        assert create_response.status_code == 201
        property_ids.append(create_response.json()["id"])
    
    # Test multiple properties across different pages
    test_indices = [0, 15, 35, 49]  # First, middle, near end, last
    for idx in test_indices:
        target_id = property_ids[idx]
        
        # Get search position
        position_response = client.get(f"/api/v1/properties/search-position?property_id={target_id}&page_size=20&sort_by=price&sort_direction=asc")
        assert position_response.status_code == 200
        position_data = position_response.json()
        assert position_data["matched"] is True
        assert position_data["page"] > 0
        
        # Query the actual page
        page_skip = (position_data["page"] - 1) * 20
        list_response = client.get(f"/api/v1/properties?skip={page_skip}&limit=20&sort_by=price&sort_direction=asc")
        assert list_response.status_code == 200
        list_data = list_response.json()
        
        # Verify the property is in the returned page
        page_property_ids = [p["id"] for p in list_data["properties"]]
        assert target_id in page_property_ids, f"Property {target_id} not in page {position_data['page']}. Page IDs: {page_property_ids}"
