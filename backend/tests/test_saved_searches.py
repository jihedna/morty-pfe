from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.permissions import UserRole
from app.core.security import get_password_hash
from app.models.agent_property_type import PropertyType
from app.models.property import ListingType
from app.schemas.agent import AgentCreate
from app.schemas.property import PropertyAgentCreate
from app.schemas.user import UserCreate
from app.services.agent_service import AgentService
from app.services.property_service import PropertyService
from app.services.saved_search_service import SavedSearchService
from app.services.user_service import UserService


def create_test_user(db: Session, email: str, role: UserRole):
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


def create_test_agent(db: Session, email: str):
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


def create_test_property(db: Session, agent_id: str, **kwargs):
    """Helper function to create a test property."""
    from app.models.property import PropertyStatus
    status = kwargs.get("status", PropertyStatus.AVAILABLE)
    status_value = status.value if isinstance(status, PropertyStatus) else status
    
    property_data = PropertyAgentCreate(
        title="Test Property",
        description="A test property",
        property_type=kwargs.get("property_type", PropertyType.APARTMENT),
        listing_type=kwargs.get("listing_type", ListingType.SALE),
        status=status,
        price=kwargs.get("price", Decimal("200000.0")),
        area_sqm=kwargs.get("area_sqm", Decimal("150.0")),
        bedrooms=kwargs.get("bedrooms", 3),
        bathrooms=kwargs.get("bathrooms", 2),
        address_line="123 Test Street",
        city=kwargs.get("city", "Tunis"),
        postal_code="1001",
        reference_code="REF123",
    )
    property_obj = PropertyService.create_property_for_agent(db, agent_id, property_data)
    # Ensure status is set correctly (in case schema defaults override)
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


def test_client_creates_valid_saved_search(client: TestClient, db: Session):
    """Test that a client can create a valid saved search."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/saved-searches",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "name": "My Search",
            "filters": {
                "property_type": "apartment",
                "city": "Tunis",
            },
            "notifications_enabled": True,
        }
    )

    assert response.status_code == 201
    assert response.json()["name"] == "My Search"
    assert response.json()["user_id"] == client_user.id


def test_non_client_cannot_create_saved_search(client: TestClient, db: Session):
    """Test that a non-client cannot create a saved search."""
    agent_user, agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/saved-searches",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "name": "My Search",
            "filters": {"city": "Tunis"},
        }
    )

    assert response.status_code == 403


def test_empty_filters_return_422(client: TestClient, db: Session):
    """Test that empty filters return 422."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.post(
        "/api/v1/saved-searches",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "name": "My Search",
            "filters": {},
        }
    )

    assert response.status_code == 422


def test_blank_name_returns_422(client: TestClient, db: Session):
    """Test that blank name returns 422."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.post(
        "/api/v1/saved-searches",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "name": "   ",
            "filters": {"city": "Tunis"},
        }
    )

    assert response.status_code == 422


def test_invalid_price_range_returns_422(client: TestClient, db: Session):
    """Test that invalid price range returns 422."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.post(
        "/api/v1/saved-searches",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "name": "My Search",
            "filters": {
                "minimum_price": 500000,
                "maximum_price": 100000,
            },
        }
    )

    assert response.status_code == 422


def test_invalid_area_range_returns_422(client: TestClient, db: Session):
    """Test that invalid area range returns 422."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.post(
        "/api/v1/saved-searches",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "name": "My Search",
            "filters": {
                "minimum_area_sqm": 200,
                "maximum_area_sqm": 100,
            },
        }
    )

    assert response.status_code == 422


def test_negative_room_values_return_422(client: TestClient, db: Session):
    """Test that negative room values return 422."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.post(
        "/api/v1/saved-searches",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "name": "My Search",
            "filters": {
                "minimum_bedrooms": -1,
            },
        }
    )

    assert response.status_code == 422


