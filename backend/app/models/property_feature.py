import uuid
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.property import Property


class PropertyFeatureEnum(str, Enum):
    """Property features and amenities."""
    PARKING = "parking"
    ELEVATOR = "elevator"
    BALCONY = "balcony"
    TERRACE = "terrace"
    GARDEN = "garden"
    POOL = "pool"
    AIR_CONDITIONING = "air_conditioning"
    CENTRAL_HEATING = "central_heating"
    SECURITY_SYSTEM = "security_system"
    SEA_VIEW = "sea_view"
    STORAGE_ROOM = "storage_room"
    ACCESSIBLE_ENTRY = "accessible_entry"


class PropertyFeature(Base, TimestampMixin):
    """Property feature model."""

    __tablename__ = "property_features"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    property_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    feature: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    # Relationships
    property: Mapped["Property"] = relationship(
        "Property",
        back_populates="features",
    )

    def __repr__(self) -> str:
        return (
            f"<PropertyFeature("
            f"id={self.id}, "
            f"property_id={self.property_id}, "
            f"feature={self.feature}"
            f")>"
        )
