import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class SavedSearch(Base, TimestampMixin):
    """Saved search model for client property search filters."""

    __tablename__ = "saved_searches"

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
    name: Mapped[str] = mapped_column(
        String(length=150),
        nullable=False,
    )
    filters: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )
    notifications_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    last_notified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="saved_searches",
    )

    # Indexes
    __table_args__ = (
        Index("ix_saved_searches_user_id", "user_id"),
        Index("ix_saved_searches_is_active", "is_active"),
        Index("ix_saved_searches_notifications_enabled", "notifications_enabled"),
        Index("ix_saved_searches_created_at", "created_at"),
    )
