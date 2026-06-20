from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.services.user_service import UserService
from app.services.agent_service import AgentService
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


def test_client_can_create_conversation(client: TestClient, db: Session):
    """Test that a client can create a conversation."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )

    assert response.status_code == 201
    assert response.json()["subject"] == "Property inquiry"
    assert response.json()["client_id"] == client_user.id
    assert response.json()["agent_id"] == agent.id
    assert response.json()["is_active"] is True


def test_non_client_cannot_create_conversation(client: TestClient, db: Session):
    """Test that non-clients cannot create conversations."""
    agent_user, agent = create_test_agent(db, "agent@example.com")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )

    assert response.status_code == 403


def test_manager_cannot_create_conversation(client: TestClient, db: Session):
    """Test that managers cannot create conversations."""
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    agent_user, agent = create_test_agent(db, "agent@example.com")

    response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )

    assert response.status_code == 403


def test_cannot_create_conversation_with_inactive_agent(client: TestClient, db: Session):
    """Test that conversation cannot be created with inactive agent."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    # Deactivate agent user
    agent_user.is_active = False
    db.commit()
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )

    assert response.status_code == 400


def test_duplicate_active_conversation_returns_existing(client: TestClient, db: Session):
    """Test that duplicate active conversation returns existing one."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create first conversation
    response1 = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )

    conversation_id = response1.json()["id"]

    # Try to create duplicate
    response2 = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Another inquiry"
        }
    )

    assert response2.status_code == 201
    assert response2.json()["id"] == conversation_id


def test_client_can_get_own_conversations(client: TestClient, db: Session):
    """Test that a client can get their own conversations."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")

    # Create conversation
    client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )

    # Get own conversations
    response = client.get(
        "/api/v1/conversations/me",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["client_id"] == client_user.id


def test_agent_can_get_own_conversations(client: TestClient, db: Session):
    """Test that an agent can get their own conversations."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    agent_token = get_auth_token(client, "agent@example.com", "SecurePass123")

    # Create conversation
    client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )

    # Get conversations as agent
    response = client.get(
        "/api/v1/conversations/me",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["agent_id"] == agent.id


def test_non_participant_cannot_access_conversation(client: TestClient, db: Session):
    """Test that non-participant cannot access a conversation."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")

    # Create conversation as client1
    create_response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )

    conversation_id = create_response.json()["id"]

    # Try to access as client2
    response = client.get(
        f"/api/v1/conversations/{conversation_id}",
        headers={"Authorization": f"Bearer {client2_token}"}
    )

    assert response.status_code == 403


def test_manager_can_access_all_conversations(client: TestClient, db: Session):
    """Test that managers can access all conversations."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

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

    # Access as manager
    response = client.get(
        f"/api/v1/conversations/{conversation_id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    assert response.json()["id"] == conversation_id


def test_manager_can_list_all_conversations(client: TestClient, db: Session):
    """Test that managers can list all conversations."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

    # Create conversations
    client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Inquiry 1"
        }
    )

    client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client2_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Inquiry 2"
        }
    )

    # List all as manager
    response = client.get(
        "/api/v1/conversations/admin/all",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_empty_message_returns_422(client: TestClient, db: Session):
    """Test that empty message returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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

    # Try to send empty message
    response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "content": "   "
        }
    )

    assert response.status_code == 422


def test_whitespace_only_message_returns_422(client: TestClient, db: Session):
    """Test that whitespace-only message returns 422."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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

    # Try to send whitespace-only message
    response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "content": "\n\t"
        }
    )

    assert response.status_code == 422


def test_client_can_send_message(client: TestClient, db: Session):
    """Test that a client can send a message."""
    client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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

    # Send message
    response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={
            "content": "Hello, I'm interested in this property"
        }
    )

    assert response.status_code == 201
    assert response.json()["content"] == "Hello, I'm interested in this property"
    assert response.json()["sender_user_id"] == client_user.id


def test_agent_can_send_message(client: TestClient, db: Session):
    """Test that an agent can send a message."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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
    response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "content": "Hi, how can I help you?"
        }
    )

    assert response.status_code == 201
    assert response.json()["content"] == "Hi, how can I help you?"
    assert response.json()["sender_user_id"] == agent_user.id


def test_manager_cannot_send_message(client: TestClient, db: Session):
    """Test that managers cannot send messages."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

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

    # Try to send message as manager
    response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "content": "Manager message"
        }
    )

    assert response.status_code == 403