def test_unsupported_filter_key_returns_422(client: TestClient, db: Session):
    """Test that unsupported filter key returns 422."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.post(
        "/api/v1/saved-searches",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "name": "My Search",
            "filters": {
                "invalid_key": "value",
            },
        }
    )

    assert response.status_code == 422


def test_client_lists_only_their_saved_searches(client: TestClient, db: Session):
    """Test that a client can only list their own saved searches."""
    client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)

    token1 = get_auth_token(client, "client1@example.com", "SecurePass123")

    # Client1 creates saved search
    SavedSearchService.create_saved_search(
        db,
        client1.id,
        "Client1 Search",
        {"city": "Tunis"},
    )
    db.commit()

    # Client2 creates saved search
    SavedSearchService.create_saved_search(
        db,
        client2.id,
        "Client2 Search",
        {"city": "Sfax"},
    )
    db.commit()

    # Client1 should only see their saved search
    response = client.get(
        "/api/v1/saved-searches/me",
        headers={"Authorization": f"Bearer {token1}"}
    )

    assert response.status_code == 200
    saved_searches = response.json()["saved_searches"]
    assert len(saved_searches) == 1
    assert saved_searches[0]["user_id"] == client1.id


def test_client_cannot_access_another_clients_saved_search(client: TestClient, db: Session):
    """Test that a client cannot access another client's saved search."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)

    token1 = get_auth_token(client, "client1@example.com", "SecurePass123")

    # Client2 creates saved search
    saved_search = SavedSearchService.create_saved_search(
        db,
        client2.id,
        "Client2 Search",
        {"city": "Sfax"},
    )
    db.commit()

    # Client1 tries to access client2's saved search
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}",
        headers={"Authorization": f"Bearer {token1}"}
    )

    assert response.status_code == 404


def test_update_saved_search_works(client: TestClient, db: Session):
    """Test that update saved search works."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "My Search",
        {"city": "Tunis"},
    )
    db.commit()

    # Update saved search
    response = client.patch(
        f"/api/v1/saved-searches/{saved_search.id}",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "name": "Updated Search",
            "filters": {"city": "Sfax"},
        }
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Search"


def test_soft_deletion_works(client: TestClient, db: Session):
    """Test that soft deletion works."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "My Search",
        {"city": "Tunis"},
    )
    db.commit()

    # Delete saved search (soft delete)
    response = client.delete(
        f"/api/v1/saved-searches/{saved_search.id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 204

    # Verify it's soft deleted (is_active = False)
    db.refresh(saved_search)
    assert saved_search.is_active is False


def test_inactive_saved_searches_are_excluded(client: TestClient, db: Session):
    """Test that inactive saved searches are excluded from default list."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create active saved search
    SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "Active Search",
        {"city": "Tunis"},
    )
    db.commit()

    # Create inactive saved search
    inactive_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "Inactive Search",
        {"city": "Sfax"},
    )
    SavedSearchService.deactivate_saved_search(db, inactive_search)
    db.commit()

    # List saved searches (default excludes inactive)
    response = client.get(
        "/api/v1/saved-searches/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()["saved_searches"]) == 1


def test_results_endpoint_applies_property_type(client: TestClient, db: Session):
    """Test that results endpoint applies property type filter."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Create apartment
    create_test_property(db, agent.id, property_type=PropertyType.APARTMENT)
    # Create villa
    create_test_property(db, agent.id, property_type=PropertyType.VILLA)

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search for apartments
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "Apartments",
        {"property_type": "apartment"},
    )
    db.commit()

    # Get results
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}/results",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()["properties"]) == 1
    assert response.json()["properties"][0]["property_type"] == "apartment"


def test_results_endpoint_applies_listing_type(client: TestClient, db: Session):
    """Test that results endpoint applies listing type filter."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Create sale property
    create_test_property(db, agent.id, listing_type=ListingType.SALE)
    # Create rent property
    create_test_property(db, agent.id, listing_type=ListingType.RENT)

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search for sale
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "For Sale",
        {"listing_type": "sale"},
    )
    db.commit()

    # Get results
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}/results",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()["properties"]) == 1
    assert response.json()["properties"][0]["listing_type"] == "sale"


def test_results_endpoint_applies_price_range(client: TestClient, db: Session):
    """Test that results endpoint applies price range filter."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Create property within range
    create_test_property(db, agent.id, price=Decimal("150000.0"))
    # Create property outside range
    create_test_property(db, agent.id, price=Decimal("500000.0"))

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search with price range
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "Price Range",
        {"minimum_price": 100000, "maximum_price": 200000},
    )
    db.commit()

    # Get results
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}/results",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()["properties"]) == 1


