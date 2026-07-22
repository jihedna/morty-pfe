import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ContractType(str, Enum):
    SALE = "sale"
    RENT = "rent"


class ContractStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Contract(Base):
    """Historical transaction / contract record."""

    __tablename__ = "contracts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True
    )
    search_request_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("client_search_requests.id", ondelete="SET NULL"), nullable=True, index=True
    )
    agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    sale_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    property_type: Mapped[str] = mapped_column(String(20), nullable=False)
    area_sqm: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    contract_type: Mapped[str] = mapped_column(String(10), nullable=False, default=ContractType.SALE.value)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=ContractStatus.APPROVED.value, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self) -> str:
        return f"<Contract({self.contract_type} {self.city} {self.amount})>"
