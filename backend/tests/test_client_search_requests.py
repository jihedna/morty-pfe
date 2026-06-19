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


def test_client_can_create_valid_request(client: TestClient, db: Session):
    """Test that a client can create a valid search request."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0,
            "preferred_city": "Tunis",
            "minimum_bedrooms": 2,
            "minimum_bathrooms": 1,
            "minimum_area_sqm": 80.0
        }
    )

    assert response.status_code == 201
    assert response.json()["property_type"] == "apartment"
    assert response.json()["client_id"] == client_user.id
    assert response.json()["is_active"] is True


def test_non_client_cannot_create_request(client: TestClient, db: Session):
    """Test that non-clients cannot create search requests."""
    agent_user, _agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    assert response.status_code == 403


def test_manager_cannot_create_request(client: TestClient, db: Session):
    """Test that managers cannot create search requests."""
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    assert response.status_code == 403


def test_invalid_budget_range_returns_422(client: TestClient, db: Session):
    """Test that invalid budget range returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 500000.0,
            "maximum_budget": 300000.0
        }
    )

    assert response.status_code == 422


def test_negative_budget_returns_422(client: TestClient, db: Session):
    """Test that negative budget returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": -100000.0
        }
    )

    assert response.status_code == 422


def test_negative_bedrooms_returns_422(client: TestClient, db: Session):
    """Test that negative bedrooms returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_bedrooms": -1
        }
    )

    assert response.status_code == 422