def test_results_endpoint_applies_location(client: TestClient, db: Session):
    """Test that results endpoint applies location filter."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Create property in Tunis
    create_test_property(db, agent.id, city="Tunis")
    # Create property in Sfax
    create_test_property(db, agent.id, city="Sfax")

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search for Tunis
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "Tunis Properties",
        {"city": "Tunis"},
    )
    db.commit()

    # Get results
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}/results",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()["properties"]) == 1
    assert response.json()["properties"][0]["city"] == "Tunis"


def test_results_endpoint_applies_bedroom_and_bathroom_filters(client: TestClient, db: Session):
    """Test that results endpoint applies bedroom and bathroom filters."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Create property with 3 bedrooms, 2 bathrooms
    create_test_property(db, agent.id, bedrooms=3, bathrooms=2)
    # Create property with 1 bedroom, 1 bathroom
    create_test_property(db, agent.id, bedrooms=1, bathrooms=1)

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search with minimum bedrooms and bathrooms
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "Large Properties",
        {"minimum_bedrooms": 2, "minimum_bathrooms": 2},
    )
    db.commit()

    # Get results
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}/results",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()["properties"]) == 1


def test_results_endpoint_applies_features(client: TestClient, db: Session):
    """Test that results endpoint applies features filter."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Create property with parking
    property1 = create_test_property(db, agent.id)
    from app.models.property_feature import PropertyFeature, PropertyFeatureEnum
    feature1 = PropertyFeature(
        property_id=property1.id,
        feature=PropertyFeatureEnum.PARKING.value
    )
    db.add(feature1)

    # Create property without parking
    _property2 = create_test_property(db, agent.id)

    db.commit()

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search with parking feature
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "With Parking",
        {"features": ["parking"]},
    )
    db.commit()

    # Get results
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}/results",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()["properties"]) == 1


def test_results_only_include_public_properties(client: TestClient, db: Session):
    """Test that results only include public properties."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Create public property
    _public_property = create_test_property(db, agent.id)
    # Create archived property
    archived_property = create_test_property(db, agent.id)
    from app.models.property import PropertyStatus
    archived_property.status = PropertyStatus.ARCHIVED.value
    db.commit()

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "All Properties",
        {"city": "Tunis"},
    )
    db.commit()

    # Get results
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}/results",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()["properties"]) == 1


def test_results_pagination_works(client: TestClient, db: Session):
    """Test that results pagination works."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")

    # Create 25 properties
    for _ in range(25):
        create_test_property(db, agent.id)

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create saved search
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "All Properties",
        {"city": "Tunis"},
    )
    db.commit()

    # Get first page
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}/results",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert response.json()["total"] == 25
    assert len(response.json()["properties"]) == 20


def test_unknown_saved_search_returns_404(client: TestClient, db: Session):
    """Test that unknown saved search returns 404."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.get(
        "/api/v1/saved-searches/nonexistent-id",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 404


def test_notification_evaluation_does_not_create_duplicates(client: TestClient, db: Session):
    """Test that notification evaluation method does not create duplicates."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    # Create saved search
    _saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "My Search",
        {"city": "Tunis"},
    )
    db.commit()

    # Evaluate property once
    SavedSearchService.evaluate_property_against_saved_searches(db, property_obj)
    db.commit()

    # Evaluate property again (should not create duplicate)
    SavedSearchService.evaluate_property_against_saved_searches(db, property_obj)
    db.commit()

    # Check that only one notification was created
    from app.models.notification import Notification
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == client_user.id)
        .all()
    )
    assert len(notifications) == 1


def test_get_results_does_not_generate_notifications(client: TestClient, db: Session):
    """Test that GET results does not generate notifications."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    _property_obj = create_test_property(db, agent.id)

    # Create saved search
    saved_search = SavedSearchService.create_saved_search(
        db,
        client_user.id,
        "My Search",
        {"city": "Tunis"},
    )
    db.commit()

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Get results (should not generate notifications)
    response = client.get(
        f"/api/v1/saved-searches/{saved_search.id}/results",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200

    # Check that no notification was created
    from app.models.notification import Notification
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == client_user.id)
        .all()
    )
    assert len(notifications) == 0
