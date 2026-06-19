import uuid
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent import Agent


class PropertyType(str, Enum):
    """Property types for agent specialization."""

    APARTMENT = "apartment"
    VILLA = "villa"
    COMMERCIAL = "commercial"
    LAND = "land"
    OFFICE = "office"


class AgentPropertyType(Base, TimestampMixin):
    """Agent property type specialization with expertise score."""

    __tablename__ = "agent_property_types"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    agent_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    property_type: Mapped[PropertyType] = mapped_column(
        String(20),
        nullable=False,
    )

    expertise_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    agent: Mapped["Agent"] = relationship(
        "Agent",
        back_populates="property_types",
    )

    def __repr__(self) -> str:
        return (
            f"<AgentPropertyType("
            f"id={self.id}, "
            f"agent_id={self.agent_id}, "
            f"property_type={self.property_type}, "
            f"score={self.expertise_score}"
            f")>"
        )
