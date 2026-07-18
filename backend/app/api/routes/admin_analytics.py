"""Admin analytics API routes."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_manager
from app.database.session import get_db
from app.schemas.admin_analytics import (
    AgentAnalyticsResponse,
    AppointmentAnalyticsResponse,
    ClientAnalyticsResponse,
    DashboardOverviewResponse,
    EngagementAnalyticsResponse,
    LeadAnalyticsResponse,
    PropertyAnalyticsResponse,
    TimeSeriesResponse,
)
from app.schemas.market import HeatMapPoint
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/admin/analytics", tags=["admin-analytics"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> DashboardOverviewResponse:
    """Get dashboard overview metrics."""
    overview = AnalyticsService.get_dashboard_overview(db)
    return DashboardOverviewResponse(**overview)


@router.get("/properties", response_model=PropertyAnalyticsResponse)
def get_property_analytics(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    agent_id: str | None = Query(None),
    property_type: str | None = Query(None),
    listing_type: str | None = Query(None),
    city: str | None = Query(None),
    district: str | None = Query(None),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> PropertyAnalyticsResponse:
    """Get property analytics with optional filters."""
    # Parse datetime strings if provided
    from datetime import datetime
    date_from_dt = None
    date_to_dt = None
    if date_from:
        # Handle both ISO formats with and without timezone
        try:
            date_from_dt = datetime.fromisoformat(date_from)
        except ValueError:
            # Try parsing without timezone
            date_from_dt = datetime.fromisoformat(date_from.replace(' ', '+', 1))
    if date_to:
        try:
            date_to_dt = datetime.fromisoformat(date_to)
        except ValueError:
            # Try parsing without timezone
            date_to_dt = datetime.fromisoformat(date_to.replace(' ', '+', 1))
    
    analytics = AnalyticsService.get_property_analytics(
        db,
        date_from=date_from_dt,
        date_to=date_to_dt,
        agent_id=agent_id,
        property_type=property_type,
        listing_type=listing_type,
        city=city,
        district=district,
    )
    return PropertyAnalyticsResponse(**analytics)


@router.get("/agents", response_model=AgentAnalyticsResponse)
def get_agent_analytics(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    active_only: bool = Query(False),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    order_by: str = Query("total_listings"),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> AgentAnalyticsResponse:
    """Get per-agent analytics with pagination."""
    # Parse datetime strings if provided
    date_from_dt = None
    date_to_dt = None
    if date_from:
        try:
            date_from_dt = datetime.fromisoformat(date_from)
        except ValueError:
            date_from_dt = datetime.fromisoformat(date_from.replace(' ', '+', 1))
    if date_to:
        try:
            date_to_dt = datetime.fromisoformat(date_to)
        except ValueError:
            date_to_dt = datetime.fromisoformat(date_to.replace(' ', '+', 1))
    
    agents, total = AnalyticsService.get_agent_analytics(
        db,
        skip=skip,
        limit=limit,
        active_only=active_only,
        date_from=date_from_dt,
        date_to=date_to_dt,
        order_by=order_by,
    )
    return AgentAnalyticsResponse(agents=agents, total=total, skip=skip, limit=limit)


@router.get("/clients", response_model=ClientAnalyticsResponse)
def get_client_analytics(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> ClientAnalyticsResponse:
    """Get client aggregate metrics."""
    analytics = AnalyticsService.get_client_analytics(db)
    return ClientAnalyticsResponse(**analytics)


@router.get("/appointments", response_model=AppointmentAnalyticsResponse)
def get_appointment_analytics(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    agent_id: str | None = Query(None),
    property_id: str | None = Query(None),
    city: str | None = Query(None),
    district: str | None = Query(None),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> AppointmentAnalyticsResponse:
    """Get appointment analytics with optional filters."""
    # Parse datetime strings if provided
    date_from_dt = None
    date_to_dt = None
    if date_from:
        try:
            date_from_dt = datetime.fromisoformat(date_from)
        except ValueError:
            date_from_dt = datetime.fromisoformat(date_from.replace(' ', '+', 1))
    if date_to:
        try:
            date_to_dt = datetime.fromisoformat(date_to)
        except ValueError:
            date_to_dt = datetime.fromisoformat(date_to.replace(' ', '+', 1))
    
    analytics = AnalyticsService.get_appointment_analytics(
        db,
        date_from=date_from_dt,
        date_to=date_to_dt,
        agent_id=agent_id,
        property_id=property_id,
        city=city,
        district=district,
    )
    return AppointmentAnalyticsResponse(**analytics)


@router.get("/engagement", response_model=EngagementAnalyticsResponse)
def get_engagement_analytics(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> EngagementAnalyticsResponse:
    """Get engagement metrics."""
    analytics = AnalyticsService.get_engagement_analytics(db)
    return EngagementAnalyticsResponse(**analytics)


@router.get("/leads", response_model=LeadAnalyticsResponse)
def get_lead_analytics(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    city: str | None = Query(None),
    district: str | None = Query(None),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> LeadAnalyticsResponse:
    """Get lead scoring analytics with optional filters."""
    date_from_dt = None
    date_to_dt = None
    if date_from:
        try:
            date_from_dt = datetime.fromisoformat(date_from)
        except ValueError:
            date_from_dt = datetime.fromisoformat(date_from.replace(' ', '+', 1))
    if date_to:
        try:
            date_to_dt = datetime.fromisoformat(date_to)
        except ValueError:
            date_to_dt = datetime.fromisoformat(date_to.replace(' ', '+', 1))

    analytics = AnalyticsService.get_lead_analytics(
        db,
        date_from=date_from_dt,
        date_to=date_to_dt,
        city=city,
        district=district,
    )
    return LeadAnalyticsResponse(**analytics)


@router.get("/heat-map", response_model=list[HeatMapPoint])
def get_heat_map(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> list[HeatMapPoint]:
    """Get manager-only heat-map data for market areas."""
    return [HeatMapPoint(**point) for point in AnalyticsService.get_heat_map(db)]


@router.get("/contracts")
def get_contract_analytics(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> dict:
    """Get contract aggregate analytics."""
    return AnalyticsService.get_contract_analytics(db)


@router.get("/time-series", response_model=TimeSeriesResponse)
def get_time_series(
    metric: str = Query(...),
    date_from: str = Query(...),
    date_to: str = Query(...),
    interval: str = Query("day"),
    city: str | None = Query(None),
    district: str | None = Query(None),
    agent_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> TimeSeriesResponse:
    """Get time-series data for a metric."""
    # Parse datetime strings
    try:
        date_from_dt = datetime.fromisoformat(date_from)
    except ValueError:
        date_from_dt = datetime.fromisoformat(date_from.replace(' ', '+', 1))
    try:
        date_to_dt = datetime.fromisoformat(date_to)
    except ValueError:
        date_to_dt = datetime.fromisoformat(date_to.replace(' ', '+', 1))
    
    try:
        analytics = AnalyticsService.get_time_series(
            db,
            metric=metric,
            date_from=date_from_dt,
            date_to=date_to_dt,
            interval=interval,
            city=city,
            district=district,
            agent_id=agent_id,
        )
        return TimeSeriesResponse(**analytics)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