def test_negative_area_returns_422(client: TestClient, db: Session):
    """Test that negative area returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_area_sqm": -50.0
        }
    )

    assert response.status_code == 422


def test_client_can_get_own_requests(client: TestClient, db: Session):
    """Test that a client can get their own requests."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create a request
    client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    # Get own requests
    response = client.get(
        "/api/v1/client-requests/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["client_id"] == client_user.id


def test_client_cannot_access_another_client_request(client: TestClient, db: Session):
    """Test that a client cannot access another client's request."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)

    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")

    # Create request as client1
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    request_id = create_response.json()["id"]

    # Try to access as client2
    response = client.get(
        f"/api/v1/client-requests/{request_id}",
        headers={"Authorization": f"Bearer {client2_token}"}
    )

    assert response.status_code == 403


def test_manager_can_access_all_requests(client: TestClient, db: Session):
    """Test that managers can access all requests."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create request as client
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    request_id = create_response.json()["id"]

    # Access as manager
    response = client.get(
        f"/api/v1/client-requests/{request_id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    assert response.json()["id"] == request_id


def test_manager_can_list_all_requests(client: TestClient, db: Session):
    """Test that managers can list all requests."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)

    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create requests as clients
    client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client2_token}"},
        json={
            "property_type": "villa",
            "listing_type": "sale",
            "minimum_budget": 500000.0,
            "maximum_budget": 1000000.0
        }
    )

    # List all as manager
    response = client.get(
        "/api/v1/client-requests/admin/all",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_client_can_update_own_request(client: TestClient, db: Session):
    """Test that a client can update their own request."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create request
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    request_id = create_response.json()["id"]

    # Update request
    response = client.patch(
        f"/api/v1/client-requests/{request_id}",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "minimum_budget": 200000.0,
            "maximum_budget": 400000.0
        }
    )

    assert response.status_code == 200
    assert float(response.json()["minimum_budget"]) == 200000.0


def test_client_cannot_update_another_client_request(client: TestClient, db: Session):
    """Test that a client cannot update another client's request."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)

    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")

    # Create request as client1
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    request_id = create_response.json()["id"]

    # Try to update as client2
    response = client.patch(
        f"/api/v1/client-requests/{request_id}",
        headers={"Authorization": f"Bearer {client2_token}"},
        json={
            "minimum_budget": 200000.0
        }
    )

    assert response.status_code == 403


def test_soft_deletion_works(client: TestClient, db: Session):
    """Test that DELETE deactivates instead of physically deleting."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create request
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    request_id = create_response.json()["id"]

    # Delete request
    response = client.delete(
        f"/api/v1/client-requests/{request_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 204

    # Request should still exist but be inactive
    get_response = client.get(
        f"/api/v1/client-requests/{request_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert get_response.status_code == 200
    assert get_response.json()["is_active"] is False


def test_unknown_request_returns_404(client: TestClient, db: Session):
    """Test that unknown request returns 404."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.get(
        "/api/v1/client-requests/nonexistent-id",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 404


def test_matching_returns_agents_ordered_by_score(client: TestClient, db: Session):
    """Test that matching returns agents ordered by score."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create agents with different characteristics
    agent1_user, agent1 = create_test_agent(db, "agent1@example.com")
    agent2_user, agent2 = create_test_agent(db, "agent2@example.com")

    # Create search request
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 200000.0,
            "maximum_budget": 400000.0,
            "preferred_city": "Tunis"
        }
    )

    request_id = create_response.json()["id"]

    # Get matches
    response = client.get(
        f"/api/v1/client-requests/{request_id}/agent-matches",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    matches = response.json()
    assert len(matches) >= 2

    # Check that scores are in descending order
    for i in range(len(matches) - 1):
        assert matches[i]["match_score"] >= matches[i + 1]["match_score"]


def test_property_type_matching(client: TestClient, db: Session):
    """Test that property type matching works correctly."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create agent with apartment property type
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Add apartment property type to agent
    from app.models.agent_property_type import AgentPropertyType
    from app.models.agent_property_type import PropertyType
    property_type = AgentPropertyType(
        agent_id=agent.id,
        property_type=PropertyType.APARTMENT,
        expertise_score=5.0
    )
    db.add(property_type)
    db.commit()

    # Create search request for apartment
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 200000.0,
            "maximum_budget": 400000.0
        }
    )

    request_id = create_response.json()["id"]

    # Get matches
    response = client.get(
        f"/api/v1/client-requests/{request_id}/agent-matches",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    matches = response.json()
    
    # Find the agent we created
    agent_match = next((m for m in matches if m["agent_id"] == agent.id), None)
    assert agent_match is not None
    assert agent_match["matched_criteria"]["property_type"] is True


def test_territory_matching(client: TestClient, db: Session):
    """Test that territory matching works correctly."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create agent with Tunis territory
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Add territory to agent using the same db session
    from app.models.agent_territory import AgentTerritory
    territory = AgentTerritory(
        agent_id=agent.id,
        territory="Tunis",
        expertise_score=5.0
    )
    db.add(territory)
    db.commit()

    # Create search request with preferred city Tunis
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 200000.0,
            "maximum_budget": 400000.0,
            "preferred_city": "Tunis"
        }
    )

    request_id = create_response.json()["id"]

    # Get matches
    response = client.get(
        f"/api/v1/client-requests/{request_id}/agent-matches",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    matches = response.json()
    
    # Find the agent we created
    agent_match = next((m for m in matches if m["agent_id"] == agent.id), None)
    assert agent_match is not None
    assert agent_match["matched_criteria"]["territory"] is True


def test_budget_overlap_matching(client: TestClient, db: Session):
    """Test that budget overlap matching works correctly."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create agent with budget range 200000-500000
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Create search request with overlapping budget 300000-400000
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 300000.0,
            "maximum_budget": 400000.0
        }
    )

    request_id = create_response.json()["id"]

    # Get matches
    response = client.get(
        f"/api/v1/client-requests/{request_id}/agent-matches",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    matches = response.json()
    
    # Find the agent we created
    agent_match = next((m for m in matches if m["agent_id"] == agent.id), None)
    assert agent_match is not None
    assert agent_match["matched_criteria"]["budget"] is True


def test_inactive_agents_excluded(client: TestClient, db: Session):
    """Test that inactive agents are excluded from matching."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create agent and set to inactive
    agent_user, agent = create_test_agent(db, "agent@example.com")
    agent_user.is_active = False
    
    from app.database.session import get_db
    db_session = next(get_db())
    try:
        db_session.commit()
    finally:
        db_session.close()

    # Create search request
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 200000.0,
            "maximum_budget": 400000.0
        }
    )

    request_id = create_response.json()["id"]

    # Get matches
    response = client.get(
        f"/api/v1/client-requests/{request_id}/agent-matches",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    matches = response.json()
    
    # Inactive agent should not be in results
    agent_match = next((m for m in matches if m["agent_id"] == agent.id), None)
    assert agent_match is None


def test_unauthorized_matching_access_returns_403(client: TestClient, db: Session):
    """Test that unauthorized matching access returns 403."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)

    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")

    # Create request as client1
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 200000.0,
            "maximum_budget": 400000.0
        }
    )

    request_id = create_response.json()["id"]

    # Try to get matches as client2
    response = client.get(
        f"/api/v1/client-requests/{request_id}/agent-matches",
        headers={"Authorization": f"Bearer {client2_token}"}
    )

    assert response.status_code == 403


def test_inactive_request_cannot_be_matched(client: TestClient, db: Session):
    """Test that inactive requests cannot be matched."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create request
    create_response = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 200000.0,
            "maximum_budget": 400000.0
        }
    )

    request_id = create_response.json()["id"]

    # Deactivate request
    client.delete(
        f"/api/v1/client-requests/{request_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    # Try to get matches
    response = client.get(
        f"/api/v1/client-requests/{request_id}/agent-matches",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 400


def test_filter_by_is_active(client: TestClient, db: Session):
    """Test that filtering by is_active works."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create two requests
    _response1 = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "apartment",
            "listing_type": "sale",
            "minimum_budget": 150000.0,
            "maximum_budget": 300000.0
        }
    )

    response2 = client.post(
        "/api/v1/client-requests",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "property_type": "villa",
            "listing_type": "sale",
            "minimum_budget": 500000.0,
            "maximum_budget": 1000000.0
        }
    )

    request_id = response2.json()["id"]

    # Deactivate second request
    client.delete(
        f"/api/v1/client-requests/{request_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    # Filter for active only
    response = client.get(
        "/api/v1/client-requests/me?is_active=true",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["is_active"] is True

    # Filter for inactive only
    response = client.get(
        "/api/v1/client-requests/me?is_active=false",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["is_active"] is False
