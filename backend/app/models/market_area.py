import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import DateTime, Numeric, String, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class DemandLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class PriceTrend(str, Enum):
    FALLING = "falling"
    STABLE = "stable"
    RISING = "rising"
    SURGING = "surging"


class MarketArea(Base):
    """Neighbourhood market data — values are DEMO/SAMPLE unless real data is imported."""

    __tablename__ = "market_areas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    average_price_per_sqm: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    average_rent_per_sqm: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    transaction_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    demand_level: Mapped[str] = mapped_column(String(20), nullable=False, default=DemandLevel.MEDIUM.value)
    price_trend: Mapped[str] = mapped_column(String(20), nullable=False, default=PriceTrend.STABLE.value)
    rental_yield: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 8), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(11, 8), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<MarketArea({self.city}/{self.district})>"
