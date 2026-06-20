from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_client,
    get_current_manager,
    get_current_user,
    get_db,
)
from app.core.permissions import UserRole
from app.models.property_appointment import AppointmentStatus
from app.schemas.property_appointment import (
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentResponse,
    AppointmentStatusUpdate,
    AppointmentUpdate,
)
from app.services.property_appointment_service import PropertyAppointmentService

router = APIRouter()


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: dict = Depends(get_current_client),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    """Create a new appointment (clients only)."""
    appointment = PropertyAppointmentService.create_appointment(
        db, appointment_data, current_user["id"]
    )
    return AppointmentResponse.model_validate(appointment)


@router.get("/me", response_model=list[AppointmentResponse])
def get_my_appointments(
    status: str | None = Query(None),
    property_id: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=0, le=100),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AppointmentResponse]:
    """Get appointments for the current user (client or agent)."""
    from datetime import datetime

    date_from_dt = datetime.fromisoformat(date_from) if date_from else None
    date_to_dt = datetime.fromisoformat(date_to) if date_to else None

    appointments = PropertyAppointmentService.get_user_appointments(
        db,
        current_user["id"],
        status=status,
        property_id=property_id,
        date_from=date_from_dt,
        date_to=date_to_dt,
        skip=skip,
        limit=limit,
    )
    return [AppointmentResponse.model_validate(a) for a in appointments]


@router.get("/agent/me", response_model=list[AppointmentResponse])
def get_agent_appointments(
    status: str | None = Query(None),
    property_id: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=0, le=100),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AppointmentResponse]:
    """Get appointments for the current agent."""
    from app.models.agent import Agent
    from datetime import datetime

    date_from_dt = datetime.fromisoformat(date_from) if date_from else None
    date_to_dt = datetime.fromisoformat(date_to) if date_to else None

    # Get agent profile
    agent = db.query(Agent).filter(Agent.user_id == current_user["id"]).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found",
        )

    appointments = PropertyAppointmentService.get_agent_appointments(
        db,
        agent.id,
        status=status,
        property_id=property_id,
        date_from=date_from_dt,
        date_to=date_to_dt,
        skip=skip,
        limit=limit,
    )
    return [AppointmentResponse.model_validate(a) for a in appointments]


@router.get("/admin/all", response_model=list[AppointmentResponse])
def get_all_appointments(
    status: str | None = Query(None),
    property_id: str | None = Query(None),
    agent_id: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=0, le=100),
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> list[AppointmentResponse]:
    """Get all appointments (managers only)."""
    from datetime import datetime

    date_from_dt = datetime.fromisoformat(date_from) if date_from else None
    date_to_dt = datetime.fromisoformat(date_to) if date_to else None

    appointments = PropertyAppointmentService.get_all_appointments(
        db,
        status=status,
        property_id=property_id,
        agent_id=agent_id,
        date_from=date_from_dt,
        date_to=date_to_dt,
        skip=skip,
        limit=limit,
    )
    return [AppointmentResponse.model_validate(a) for a in appointments]


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    """Get a specific appointment by ID."""
    from app.models.agent import Agent

    appointment = PropertyAppointmentService.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Check access permissions
    if current_user["role"] == UserRole.CLIENT.value:
        if appointment.client_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access another client's appointment",
            )
    elif current_user["role"] == UserRole.AGENT.value:
        agent = db.query(Agent).filter(Agent.user_id == current_user["id"]).first()
        if not agent or appointment.agent_id != agent.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access another agent's appointment",
            )

    return AppointmentResponse.model_validate(appointment)


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    """Update appointment notes."""
    from app.models.agent import Agent

    appointment = PropertyAppointmentService.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Check access permissions
    if current_user["role"] == UserRole.CLIENT.value:
        if appointment.client_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update another client's appointment",
            )
    elif current_user["role"] == UserRole.AGENT.value:
        agent = db.query(Agent).filter(Agent.user_id == current_user["id"]).first()
        if not agent or appointment.agent_id != agent.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update another agent's appointment",
            )

    updated = PropertyAppointmentService.update_appointment(
        db, appointment, update_data, current_user["role"]
    )
    return AppointmentResponse.model_validate(updated)


@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: str,
    status_update: AppointmentStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    """Update appointment status."""
    from app.models.agent import Agent

    appointment = PropertyAppointmentService.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Check access permissions
    if current_user["role"] == UserRole.CLIENT.value:
        if appointment.client_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update another client's appointment",
            )
        # Clients can only cancel
        if status_update.status not in [AppointmentStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Clients can only cancel appointments",
            )
    elif current_user["role"] == UserRole.AGENT.value:
        agent = db.query(Agent).filter(Agent.user_id == current_user["id"]).first()
        if not agent or appointment.agent_id != agent.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update another agent's appointment",
            )

    updated = PropertyAppointmentService.update_status(
        db,
        appointment,
        status_update.status,
        status_update.cancellation_reason,
        current_user["role"],
    )
    return AppointmentResponse.model_validate(updated)


@router.patch("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: str,
    reschedule_data: AppointmentReschedule,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    """Reschedule an appointment."""
    from app.models.agent import Agent

    appointment = PropertyAppointmentService.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Check access permissions
    if current_user["role"] == UserRole.CLIENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clients cannot reschedule appointments",
        )
    elif current_user["role"] == UserRole.AGENT.value:
        agent = db.query(Agent).filter(Agent.user_id == current_user["id"]).first()
        if not agent or appointment.agent_id != agent.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot reschedule another agent's appointment",
            )

    updated = PropertyAppointmentService.reschedule_appointment(
        db, appointment, reschedule_data, current_user["role"]
    )
    return AppointmentResponse.model_validate(updated)


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Cancel an appointment (soft delete)."""
    from app.models.agent import Agent

    appointment = PropertyAppointmentService.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Check access permissions
    if current_user["role"] == UserRole.CLIENT.value:
        if appointment.client_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot cancel another client's appointment",
            )
    elif current_user["role"] == UserRole.AGENT.value:
        agent = db.query(Agent).filter(Agent.user_id == current_user["id"]).first()
        if not agent or appointment.agent_id != agent.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot cancel another agent's appointment",
            )

    PropertyAppointmentService.cancel_appointment(
        db, appointment, "Cancelled by user", current_user["role"]
    )
