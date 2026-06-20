from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.property import PropertyStatus
from app.models.property_appointment import AppointmentStatus
from app.models.user import User
from app.services.agent_service import AgentService
from app.services.property_service import PropertyService
from app.services.user_service import UserService
from app.core.permissions import UserRole
from app.core.security import get_password_hash


def create_test_user(db: Session, email: str, role: UserRole) -> User:
    """Helper function to create a test user."""
    from app.schemas.user import UserCreate
    
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
    from app.schemas.agent import AgentCreate
    
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


def create_test_property(db: Session, agent_id: str, status: PropertyStatus = PropertyStatus.AVAILABLE) -> dict:
    """Helper function to create a test property."""
    from app.models.agent_property_type import PropertyType
    from app.models.property import ListingType
    from app.schemas.property import PropertyAgentCreate, PropertyManagerCreate
    from decimal import Decimal

    # Use PropertyManagerCreate for SOLD/RENTED status since agents can't create those
    if status in [PropertyStatus.SOLD, PropertyStatus.RENTED]:
        property_data = PropertyManagerCreate(
            title="Test Property",
            description="A test property",
            property_type=PropertyType.APARTMENT,
            listing_type=ListingType.SALE,
            price=Decimal("200000.0"),
            area_sqm=Decimal("150.0"),
            bedrooms=3,
            bathrooms=2,
            address_line="123 Test Street",
            city="Tunis",
            postal_code="1001",
            agent_id=agent_id,
            status=status,
        )
        return PropertyService.create_property_for_manager(db, property_data)
    else:
        property_data = PropertyAgentCreate(
            title="Test Property",
            description="A test property",
            property_type=PropertyType.APARTMENT,
            listing_type=ListingType.SALE,
            price=Decimal("200000.0"),
            area_sqm=Decimal("150.0"),
            bedrooms=3,
            bathrooms=2,
            address_line="123 Test Street",
            city="Tunis",
            postal_code="1001",
            status=status,
        )
        return PropertyService.create_property_for_agent(db, agent_id, property_data)


def get_auth_token(client: TestClient, email: str, password: str) -> str:
    """Helper function to get authentication token."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    return response.json()["access_token"]


def test_client_creates_valid_future_appointment(client: TestClient, db: Session):
    """Test that a client can create a valid future appointment."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
            "client_notes": "I'm interested in viewing this property"
        }
    )

    assert response.status_code == 201
    assert response.json()["client"]["id"] == _client_user.id
    assert response.json()["agent"]["id"] == agent.id
    assert response.json()["property"]["id"] == property_obj.id
    assert response.json()["status"] == AppointmentStatus.REQUESTED.value


def test_agent_cannot_create_appointment(client: TestClient, db: Session):
    """Test that agents cannot create appointments."""
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    
    property_obj = create_test_property(db, agent.id)

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 403


def test_manager_cannot_create_appointment(client: TestClient, db: Session):
    """Test that managers cannot create appointments."""
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")
    
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 403


def test_unknown_property_returns_404(client: TestClient, db: Session):
    """Test that unknown property returns 404."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": "nonexistent-property-id",
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 404


def test_unknown_agent_returns_404(client: TestClient, db: Session):
    """Test that unknown agent returns 404."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": "nonexistent-agent-id",
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 404


def test_inactive_agent_is_rejected(client: TestClient, db: Session):
    """Test that inactive agent is rejected."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    # Deactivate agent user
    agent_user.is_active = False
    db.commit()
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 400


def test_agent_must_own_property(client: TestClient, db: Session):
    """Test that agent must own the property."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user1, agent1 = create_test_agent(db, "agent1@example.com")
    _agent_user2, agent2 = create_test_agent(db, "agent2@example.com")
    property_obj = create_test_property(db, agent1.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent2.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 400


def test_sold_property_appointments_are_rejected(client: TestClient, db: Session):
    """Test that sold property appointments are rejected."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id, PropertyStatus.SOLD)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 400


def test_rented_property_appointments_are_rejected(client: TestClient, db: Session):
    """Test that rented property appointments are rejected."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id, PropertyStatus.RENTED)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 400


def test_archived_property_appointments_are_rejected(client: TestClient, db: Session):
    """Test that archived property appointments are rejected."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id, PropertyStatus.ARCHIVED)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 400


def test_past_appointment_returns_422(client: TestClient, db: Session):
    """Test that past appointment returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) - timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 422


