from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.agent import AvailabilityStatus
from app.models.agent_property_type import PropertyType


class AgentTerritoryBase(BaseModel):
    """Base schema for an agent territory."""

    territory: str = Field(..., min_length=1, max_length=100)
    expertise_score: float = Field(..., ge=0.0, le=1.0)


class AgentTerritoryCreate(AgentTerritoryBase):
    """Schema for creating an agent territory."""


class AgentTerritoryResponse(AgentTerritoryBase):
    """Schema returned for an agent territory."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str


class AgentPropertyTypeBase(BaseModel):
    """Base schema for an agent property-type specialization."""

    property_type: PropertyType
    expertise_score: float = Field(..., ge=0.0, le=1.0)


class AgentPropertyTypeCreate(AgentPropertyTypeBase):
    """Schema for creating an agent property-type specialization."""


class AgentPropertyTypeResponse(AgentPropertyTypeBase):
    """Schema returned for an agent property-type specialization."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str


class AgentBase(BaseModel):
    """Shared agent profile fields."""

    user_id: str
    office: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=1, max_length=20)
    biography: str | None = Field(default=None, max_length=2000)
    years_experience: int = Field(..., ge=0)
    minimum_budget: float = Field(..., ge=0.0)
    maximum_budget: float = Field(..., ge=0.0)
    availability_status: AvailabilityStatus = AvailabilityStatus.AVAILABLE
    active_lead_count: int = Field(default=0, ge=0)
    success_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    closed_deals: int = Field(default=0, ge=0)
    languages: str | None = Field(default=None, max_length=500)

    @field_validator("maximum_budget")
    @classmethod
    def validate_budget_range(cls, value: float, info) -> float:
        """Ensure the maximum budget is not below the minimum budget."""
        minimum_budget = info.data.get("minimum_budget")
        if minimum_budget is not None and value < minimum_budget:
            raise ValueError(
                "maximum_budget must be greater than or equal to minimum_budget"
            )
        return value


class AgentCreate(AgentBase):
    """Schema for manager-created agent profiles."""


class AgentUpdate(BaseModel):
    """Schema for a manager updating an agent profile."""

    office: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, min_length=1, max_length=20)
    biography: str | None = Field(default=None, max_length=2000)
    years_experience: int | None = Field(default=None, ge=0)
    minimum_budget: float | None = Field(default=None, ge=0.0)
    maximum_budget: float | None = Field(default=None, ge=0.0)
    availability_status: AvailabilityStatus | None = None
    active_lead_count: int | None = Field(default=None, ge=0)
    success_rate: float | None = Field(default=None, ge=0.0, le=1.0)
    closed_deals: int | None = Field(default=None, ge=0)
    languages: str | None = Field(default=None, max_length=500)

    @field_validator("maximum_budget")
    @classmethod
    def validate_budget_range(
        cls,
        value: float | None,
        info,
    ) -> float | None:
        """Validate the range when both budget fields are supplied."""
        minimum_budget = info.data.get("minimum_budget")
        if (
            value is not None
            and minimum_budget is not None
            and value < minimum_budget
        ):
            raise ValueError(
                "maximum_budget must be greater than or equal to minimum_budget"
            )
        return value


class AgentSelfUpdate(BaseModel):
    """Fields an agent may update on their own profile."""

    model_config = ConfigDict(extra="ignore")

    phone: str | None = Field(default=None, min_length=1, max_length=20)
    biography: str | None = Field(default=None, max_length=2000)
    languages: str | None = Field(default=None, max_length=500)
    availability_status: AvailabilityStatus | None = None


class AgentAvailabilityUpdate(BaseModel):
    """Schema for updating an agent's availability."""

    availability_status: AvailabilityStatus


class AgentResponse(AgentBase):
    """Complete agent profile response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
    territories: list[AgentTerritoryResponse] = Field(default_factory=list)
    property_types: list[AgentPropertyTypeResponse] = Field(
        default_factory=list
    )


class UserSummary(BaseModel):
    """Minimal user info embedded in agent responses."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    email: str


class AgentPublicResponse(BaseModel):
    """Agent information visible to authenticated users."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    office: str
    phone: str
    biography: str | None
    years_experience: int
    minimum_budget: float
    maximum_budget: float
    availability_status: AvailabilityStatus
    active_lead_count: int
    success_rate: float
    closed_deals: int
    languages: str | None
    territories: list[AgentTerritoryResponse] = Field(default_factory=list)
    property_types: list[AgentPropertyTypeResponse] = Field(
        default_factory=list
    )
    user: UserSummary | None = None


class AgentListFilters(BaseModel):
    """Schema describing supported agent-list filters."""

    territory: str | None = None
    property_type: PropertyType | None = None
    availability_status: AvailabilityStatus | None = None
    minimum_experience: int | None = Field(default=None, ge=0)
    language: str | None = None
    minimum_budget: float | None = Field(default=None, ge=0.0)
    maximum_budget: float | None = Field(default=None, ge=0.0)
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=100)
