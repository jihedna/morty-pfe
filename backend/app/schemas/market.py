from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MarketAreaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    city: str
    district: str
    average_price_per_sqm: Decimal | None
    average_rent_per_sqm: Decimal | None
    transaction_count: int
    demand_level: str
    price_trend: str
    rental_yield: Decimal | None
    latitude: Decimal | None
    longitude: Decimal | None
    updated_at: datetime


class MarketAreaCreate(BaseModel):
    city: str = Field(..., min_length=1, max_length=100)
    district: str = Field(..., min_length=1, max_length=100)
    average_price_per_sqm: Decimal | None = None
    average_rent_per_sqm: Decimal | None = None
    transaction_count: int = 0
    demand_level: str = "medium"
    price_trend: str = "stable"
    rental_yield: Decimal | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None


class MarketAreaUpdate(BaseModel):
    average_price_per_sqm: Decimal | None = None
    average_rent_per_sqm: Decimal | None = None
    transaction_count: int | None = None
    demand_level: str | None = None
    price_trend: str | None = None
    rental_yield: Decimal | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None


class HeatMapPoint(BaseModel):
    id: str
    city: str
    district: str
    latitude: Decimal | None
    longitude: Decimal | None
    average_price_per_sqm: Decimal | None
    average_rent_per_sqm: Decimal | None
    demand_level: str
    price_trend: str
    rental_yield: Decimal | None
    transaction_count: int
    normalized_price: float
    normalized_demand: float
