from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.agent_property_type import PropertyType
from app.models.property import ListingType


class SavedSearchFilters(BaseModel):
    """Validated schema for saved-search filters."""

    property_type: PropertyType | None = None
    listing_type: ListingType | None = None
    minimum_price: Decimal | None = Field(default=None, ge=0)
    maximum_price: Decimal | None = Field(default=None, ge=0)
    currency: str | None = None
    city: str | None = None
    district: str | None = None
    minimum_bedrooms: int | None = Field(default=None, ge=0)
    minimum_bathrooms: int | None = Field(default=None, ge=0)
    minimum_area_sqm: Decimal | None = Field(default=None, ge=0)
    maximum_area_sqm: Decimal | None = Field(default=None, ge=0)
    features: list[str] | None = None
    agent_id: str | None = None
    is_featured: bool | None = None

    @model_validator(mode="after")
    def validate_price_range(self) -> "SavedSearchFilters":
        if self.minimum_price is not None and self.maximum_price is not None:
            if self.minimum_price > self.maximum_price:
                raise ValueError("minimum_price cannot exceed maximum_price")
        return self

    @model_validator(mode="after")
    def validate_area_range(self) -> "SavedSearchFilters":
        if self.minimum_area_sqm is not None and self.maximum_area_sqm is not None:
            if self.minimum_area_sqm > self.maximum_area_sqm:
                raise ValueError("minimum_area_sqm cannot exceed maximum_area_sqm")
        return self

    @field_validator("features")
    @classmethod
    def validate_features(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            from app.models.property_feature import PropertyFeatureEnum
            valid_features = [
                f.value for f in PropertyFeatureEnum
            ]
            for feature in v:
                if feature not in valid_features:
                    raise ValueError(f"Invalid feature: {feature}")
        return v

    @model_validator(mode="after")
    def validate_has_filters(self) -> "SavedSearchFilters":
        if all(
            value is None
            for value in [
                self.property_type,
                self.listing_type,
                self.minimum_price,
                self.maximum_price,
                self.currency,
                self.city,
                self.district,
                self.minimum_bedrooms,
                self.minimum_bathrooms,
                self.minimum_area_sqm,
                self.maximum_area_sqm,
                self.features,
                self.agent_id,
                self.is_featured,
            ]
        ):
            raise ValueError("A saved search must contain at least one filter")
        return self


class SavedSearchCreate(BaseModel):
    """Schema for creating a saved search."""

    name: str = Field(..., min_length=1, max_length=150)
    filters: dict[str, Any]
    notifications_enabled: bool = True


class SavedSearchUpdate(BaseModel):
    """Schema for updating a saved search."""

    name: str | None = Field(default=None, min_length=1, max_length=150)
    filters: dict[str, Any] | None = None
    notifications_enabled: bool | None = None


class SavedSearchResponse(BaseModel):
    """Schema for saved search response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    filters: dict[str, Any]
    notifications_enabled: bool
    is_active: bool
    last_notified_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class SavedSearchListResponse(BaseModel):
    """Schema for saved search list response."""

    model_config = ConfigDict(from_attributes=True)

    saved_searches: list[SavedSearchResponse]
    total: int
    skip: int
    limit: int
