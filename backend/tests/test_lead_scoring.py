"""Tests for lead scoring service and agent leads endpoints."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.agent_property_type import AgentPropertyType, PropertyType
from app.models.agent_territory import AgentTerritory
from app.models.client_search_request import ClientSearchRequest
from app.models.user import User, UserRole
from app.schemas.agent import AgentCreate
from app.schemas.user import UserCreate
from app.services.agent_service import AgentService
from app.services.client_search_request_service import ClientSearchRequestService
from app.services.lead_scoring_service import LeadScoringService
from app.services.user_service import UserService
from app.core.security import get_password_hash


def create_test_user(db: Session, email: str, role: UserRole) -> User:
    """Create a test user."""
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


def create_test_agent(db: Session, email: str) -> tuple[User, Agent]:
    """Create a test user and agent profile."""
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


def create_test_client_request(db: Session, client_id: str, **kwargs) -> ClientSearchRequest:
    """Create a test client search request."""
    from app.schemas.client_search_request import ClientSearchRequestCreate
    from app.models.property import ListingType
    data = ClientSearchRequestCreate(
        property_type="apartment",
        listing_type=ListingType.SALE,
        minimum_budget=150000.0,
        maximum_budget=300000.0,
        preferred_city="Tunis",
        preferred_district="Lac",
        minimum_bedrooms=2,
        minimum_bathrooms=1,
        urgency="high",
        **kwargs,
    )
    request = ClientSearchRequestService.create_request(db, client_id, data)
    db.commit()
    return request


def get_auth_token(client: TestClient, email: str, password: str = "SecurePass123") -> str:
    """Get an authentication token."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    return response.json()["access_token"]


def test_lead_score_calculated_on_request_creation(client: TestClient, db: Session):
    """Creating a request should compute and store a lead score."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    request = create_test_client_request(db, client_user.id)

    assert request.lead_score is not None
    assert 0 <= request.lead_score <= 100
    assert request.qualification_level in ("cold", "warm", "hot")
    assert request.lead_score_reasons is not None
    assert len(request.lead_score_reasons) > 0


def test_lead_score_recalculation_updates_score(client: TestClient, db: Session):
    """Recalculating a request should update its score."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    request = create_test_client_request(db, client_user.id)
    original_score = request.lead_score

    # Update urgency to change score
    request.urgency = "immediate"
    db.commit()

    LeadScoringService.recalculate_request_score(db, request.id)
    db.commit()
    db.refresh(request)

    assert request.lead_score is not None
    assert request.lead_score >= original_score
    assert request.qualification_level == "hot"


def test_agent_can_list_leads(client: TestClient, db: Session):
    """An agent can list leads that match their profile."""
    agent_user, agent = create_test_agent(db, "agent@example.com")
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)

    # Add matching property type and territory
    db.add(AgentPropertyType(agent_id=agent.id, property_type=PropertyType.APARTMENT, expertise_score=5.0))
    db.add(AgentTerritory(agent_id=agent.id, territory="Tunis", expertise_score=5.0))
    db.commit()

    create_test_client_request(db, client_user.id)

    agent_token = get_auth_token(client, agent_user.email)
    response = client.get(
        "/api/v1/agent/leads",
        headers={"Authorization": f"Bearer {agent_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["leads"]) >= 1
    assert data["leads"][0]["property_type"] == "apartment"
    assert "lead_score" in data["leads"][0]


def test_agent_can_get_single_lead(client: TestClient, db: Session):
    """An agent can retrieve a single lead by request ID."""
    agent_user, agent = create_test_agent(db, "agent@example.com")
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)

    db.add(AgentPropertyType(agent_id=agent.id, property_type=PropertyType.APARTMENT, expertise_score=5.0))
    db.add(AgentTerritory(agent_id=agent.id, territory="Tunis", expertise_score=5.0))
    db.commit()

    request = create_test_client_request(db, client_user.id)

    agent_token = get_auth_token(client, agent_user.email)
    response = client.get(
        f"/api/v1/agent/leads/{request.id}",
        headers={"Authorization": f"Bearer {agent_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == request.id
    assert data["lead_score"] >= 0
    assert "matched_criteria" in data


def test_agent_can_recalculate_lead(client: TestClient, db: Session):
    """An agent can recalculate a lead score and receive updated data."""
    agent_user, agent = create_test_agent(db, "agent@example.com")
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)

    db.add(AgentPropertyType(agent_id=agent.id, property_type=PropertyType.APARTMENT, expertise_score=5.0))
    db.add(AgentTerritory(agent_id=agent.id, territory="Tunis", expertise_score=5.0))
    db.commit()

    request = create_test_client_request(db, client_user.id)

    agent_token = get_auth_token(client, agent_user.email)
    response = client.post(
        f"/api/v1/agent/leads/{request.id}/recalculate",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == request.id
    assert data["lead_score"] >= 0


def test_client_cannot_access_agent_leads(client: TestClient, db: Session):
    """A client should receive 403 on the agent leads endpoint."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email)

    response = client.get(
        "/api/v1/agent/leads",
        headers={"Authorization": f"Bearer {client_token}"},
    )

    assert response.status_code == 403


def test_manager_requires_agent_id_for_leads(client: TestClient, db: Session):
    """A manager must provide agent_id to list leads."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email)

    response = client.get(
        "/api/v1/agent/leads",
        headers={"Authorization": f"Bearer {manager_token}"},
    )

    assert response.status_code == 400


def test_manager_can_access_agent_leads_with_agent_id(client: TestClient, db: Session):
    """A manager can list leads for a specific agent."""
    agent_user, agent = create_test_agent(db, "agent@example.com")
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)

    db.add(AgentPropertyType(agent_id=agent.id, property_type=PropertyType.APARTMENT, expertise_score=5.0))
    db.add(AgentTerritory(agent_id=agent.id, territory="Tunis", expertise_score=5.0))
    db.commit()

    create_test_client_request(db, client_user.id)

    manager_token = get_auth_token(client, manager_user.email)
    response = client.get(
        f"/api/v1/agent/leads?agent_id={agent.id}",
        headers={"Authorization": f"Bearer {manager_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


def test_lead_analytics_endpoint(client: TestClient, db: Session):
    """Manager can access lead analytics endpoint."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email)

    response = client.get(
        "/api/v1/admin/analytics/leads",
        headers={"Authorization": f"Bearer {manager_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "total_search_requests" in data
    assert "total_hot_leads" in data
    assert "total_warm_leads" in data
    assert "total_cold_leads" in data
    assert "average_lead_score" in data


def test_lead_metrics_in_dashboard_overview(client: TestClient, db: Session):
    """Dashboard overview should include lead metrics."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, manager_user.email)

    response = client.get(
        "/api/v1/admin/analytics/overview",
        headers={"Authorization": f"Bearer {manager_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "total_hot_leads" in data
    assert "total_warm_leads" in data
    assert "total_cold_leads" in data
    assert "average_lead_score" in data
