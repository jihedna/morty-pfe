import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent import Agent


class AgentTerritory(Base, TimestampMixin):
    """Agent territory specialization with expertise score."""

    __tablename__ = "agent_territories"

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

    territory: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    expertise_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    agent: Mapped["Agent"] = relationship(
        "Agent",
        back_populates="territories",
    )

    def __repr__(self) -> str:
        return (
            f"<AgentTerritory("
            f"id={self.id}, "
            f"agent_id={self.agent_id}, "
            f"territory={self.territory}, "
            f"score={self.expertise_score}"
            f")>"
        )
