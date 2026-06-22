import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum as SQLEnum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.permissions import UserRole
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent import Agent
    from app.models.client_search_request import ClientSearchRequest
    from app.models.conversation import Conversation
    from app.models.notification import Notification
    from app.models.property_appointment import PropertyAppointment
    from app.models.property_favorite import PropertyFavorite
    from app.models.saved_search import SavedSearch


class User(Base, TimestampMixin):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        SQLEnum(
            UserRole,
            name="userrole",
            values_callable=lambda enum_class: [
                role.value for role in enum_class
            ],
            validate_strings=True,
        ),
        nullable=False,
        default=UserRole.CLIENT,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    search_requests: Mapped[list["ClientSearchRequest"]] = relationship(
        "ClientSearchRequest",
        back_populates="client",
        cascade="all, delete-orphan",
    )

    agent: Mapped["Agent"] = relationship(
        "Agent",
        back_populates="user",
        uselist=False,
    )

    conversations_as_client: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        foreign_keys="Conversation.client_id",
        back_populates="client",
    )

    appointments_as_client: Mapped[list["PropertyAppointment"]] = relationship(
        "PropertyAppointment",
        foreign_keys="PropertyAppointment.client_id",
        back_populates="client",
    )

    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        foreign_keys="Notification.user_id",
        back_populates="user",
    )

    favorites: Mapped[list["PropertyFavorite"]] = relationship(
        "PropertyFavorite",
        back_populates="user",
    )

    saved_searches: Mapped[list["SavedSearch"]] = relationship(
        "SavedSearch",
        back_populates="user",
    )

    def __repr__(self) -> str:
        return (
            f"<User("
            f"id={self.id}, "
            f"email={self.email}, "
            f"role={self.role.value}"
            f")>"
        )
