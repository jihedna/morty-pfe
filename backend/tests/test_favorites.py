from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.permissions import UserRole
from app.core.security import get_password_hash
from app.models.agent_property_type import PropertyType
from app.models.property import ListingType, PropertyStatus
from app.schemas.agent import AgentCreate
from app.schemas.property import PropertyAgentCreate
from app.schemas.user import UserCreate
from app.services.agent_service import AgentService
from app.services.favorite_service import FavoriteService
from app.services.property_service import PropertyService
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


def create_test_property(db: Session, agent_id: str):
    """Helper function to create a test property."""
    from decimal import Decimal
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
        reference_code="REF123",
    )
    return PropertyService.create_property_for_agent(db, agent_id, property_data)


def get_auth_token(client: TestClient, email: str, password: str) -> str:
    """Helper function to get authentication token."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    return response.json()["access_token"]


def test_client_adds_favorite(client: TestClient, db: Session):
    """Test that a client can add a favorite."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        f"/api/v1/favorites/{property_obj.id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 201
    assert response.json()["property_id"] == property_obj.id
    assert response.json()["user_id"] == client_user.id


def test_agent_cannot_add_favorite(client: TestClient, db: Session):
    """Test that an agent cannot add a favorite."""
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    response = client.post(
        f"/api/v1/favorites/{property_obj.id}",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    assert response.status_code == 403


def test_manager_cannot_add_favorite(client: TestClient, db: Session):
    """Test that a manager cannot add a favorite."""
    manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    manager_token = get_auth_token(client, manager_user.email, "SecurePass123")

    response = client.post(
        f"/api/v1/favorites/{property_obj.id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 403


def test_unknown_property_returns_404(client: TestClient, db: Session):
    """Test that unknown property returns 404."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.post(
        "/api/v1/favorites/nonexistent-id",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 404


def test_archived_property_cannot_be_favorited(client: TestClient, db: Session):
    """Test that archived property cannot be newly favorited."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    # Archive the property
    property_obj.status = PropertyStatus.ARCHIVED.value
    db.commit()

    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    response = client.post(
        f"/api/v1/favorites/{property_obj.id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 400


def test_duplicate_favorite_is_idempotent(client: TestClient, db: Session):
    """Test that duplicate favorite is idempotent."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    # Add favorite first time
    response1 = client.post(
        f"/api/v1/favorites/{property_obj.id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    favorite_id_1 = response1.json()["id"]

    # Add favorite second time (should be idempotent)
    response2 = client.post(
        f"/api/v1/favorites/{property_obj.id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    favorite_id_2 = response2.json()["id"]

    assert response2.status_code == 201
    assert favorite_id_1 == favorite_id_2


def test_client_lists_only_their_favorites(client: TestClient, db: Session):
    """Test that a client can only list their own favorites."""
    client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    token1 = get_auth_token(client, "client1@example.com", "SecurePass123")

    # Client1 adds favorite
    FavoriteService.add_favorite(db, client1.id, property_obj.id)
    db.commit()

    # Client2 adds favorite
    FavoriteService.add_favorite(db, client2.id, property_obj.id)
    db.commit()

    # Client1 should only see their favorite
    response = client.get(
        "/api/v1/favorites/me",
        headers={"Authorization": f"Bearer {token1}"}
    )

    assert response.status_code == 200
    favorites = response.json()["favorites"]
    assert len(favorites) == 1
    assert favorites[0]["user_id"] == client1.id


def test_client_cannot_delete_another_clients_favorite(client: TestClient, db: Session):
    """Test that a client cannot delete another client's favorite."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    token1 = get_auth_token(client, "client1@example.com", "SecurePass123")

    # Client2 adds favorite
    _favorite = FavoriteService.add_favorite(db, client2.id, property_obj.id)
    db.commit()

    # Client1 tries to delete client2's favorite
    response = client.delete(
        f"/api/v1/favorites/{property_obj.id}",
        headers={"Authorization": f"Bearer {token1}"}
    )

    assert response.status_code == 404


def test_delete_favorite_works(client: TestClient, db: Session):
    """Test that delete favorite works."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    # Add favorite
    FavoriteService.add_favorite(db, client_user.id, property_obj.id)
    db.commit()

    # Delete favorite
    response = client.delete(
        f"/api/v1/favorites/{property_obj.id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 204


def test_deleting_unknown_favorite_returns_404(client: TestClient, db: Session):
    """Test that deleting an unknown favorite returns 404."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    # Try to delete favorite that doesn't exist
    response = client.delete(
        f"/api/v1/favorites/{property_obj.id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 404


def test_favorite_check_returns_true(client: TestClient, db: Session):
    """Test that favorite check returns true when favorited."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    # Add favorite
    FavoriteService.add_favorite(db, client_user.id, property_obj.id)
    db.commit()

    # Check favorite
    response = client.get(
        f"/api/v1/favorites/check/{property_obj.id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert response.json()["is_favorited"] is True
    assert response.json()["property_id"] == property_obj.id


def test_favorite_check_returns_false(client: TestClient, db: Session):
    """Test that favorite check returns false when not favorited."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    # Check favorite (not added)
    response = client.get(
        f"/api/v1/favorites/check/{property_obj.id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert response.json()["is_favorited"] is False
    assert response.json()["property_id"] == property_obj.id


def test_pagination_works(client: TestClient, db: Session):
    """Test that pagination works."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")

    client_token = get_auth_token(client, client_user.email, "SecurePass123")

    # Create 25 properties and add them as favorites
    for i in range(25):
        property_obj = create_test_property(db, agent.id)
        FavoriteService.add_favorite(db, client_user.id, property_obj.id)
    db.commit()

    # Get first page (default 20)
    response = client.get(
        "/api/v1/favorites/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert response.json()["total"] == 25
    assert len(response.json()["favorites"]) == 20
    assert response.json()["skip"] == 0
    assert response.json()["limit"] == 20

    # Get second page
    response = client.get(
        "/api/v1/favorites/me?skip=20&limit=10",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()["favorites"]) == 5
    assert response.json()["skip"] == 20
    assert response.json()["limit"] == 10


def test_current_property_status_is_included(client: TestClient, db: Session):
    """Test that current property status is included."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Add favorite
    FavoriteService.add_favorite(db, client_user.id, property_obj.id)
    db.commit()

    # Mark property as sold
    property_obj.status = PropertyStatus.SOLD.value
    db.commit()

    # List favorites
    response = client.get(
        "/api/v1/favorites/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert response.json()["favorites"][0]["property"]["status"] == PropertyStatus.SOLD.value


def test_primary_property_image_is_returned_when_available(client: TestClient, db: Session):
    """Test that primary property image is returned when available."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    property_obj = create_test_property(db, agent.id)

    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Add primary image
    from app.models.property_image import PropertyImage
    image = PropertyImage(
        property_id=property_obj.id,
        image_url="https://example.com/image.jpg",
        is_primary=True,
        position=1,
    )
    db.add(image)
    db.commit()

    # Add favorite
    FavoriteService.add_favorite(db, client_user.id, property_obj.id)
    db.commit()

    # List favorites
    response = client.get(
        "/api/v1/favorites/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert response.json()["favorites"][0]["property"]["primary_image_url"] == "https://example.com/image.jpg"