def test_end_before_start_returns_422(client: TestClient, db: Session):
    """Test that end before start returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start - timedelta(hours=1)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 422


def test_duration_below_30_minutes_returns_422(client: TestClient, db: Session):
    """Test that duration below 30 minutes returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(minutes=20)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 422


def test_duration_above_4_hours_returns_422(client: TestClient, db: Session):
    """Test that duration above 4 hours returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=5)

    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 422


def test_client_conflict_returns_409(client: TestClient, db: Session):
    """Test that client conflict returns 409."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create first appointment
    client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    # Try to create overlapping appointment
    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": (scheduled_start + timedelta(minutes=30)).isoformat(),
            "scheduled_end": (scheduled_end + timedelta(minutes=30)).isoformat(),
        }
    )

    assert response.status_code == 409


def test_agent_conflict_returns_409(client: TestClient, db: Session):
    """Test that agent conflict returns 409."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create first appointment for client1
    client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    # Try to create overlapping appointment for client2
    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client2_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": (scheduled_start + timedelta(minutes=30)).isoformat(),
            "scheduled_end": (scheduled_end + timedelta(minutes=30)).isoformat(),
        }
    )

    assert response.status_code == 409


def test_cancelled_appointment_does_not_block_slot(client: TestClient, db: Session):
    """Test that cancelled appointment does not block a slot."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create and cancel first appointment
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    client.delete(
        f"/api/v1/appointments/{appointment_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    # Try to create new appointment at same time
    response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    assert response.status_code == 201


def test_client_lists_only_their_appointments(client: TestClient, db: Session):
    """Test that client lists only their appointments."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment for client1
    client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    # Create appointment for client2
    client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client2_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": (scheduled_start + timedelta(days=2)).isoformat(),
            "scheduled_end": (scheduled_end + timedelta(days=2)).isoformat(),
        }
    )

    # Get appointments as client1
    response = client.get(
        "/api/v1/appointments/me",
        headers={"Authorization": f"Bearer {client1_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["client"]["id"] == _client1.id


def test_agent_lists_only_assigned_appointments(client: TestClient, db: Session):
    """Test that agent lists only assigned appointments."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment
    client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    # Get appointments as agent
    response = client.get(
        "/api/v1/appointments/agent/me",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["agent"]["id"] == agent.id


def test_manager_lists_all_appointments(client: TestClient, db: Session):
    """Test that manager lists all appointments."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointments
    client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client2_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": (scheduled_start + timedelta(days=2)).isoformat(),
            "scheduled_end": (scheduled_end + timedelta(days=2)).isoformat(),
        }
    )

    # Get all appointments as manager
    response = client.get(
        "/api/v1/appointments/admin/all",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_unauthorized_access_returns_403(client: TestClient, db: Session):
    """Test that unauthorized access returns 403."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment for client1
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    # Try to access as client2
    response = client.get(
        f"/api/v1/appointments/{appointment_id}",
        headers={"Authorization": f"Bearer {client2_token}"}
    )

    assert response.status_code == 403


def test_client_cancellation_works(client: TestClient, db: Session):
    """Test that client cancellation works."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    # Cancel appointment
    response = client.delete(
        f"/api/v1/appointments/{appointment_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 204

    # Verify status is cancelled
    get_response = client.get(
        f"/api/v1/appointments/{appointment_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert get_response.json()["status"] == AppointmentStatus.CANCELLED.value


def test_agent_confirmation_works(client: TestClient, db: Session):
    """Test that agent confirmation works."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    # Confirm appointment
    response = client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"status": AppointmentStatus.CONFIRMED.value}
    )

    assert response.status_code == 200
    assert response.json()["status"] == AppointmentStatus.CONFIRMED.value


