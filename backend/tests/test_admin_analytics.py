"""Tests for admin analytics endpoints."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.property import ListingType, PropertyStatus
from app.models.property_appointment import AppointmentStatus, PropertyAppointment
from app.models.property_favorite import PropertyFavorite
from app.models.saved_search import SavedSearch
from app.models.user import UserRole
from app.schemas.agent import AgentCreate
from app.schemas.property import PropertyAgentCreate
from app.schemas.user import UserCreate
from app.services.agent_service import AgentService
from app.services.property_service import PropertyService
from app.services.user_service import UserService


def create_test_user(db: Session, email: str, role: UserRole):
    """Helper function to create a test user."""
    from app.core.security import get_password_hash
    user_data = UserCreate(
        email=email,
        password_hash=get_password_hash("SecurePass123"),
        first_name="Test",
        last_name="User",
        role=role,
        is_active=True,
    )
    user = UserService.create_user(db, user_data)
    db.commit()
    return user


def create_test_agent(db: Session, email: str):
    """Helper function to create a test agent."""
    user = create_test_user(db, email, UserRole.AGENT)
    agent_data = AgentCreate(
        user_id=user.id,
        office="Test Office",
        phone="+21612345678",
        years_experience=5,
        minimum_budget=100000.0,
        maximum_budget=500000.0,
    )
    agent = AgentService.create_agent(db, agent_data)
    db.commit()
    return user, agent


def create_test_property(db: Session, agent_id: str, status: PropertyStatus = PropertyStatus.AVAILABLE):
    """Helper function to create a test property."""
    from app.models.property import PropertyStatus
    status_value = status.value if isinstance(status, PropertyStatus) else status
    
    # Create with AVAILABLE status first (validation prevents SOLD/RENTED initially)
    property_data = PropertyAgentCreate(
        title="Test Property",
        description="A test property",
        property_type="apartment",
        listing_type=ListingType.SALE,
        status=PropertyStatus.AVAILABLE,
        price=Decimal("200000.0"),
        area_sqm=Decimal("150.0"),
        bedrooms=3,
        bathrooms=2,
        address_line="123 Test Street",
        city="Tunis",
        postal_code="1001",
    )
    property_obj = PropertyService.create_property_for_agent(db, agent_id, property_data)
    # Update status to desired value
    if property_obj.status != status_value:
        property_obj.status = status_value
        db.commit()
    return property_obj


def get_auth_token(client: TestClient, email: str, password: str) -> str:
    """Helper function to get authentication token."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    return response.json()["access_token"]


def test_manager_can_access_overview(client: TestClient, db: Session):
    """Test that manager can access overview endpoint."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_clients" in data
    assert "total_agents" in data
    assert "total_properties" in data


def test_client_receives_403_on_overview(client: TestClient, db: Session):
    """Test that client receives 403 on overview endpoint."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 403


def test_agent_receives_403_on_overview(client: TestClient, db: Session):
    """Test that agent receives 403 on overview endpoint."""
    agent_user, agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, agent_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    assert response.status_code == 403


def test_overview_counts_are_correct(client: TestClient, db: Session):
    """Test that overview counts are correct."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    # Create properties with different statuses
    _available_property = create_test_property(db, agent.id, PropertyStatus.AVAILABLE)
    _sold_property = create_test_property(db, agent.id, PropertyStatus.SOLD)
    _rented_property = create_test_property(db, agent.id, PropertyStatus.RENTED)
    _archived_property = create_test_property(db, agent.id, PropertyStatus.ARCHIVED)
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_users"] >= 3  # manager, client, agent
    assert data["total_clients"] >= 1
    assert data["total_agents"] >= 1
    assert data["available_properties"] >= 1
    assert data["sold_properties"] >= 1
    assert data["rented_properties"] >= 1
    assert data["archived_properties"] >= 1


def test_property_status_grouping_is_correct(client: TestClient, db: Session):
    """Test that property status grouping is correct."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    # Create properties with different statuses
    create_test_property(db, agent.id, PropertyStatus.AVAILABLE)
    create_test_property(db, agent.id, PropertyStatus.AVAILABLE)
    create_test_property(db, agent.id, PropertyStatus.SOLD)
    create_test_property(db, agent.id, PropertyStatus.RENTED)
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/properties",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_properties"] >= 4
    assert data["properties_by_status"].get("available", 0) >= 2
    assert data["properties_by_status"].get("sold", 0) >= 1
    assert data["properties_by_status"].get("rented", 0) >= 1


