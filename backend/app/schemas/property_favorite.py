from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict


class FavoritePropertySummary(BaseModel):
    """Schema for property summary in favorite response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    property_type: str
    listing_type: str
    price: Decimal
    currency: str
    city: str
    district: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    area_sqm: Decimal | None = None
    status: str
    primary_image_url: str | None = None
    agent: dict[str, Any]


class FavoriteResponse(BaseModel):
    """Schema for favorite response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    property_id: str
    property: FavoritePropertySummary
    favorited_at: datetime


class FavoriteListResponse(BaseModel):
    """Schema for favorite list response."""

    model_config = ConfigDict(from_attributes=True)

    favorites: list[FavoriteResponse]
    total: int
    skip: int
    limit: int


class FavoriteCheckResponse(BaseModel):
    """Schema for favorite check response."""

    model_config = ConfigDict(from_attributes=True)

    property_id: str
    is_favorited: bool
