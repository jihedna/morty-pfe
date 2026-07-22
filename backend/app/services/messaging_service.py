from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.notification import NotificationType
from app.schemas.messaging import (
    ConversationCreate,
    ConversationUpdate,
    MessageCreate,
)
from app.services.agent_service import AgentService
from app.services.lead_scoring_service import LeadScoringService
from app.services.notification_service import NotificationService
from app.services.property_service import PropertyService
from app.services.user_service import UserService


class MessagingService:
    """Service for client-agent messaging."""

    @staticmethod
    def get_conversation_by_id(
        db: Session,
        conversation_id: str,
    ) -> Conversation | None:
        """Return a conversation by ID."""
        return (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )

    @staticmethod
    def get_user_conversations(
        db: Session,
        user_id: str,
        is_active: bool | None = None,
    ) -> list[Conversation]:
        """Return all conversations for a user (as client or agent)."""
        from app.models.agent import Agent
        
        # Get conversations where user is client
        client_conversations = (
            db.query(Conversation)
            .filter(Conversation.client_id == user_id)
        )
        
        # Get conversations where user is agent (via Agent table)
        agent_obj = db.query(Agent).filter(Agent.user_id == user_id).first()
        if agent_obj:
            agent_conversations = (
                db.query(Conversation)
                .filter(Conversation.agent_id == agent_obj.id)
            )
            # Combine queries using union
            query = client_conversations.union(agent_conversations)
        else:
            query = client_conversations

        if is_active is not None:
            query = query.filter(Conversation.is_active == is_active)

        return query.order_by(Conversation.updated_at.desc()).all()

    @staticmethod
    def get_all_conversations(
        db: Session,
        is_active: bool | None = None,
    ) -> list[Conversation]:
        """Return all conversations (manager only)."""
        query = db.query(Conversation)

        if is_active is not None:
            query = query.filter(Conversation.is_active == is_active)

        return query.order_by(Conversation.updated_at.desc()).all()

    @staticmethod
    def get_conversation_messages(
        db: Session,
        conversation_id: str,
        include_deleted: bool = False,
    ) -> list[Message]:
        """Return messages for a conversation, ordered oldest to newest."""
        query = db.query(Message).filter(
            Message.conversation_id == conversation_id
        )

        if not include_deleted:
            query = query.filter(Message.is_deleted.is_(False))

        return query.order_by(Message.created_at).all()

    @staticmethod
    def get_unread_count(
        db: Session,
        user_id: str,
    ) -> int:
        """Return unread message count for a user."""
        # Get all conversations where user is participant
        conversations = db.query(Conversation).filter(
            (Conversation.client_id == user_id)
            | (Conversation.agent_id == user_id)
        ).all()

        unread_count = 0

        for conv in conversations:
            # Determine which read timestamp to use
            if conv.client_id == user_id:
                last_read_at = conv.client_last_read_at
            else:
                last_read_at = conv.agent_last_read_at

            # Count messages sent after last read
            if last_read_at:
                unread = (
                    db.query(Message)
                    .filter(
                        Message.conversation_id == conv.id,
                        Message.is_deleted.is_(False),
                        Message.sender_user_id != user_id,
                        Message.created_at > last_read_at,
                    )
                    .count()
                )
            else:
                unread = (
                    db.query(Message)
                    .filter(
                        Message.conversation_id == conv.id,
                        Message.is_deleted.is_(False),
                        Message.sender_user_id != user_id,
                    )
                    .count()
                )

            unread_count += unread

        return unread_count

    @staticmethod
    def create_conversation(
        db: Session,
        client_id: str,
        conversation_data: ConversationCreate,
    ) -> Conversation:
        """Create a new conversation or return existing active one."""
        # Check if user is a client
        user = UserService.get_user_by_id(db, client_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        from app.core.permissions import UserRole

        if user.role != UserRole.CLIENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can start conversations",
            )

        # Check if agent exists and is active
        agent = AgentService.get_agent_by_id(db, conversation_data.agent_id)
        if agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        if not agent.user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent is not active",
            )

        # Check for duplicate active conversation (scoped to same property if provided)
        dup_filters = [
            Conversation.client_id == client_id,
            Conversation.agent_id == conversation_data.agent_id,
            Conversation.is_active.is_(True),
        ]
        if conversation_data.property_id:
            dup_filters.append(Conversation.property_id == conversation_data.property_id)
        else:
            dup_filters.append(Conversation.property_id.is_(None))

        existing = db.query(Conversation).filter(*dup_filters).first()

        if existing:
            if existing.search_request_id:
                LeadScoringService.recalculate_request_score(
                    db, existing.search_request_id
                )
                db.commit()
            return existing

        # Validate optional foreign keys
        if conversation_data.property_id:
            property_obj = PropertyService.get_property_by_id(
                db,
                conversation_data.property_id,
            )
            if property_obj is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Property not found",
                )

        db_conversation = Conversation(
            client_id=client_id,
            agent_id=conversation_data.agent_id,
            subject=conversation_data.subject,
            property_id=conversation_data.property_id,
            search_request_id=conversation_data.search_request_id,
            is_active=True,
        )

        db.add(db_conversation)
        db.flush()
        if db_conversation.search_request_id:
            LeadScoringService.recalculate_request_score(
                db, db_conversation.search_request_id
            )
        db.commit()
        db.refresh(db_conversation)
        return db_conversation

    @staticmethod
    def create_agent_lead_conversation(
        db: Session,
        agent_id: str,
        client_id: str,
        search_request_id: str,
        subject: str,
    ) -> Conversation:
        """Create or reuse the conversation for an agent's client lead."""
        existing = (
            db.query(Conversation)
            .filter(
                Conversation.agent_id == agent_id,
                Conversation.client_id == client_id,
                Conversation.search_request_id == search_request_id,
                Conversation.is_active.is_(True),
            )
            .first()
        )
        if existing:
            return existing

        conversation = Conversation(
            client_id=client_id,
            agent_id=agent_id,
            search_request_id=search_request_id,
            subject=subject[:200],
            is_active=True,
        )
        db.add(conversation)
        db.flush()
        LeadScoringService.recalculate_request_score(db, search_request_id)
        db.commit()
        db.refresh(conversation)
        return conversation

    @staticmethod
    def update_conversation(
        db: Session,
        conversation_id: str,
        conversation_data: ConversationUpdate,
    ) -> Conversation:
        """Update a conversation."""
        db_conversation = MessagingService.get_conversation_by_id(
            db,
            conversation_id,
        )
        if db_conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        update_data = conversation_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_conversation, field, value)

        db.flush()
        if db_conversation.search_request_id:
            LeadScoringService.recalculate_request_score(
                db, db_conversation.search_request_id
            )
        db.commit()
        db.refresh(db_conversation)
        return db_conversation

    @staticmethod
    def delete_conversation(
        db: Session,
        conversation_id: str,
    ) -> Conversation:
        """Deactivate a conversation (soft delete)."""
        db_conversation = MessagingService.get_conversation_by_id(
            db,
            conversation_id,
        )
        if db_conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        db_conversation.is_active = False
        db.flush()
        if db_conversation.search_request_id:
            LeadScoringService.recalculate_request_score(
                db, db_conversation.search_request_id
            )
        db.commit()
        db.refresh(db_conversation)
        return db_conversation

    @staticmethod
    def create_message(
        db: Session,
        conversation_id: str,
        sender_user_id: str,
        message_data: MessageCreate,
    ) -> Message:
        """Create a new message in a conversation."""
        db_conversation = MessagingService.get_conversation_by_id(
            db,
            conversation_id,
        )
        if db_conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        if not db_conversation.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send message to inactive conversation",
            )

        # Resolve agent user_id from agent_id
        agent_obj = db.query(Agent).filter(Agent.id == db_conversation.agent_id).first()
        agent_user_id = agent_obj.user_id if agent_obj else None

        # Check if sender is client or agent in this conversation
        if (
            sender_user_id != db_conversation.client_id
            and sender_user_id != agent_user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant in this conversation",
            )

        db_message = Message(
            conversation_id=conversation_id,
            sender_user_id=sender_user_id,
            content=message_data.content,
            is_deleted=False,
        )

        db.add(db_message)
        db.flush()
        db.refresh(db_message)

        if db_conversation.search_request_id:
            LeadScoringService.recalculate_request_score(
                db, db_conversation.search_request_id
            )

        # Create notification for the recipient
        recipient_user_id = None
        if sender_user_id == db_conversation.client_id:
            recipient_user_id = agent_user_id
        elif sender_user_id == agent_user_id:
            recipient_user_id = db_conversation.client_id

        if recipient_user_id:
            NotificationService.create_notification(
                db,
                user_id=recipient_user_id,
                notification_type=NotificationType.NEW_MESSAGE,
                title="New message",
                message="You have received a new message",
                data={
                    "conversation_id": conversation_id,
                    "message_id": db_message.id,
                },
            )

        db.commit()
        db.refresh(db_message)
        return db_message

    @staticmethod
    def delete_message(
        db: Session,
        message_id: str,
        user_id: str,
        is_manager: bool = False,
    ) -> Message:
        """Soft delete a message."""
        db_message = (
            db.query(Message).filter(Message.id == message_id).first()
        )
        if db_message is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        # Users can only delete their own messages, managers can delete any
        if not is_manager and db_message.sender_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own messages",
            )

        db_message.is_deleted = True
        db.commit()
        db.refresh(db_message)
        return db_message

    @staticmethod
    def mark_conversation_read(
        db: Session,
        conversation_id: str,
        user_id: str,
    ) -> Conversation:
        """Mark a conversation as read for a user."""
        db_conversation = MessagingService.get_conversation_by_id(
            db,
            conversation_id,
        )
        if db_conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        # Resolve agent user_id
        agent_obj = db.query(Agent).filter(Agent.id == db_conversation.agent_id).first()
        agent_user_id = agent_obj.user_id if agent_obj else None

        # Check if user is participant
        if (
            user_id != db_conversation.client_id
            and user_id != agent_user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant in this conversation",
            )

        now = datetime.now(UTC)

        if user_id == db_conversation.client_id:
            db_conversation.client_last_read_at = now
        else:
            db_conversation.agent_last_read_at = now

        db.commit()
        db.refresh(db_conversation)
        return db_conversation
