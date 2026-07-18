from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_client,
    get_current_manager,
    get_current_user,
    get_db,
)
from app.core.permissions import UserRole
from app.schemas.messaging import (
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    ConversationWithMessages,
    MessageCreate,
    MessageResponse,
    UnreadCountResponse,
)
from app.models.agent import Agent
from app.services.interaction_tracking_service import InteractionTrackingService
from app.services.messaging_service import MessagingService

router = APIRouter()


def _authorize_conversation_access(
    db: Session,
    current_user: dict,
    conversation_id: str,
) -> tuple:
    """Return conversation and check access permissions."""
    conversation = MessagingService.get_conversation_by_id(
        db,
        conversation_id,
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    # Check if user is participant or manager
    is_manager = current_user["role"] == UserRole.MANAGER.value
    agent_obj = db.query(Agent).filter(Agent.id == conversation.agent_id).first()
    agent_user_id = agent_obj.user_id if agent_obj else None
    is_participant = (
        current_user["id"] == conversation.client_id
        or current_user["id"] == agent_user_id
    )

    if not is_manager and not is_participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this conversation",
        )

    return conversation, is_manager


@router.post(
    "",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    conversation_data: ConversationCreate,
    current_user: dict = Depends(get_current_client),
    db: Session = Depends(get_db),
) -> ConversationResponse:
    """Create a new conversation (client only)."""
    conversation = MessagingService.create_conversation(
        db,
        current_user["id"],
        conversation_data,
    )
    InteractionTrackingService.track(
        db,
        current_user["id"],
        "conversation_created",
        property_id=conversation.property_id,
        agent_id=conversation.agent_id,
        search_request_id=conversation.search_request_id,
        event_value=str(conversation.id),
        commit=True,
    )
    return ConversationResponse.model_validate(conversation)


@router.get("/me", response_model=list[ConversationResponse])
def get_my_conversations(
    current_user: dict = Depends(get_current_user),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ConversationResponse]:
    """Return the authenticated user's conversations."""
    conversations = MessagingService.get_user_conversations(
        db,
        current_user["id"],
        is_active=is_active,
    )
    return [
        ConversationResponse.model_validate(conv)
        for conv in conversations
    ]


@router.get("/admin/all", response_model=list[ConversationResponse])
def get_all_conversations(
    _current_user: dict = Depends(get_current_manager),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ConversationResponse]:
    """Return all conversations (manager only)."""
    conversations = MessagingService.get_all_conversations(
        db,
        is_active=is_active,
    )
    return [
        ConversationResponse.model_validate(conv)
        for conv in conversations
    ]


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UnreadCountResponse:
    """Return unread message count for the authenticated user."""
    count = MessagingService.get_unread_count(db, current_user["id"])
    return UnreadCountResponse(unread_count=count)


@router.get(
    "/{conversation_id}",
    response_model=ConversationWithMessages,
)
def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationWithMessages:
    """Return a specific conversation with messages."""
    conversation, _is_manager = _authorize_conversation_access(
        db,
        current_user,
        conversation_id,
    )

    messages = MessagingService.get_conversation_messages(
        db,
        conversation_id,
        include_deleted=False,
    )

    return ConversationWithMessages(
        **ConversationResponse.model_validate(conversation).model_dump(),
        messages=[MessageResponse.model_validate(msg) for msg in messages],
    )


@router.patch(
    "/{conversation_id}",
    response_model=ConversationResponse,
)
def update_conversation(
    conversation_id: str,
    conversation_data: ConversationUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationResponse:
    """Update a conversation."""
    conversation, is_manager = _authorize_conversation_access(
        db,
        current_user,
        conversation_id,
    )

    # Only participants can update their own conversations
    if not is_manager:
        if current_user["id"] != conversation.client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the client can update the conversation",
            )

    updated_conversation = MessagingService.update_conversation(
        db,
        conversation_id,
        conversation_data,
    )
    return ConversationResponse.model_validate(updated_conversation)


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Deactivate a conversation (soft delete)."""
    conversation, is_manager = _authorize_conversation_access(
        db,
        current_user,
        conversation_id,
    )

    # Only participants can delete their own conversations
    if not is_manager:
        if current_user["id"] != conversation.client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the client can delete the conversation",
            )

    MessagingService.delete_conversation(db, conversation_id)


@router.post(
    "/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_message(
    conversation_id: str,
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Create a new message in a conversation."""
    # Managers cannot send messages
    if current_user["role"] == UserRole.MANAGER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers cannot send messages",
        )

    conversation = MessagingService.get_conversation_by_id(
        db,
        conversation_id,
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    # Check if user is participant
    is_participant = (
        current_user["id"] == conversation.client_id
        or current_user["id"] == conversation.agent.user_id
    )

    if not is_participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this conversation",
        )

    message = MessagingService.create_message(
        db,
        conversation_id,
        current_user["id"],
        message_data,
    )
    InteractionTrackingService.track(
        db,
        current_user["id"],
        "message_sent",
        property_id=conversation.property_id,
        agent_id=conversation.agent_id,
        search_request_id=conversation.search_request_id,
        event_value=str(conversation.id),
        commit=True,
    )
    return MessageResponse.model_validate(message)


@router.get(
    "/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def get_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MessageResponse]:
    """Return messages for a conversation."""
    _authorize_conversation_access(db, current_user, conversation_id)

    messages = MessagingService.get_conversation_messages(
        db,
        conversation_id,
        include_deleted=False,
    )
    return [MessageResponse.model_validate(msg) for msg in messages]


@router.delete(
    "/{conversation_id}/messages/{message_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_message(
    conversation_id: str,
    message_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Soft delete a message."""
    _authorize_conversation_access(db, current_user, conversation_id)

    is_manager = current_user["role"] == UserRole.MANAGER.value
    MessagingService.delete_message(
        db,
        message_id,
        current_user["id"],
        is_manager=is_manager,
    )


@router.patch(
    "/{conversation_id}/read",
    response_model=ConversationResponse,
)
def mark_conversation_read(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationResponse:
    """Mark a conversation as read for the authenticated user."""
    conversation = MessagingService.mark_conversation_read(
        db,
        conversation_id,
        current_user["id"],
    )
    return ConversationResponse.model_validate(conversation)
