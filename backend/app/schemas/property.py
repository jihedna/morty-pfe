from datetime import datetime
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.models.agent_property_type import PropertyType
from app.models.property import Currency, ListingType, PropertyStatus
from app.models.property_feature import PropertyFeatureEnum


class PropertyImageBase(BaseModel):
    """Shared property-image fields."""

    image_url: str = Field(..., min_length=1, max_length=500)
    alt_text: str | None = Field(default=None, max_length=200)
    position: int = Field(default=0, ge=0)
    is_primary: bool = False

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        """Require an HTTP or HTTPS image URL."""
        if not value.startswith(("http://", "https://")):
            raise ValueError("image_url must use http or https")
        return value


class PropertyImageCreate(PropertyImageBase):
    """Schema for adding a property image."""


class PropertyImageUpdate(BaseModel):
    """Schema for updating a property image."""

    alt_text: str | None = Field(default=None, max_length=200)
    position: int | None = Field(default=None, ge=0)
    is_primary: bool | None = None


class PropertyImageResponse(PropertyImageBase):
    """Property image response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime


class PropertyFeatureBase(BaseModel):
    """Shared property-feature fields."""

    feature: PropertyFeatureEnum


class PropertyFeatureCreate(PropertyFeatureBase):
    """Schema for adding a property feature."""


class PropertyFeatureResponse(PropertyFeatureBase):
    """Property feature response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    property_id: str
    created_at: datetime
    updated_at: datetime


