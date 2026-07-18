"""User interaction event tracking model.

Records implicit and explicit user interactions with properties for
ML training purposes. Does not log message contents, passwords, tokens,
or private chatbot content.

Data retention: interactions are retained for ML training and improvement.
Purpose: property recommendation and lead-conversion prediction.
Privacy: no personally identifying content is stored — only event types,
property IDs, and timestamps.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    pass


class UserInteraction(Base, TimestampMixin):
    """General user interaction event for ML training."""

    __tablename__ = "user_interactions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    property_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("properties.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    search_request_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("client_search_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    agent_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    event_value: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    metadata_json: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.utcnow(),
        index=True,
    )

    __table_args__ = (
        Index("ix_user_interactions_user_event", "user_id", "event_type"),
    )

    def __repr__(self) -> str:
        return (
            f"<UserInteraction("
            f"id={self.id}, "
            f"user_id={self.user_id}, "
            f"event_type={self.event_type}, "
            f"property_id={self.property_id}"
            f")>"
        )