def test_property_type_grouping_is_correct(client: TestClient, db: Session):
    """Test that property type grouping is correct."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    # Create properties with different types
    property_data1 = PropertyAgentCreate(
        title="Apartment",
        description="A test apartment",
        property_type="apartment",
        listing_type=ListingType.SALE,
        status=PropertyStatus.AVAILABLE,
        price=Decimal("200000.0"),
        area_sqm=Decimal("150.0"),
        bedrooms=3,
        bathrooms=2,
        address_line="123 Test Street",
        city="Tunis",
        postal_code="1001",
        reference_code="REF1",
    )
    PropertyService.create_property_for_agent(db, agent.id, property_data1)
    
    property_data2 = PropertyAgentCreate(
        title="Villa",
        description="A test villa",
        property_type="villa",
        listing_type=ListingType.SALE,
        status=PropertyStatus.AVAILABLE,
        price=Decimal("300000.0"),
        area_sqm=Decimal("250.0"),
        bedrooms=4,
        bathrooms=3,
        address_line="456 Test Street",
        city="Tunis",
        postal_code="1001",
        reference_code="REF2",
    )
    PropertyService.create_property_for_agent(db, agent.id, property_data2)
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/properties",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["properties_by_type"].get("apartment", 0) >= 1
    assert data["properties_by_type"].get("villa", 0) >= 1


def test_date_filtering_works(client: TestClient, db: Session):
    """Test that date filtering works."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    # Create a property
    _property_obj = create_test_property(db, agent.id, PropertyStatus.AVAILABLE)
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")
    
    # Filter for properties created today
    today = datetime.now(UTC).date()
    date_from = datetime(today.year, today.month, today.day, tzinfo=UTC)
    date_to = date_from + timedelta(days=1)
    
    response = client.get(
        f"/api/v1/admin/analytics/properties?date_from={date_from.isoformat()}&date_to={date_to.isoformat()}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["created_in_period"] >= 1


def test_agent_metrics_are_correct(client: TestClient, db: Session):
    """Test that agent metrics are correct."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    # Create properties for the agent
    create_test_property(db, agent.id, PropertyStatus.AVAILABLE)
    create_test_property(db, agent.id, PropertyStatus.SOLD)
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/agents",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["agents"]) >= 1
    agent_data = data["agents"][0]
    assert agent_data["agent_id"] == agent.id
    assert agent_data["total_listings"] >= 2
    assert agent_data["sold_listings"] >= 1


def test_agent_pagination_works(client: TestClient, db: Session):
    """Test that agent pagination works."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    
    # Create multiple agents
    for i in range(5):
        create_test_agent(db, f"agent{i}@example.com")
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/agents?skip=0&limit=2",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["agents"]) <= 2
    assert data["skip"] == 0
    assert data["limit"] == 2


def test_agent_ordering_works(client: TestClient, db: Session):
    """Test that agent ordering works."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user1, agent1 = create_test_agent(db, "agent1@example.com")
    agent_user2, agent2 = create_test_agent(db, "agent2@example.com")
    
    # Create different number of properties for each agent
    create_test_property(db, agent1.id, PropertyStatus.AVAILABLE)
    create_test_property(db, agent1.id, PropertyStatus.SOLD)
    create_test_property(db, agent2.id, PropertyStatus.AVAILABLE)
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/agents?order_by=total_listings",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    # First agent should have more listings
    if len(data["agents"]) >= 2:
        assert data["agents"][0]["total_listings"] >= data["agents"][1]["total_listings"]


def test_client_aggregate_metrics_are_correct(client: TestClient, db: Session):
    """Test that client aggregate metrics are correct."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    # Create a property and favorite
    property_obj = create_test_property(db, agent.id, PropertyStatus.AVAILABLE)
    favorite = PropertyFavorite(
        user_id=client_user.id,
        property_id=property_obj.id,
    )
    db.add(favorite)
    db.commit()
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/clients",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_clients"] >= 1
    assert data["clients_with_favorites"] >= 1
    assert data["average_favorites_per_client"] > 0


