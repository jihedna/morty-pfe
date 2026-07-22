import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.user import User


class ClientSearchRequest(Base, TimestampMixin):
    """Client property search request."""

    __tablename__ = "client_search_requests"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    client_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    property_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("properties.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    property_type: Mapped[str] = mapped_column(String(20), nullable=False)
    listing_type: Mapped[str] = mapped_column(String(10), nullable=False)
    minimum_budget: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )
    maximum_budget: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )
    preferred_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preferred_district: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    minimum_bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    minimum_bathrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    minimum_area_sqm: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    urgency: Mapped[str | None] = mapped_column(String(20), nullable=True, default="medium")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    lead_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        default=None,
    )
    qualification_level: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        default=None,
    )
    lead_score_reasons: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        default=None,
    )
    lead_score_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    client: Mapped["User"] = relationship(
        "User",
        back_populates="search_requests",
    )

    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        foreign_keys="Conversation.search_request_id",
        back_populates="search_request",
    )
