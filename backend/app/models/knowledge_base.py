import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class KBCategory(str, Enum):
    MARKET = "market"
    LEGAL = "legal"
    TAX = "tax"
    AGENCY_SERVICE = "agency_service"
    INVESTMENT = "investment"
    GENERAL = "general"


class KnowledgeBaseArticle(Base):
    """Internal knowledge base for chatbot and market guidance."""

    __tablename__ = "knowledge_base_articles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str | None] = mapped_column(String(300), nullable=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="fr")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<KnowledgeBaseArticle({self.category}: {self.title[:40]})>"