class PropertyFields(BaseModel):
    """Shared editable property fields."""

    title: str = Field(..., min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    property_type: PropertyType
    listing_type: ListingType
    status: PropertyStatus = PropertyStatus.DRAFT
    price: Decimal = Field(..., gt=0)
    currency: Currency = Currency.TND
    area_sqm: Decimal = Field(..., gt=0)
    land_area_sqm: Decimal | None = Field(default=None, gt=0)
    rooms: int = Field(default=0, ge=0)
    bedrooms: int = Field(default=0, ge=0)
    bathrooms: int = Field(default=0, ge=0)
    floor_number: int = Field(default=0, ge=0)
    total_floors: int = Field(default=0, ge=0)
    construction_year: int | None = None
    is_furnished: bool = False
    address_line: str | None = Field(default=None, max_length=300)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    governorate: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("construction_year")
    @classmethod
    def validate_construction_year(cls, value: int | None) -> int | None:
        """Validate the construction year."""
        if value is None:
            return value

        current_year = datetime.now().year
        if value < 1800:
            raise ValueError("construction_year must be at least 1800")
        if value > current_year:
            raise ValueError("construction_year cannot be in the future")
        return value

    @model_validator(mode="after")
    def validate_related_fields(self):
        """Validate cross-field property constraints."""
        if (
            self.rooms > 0
            and self.bedrooms > 0
            and self.bedrooms > self.rooms
        ):
            raise ValueError("bedrooms cannot exceed total rooms")

        if (
            self.total_floors > 0
            and self.floor_number > self.total_floors
        ):
            raise ValueError("floor_number cannot exceed total_floors")

        if (self.latitude is None) != (self.longitude is None):
            raise ValueError(
                "latitude and longitude must both be present or both be absent"
            )

        return self


class PropertyCreate(PropertyFields):
    """Unified property creation request."""

    agent_id: str | None = None
    is_featured: bool = False


class PropertyAgentCreate(PropertyFields):
    """Validated property creation data for an agent."""

    @field_validator("status")
    @classmethod
    def validate_initial_status(
        cls,
        value: PropertyStatus,
    ) -> PropertyStatus:
        """Agents cannot create sold or rented properties."""
        if value in (PropertyStatus.SOLD, PropertyStatus.RENTED):
            raise ValueError("Initial status cannot be sold or rented")
        return value


class PropertyManagerCreate(PropertyFields):
    """Validated property creation data for a manager."""

    agent_id: str
    is_featured: bool = False


class PropertyUpdate(BaseModel):
    """Partial property update request."""

    agent_id: str | None = None
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    property_type: PropertyType | None = None
    listing_type: ListingType | None = None
    status: PropertyStatus | None = None
    price: Decimal | None = Field(default=None, gt=0)
    currency: Currency | None = None
    area_sqm: Decimal | None = Field(default=None, gt=0)
    land_area_sqm: Decimal | None = Field(default=None, gt=0)
    rooms: int | None = Field(default=None, ge=0)
    bedrooms: int | None = Field(default=None, ge=0)
    bathrooms: int | None = Field(default=None, ge=0)
    floor_number: int | None = Field(default=None, ge=0)
    total_floors: int | None = Field(default=None, ge=0)
    construction_year: int | None = None
    is_furnished: bool | None = None
    is_featured: bool | None = None
    address_line: str | None = Field(default=None, max_length=300)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    governorate: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("construction_year")
    @classmethod
    def validate_construction_year(cls, value: int | None) -> int | None:
        """Validate a supplied construction year."""
        if value is None:
            return value

        current_year = datetime.now().year
        if value < 1800:
            raise ValueError("construction_year must be at least 1800")
        if value > current_year:
            raise ValueError("construction_year cannot be in the future")
        return value

    @model_validator(mode="after")
    def validate_supplied_pairs(self):
        """Validate related fields when both are supplied."""
        if (
            self.rooms is not None
            and self.bedrooms is not None
            and self.rooms > 0
            and self.bedrooms > self.rooms
        ):
            raise ValueError("bedrooms cannot exceed total rooms")

        if (
            self.floor_number is not None
            and self.total_floors is not None
            and self.total_floors > 0
            and self.floor_number > self.total_floors
        ):
            raise ValueError("floor_number cannot exceed total_floors")

        supplied = self.model_fields_set
        latitude_supplied = "latitude" in supplied
        longitude_supplied = "longitude" in supplied

        if latitude_supplied != longitude_supplied:
            raise ValueError(
                "latitude and longitude must be updated together"
            )

        if (
            latitude_supplied
            and longitude_supplied
            and (self.latitude is None) != (self.longitude is None)
        ):
            raise ValueError(
                "latitude and longitude must both be present or both be absent"
            )

        return self


class PropertyAgentUpdate(PropertyUpdate):
    """Agent property update data."""

    model_config = ConfigDict(extra="ignore")

    agent_id: None = None
    is_featured: None = None

    @field_validator("status")
    @classmethod
    def validate_status(
        cls,
        value: PropertyStatus | None,
    ) -> PropertyStatus | None:
        """Agents cannot set sold or rented status."""
        if value in (PropertyStatus.SOLD, PropertyStatus.RENTED):
            raise ValueError("Agents cannot mark property as sold or rented")
        return value


class PropertyManagerUpdate(PropertyUpdate):
    """Manager property update data."""


class PropertyStatusUpdate(BaseModel):
    """Property status update."""

    status: PropertyStatus


class PropertyAssignmentUpdate(BaseModel):
    """Property-agent assignment update."""

    agent_id: str


class PropertyResponse(PropertyFields):
    """Complete property response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    reference_code: str
    agent_id: str
    price: float
    area_sqm: float
    land_area_sqm: float | None
    is_featured: bool
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    images: list[PropertyImageResponse] = Field(default_factory=list)
    features: list[PropertyFeatureResponse] = Field(default_factory=list)


class PropertyPublicResponse(BaseModel):
    """Public property response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    reference_code: str
    title: str
    description: str | None
    property_type: PropertyType
    listing_type: ListingType
    status: PropertyStatus
    price: float
    currency: Currency
    area_sqm: float
    land_area_sqm: float | None
    rooms: int
    bedrooms: int
    bathrooms: int
    floor_number: int
    total_floors: int
    construction_year: int | None
    is_furnished: bool
    is_featured: bool
    address_line: str | None
    city: str | None
    district: str | None
    governorate: str | None
    postal_code: str | None
    latitude: float | None
    longitude: float | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    agent_id: str
    images: list[PropertyImageResponse] = Field(default_factory=list)
    features: list[PropertyFeatureResponse] = Field(default_factory=list)


class PropertyListFilters(BaseModel):
    """Supported property-list filters."""

    search: str | None = None
    property_type: PropertyType | None = None
    listing_type: ListingType | None = None
    city: str | None = None
    district: str | None = None
    governorate: str | None = None
    agent_id: str | None = None
    minimum_price: Decimal | None = Field(default=None, gt=0)
    maximum_price: Decimal | None = Field(default=None, gt=0)
    minimum_area: Decimal | None = Field(default=None, gt=0)
    maximum_area: Decimal | None = Field(default=None, gt=0)
    minimum_bedrooms: int | None = Field(default=None, ge=0)
    minimum_bathrooms: int | None = Field(default=None, ge=0)
    feature: PropertyFeatureEnum | None = None
    is_furnished: bool | None = None
    is_featured: bool | None = None
    status: PropertyStatus | None = None
    reference_code: str | None = None
    minimum_latitude: float | None = Field(default=None, ge=-90, le=90)
    maximum_latitude: float | None = Field(default=None, ge=-90, le=90)
    minimum_longitude: float | None = Field(default=None, ge=-180, le=180)
    maximum_longitude: float | None = Field(default=None, ge=-180, le=180)
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)
    sort_by: str = "created_at"
    sort_direction: str = "desc"


class PropertyListResponse(BaseModel):
    """Schema for property list response with pagination."""

    model_config = ConfigDict(from_attributes=True)

    properties: list[PropertyPublicResponse]
    total: int
    skip: int
    limit: int
