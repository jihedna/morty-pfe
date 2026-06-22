import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.property import Property
    from app.models.user import User


class PropertyFavorite(Base, TimestampMixin):
    """Property favorite model for client bookmarked properties."""

    __tablename__ = "property_favorites"

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
    property_id: Mapped[str] = mapped_column(
        String(length=36),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="favorites",
    )
    property: Mapped["Property"] = relationship(
        "Property",
        back_populates="favorites",
    )

    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("user_id", "property_id", name="uq_user_property_favorite"),
        Index("ix_property_favorites_user_id", "user_id"),
        Index("ix_property_favorites_property_id", "property_id"),
        Index("ix_property_favorites_created_at", "created_at"),
    )
