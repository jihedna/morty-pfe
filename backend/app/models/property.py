import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent import Agent
    from app.models.property_feature import PropertyFeature
    from app.models.property_image import PropertyImage


class ListingType(str, Enum):
    """Property listing type."""

    SALE = "sale"
    RENT = "rent"


class PropertyStatus(str, Enum):
    """Property status."""

    DRAFT = "draft"
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    RENTED = "rented"
    ARCHIVED = "archived"


class Currency(str, Enum):
    """Supported currency."""

    TND = "TND"


class Property(Base, TimestampMixin):
    """Property model linked to an agent profile."""

    __tablename__ = "properties"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    reference_code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )

    agent_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(5000),
        nullable=True,
    )

    property_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    listing_type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=PropertyStatus.DRAFT.value,
        index=True,
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        index=True,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default=Currency.TND.value,
    )

    area_sqm: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    land_area_sqm: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    rooms: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    bedrooms: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    bathrooms: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    floor_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    total_floors: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    construction_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    is_furnished: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    address_line: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    district: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    governorate: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    postal_code: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    latitude: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 8),
        nullable=True,
    )

    longitude: Mapped[Decimal | None] = mapped_column(
        Numeric(11, 8),
        nullable=True,
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    agent: Mapped["Agent"] = relationship(
        "Agent",
        back_populates="properties",
    )

    images: Mapped[list["PropertyImage"]] = relationship(
        "PropertyImage",
        back_populates="property",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    features: Mapped[list["PropertyFeature"]] = relationship(
        "PropertyFeature",
        back_populates="property",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return (
            f"<Property("
            f"id={self.id}, "
            f"reference_code={self.reference_code}, "
            f"title={self.title}, "
            f"status={self.status}"
            f")>"
        )