def test_non_participant_cannot_send_message(client: TestClient, db: Session):
    """Test that non-participant cannot send a message."""
    _client1 = create_test_user(db, "client1@example.com", UserRole.CLIENT)
    _client2 = create_test_user(db, "client2@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client1_token = get_auth_token(client, "client1@example.com", "SecurePass123")
    client2_token = get_auth_token(client, "client2@example.com", "SecurePass123")

    # Create conversation as client1
    create_response = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {client1_token}"},
        json={
            "agent_id": agent.id,
            "subject": "Property inquiry"
        }
    )

    conversation_id = create_response.json()["id"]

    # Try to send message as client2
    response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client2_token}"},
        json={
            "content": "Interloper message"
        }
    )

    assert response.status_code == 403


def test_messages_ordered_oldest_to_newest(client: TestClient, db: Session):
    """Test that messages are ordered oldest to newest."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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

    # Send multiple messages
    client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"content": "First message"}
    )

    client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"content": "Second message"}
    )

    client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"content": "Third message"}
    )

    # Get messages
    response = client.get(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    messages = response.json()
    assert len(messages) == 3
    assert messages[0]["content"] == "First message"
    assert messages[1]["content"] == "Second message"
    assert messages[2]["content"] == "Third message"


def test_soft_deletion_of_conversation(client: TestClient, db: Session):
    """Test that conversation deletion is soft deletion."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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

    # Delete conversation
    response = client.delete(
        f"/api/v1/conversations/{conversation_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 204

    # Conversation should still exist but be inactive
    get_response = client.get(
        f"/api/v1/conversations/{conversation_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert get_response.status_code == 200
    assert get_response.json()["is_active"] is False


def test_soft_deletion_of_message(client: TestClient, db: Session):
    """Test that message deletion is soft deletion."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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

    # Send message
    message_response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"content": "Test message"}
    )

    message_id = message_response.json()["id"]

    # Delete message
    response = client.delete(
        f"/api/v1/conversations/{conversation_id}/messages/{message_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 204

    # Message should still exist but be marked as deleted
    get_response = client.get(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert get_response.status_code == 200
    assert len(get_response.json()) == 0  # Deleted messages are excluded by default


def test_user_can_only_delete_own_messages(client: TestClient, db: Session):
    """Test that users can only delete their own messages."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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
    message_response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"content": "Client message"}
    )

    message_id = message_response.json()["id"]

    # Try to delete as agent
    response = client.delete(
        f"/api/v1/conversations/{conversation_id}/messages/{message_id}",
        headers={"Authorization": f"Bearer {agent_token}"}
    )

    assert response.status_code == 403


def test_manager_can_delete_any_message(client: TestClient, db: Session):
    """Test that managers can delete any message."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    _manager_user = create_test_user(db, "manager@example.com", UserRole.MANAGER)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
    client_token = get_auth_token(client, "client@example.com", "SecurePass123")
    manager_token = get_auth_token(client, "manager@example.com", "SecurePass123")

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
    message_response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"content": "Client message"}
    )

    message_id = message_response.json()["id"]

    # Delete as manager
    response = client.delete(
        f"/api/v1/conversations/{conversation_id}/messages/{message_id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )

    assert response.status_code == 204


def test_mark_conversation_read(client: TestClient, db: Session):
    """Test marking a conversation as read."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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

    # Mark as read
    response = client.patch(
        f"/api/v1/conversations/{conversation_id}/read",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert response.json()["client_last_read_at"] is not None


def test_unread_count(client: TestClient, db: Session):
    """Test unread message count."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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
        json={"content": "Agent message"}
    )

    # Get unread count as client
    response = client.get(
        "/api/v1/conversations/unread-count",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    assert response.status_code == 200
    assert response.json()["unread_count"] == 1


def test_cannot_send_message_to_inactive_conversation(client: TestClient, db: Session):
    """Test that messages cannot be sent to inactive conversations."""
    _client_user = create_test_user(db, "client@example.com", UserRole.CLIENT)
    agent_user, agent = create_test_agent(db, "agent@example.com")
    
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

    # Deactivate conversation
    client.delete(
        f"/api/v1/conversations/{conversation_id}",
        headers={"Authorization": f"Bearer {client_token}"}
    )

    # Try to send message
    response = client.post(
        f"/api/v1/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {client_token}"},
        json={"content": "Test message"}
    )

    assert response.status_code == 400
