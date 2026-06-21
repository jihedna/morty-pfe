from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    """Schema for notification response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    notification_type: str
    title: str
    message: str
    data: dict[str, Any] | None = None
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class NotificationListResponse(BaseModel):
    """Schema for notification list response."""

    model_config = ConfigDict(from_attributes=True)

    notifications: list[NotificationResponse]
    total: int
    skip: int
    limit: int


class UnreadCountResponse(BaseModel):
    """Schema for unread count response."""

    model_config = ConfigDict(from_attributes=True)

    unread_count: int


class MarkAllReadResponse(BaseModel):
    """Schema for mark all read response."""

    model_config = ConfigDict(from_attributes=True)

    marked_count: int
