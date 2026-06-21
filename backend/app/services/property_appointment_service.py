from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import NotificationType
from app.models.property import PropertyStatus
from app.models.property_appointment import (
    AppointmentStatus,
    PropertyAppointment,
)
from app.schemas.property_appointment import (
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentUpdate,
)
from app.services.notification_service import NotificationService


class PropertyAppointmentService:
    """Service for property appointment business logic."""

    # Valid status transitions
    CLIENT_TRANSITIONS = {
        AppointmentStatus.REQUESTED: [AppointmentStatus.CANCELLED],
        AppointmentStatus.CONFIRMED: [AppointmentStatus.CANCELLED],
        AppointmentStatus.RESCHEDULED: [AppointmentStatus.CANCELLED],
    }

    AGENT_TRANSITIONS = {
        AppointmentStatus.REQUESTED: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLED,
        ],
        AppointmentStatus.CONFIRMED: [
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.NO_SHOW,
        ],
        AppointmentStatus.RESCHEDULED: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.NO_SHOW,
        ],
    }

    MANAGER_TRANSITIONS = {
        AppointmentStatus.REQUESTED: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLED,
        ],
        AppointmentStatus.CONFIRMED: [
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.NO_SHOW,
        ],
        AppointmentStatus.RESCHEDULED: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.NO_SHOW,
        ],
    }

    # Statuses that block time slots
    BLOCKING_STATUSES = [
        AppointmentStatus.REQUESTED,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.RESCHEDULED,
    ]

    @staticmethod
    def create_appointment(
        db: Session,
        appointment_data: AppointmentCreate,
        client_id: str,
    ) -> PropertyAppointment:
        """Create a new appointment with validation."""
        from app.models.conversation import Conversation
        from app.services.agent_service import AgentService
        from app.services.property_service import PropertyService

        # Validate property exists
        property_obj = PropertyService.get_property_by_id(db, appointment_data.property_id)
        if not property_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found",
            )

        # Validate agent exists and is active
        agent = AgentService.get_agent_by_id(db, appointment_data.agent_id)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        # Check if agent user is active
        from app.services.user_service import UserService
        agent_user = UserService.get_user_by_id(db, agent.user_id)
        if not agent_user or not agent_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent is not active",
            )

        # Validate agent owns the property
        if property_obj.agent_id != agent.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent does not own this property",
            )

        # Validate property is not archived, sold, or rented
        if property_obj.status in [
            PropertyStatus.ARCHIVED.value,
            PropertyStatus.SOLD.value,
            PropertyStatus.RENTED.value,
        ]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot create appointment for property with status {property_obj.status}",
            )

        # Validate scheduled_start is in the future
        if appointment_data.scheduled_start < datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="scheduled_start must be in the future",
            )

        # Validate scheduled_end is after scheduled_start
        if appointment_data.scheduled_end <= appointment_data.scheduled_start:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="scheduled_end must be after scheduled_start",
            )

        # Validate duration is between 30 minutes and 4 hours
        duration = appointment_data.scheduled_end - appointment_data.scheduled_start
        if duration < timedelta(minutes=30):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Appointment duration must be at least 30 minutes",
            )
        if duration > timedelta(hours=4):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Appointment duration must not exceed 4 hours",
            )

        # Validate conversation_id if provided
        if appointment_data.conversation_id:
            conversation = (
                db.query(Conversation)
                .filter(Conversation.id == appointment_data.conversation_id)
                .first()
            )
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found",
                )
            if conversation.client_id != client_id or conversation.agent_id != agent.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Conversation must belong to the same client and agent",
                )

        # Check for client conflicts
        PropertyAppointmentService._check_client_conflicts(
            db, client_id, appointment_data.scheduled_start, appointment_data.scheduled_end
        )

        # Check for agent conflicts
        PropertyAppointmentService._check_agent_conflicts(
            db, agent.id, appointment_data.scheduled_start, appointment_data.scheduled_end
        )

        # Create appointment
        appointment = PropertyAppointment(
            client_id=client_id,
            agent_id=agent.id,
            property_id=property_obj.id,
            conversation_id=appointment_data.conversation_id,
            scheduled_start=appointment_data.scheduled_start,
            scheduled_end=appointment_data.scheduled_end,
            status=AppointmentStatus.REQUESTED.value,
            client_notes=appointment_data.client_notes,
        )
        db.add(appointment)
        db.flush()
        db.refresh(appointment)

        # Notify agent of new appointment request
        NotificationService.create_notification(
            db,
            user_id=agent.user_id,
            notification_type=NotificationType.APPOINTMENT_REQUESTED,
            title="New appointment request",
            message="You have received a new property viewing appointment request",
            data={
                "appointment_id": appointment.id,
                "property_id": property_obj.id,
                "scheduled_start": appointment.scheduled_start.isoformat(),
                "status": appointment.status,
            },
        )

        db.commit()
        db.refresh(appointment)

        return appointment

    @staticmethod
    def _check_client_conflicts(
        db: Session,
        client_id: str,
        scheduled_start: datetime,
        scheduled_end: datetime,
    ) -> None:
        """Check for overlapping appointments for the same client."""
        conflict = (
            db.query(PropertyAppointment)
            .filter(
                PropertyAppointment.client_id == client_id,
                PropertyAppointment.status.in_(
                    [s.value for s in PropertyAppointmentService.BLOCKING_STATUSES]
                ),
                PropertyAppointment.scheduled_start < scheduled_end,
                PropertyAppointment.scheduled_end > scheduled_start,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Client has an overlapping appointment",
            )

    @staticmethod
    def _check_agent_conflicts(
        db: Session,
        agent_id: str,
        scheduled_start: datetime,
        scheduled_end: datetime,
    ) -> None:
        """Check for overlapping appointments for the same agent."""
        conflict = (
            db.query(PropertyAppointment)
            .filter(
                PropertyAppointment.agent_id == agent_id,
                PropertyAppointment.status.in_(
                    [s.value for s in PropertyAppointmentService.BLOCKING_STATUSES]
                ),
                PropertyAppointment.scheduled_start < scheduled_end,
                PropertyAppointment.scheduled_end > scheduled_start,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Agent has an overlapping appointment",
            )

    @staticmethod
    def get_appointment(db: Session, appointment_id: str) -> PropertyAppointment:
        """Get appointment by ID."""
        return (
            db.query(PropertyAppointment)
            .filter(PropertyAppointment.id == appointment_id)
            .first()
        )

    @staticmethod
    def get_user_appointments(
        db: Session,
        user_id: str,
        status: str | None = None,
        property_id: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PropertyAppointment]:
        """Get appointments for a user (as client or agent)."""
        from app.models.agent import Agent

        # Get appointments where user is client
        client_appointments = (
            db.query(PropertyAppointment)
            .filter(PropertyAppointment.client_id == user_id)
        )

        # Get appointments where user is agent (via Agent table)
        agent_obj = db.query(Agent).filter(Agent.user_id == user_id).first()
        if agent_obj:
            agent_appointments = (
                db.query(PropertyAppointment)
                .filter(PropertyAppointment.agent_id == agent_obj.id)
            )
            query = client_appointments.union(agent_appointments)
        else:
            query = client_appointments

        # Apply filters
        if status:
            query = query.filter(PropertyAppointment.status == status)
        if property_id:
            query = query.filter(PropertyAppointment.property_id == property_id)
        if date_from:
            query = query.filter(PropertyAppointment.scheduled_start >= date_from)
        if date_to:
            query = query.filter(PropertyAppointment.scheduled_start <= date_to)

        return query.order_by(PropertyAppointment.scheduled_start).offset(skip).limit(limit).all()

    @staticmethod
    def get_agent_appointments(
        db: Session,
        agent_id: str,
        status: str | None = None,
        property_id: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PropertyAppointment]:
        """Get appointments for an agent."""
        query = db.query(PropertyAppointment).filter(
            PropertyAppointment.agent_id == agent_id
        )

        # Apply filters
        if status:
            query = query.filter(PropertyAppointment.status == status)
        if property_id:
            query = query.filter(PropertyAppointment.property_id == property_id)
        if date_from:
            query = query.filter(PropertyAppointment.scheduled_start >= date_from)
        if date_to:
            query = query.filter(PropertyAppointment.scheduled_start <= date_to)

        return query.order_by(PropertyAppointment.scheduled_start).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_appointments(
        db: Session,
        status: str | None = None,
        property_id: str | None = None,
        agent_id: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PropertyAppointment]:
        """Get all appointments (manager only)."""
        query = db.query(PropertyAppointment)

        # Apply filters
        if status:
            query = query.filter(PropertyAppointment.status == status)
        if property_id:
            query = query.filter(PropertyAppointment.property_id == property_id)
        if agent_id:
            query = query.filter(PropertyAppointment.agent_id == agent_id)
        if date_from:
            query = query.filter(PropertyAppointment.scheduled_start >= date_from)
        if date_to:
            query = query.filter(PropertyAppointment.scheduled_start <= date_to)

        return query.order_by(PropertyAppointment.scheduled_start).offset(skip).limit(limit).all()

    @staticmethod
    def update_appointment(
        db: Session,
        appointment: PropertyAppointment,
        update_data: AppointmentUpdate,
        user_role: str,
    ) -> PropertyAppointment:
        """Update appointment notes."""
        # Clients can only update client_notes before completion
        if user_role == "client":
            if update_data.agent_notes is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Clients cannot modify agent_notes",
                )
            if appointment.status in [
                AppointmentStatus.COMPLETED.value,
                AppointmentStatus.CANCELLED.value,
                AppointmentStatus.NO_SHOW.value,
            ]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot update completed, cancelled, or no-show appointments",
                )
            if update_data.client_notes is not None:
                appointment.client_notes = update_data.client_notes

        # Agents and managers can update agent_notes
        elif user_role in ["agent", "manager"]:
            if update_data.agent_notes is not None:
                appointment.agent_notes = update_data.agent_notes
            if user_role == "manager" and update_data.client_notes is not None:
                appointment.client_notes = update_data.client_notes

        db.commit()
        db.refresh(appointment)

        return appointment

    @staticmethod
    def update_status(
        db: Session,
        appointment: PropertyAppointment,
        new_status: AppointmentStatus,
        cancellation_reason: str | None = None,
        user_role: str = "manager",
    ) -> PropertyAppointment:
        """Update appointment status with transition validation."""
        current_status = AppointmentStatus(appointment.status)

        # Determine valid transitions based on role
        if user_role == "client":
            valid_transitions = PropertyAppointmentService.CLIENT_TRANSITIONS
        elif user_role == "agent":
            valid_transitions = PropertyAppointmentService.AGENT_TRANSITIONS
        else:  # manager
            valid_transitions = PropertyAppointmentService.MANAGER_TRANSITIONS

        # Validate transition
        if current_status not in valid_transitions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from {current_status.value}",
            )

        if new_status not in valid_transitions[current_status]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {current_status.value} to {new_status.value}",
            )

        # Validate cancellation reason for cancelled status
        if new_status == AppointmentStatus.CANCELLED and not cancellation_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="cancellation_reason is required when cancelling",
            )

        # Update status
        appointment.status = new_status.value
        if cancellation_reason:
            appointment.cancellation_reason = cancellation_reason

        db.flush()
        db.refresh(appointment)

        # Create notifications based on status change
        # Determine recipient: if agent/manager changed status, notify client; if client changed status, notify agent
        recipient_user_id = None
        notification_type = None
        title = ""
        message = ""

        if user_role in ["agent", "manager"]:
            # Agent or manager changed status, notify client
            recipient_user_id = appointment.client_id
            if new_status == AppointmentStatus.CONFIRMED:
                notification_type = NotificationType.APPOINTMENT_CONFIRMED
                title = "Appointment confirmed"
                message = "Your property viewing appointment has been confirmed"
            elif new_status == AppointmentStatus.CANCELLED:
                notification_type = NotificationType.APPOINTMENT_CANCELLED
                title = "Appointment cancelled"
                message = "Your property viewing appointment has been cancelled"
            elif new_status == AppointmentStatus.COMPLETED:
                notification_type = NotificationType.APPOINTMENT_COMPLETED
                title = "Appointment completed"
                message = "Your property viewing appointment has been completed"
            elif new_status == AppointmentStatus.NO_SHOW:
                notification_type = NotificationType.APPOINTMENT_NO_SHOW
                title = "Appointment marked as no-show"
                message = "Your property viewing appointment was marked as no-show"
        elif user_role == "client":
            # Client changed status, notify agent
            from app.models.agent import Agent
            agent = db.query(Agent).filter(Agent.id == appointment.agent_id).first()
            if agent:
                recipient_user_id = agent.user_id
                if new_status == AppointmentStatus.CANCELLED:
                    notification_type = NotificationType.APPOINTMENT_CANCELLED
                    title = "Appointment cancelled"
                    message = "A property viewing appointment has been cancelled by the client"

        if recipient_user_id and notification_type:
            NotificationService.create_notification(
                db,
                user_id=recipient_user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                data={
                    "appointment_id": appointment.id,
                    "property_id": appointment.property_id,
                    "scheduled_start": appointment.scheduled_start.isoformat(),
                    "status": appointment.status,
                },
            )

        db.commit()
        db.refresh(appointment)

        return appointment

    @staticmethod
    def reschedule_appointment(
        db: Session,
        appointment: PropertyAppointment,
        reschedule_data: AppointmentReschedule,
        user_role: str = "agent",
    ) -> PropertyAppointment:
        """Reschedule an appointment with validation."""
        # Validate scheduled_start is in the future
        if reschedule_data.scheduled_start < datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="scheduled_start must be in the future",
            )

        # Validate duration is between 30 minutes and 4 hours
        duration = reschedule_data.scheduled_end - reschedule_data.scheduled_start
        if duration < timedelta(minutes=30):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Appointment duration must be at least 30 minutes",
            )
        if duration > timedelta(hours=4):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Appointment duration must not exceed 4 hours",
            )

        # Check for client conflicts (excluding current appointment)
        PropertyAppointmentService._check_client_conflicts_excluding(
            db,
            appointment.client_id,
            reschedule_data.scheduled_start,
            reschedule_data.scheduled_end,
            appointment.id,
        )

        # Check for agent conflicts (excluding current appointment)
        PropertyAppointmentService._check_agent_conflicts_excluding(
            db,
            appointment.agent_id,
            reschedule_data.scheduled_start,
            reschedule_data.scheduled_end,
            appointment.id,
        )

        # Update times and status
        appointment.scheduled_start = reschedule_data.scheduled_start
        appointment.scheduled_end = reschedule_data.scheduled_end
        appointment.status = AppointmentStatus.RESCHEDULED.value

        db.flush()
        db.refresh(appointment)

        # Notify the other participant of rescheduling
        # If agent rescheduled, notify client; if client rescheduled, notify agent
        recipient_user_id = None
        if user_role in ["agent", "manager"]:
            # Agent or manager rescheduled, notify client
            recipient_user_id = appointment.client_id
        elif user_role == "client":
            # Client rescheduled, notify agent
            from app.models.agent import Agent
            agent = db.query(Agent).filter(Agent.id == appointment.agent_id).first()
            if agent:
                recipient_user_id = agent.user_id

        if recipient_user_id:
            NotificationService.create_notification(
                db,
                user_id=recipient_user_id,
                notification_type=NotificationType.APPOINTMENT_RESCHEDULED,
                title="Appointment rescheduled",
                message="Your property viewing appointment has been rescheduled",
                data={
                    "appointment_id": appointment.id,
                    "property_id": appointment.property_id,
                    "scheduled_start": appointment.scheduled_start.isoformat(),
                    "status": appointment.status,
                },
            )

        db.commit()
        db.refresh(appointment)

        return appointment

    @staticmethod
    def _check_client_conflicts_excluding(
        db: Session,
        client_id: str,
        scheduled_start: datetime,
        scheduled_end: datetime,
        exclude_id: str,
    ) -> None:
        """Check for overlapping appointments for the same client, excluding current appointment."""
        conflict = (
            db.query(PropertyAppointment)
            .filter(
                PropertyAppointment.client_id == client_id,
                PropertyAppointment.id != exclude_id,
                PropertyAppointment.status.in_(
                    [s.value for s in PropertyAppointmentService.BLOCKING_STATUSES]
                ),
                PropertyAppointment.scheduled_start < scheduled_end,
                PropertyAppointment.scheduled_end > scheduled_start,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Client has an overlapping appointment",
            )

    @staticmethod
    def _check_agent_conflicts_excluding(
        db: Session,
        agent_id: str,
        scheduled_start: datetime,
        scheduled_end: datetime,
        exclude_id: str,
    ) -> None:
        """Check for overlapping appointments for the same agent, excluding current appointment."""
        conflict = (
            db.query(PropertyAppointment)
            .filter(
                PropertyAppointment.agent_id == agent_id,
                PropertyAppointment.id != exclude_id,
                PropertyAppointment.status.in_(
                    [s.value for s in PropertyAppointmentService.BLOCKING_STATUSES]
                ),
                PropertyAppointment.scheduled_start < scheduled_end,
                PropertyAppointment.scheduled_end > scheduled_start,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Agent has an overlapping appointment",
            )

    @staticmethod
    def cancel_appointment(
        db: Session,
        appointment: PropertyAppointment,
        cancellation_reason: str,
        user_role: str,
    ) -> PropertyAppointment:
        """Cancel an appointment."""
        return PropertyAppointmentService.update_status(
            db,
            appointment,
            AppointmentStatus.CANCELLED,
            cancellation_reason,
            user_role,
        )

    @staticmethod
    def delete_appointment(db: Session, appointment: PropertyAppointment) -> None:
        """Soft delete an appointment by cancelling it."""
        appointment.status = AppointmentStatus.CANCELLED.value
        db.commit()
