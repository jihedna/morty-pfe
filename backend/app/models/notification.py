import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(str, Enum):
    """Notification type enumeration."""

    NEW_MESSAGE = "new_message"
    APPOINTMENT_REQUESTED = "appointment_requested"
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    APPOINTMENT_COMPLETED = "appointment_completed"
    APPOINTMENT_NO_SHOW = "appointment_no_show"
    AGENT_MATCH_AVAILABLE = "agent_match_available"
    PROPERTY_STATUS_CHANGED = "property_status_changed"
    SYSTEM = "system"


class Notification(Base, TimestampMixin):
    """In-app notification model."""

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String(length=36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(length=36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    notification_type: Mapped[str] = mapped_column(
        String(length=50),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(length=200),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(
        String(length=2000),
        nullable=False,
    )
    data: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    is_read: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
    )
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="notifications",
    )

    # Indexes
    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_is_read", "is_read"),
        Index("ix_notifications_notification_type", "notification_type"),
        Index("ix_notifications_created_at", "created_at"),
    )
