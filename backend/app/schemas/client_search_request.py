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
    minimum_area_sqm: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=1000)
    urgency: str | None = Field(default="medium", pattern="^(low|medium|high|immediate)$")

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
    minimum_area_sqm: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=1000)
    urgency: str | None = Field(default=None, pattern="^(low|medium|high|immediate)$")
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
    property_id: str | None = None
    urgency: str | None = None
    is_active: bool
    lead_score: int | None = None
    qualification_level: str | None = None
    lead_score_reasons: list[str] | None = None
    lead_score_updated_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class LeadScoreResponse(BaseModel):
    """Lead score result for a search request."""

    request_id: str
    lead_score: int = Field(ge=0, le=100)
    qualification_level: str
    urgency: str
    lead_score_reasons: list[str]
    recommended_action: str


class AgentLeadResponse(BaseModel):
    """Lead visible to an agent."""

    model_config = ConfigDict(from_attributes=True)

    request_id: str
    property_id: str | None = None
    client_id: str
    summary: str | None = None
    preferred_city: str | None = None
    preferred_district: str | None = None
    property_type: str
    listing_type: str
    minimum_budget: Decimal | None = None
    maximum_budget: Decimal | None = None
    minimum_bedrooms: int | None = None
    minimum_bathrooms: int | None = None
    urgency: str | None = None
    lead_score: int = Field(ge=0, le=100)
    qualification_level: str
    lead_score_reasons: list[str]
    match_percentage: int = Field(ge=0, le=100)
    matched_criteria: dict
    recommended_action: str
    created_at: datetime
    conversation_id: str | None = None
    appointment_count: int = 0


class AgentLeadListResponse(BaseModel):
    """Paginated list of agent leads."""

    leads: list[AgentLeadResponse]
    total: int
    skip: int
    limit: int


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
