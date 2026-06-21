from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.notification import NotificationType
from app.models.user import User
from app.services.agent_service import AgentService
from app.services.notification_service import NotificationService
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
    user = create_test_user(db, email, UserRole.AGENT)
    from app.schemas.agent import AgentCreate
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


def test_user_lists_only_their_notifications(client: TestClient, db: Session):
    """Test that a user can only list their own notifications."""
    user1 = create_test_user(db, "user1@example.com", UserRole.CLIENT)
    user2 = create_test_user(db, "user2@example.com", UserRole.CLIENT)
    
    token1 = get_auth_token(client, "user1@example.com", "SecurePass123")
    
    # Create notification for user1
    NotificationService.create_notification(
        db,
        user_id=user1.id,
        notification_type=NotificationType.SYSTEM,
        title="Test notification",
        message="Test message",
    )
    db.commit()
    
    # Create notification for user2
    NotificationService.create_notification(
        db,
        user_id=user2.id,
        notification_type=NotificationType.SYSTEM,
        title="Test notification",
        message="Test message",
    )
    db.commit()
    
    # User1 should only see their own notification
    response = client.get(
        "/api/v1/notifications/me",
        headers={"Authorization": f"Bearer {token1}"}
    )
    
    assert response.status_code == 200
    notifications = response.json()["notifications"]
    assert len(notifications) == 1
    assert notifications[0]["user_id"] == user1.id


def test_unrelated_user_cannot_access_notification(client: TestClient, db: Session):
    """Test that an unrelated user cannot access another user's notification."""
    user1 = create_test_user(db, "user1@example.com", UserRole.CLIENT)
    _user2 = create_test_user(db, "user2@example.com", UserRole.CLIENT)
    
    _token1 = get_auth_token(client, "user1@example.com", "SecurePass123")
    token2 = get_auth_token(client, "user2@example.com", "SecurePass123")
    
    # Create notification for user1
    notification = NotificationService.create_notification(
        db,
        user_id=user1.id,
        notification_type=NotificationType.SYSTEM,
        title="Test notification",
        message="Test message",
    )
    db.commit()
    
    # User2 should not be able to access user1's notification
    response = client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {token2}"}
    )
    
    assert response.status_code == 200
    assert response.json()["unread_count"] == 0
    
    # User2 should get 404 when trying to mark user1's notification as read
    response = client.patch(
        f"/api/v1/notifications/{notification.id}/read",
        headers={"Authorization": f"Bearer {token2}"}
    )
    
    assert response.status_code == 404


def test_unread_count_is_correct(client: TestClient, db: Session):
    """Test that unread count is correct."""
    user = create_test_user(db, "user@example.com", UserRole.CLIENT)
    token = get_auth_token(client, "user@example.com", "SecurePass123")
    
    # Create 3 unread notifications
    for i in range(3):
        NotificationService.create_notification(
            db,
            user_id=user.id,
            notification_type=NotificationType.SYSTEM,
            title=f"Test notification {i}",
            message="Test message",
        )
    db.commit()
    
    # Check unread count
    response = client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["unread_count"] == 3


