from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.property_appointment import AppointmentStatus


class AppointmentStatusUpdate(BaseModel):
    """Schema for updating appointment status."""
    status: AppointmentStatus
    cancellation_reason: str | None = Field(None, max_length=1000)


class AppointmentReschedule(BaseModel):
    """Schema for rescheduling an appointment."""
    scheduled_start: datetime
    scheduled_end: datetime

    @field_validator("scheduled_end")
    @classmethod
    def validate_end_after_start(cls, v: datetime, info) -> datetime:
        """Validate that end time is after start time."""
        if "scheduled_start" in info.data and v <= info.data["scheduled_start"]:
            raise ValueError("scheduled_end must be after scheduled_start")
        return v


class AppointmentBase(BaseModel):
    """Shared appointment fields."""
    property_id: str
    conversation_id: str | None = None
    scheduled_start: datetime
    scheduled_end: datetime
    client_notes: str | None = Field(None, max_length=2000)

    @field_validator("scheduled_end")
    @classmethod
    def validate_end_after_start(cls, v: datetime, info) -> datetime:
        """Validate that end time is after start time."""
        if "scheduled_start" in info.data and v <= info.data["scheduled_start"]:
            raise ValueError("scheduled_end must be after scheduled_start")
        return v


class AppointmentCreate(AppointmentBase):
    """Schema for creating an appointment."""
    agent_id: str


class AppointmentUpdate(BaseModel):
    """Schema for updating an appointment."""
    client_notes: str | None = Field(None, max_length=2000)
    agent_notes: str | None = Field(None, max_length=2000)


class UserSummary(BaseModel):
    """Summary of user information."""
    id: str
    first_name: str
    last_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class AgentSummary(BaseModel):
    """Summary of agent information."""
    id: str
    office: str
    phone: str
    user: UserSummary

    model_config = ConfigDict(from_attributes=True)


class PropertySummary(BaseModel):
    """Summary of property information."""
    id: str
    reference_code: str
    title: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class AppointmentResponse(BaseModel):
    """Schema for appointment response."""
    id: str
    client: UserSummary
    agent: AgentSummary
    property: PropertySummary
    conversation_id: str | None
    scheduled_start: datetime
    scheduled_end: datetime
    status: str
    client_notes: str | None
    agent_notes: str | None
    cancellation_reason: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
