import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent import Agent
    from app.models.client_search_request import ClientSearchRequest
    from app.models.message import Message
    from app.models.property import Property
    from app.models.property_appointment import PropertyAppointment
    from app.models.user import User


class Conversation(Base, TimestampMixin):
    """Conversation between a client and an agent."""

    __tablename__ = "conversations"

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
    agent_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
    )
    property_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("properties.id", ondelete="SET NULL"),
        nullable=True,
    )
    search_request_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("client_search_requests.id", ondelete="SET NULL"),
        nullable=True,
    )
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    client_last_read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    agent_last_read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    client: Mapped["User"] = relationship(
        "User",
        foreign_keys=[client_id],
        back_populates="conversations_as_client",
    )
    agent: Mapped["Agent"] = relationship(
        "Agent",
        foreign_keys=[agent_id],
        back_populates="conversations",
    )
    property: Mapped["Property"] = relationship(
        "Property",
        foreign_keys=[property_id],
        back_populates="conversations",
    )
    search_request: Mapped["ClientSearchRequest"] = relationship(
        "ClientSearchRequest",
        foreign_keys=[search_request_id],
        back_populates="conversations",
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )
    appointments: Mapped[list["PropertyAppointment"]] = relationship(
        "PropertyAppointment",
        foreign_keys="PropertyAppointment.conversation_id",
        back_populates="conversation",
    )