def test_agent_rescheduling_works(client: TestClient, db: Session):
    """Test that agent rescheduling works."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    # Reschedule appointment
    new_start = scheduled_start + timedelta(hours=2)
    new_end = scheduled_end + timedelta(hours=2)

    response = client.patch(
        f"/api/v1/appointments/{appointment_id}/reschedule",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "scheduled_start": new_start.isoformat(),
            "scheduled_end": new_end.isoformat(),
        }
    )

    assert response.status_code == 200
    assert response.json()["status"] == AppointmentStatus.RESCHEDULED.value


def test_conflict_validation_runs_during_rescheduling(client: TestClient, db: Session):
    """Test that conflict validation runs during rescheduling."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment for client1
    _create_response1 = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    # Create appointment for client2 at different time
    scheduled_start2 = scheduled_start + timedelta(hours=2)
    scheduled_end2 = scheduled_end + timedelta(hours=2)

    _create_response2 = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client2_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start2.isoformat(),
            "scheduled_end": scheduled_end2.isoformat(),
        }
    )

    appointment_id = _create_response2.json()["id"]

    # Try to reschedule to overlapping time
    response = client.patch(
        f"/api/v1/appointments/{appointment_id}/reschedule",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "scheduled_start": (scheduled_start + timedelta(minutes=30)).isoformat(),
            "scheduled_end": (scheduled_end + timedelta(minutes=30)).isoformat(),
        }
    )

    assert response.status_code == 409


def test_invalid_status_transition_returns_400(client: TestClient, db: Session):
    """Test that invalid status transition returns 400."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    # Try invalid transition from requested to completed
    response = client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"status": AppointmentStatus.COMPLETED.value}
    )

    assert response.status_code == 400


def test_agent_completes_confirmed_appointment(client: TestClient, db: Session):
    """Test that agent completes confirmed appointment."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create and confirm appointment
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"status": AppointmentStatus.CONFIRMED.value}
    )

    # Complete appointment
    response = client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"status": AppointmentStatus.COMPLETED.value}
    )

    assert response.status_code == 200
    assert response.json()["status"] == AppointmentStatus.COMPLETED.value


def test_agent_marks_confirmed_appointment_no_show(client: TestClient, db: Session):
    """Test that agent marks confirmed appointment no-show."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create and confirm appointment
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"status": AppointmentStatus.CONFIRMED.value}
    )

    # Mark as no-show
    response = client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"status": AppointmentStatus.NO_SHOW.value}
    )

    assert response.status_code == 200
    assert response.json()["status"] == AppointmentStatus.NO_SHOW.value


def test_client_cannot_confirm_or_complete(client: TestClient, db: Session):
    """Test that client cannot confirm or complete."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    # Try to confirm
    response = client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"status": AppointmentStatus.CONFIRMED.value}
    )

    assert response.status_code == 403


def test_soft_cancellation_works(client: TestClient, db: Session):
    """Test that soft cancellation works."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create appointment
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    appointment_id = create_response.json()["id"]

    # Cancel appointment
    client.delete(
        f"/api/v1/appointments/{appointment_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    # Verify appointment still exists but is cancelled
    get_response = client.get(
        f"/api/v1/appointments/{appointment_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert get_response.status_code == 200
    assert get_response.json()["status"] == AppointmentStatus.CANCELLED.value


def test_filters_work(client: TestClient, db: Session):
    """Test that filters work."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)

    # Create requested appointment
    client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
        }
    )

    # Filter by status
    response = client.get(
        "/api/v1/appointments/me?status=requested",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == AppointmentStatus.REQUESTED.value


def test_pagination_works(client: TestClient, db: Session):
    """Test that pagination works."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create multiple appointments
    for i in range(5):
        scheduled_start = datetime.now(UTC) + timedelta(days=i + 1)
        scheduled_end = scheduled_start + timedelta(hours=1)
        
        client.post(
            "/api/v1/appointments",
            headers={"Authorization": f"Bearer {client_token}"},
            json={
                "agent_id": agent.id,
                "property_id": property_obj.id,
                "scheduled_start": scheduled_start.isoformat(),
                "scheduled_end": scheduled_end.isoformat(),
            }
        )

    # Test pagination
    response = client.get(
        "/api/v1/appointments/me?skip=0&limit=2",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_unknown_appointment_returns_404(client: TestClient, db: Session):
    """Test that unknown appointment returns 404."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.get(
        "/api/v1/appointments/nonexistent-id",
        headers={"Authorization": f"Bearer {_client_token}"}
    )

    assert response.status_code == 404