def test_appointment_completion_rate_is_correct(client: TestClient, db: Session):
    """Test that appointment completion rate is correct."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id, PropertyStatus.AVAILABLE)
    
    # Create completed appointment
    appointment1 = PropertyAppointment(
        client_id=client_user.id,
        agent_id=agent.id,
        property_id=property_obj.id,
        scheduled_start=datetime.now(UTC) + timedelta(days=1),
        scheduled_end=datetime.now(UTC) + timedelta(days=1, hours=1),
        status=AppointmentStatus.COMPLETED,
    )
    db.add(appointment1)
    
    # Create cancelled appointment
    appointment2 = PropertyAppointment(
        client_id=client_user.id,
        agent_id=agent.id,
        property_id=property_obj.id,
        scheduled_start=datetime.now(UTC) + timedelta(days=2),
        scheduled_end=datetime.now(UTC) + timedelta(days=2, hours=1),
        status=AppointmentStatus.CANCELLED,
    )
    db.add(appointment2)
    db.commit()
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/appointments",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_appointments"] >= 2
    assert data["completed"] >= 1
    assert data["cancelled"] >= 1
    assert data["completion_rate"] > 0
    assert data["cancellation_rate"] > 0


def test_zero_totals_do_not_cause_division_errors(client: TestClient, db: Session):
    """Test that zero totals do not cause division errors."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    # Test appointments with no data
    response = client.get(
        "/api/v1/admin/analytics/appointments",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["completion_rate"] == 0.0
    assert data["cancellation_rate"] == 0.0
    assert data["no_show_rate"] == 0.0


def test_engagement_metrics_are_correct(client: TestClient, db: Session):
    """Test that engagement metrics are correct."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id, PropertyStatus.AVAILABLE)
    
    # Create favorite
    favorite = PropertyFavorite(
        user_id=client_user.id,
        property_id=property_obj.id,
    )
    db.add(favorite)
    
    # Create saved search
    saved_search = SavedSearch(
        user_id=client_user.id,
        name="My Search",
        filters={"city": "Tunis"},
        notifications_enabled=True,
        is_active=True,
    )
    db.add(saved_search)
    db.commit()
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/engagement",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_favorites"] >= 1
    assert data["total_saved_searches"] >= 1
    assert data["saved_searches_with_notifications_enabled"] >= 1
    assert data["clients_with_engagement"] >= 1


def test_time_series_daily_grouping_works(client: TestClient, db: Session):
    """Test that time-series daily grouping works."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")
    
    # Create a user
    create_test_user(db, "test@example.com", UserRole.CLIENT)
    
    today = datetime.now(UTC).date()
    date_from = datetime(today.year, today.month, today.day, tzinfo=UTC)
    date_to = date_from + timedelta(days=1)
    
    response = client.get(
        f"/api/v1/admin/analytics/time-series?metric=users&date_from={date_from.isoformat()}&date_to={date_to.isoformat()}&interval=day",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["metric"] == "users"
    assert data["interval"] == "day"
    assert isinstance(data["points"], list)


def test_time_series_weekly_grouping_works(client: TestClient, db: Session):
    """Test that time-series weekly grouping works."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")
    
    # Create a user
    create_test_user(db, "test@example.com", UserRole.CLIENT)
    
    today = datetime.now(UTC).date()
    date_from = datetime(today.year, today.month, today.day, tzinfo=UTC)
    date_to = date_from + timedelta(days=7)
    
    response = client.get(
        f"/api/v1/admin/analytics/time-series?metric=users&date_from={date_from.isoformat()}&date_to={date_to.isoformat()}&interval=week",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["metric"] == "users"
    assert data["interval"] == "week"
    assert isinstance(data["points"], list)


def test_time_series_monthly_grouping_works(client: TestClient, db: Session):
    """Test that time-series monthly grouping works."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")
    
    # Create a user
    create_test_user(db, "test@example.com", UserRole.CLIENT)
    
    today = datetime.now(UTC).date()
    date_from = datetime(today.year, today.month, 1, tzinfo=UTC)
    date_to = date_from + timedelta(days=31)
    
    response = client.get(
        f"/api/v1/admin/analytics/time-series?metric=users&date_from={date_from.isoformat()}&date_to={date_to.isoformat()}&interval=month",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["metric"] == "users"
    assert data["interval"] == "month"
    assert isinstance(data["points"], list)


def test_unsupported_metric_returns_422(client: TestClient, db: Session):
    """Test that unsupported metric returns 422."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")
    
    today = datetime.now(UTC).date()
    date_from = datetime(today.year, today.month, today.day, tzinfo=UTC)
    date_to = date_from + timedelta(days=1)
    
    response = client.get(
        f"/api/v1/admin/analytics/time-series?metric=invalid&date_from={date_from.isoformat()}&date_to={date_to.isoformat()}&interval=day",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 422


def test_unsupported_interval_returns_422(client: TestClient, db: Session):
    """Test that unsupported interval returns 422."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")
    
    today = datetime.now(UTC).date()
    date_from = datetime(today.year, today.month, today.day, tzinfo=UTC)
    date_to = date_from + timedelta(days=1)
    
    response = client.get(
        f"/api/v1/admin/analytics/time-series?metric=users&date_from={date_from.isoformat()}&date_to={date_to.isoformat()}&interval=invalid",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 422


def test_empty_database_returns_valid_zero_values(client: TestClient, db: Session):
    """Test that empty database returns valid zero values."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    # Should have at least the manager user
    assert data["total_users"] >= 1
    assert data["total_properties"] == 0
    assert data["total_appointments"] == 0
    assert data["total_favorites"] == 0


def test_sensitive_data_is_not_exposed(client: TestClient, db: Session):
    """Test that sensitive data is not exposed."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/admin/analytics/agents",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    if len(data["agents"]) > 0:
        agent_data = data["agents"][0]
        # Should not contain sensitive fields
        assert "password" not in agent_data
        assert "password_hash" not in agent_data
        assert "email" not in agent_data
        assert "phone_number" not in agent_data
