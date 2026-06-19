import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.property import Property


class PropertyImage(Base, TimestampMixin):
    """Property image model with URL storage."""

    __tablename__ = "property_images"

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

    image_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    alt_text: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    # Relationships
    property: Mapped["Property"] = relationship(
        "Property",
        back_populates="images",
    )

    def __repr__(self) -> str:
        return (
            f"<PropertyImage("
            f"id={self.id}, "
            f"property_id={self.property_id}, "
            f"is_primary={self.is_primary}"
            f")>"
        )
