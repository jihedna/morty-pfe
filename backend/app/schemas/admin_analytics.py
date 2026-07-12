"""Pydantic schemas for admin analytics responses."""

from pydantic import BaseModel, ConfigDict


class DashboardOverviewResponse(BaseModel):
    """Dashboard overview metrics."""

    model_config = ConfigDict(from_attributes=True)

    total_users: int
    total_clients: int
    total_agents: int
    active_agents: int
    total_properties: int
    available_properties: int
    reserved_properties: int
    sold_properties: int
    rented_properties: int
    archived_properties: int
    total_client_search_requests: int
    active_client_search_requests: int
    total_conversations: int
    active_conversations: int
    total_messages: int
    unread_notifications: int
    total_appointments: int
    upcoming_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    total_favorites: int
    active_saved_searches: int
    total_hot_leads: int
    total_warm_leads: int
    total_cold_leads: int
    average_lead_score: float | None


class LeadAnalyticsResponse(BaseModel):
    """Lead scoring analytics."""

    model_config = ConfigDict(from_attributes=True)

    total_search_requests: int
    active_search_requests: int
    scored_leads: int
    unscored_leads: int
    total_hot_leads: int
    total_warm_leads: int
    total_cold_leads: int
    average_lead_score: float | None
    leads_by_property_type: dict[str, int]
    leads_by_city: dict[str, int]
    leads_by_urgency: dict[str, int]


class PropertyAnalyticsResponse(BaseModel):
    """Property analytics with groupings."""

    model_config = ConfigDict(from_attributes=True)

    total_properties: int
    properties_by_status: dict[str, int]
    properties_by_type: dict[str, int]
    properties_by_listing_type: dict[str, int]
    properties_by_city: dict[str, int]
    average_sale_price: float | None
    average_rental_price: float | None
    minimum_price: float | None
    maximum_price: float | None
    featured_count: int
    created_in_period: int
    sold_or_rented_in_period: int


class AgentAnalyticsItem(BaseModel):
    """Single agent analytics item."""

    model_config = ConfigDict(from_attributes=True)

    agent_id: str
    user_id: str
    first_name: str
    last_name: str
    years_experience: int
    total_listings: int
    available_listings: int
    sold_listings: int
    rented_listings: int
    appointment_count: int
    completed_appointment_count: int
    conversation_count: int
    received_favorites: int


class AgentAnalyticsResponse(BaseModel):
    """Agent analytics with pagination."""

    model_config = ConfigDict(from_attributes=True)

    agents: list[AgentAnalyticsItem]
    total: int
    skip: int
    limit: int


class ClientAnalyticsResponse(BaseModel):
    """Client aggregate metrics."""

    model_config = ConfigDict(from_attributes=True)

    total_clients: int
    active_clients: int
    clients_with_search_requests: int
    clients_with_favorites: int
    clients_with_saved_searches: int
    clients_with_conversations: int
    clients_with_appointments: int
    average_favorites_per_client: float
    average_saved_searches_per_client: float
    average_appointments_per_client: float


class AppointmentAnalyticsResponse(BaseModel):
    """Appointment analytics with groupings."""

    model_config = ConfigDict(from_attributes=True)

    total_appointments: int
    requested: int
    confirmed: int
    rescheduled: int
    cancelled: int
    completed: int
    no_show: int
    completion_rate: float
    cancellation_rate: float
    no_show_rate: float
    upcoming_count: int
    appointments_by_day: dict[str, int]
    appointments_by_agent: dict[str, int]


class EngagementAnalyticsResponse(BaseModel):
    """Engagement metrics."""

    model_config = ConfigDict(from_attributes=True)

    total_conversations: int
    active_conversations: int
    total_messages: int
    average_messages_per_conversation: float
    total_notifications: int
    unread_notifications: int
    notification_read_rate: float
    total_favorites: int
    total_saved_searches: int
    saved_searches_with_notifications_enabled: int
    clients_with_engagement: int


class TimeSeriesPoint(BaseModel):
    """Single time-series data point."""

    model_config = ConfigDict(from_attributes=True)

    period: str
    value: int


class TimeSeriesResponse(BaseModel):
    """Time-series analytics response."""

    model_config = ConfigDict(from_attributes=True)

    metric: str
    interval: str
    points: list[TimeSeriesPoint]
