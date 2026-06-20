from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ConversationBase(BaseModel):
    """Shared conversation fields."""

    subject: str = Field(..., min_length=1, max_length=200)
    property_id: str | None = None
    search_request_id: str | None = None


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation."""

    agent_id: str


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation."""

    subject: str | None = Field(None, min_length=1, max_length=200)
    is_active: bool | None = None


class ConversationResponse(ConversationBase):
    """Conversation response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    client_id: str
    agent_id: str
    is_active: bool
    client_last_read_at: datetime | None
    agent_last_read_at: datetime | None
    created_at: datetime
    updated_at: datetime


class MessageBase(BaseModel):
    """Shared message fields."""

    content: str = Field(..., min_length=1)

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        """Ensure content is not empty or whitespace only."""
        if not v.strip():
            raise ValueError("Message content cannot be empty")
        return v


class MessageCreate(MessageBase):
    """Schema for creating a message."""


class MessageResponse(MessageBase):
    """Message response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    sender_user_id: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class ConversationWithMessages(ConversationResponse):
    """Conversation with messages included."""

    messages: list[MessageResponse]


class UnreadCountResponse(BaseModel):
    """Unread message count response."""

    unread_count: int