def test_mark_one_notification_as_read(client: TestClient, db: Session):
    """Test marking a single notification as read."""
    user = create_test_user(db, "user@example.com", UserRole.CLIENT)
    token = get_auth_token(client, "user@example.com", "SecurePass123")
    
    # Create notification
    notification = NotificationService.create_notification(
        db,
        user_id=user.id,
        notification_type=NotificationType.SYSTEM,
        title="Test notification",
        message="Test message",
    )
    db.commit()
    
    # Mark as read
    response = client.patch(
        f"/api/v1/notifications/{notification.id}/read",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["is_read"] is True
    assert response.json()["read_at"] is not None


def test_mark_all_notifications_as_read(client: TestClient, db: Session):
    """Test marking all notifications as read."""
    user = create_test_user(db, "user@example.com", UserRole.CLIENT)
    token = get_auth_token(client, "user@example.com", "SecurePass123")
    
    # Create 3 unread notifications
    for i in range(3):
        NotificationService.create_notification(
            db,
            user_id=user.id,
            notification_type=NotificationType.SYSTEM,
            title=f"Test notification {i}",
            message="Test message",
        )
    db.commit()
    
    # Mark all as read
    response = client.patch(
        "/api/v1/notifications/read-all",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["marked_count"] == 3
    
    # Check that all are now read
    response = client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.json()["unread_count"] == 0


def test_re_reading_notification_is_idempotent(client: TestClient, db: Session):
    """Test that re-reading a notification is idempotent."""
    user = create_test_user(db, "user@example.com", UserRole.CLIENT)
    token = get_auth_token(client, "user@example.com", "SecurePass123")
    
    # Create notification
    notification = NotificationService.create_notification(
        db,
        user_id=user.id,
        notification_type=NotificationType.SYSTEM,
        title="Test notification",
        message="Test message",
    )
    db.commit()
    
    # Mark as read first time
    response1 = client.patch(
        f"/api/v1/notifications/{notification.id}/read",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response1.status_code == 200
    read_at_1 = response1.json()["read_at"]
    
    # Mark as read second time (should be idempotent)
    response2 = client.patch(
        f"/api/v1/notifications/{notification.id}/read",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response2.status_code == 200
    read_at_2 = response2.json()["read_at"]
    
    # read_at should be the same (not updated)
    assert read_at_1 == read_at_2


def test_delete_own_notification(client: TestClient, db: Session):
    """Test that a user can delete their own notification."""
    user = create_test_user(db, "user@example.com", UserRole.CLIENT)
    token = get_auth_token(client, "user@example.com", "SecurePass123")
    
    # Create notification
    notification = NotificationService.create_notification(
        db,
        user_id=user.id,
        notification_type=NotificationType.SYSTEM,
        title="Test notification",
        message="Test message",
    )
    db.commit()
    
    # Delete notification
    response = client.delete(
        f"/api/v1/notifications/{notification.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 204
    
    # Verify it's deleted
    response = client.get(
        "/api/v1/notifications/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["notifications"]) == 0


def test_cannot_delete_another_users_notification(client: TestClient, db: Session):
    """Test that a user cannot delete another user's notification."""
    _user1 = create_test_user(db, "user1@example.com", UserRole.CLIENT)
    user2 = create_test_user(db, "user2@example.com", UserRole.CLIENT)
    
    token1 = get_auth_token(client, "user1@example.com", "SecurePass123")
    
    # Create notification for user2
    notification = NotificationService.create_notification(
        db,
        user_id=user2.id,
        notification_type=NotificationType.SYSTEM,
        title="Test notification",
        message="Test message",
    )
    db.commit()
    
    # User1 should not be able to delete user2's notification
    response = client.delete(
        f"/api/v1/notifications/{notification.id}",
        headers={"Authorization": f"Bearer {token1}"}
    )
    
    assert response.status_code == 404


def test_pagination(client: TestClient, db: Session):
    """Test pagination of notifications."""
    user = create_test_user(db, "user@example.com", UserRole.CLIENT)
    token = get_auth_token(client, "user@example.com", "SecurePass123")
    
    # Create 25 notifications
    for i in range(25):
        NotificationService.create_notification(
            db,
            user_id=user.id,
            notification_type=NotificationType.SYSTEM,
            title=f"Test notification {i}",
            message="Test message",
        )
    db.commit()
    
    # Get first page (default 20)
    response = client.get(
        "/api/v1/notifications/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["total"] == 25
    assert len(response.json()["notifications"]) == 20
    assert response.json()["skip"] == 0
    assert response.json()["limit"] == 20
    
    # Get second page
    response = client.get(
        "/api/v1/notifications/me?skip=20&limit=10",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["notifications"]) == 5
    assert response.json()["skip"] == 20
    assert response.json()["limit"] == 10


def test_filtering_by_read_status(client: TestClient, db: Session):
    """Test filtering notifications by read status."""
    user = create_test_user(db, "user@example.com", UserRole.CLIENT)
    token = get_auth_token(client, "user@example.com", "SecurePass123")
    
    # Create 5 unread notifications
    for i in range(5):
        NotificationService.create_notification(
            db,
            user_id=user.id,
            notification_type=NotificationType.SYSTEM,
            title=f"Unread {i}",
            message="Test message",
        )
    db.commit()
    
    # Mark 2 as read
    notifications = NotificationService.list_user_notifications(db, user.id, limit=5)[0]
    for notif in notifications[:2]:
        NotificationService.mark_as_read(db, notif.id, user.id)
    db.commit()
    
    # Filter for unread
    response = client.get(
        "/api/v1/notifications/me?is_read=false",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["notifications"]) == 3
    
    # Filter for read
    response = client.get(
        "/api/v1/notifications/me?is_read=true",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["notifications"]) == 2


def test_filtering_by_notification_type(client: TestClient, db: Session):
    """Test filtering notifications by type."""
    user = create_test_user(db, "user@example.com", UserRole.CLIENT)
    token = get_auth_token(client, "user@example.com", "SecurePass123")
    
    # Create notifications of different types
    NotificationService.create_notification(
        db,
        user_id=user.id,
        notification_type=NotificationType.NEW_MESSAGE,
        title="New message",
        message="Test message",
    )
    NotificationService.create_notification(
        db,
        user_id=user.id,
        notification_type=NotificationType.APPOINTMENT_REQUESTED,
        title="Appointment requested",
        message="Test message",
    )
    NotificationService.create_notification(
        db,
        user_id=user.id,
        notification_type=NotificationType.SYSTEM,
        title="System",
        message="Test message",
    )
    db.commit()
    
    # Filter for NEW_MESSAGE type
    response = client.get(
        "/api/v1/notifications/me?notification_type=new_message",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["notifications"]) == 1
    assert response.json()["notifications"][0]["notification_type"] == "new_message"


def test_new_client_message_notifies_agent(client: TestClient, db: Session):
    """Test that a new client message notifies the agent."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    
    # Create conversation
    create_response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )
    
    conversation_id = create_response.json()["id"]
    
    # Send message as client
    client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"content": "Hello agent"}
    )
    
    # Check that agent received notification
    response = client.get(
        "/api/v1/notifications/me",
        headers={"Authorization": f"Bearer {agent_token}"}
    )
    
    assert response.status_code == 200
    notifications = response.json()["notifications"]
    assert len(notifications) == 1
    assert notifications[0]["notification_type"] == "new_message"
    assert notifications[0]["data"]["conversation_id"] == conversation_id


def test_new_agent_message_notifies_client(client: TestClient, db: Session):
    """Test that a new agent message notifies the client."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    
    # Create conversation
    create_response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )
    
    conversation_id = create_response.json()["id"]
    
    # Send message as agent
    client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"content": "Hello client"}
    )
    
    # Check that client received notification
    response = client.get(
        "/api/v1/notifications/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    
    assert response.status_code == 200
    notifications = response.json()["notifications"]
    assert len(notifications) == 1
    assert notifications[0]["notification_type"] == "new_message"
    assert notifications[0]["data"]["conversation_id"] == conversation_id


def test_sender_is_not_notified(client: TestClient, db: Session):
    """Test that the sender is not notified of their own message."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    
    # Create conversation
    create_response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )
    
    conversation_id = create_response.json()["id"]
    
    # Send message as client
    client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"content": "Hello agent"}
    )
    
    # Check that client did NOT receive notification
    response = client.get(
        "/api/v1/notifications/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["notifications"]) == 0


def test_appointment_request_notifies_agent(client: TestClient, db: Session):
    """Test that an appointment request notifies the agent."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    
    # Create property
    from app.models.agent_property_type import PropertyType
    from app.models.property import ListingType
    from decimal import Decimal
    from app.schemas.property import PropertyAgentCreate
    from app.services.property_service import PropertyService
    
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
    property_obj = PropertyService.create_property_for_agent(db, agent.id, property_data)
    
    # Create appointment
    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)
    
    client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
            "client_notes": "I would like to view this property"
        }
    )
    
    # Check that agent received notification
    response = client.get(
        "/api/v1/notifications/me",
        headers={"Authorization": f"Bearer {agent_token}"}
    )
    
    assert response.status_code == 200
    notifications = response.json()["notifications"]
    assert len(notifications) == 1
    assert notifications[0]["notification_type"] == "appointment_requested"


def test_appointment_confirmation_notifies_client(client: TestClient, db: Session):
    """Test that appointment confirmation notifies the client."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")
    
    # Create property
    from app.models.agent_property_type import PropertyType
    from app.models.property import ListingType
    from decimal import Decimal
    from app.schemas.property import PropertyAgentCreate
    from app.services.property_service import PropertyService
    
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
    property_obj = PropertyService.create_property_for_agent(db, agent.id, property_data)
    
    # Create appointment
    scheduled_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_end = scheduled_start + timedelta(hours=1)
    
    create_response = client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "property_id": property_obj.id,
            "scheduled_start": scheduled_start.isoformat(),
            "scheduled_end": scheduled_end.isoformat(),
            "client_notes": "I would like to view this property"
        }
    )
    
    appointment_id = create_response.json()["id"]
    
    # Confirm appointment as agent
    client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"status": "confirmed"}
    )
    
    # Check that client received notification
    response = client.get(
        "/api/v1/notifications/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    
    assert response.status_code == 200
    notifications = response.json()["notifications"]
    # Client should have 1 notification: appointment_confirmed
    assert len(notifications) == 1
    assert any(n["notification_type"] == "appointment_confirmed" for n in notifications)


def test_unknown_notification_returns_404(client: TestClient, db: Session):
    """Test that unknown notification returns 404."""
    _user = create_test_user(db, "user@example.com", UserRole.CLIENT)
    token = get_auth_token(client, "user@example.com", "SecurePass123")
    
    # Try to mark unknown notification as read
    response = client.patch(
        "/api/v1/notifications/nonexistent-id/read",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 404
    
    # Try to delete unknown notification
    response = client.delete(
        "/api/v1/notifications/nonexistent-id",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 404
