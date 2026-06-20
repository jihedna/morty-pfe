import uuid
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_property_type import AgentPropertyType
    from app.models.agent_territory import AgentTerritory
    from app.models.conversation import Conversation
    from app.models.property import Property
    from app.models.user import User


class AvailabilityStatus(str, Enum):
    """Agent availability status."""

    AVAILABLE = "available"
    BUSY = "busy"
    UNAVAILABLE = "unavailable"


class Agent(Base, TimestampMixin):
    """Agent profile model linked to a user account."""

    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    office: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    biography: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True,
    )

    years_experience: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    minimum_budget: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    maximum_budget: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    availability_status: Mapped[AvailabilityStatus] = mapped_column(
        String(20),
        nullable=False,
        default=AvailabilityStatus.AVAILABLE,
    )

    active_lead_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    success_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    closed_deals: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    languages: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    territories: Mapped[list["AgentTerritory"]] = relationship(
        "AgentTerritory",
        back_populates="agent",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    property_types: Mapped[list["AgentPropertyType"]] = relationship(
        "AgentPropertyType",
        back_populates="agent",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    properties: Mapped[list["Property"]] = relationship(
        "Property",
        back_populates="agent",
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="agent",
    )

    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        foreign_keys="Conversation.agent_id",
        back_populates="agent",
    )

    def __repr__(self) -> str:
        return (
            f"<Agent("
            f"id={self.id}, "
            f"user_id={self.user_id}, "
            f"office={self.office}, "
            f"availability={self.availability_status}"
            f")>"
        )
