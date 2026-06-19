from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.agent_property_type import PropertyType
from app.models.property import ListingType


class ClientSearchRequestBase(BaseModel):
    """Shared client search request fields."""

    property_type: PropertyType
    listing_type: ListingType
    minimum_budget: Decimal | None = Field(default=None, gt=0)
    maximum_budget: Decimal | None = Field(default=None, gt=0)
    preferred_city: str | None = Field(default=None, max_length=100)
    preferred_district: str | None = Field(default=None, max_length=100)
    minimum_bedrooms: int | None = Field(default=None, ge=0)
    minimum_bathrooms: int | None = Field(default=None, ge=0)
    minimum_area_sqm: Decimal | None = Field(default=None, gt=0)
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_budget_range(self):
        """Ensure minimum_budget does not exceed maximum_budget."""
        if (
            self.minimum_budget is not None
            and self.maximum_budget is not None
            and self.minimum_budget > self.maximum_budget
        ):
            raise ValueError(
                "minimum_budget cannot exceed maximum_budget"
            )
        return self


class ClientSearchRequestCreate(ClientSearchRequestBase):
    """Schema for creating a client search request."""


class ClientSearchRequestUpdate(BaseModel):
    """Schema for updating a client search request."""

    property_type: PropertyType | None = None
    listing_type: ListingType | None = None
    minimum_budget: Decimal | None = Field(default=None, gt=0)
    maximum_budget: Decimal | None = Field(default=None, gt=0)
    preferred_city: str | None = Field(default=None, max_length=100)
    preferred_district: str | None = Field(default=None, max_length=100)
    minimum_bedrooms: int | None = Field(default=None, ge=0)
    minimum_bathrooms: int | None = Field(default=None, ge=0)
    minimum_area_sqm: Decimal | None = Field(default=None, gt=0)
    notes: str | None = Field(default=None, max_length=1000)
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_budget_range(self):
        """Ensure minimum_budget does not exceed maximum_budget when both are supplied."""
        if (
            self.minimum_budget is not None
            and self.maximum_budget is not None
            and self.minimum_budget > self.maximum_budget
        ):
            raise ValueError(
                "minimum_budget cannot exceed maximum_budget"
            )
        return self


class ClientSearchRequestResponse(ClientSearchRequestBase):
    """Client search request response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    client_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AgentMatchCriteria(BaseModel):
    """Matched or unmatched criteria for an agent."""

    property_type: bool = False
    territory: bool = False
    budget: bool = False
    availability: bool = False


class AgentMatchResponse(BaseModel):
    """Agent match response with scoring details."""

    agent_id: str
    user_id: str
    full_name: str
    office: str
    phone: str
    years_experience: int
    match_score: int = Field(ge=0, le=100)
    matched_criteria: AgentMatchCriteria
    unmatched_criteria: AgentMatchCriteria
