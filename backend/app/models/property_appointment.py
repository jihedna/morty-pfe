import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent import Agent
    from app.models.conversation import Conversation
    from app.models.property import Property
    from app.models.user import User


class AppointmentStatus(str, Enum):
    """Appointment status enumeration."""
    REQUESTED = "requested"
    CONFIRMED = "confirmed"
    RESCHEDULED = "rescheduled"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class PropertyAppointment(Base, TimestampMixin):
    """Property viewing appointment model."""

    __tablename__ = "property_appointments"

    id: Mapped[str] = mapped_column(
        String(length=36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    client_id: Mapped[str] = mapped_column(
        String(length=36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    agent_id: Mapped[str] = mapped_column(
        String(length=36),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
    )
    property_id: Mapped[str] = mapped_column(
        String(length=36),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
    )
    conversation_id: Mapped[str | None] = mapped_column(
        String(length=36),
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
    )
    scheduled_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    scheduled_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(length=20),
        nullable=False,
        default=AppointmentStatus.REQUESTED.value,
    )
    client_notes: Mapped[str | None] = mapped_column(
        Text(),
        nullable=True,
    )
    agent_notes: Mapped[str | None] = mapped_column(
        Text(),
        nullable=True,
    )
    cancellation_reason: Mapped[str | None] = mapped_column(
        String(length=1000),
        nullable=True,
    )

    # Relationships
    client: Mapped["User"] = relationship(
        "User",
        foreign_keys=[client_id],
        back_populates="appointments_as_client",
    )
    agent: Mapped["Agent"] = relationship(
        "Agent",
        foreign_keys=[agent_id],
        back_populates="appointments",
    )
    property: Mapped["Property"] = relationship(
        "Property",
        foreign_keys=[property_id],
        back_populates="appointments",
    )
    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        foreign_keys=[conversation_id],
        back_populates="appointments",
    )

    # Indexes
    __table_args__ = (
        Index("ix_property_appointments_client_id", "client_id"),
        Index("ix_property_appointments_agent_id", "agent_id"),
        Index("ix_property_appointments_property_id", "property_id"),
        Index("ix_property_appointments_conversation_id", "conversation_id"),
        Index("ix_property_appointments_status", "status"),
        Index("ix_property_appointments_scheduled_start", "scheduled_start"),
        Index("ix_property_appointments_scheduled_end", "scheduled_end"),
    )
