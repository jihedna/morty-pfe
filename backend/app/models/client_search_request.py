import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
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
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    client: Mapped["User"] = relationship(
        "User",
        back_populates="search_requests",
    )
