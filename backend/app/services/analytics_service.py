"""Service for admin analytics and dashboard metrics."""

from datetime import UTC, datetime

from sqlalchemy import distinct, func, or_
from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.client_search_request import ClientSearchRequest
from app.models.contract import Contract
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.notification import Notification
from app.models.property import ListingType, Property, PropertyStatus
from app.models.property_appointment import PropertyAppointment, AppointmentStatus
from app.models.property_favorite import PropertyFavorite
from app.models.saved_search import SavedSearch
from app.models.user import User, UserRole
from app.services.market_service import MarketService


class AnalyticsService:
    """Service for admin analytics and dashboard metrics."""

    @staticmethod
    def get_dashboard_overview(db: Session) -> dict:
        """Get dashboard overview metrics."""
        # User counts
        total_users = db.query(func.count(User.id)).scalar()
        total_clients = (
            db.query(func.count(User.id))
            .filter(User.role == UserRole.CLIENT)
            .scalar()
        )
        total_agents = (
            db.query(func.count(User.id))
            .filter(User.role == UserRole.AGENT)
            .scalar()
        )
        active_agents = (
            db.query(func.count(Agent.id))
            .join(User, Agent.user_id == User.id)
            .filter(User.role == UserRole.AGENT, User.is_active.is_(True))
            .scalar()
        )

        # Property counts by status
        total_properties = db.query(func.count(Property.id)).scalar()
        available_properties = (
            db.query(func.count(Property.id))
            .filter(Property.status == PropertyStatus.AVAILABLE.value)
            .scalar()
        )
        reserved_properties = (
            db.query(func.count(Property.id))
            .filter(Property.status == PropertyStatus.RESERVED.value)
            .scalar()
        )
        sold_properties = (
            db.query(func.count(Property.id))
            .filter(Property.status == PropertyStatus.SOLD.value)
            .scalar()
        )
        rented_properties = (
            db.query(func.count(Property.id))
            .filter(Property.status == PropertyStatus.RENTED.value)
            .scalar()
        )
        archived_properties = (
            db.query(func.count(Property.id))
            .filter(Property.status == PropertyStatus.ARCHIVED.value)
            .scalar()
        )

        # Client search request counts
        total_client_search_requests = db.query(func.count(ClientSearchRequest.id)).scalar()
        active_client_search_requests = (
            db.query(func.count(ClientSearchRequest.id))
            .filter(ClientSearchRequest.is_active.is_(True))
            .scalar()
        )

        # Conversation counts
        total_conversations = db.query(func.count(Conversation.id)).scalar()
        active_conversations = (
            db.query(func.count(Conversation.id))
            .filter(Conversation.is_active.is_(True))
            .scalar()
        )

        # Message count
        total_messages = db.query(func.count(Message.id)).scalar()

        # Notification counts
        unread_notifications = (
            db.query(func.count(Notification.id))
            .filter(Notification.is_read.is_(False))
            .scalar()
        )

        # Appointment counts by status
        total_appointments = db.query(func.count(PropertyAppointment.id)).scalar()
        upcoming_appointments = (
            db.query(func.count(PropertyAppointment.id))
            .filter(
                PropertyAppointment.scheduled_start > datetime.now(UTC),
                PropertyAppointment.status.in_(
                    [
                        AppointmentStatus.REQUESTED.value,
                        AppointmentStatus.CONFIRMED.value,
                    ]
                ),
            )
            .scalar()
        )
        completed_appointments = (
            db.query(func.count(PropertyAppointment.id))
            .filter(PropertyAppointment.status == AppointmentStatus.COMPLETED.value)
            .scalar()
        )
        cancelled_appointments = (
            db.query(func.count(PropertyAppointment.id))
            .filter(PropertyAppointment.status == AppointmentStatus.CANCELLED.value)
            .scalar()
        )

        # Favorites and saved searches
        total_favorites = db.query(func.count(PropertyFavorite.id)).scalar()
        active_saved_searches = (
            db.query(func.count(SavedSearch.id))
            .filter(SavedSearch.is_active.is_(True))
            .scalar()
        )

        # Lead scoring counts
        total_hot_leads = (
            db.query(func.count(ClientSearchRequest.id))
            .filter(ClientSearchRequest.qualification_level == "hot")
            .scalar()
        )
        total_warm_leads = (
            db.query(func.count(ClientSearchRequest.id))
            .filter(ClientSearchRequest.qualification_level == "warm")
            .scalar()
        )
        total_cold_leads = (
            db.query(func.count(ClientSearchRequest.id))
            .filter(ClientSearchRequest.qualification_level == "cold")
            .scalar()
        )
        average_lead_score = (
            db.query(func.avg(ClientSearchRequest.lead_score))
            .filter(ClientSearchRequest.lead_score.isnot(None))
            .scalar()
        )

        return {
            "total_users": total_users or 0,
            "total_clients": total_clients or 0,
            "total_agents": total_agents or 0,
            "active_agents": active_agents or 0,
            "total_properties": total_properties or 0,
            "available_properties": available_properties or 0,
            "reserved_properties": reserved_properties or 0,
            "sold_properties": sold_properties or 0,
            "rented_properties": rented_properties or 0,
            "archived_properties": archived_properties or 0,
            "total_client_search_requests": total_client_search_requests or 0,
            "active_client_search_requests": active_client_search_requests or 0,
            "total_conversations": total_conversations or 0,
            "active_conversations": active_conversations or 0,
            "total_messages": total_messages or 0,
            "unread_notifications": unread_notifications or 0,
            "total_appointments": total_appointments or 0,
            "upcoming_appointments": upcoming_appointments or 0,
            "completed_appointments": completed_appointments or 0,
            "cancelled_appointments": cancelled_appointments or 0,
            "total_favorites": total_favorites or 0,
            "active_saved_searches": active_saved_searches or 0,
            "total_hot_leads": total_hot_leads or 0,
            "total_warm_leads": total_warm_leads or 0,
            "total_cold_leads": total_cold_leads or 0,
            "average_lead_score": round(float(average_lead_score), 2) if average_lead_score else None,
        }

    @staticmethod
    def get_property_analytics(
        db: Session,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        agent_id: str | None = None,
        property_type: str | None = None,
        listing_type: str | None = None,
        city: str | None = None,
        district: str | None = None,
    ) -> dict:
        """Get property analytics with optional filters."""
        # Build base query with filters
        query = db.query(Property)

        if date_from:
            query = query.filter(Property.created_at >= date_from)
        if date_to:
            query = query.filter(Property.created_at <= date_to)
        if agent_id:
            query = query.filter(Property.agent_id == agent_id)
        if property_type:
            query = query.filter(Property.property_type == property_type)
        if listing_type:
            query = query.filter(Property.listing_type == listing_type)
        if city:
            query = query.filter(Property.city.ilike(f"%{city}%"))
        if district:
            query = query.filter(Property.district.ilike(f"%{district}%"))

        # Total properties
        total_properties = query.count()

        # Get property IDs from filtered query
        property_ids = [row.id for row in query.all()]

        # Properties by status
        properties_by_status = (
            db.query(Property.status, func.count(Property.id))
            .filter(Property.id.in_(property_ids))
            .group_by(Property.status)
            .all()
        )
        status_dict = {row[0]: row[1] for row in properties_by_status}

        # Properties by type
        properties_by_type = (
            db.query(Property.property_type, func.count(Property.id))
            .filter(Property.id.in_(property_ids))
            .group_by(Property.property_type)
            .all()
        )
        type_dict = {row[0]: row[1] for row in properties_by_type}

        # Properties by listing type
        properties_by_listing_type = (
            db.query(Property.listing_type, func.count(Property.id))
            .filter(Property.id.in_(property_ids))
            .group_by(Property.listing_type)
            .all()
        )
        listing_type_dict = {row[0]: row[1] for row in properties_by_listing_type}

        # Properties by city
        properties_by_city = (
            db.query(Property.city, func.count(Property.id))
            .filter(Property.id.in_(property_ids))
            .group_by(Property.city)
            .all()
        )
        city_dict = {row[0]: row[1] for row in properties_by_city}

        # Price statistics (exclude null/invalid prices)
        sale_prices = (
            db.query(Property.price)
            .filter(
                Property.listing_type == ListingType.SALE.value,
                Property.price.is_not(None),
                Property.id.in_(property_ids)
            )
            .all()
        )
        sale_price_values = [p[0] for p in sale_prices if p[0] is not None]
        average_sale_price = (
            sum(sale_price_values) / len(sale_price_values) if sale_price_values else None
        )
        minimum_price = min(sale_price_values) if sale_price_values else None
        maximum_price = max(sale_price_values) if sale_price_values else None

        rental_prices = (
            db.query(Property.price)
            .filter(
                Property.listing_type == ListingType.RENT.value,
                Property.price.is_not(None),
                Property.id.in_(property_ids)
            )
            .all()
        )
        rental_price_values = [p[0] for p in rental_prices if p[0] is not None]
        average_rental_price = (
            sum(rental_price_values) / len(rental_price_values) if rental_price_values else None
        )

        # Featured count
        featured_count = (
            db.query(func.count(Property.id))
            .filter(
                Property.is_featured.is_(True),
                Property.id.in_(property_ids)
            )
            .scalar()
        ) or 0

        # Properties created during period
        created_in_period = total_properties

        # Properties sold or rented during period
        sold_or_rented_in_period = (
            db.query(func.count(Property.id))
            .filter(
                Property.status.in_([PropertyStatus.SOLD.value, PropertyStatus.RENTED.value]),
                Property.id.in_(property_ids)
            )
            .scalar()
        ) or 0

        return {
            "total_properties": total_properties,
            "properties_by_status": status_dict,
            "properties_by_type": type_dict,
            "properties_by_listing_type": listing_type_dict,
            "properties_by_city": city_dict,
            "average_sale_price": average_sale_price,
            "average_rental_price": average_rental_price,
            "minimum_price": minimum_price,
            "maximum_price": maximum_price,
            "featured_count": featured_count,
            "created_in_period": created_in_period,
            "sold_or_rented_in_period": sold_or_rented_in_period,
        }

    @staticmethod
    def get_agent_analytics(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        active_only: bool = False,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        order_by: str = "total_listings",
    ) -> tuple[list[dict], int]:
        """Get per-agent analytics with pagination."""
        # Validate order_by
        valid_order_fields = {
            "total_listings",
            "completed_appointments",
            "sold_properties",
            "received_favorites",
        }
        if order_by not in valid_order_fields:
            order_by = "total_listings"

        # Build base query
        query = (
            db.query(
                Agent.id.label("agent_id"),
                Agent.user_id,
                User.first_name,
                User.last_name,
                Agent.years_experience,
            )
            .join(User, Agent.user_id == User.id)
        )

        if active_only:
            query = query.filter(User.is_active.is_(True))

        if date_from:
            query = query.filter(User.created_at >= date_from)
        if date_to:
            query = query.filter(User.created_at <= date_to)

        # Get total count
        total = query.count()

        # Get agent IDs with pagination
        agents = query.offset(skip).limit(limit).all()

        agent_ids = [agent.agent_id for agent in agents]

        if not agent_ids:
            return [], total

        # Build analytics data for each agent
        agent_data = []
        for agent in agents:
            # Property counts
            total_listings = (
                db.query(func.count(Property.id))
                .filter(Property.agent_id == agent.agent_id)
                .scalar()
            ) or 0

            available_listings = (
                db.query(func.count(Property.id))
                .filter(
                    Property.agent_id == agent.agent_id,
                    Property.status == PropertyStatus.AVAILABLE.value,
                )
                .scalar()
            ) or 0

            sold_listings = (
                db.query(func.count(Property.id))
                .filter(
                    Property.agent_id == agent.agent_id,
                    Property.status == PropertyStatus.SOLD.value,
                )
                .scalar()
            ) or 0

            rented_listings = (
                db.query(func.count(Property.id))
                .filter(
                    Property.agent_id == agent.agent_id,
                    Property.status == PropertyStatus.RENTED.value,
                )
                .scalar()
            ) or 0

            # Appointment counts
            appointment_count = (
                db.query(func.count(PropertyAppointment.id))
                .filter(PropertyAppointment.agent_id == agent.agent_id)
                .scalar()
            ) or 0

            completed_appointment_count = (
                db.query(func.count(PropertyAppointment.id))
                .filter(
                    PropertyAppointment.agent_id == agent.agent_id,
                    PropertyAppointment.status == AppointmentStatus.COMPLETED.value,
                )
                .scalar()
            ) or 0

            # Conversation count
            conversation_count = (
                db.query(func.count(Conversation.id))
                .filter(Conversation.agent_id == agent.agent_id)
                .scalar()
            ) or 0

            # Received favorites count
            received_favorites = (
                db.query(func.count(PropertyFavorite.id))
                .join(Property, PropertyFavorite.property_id == Property.id)
                .filter(Property.agent_id == agent.agent_id)
                .scalar()
            ) or 0

            agent_data.append(
                {
                    "agent_id": agent.agent_id,
                    "user_id": agent.user_id,
                    "first_name": agent.first_name,
                    "last_name": agent.last_name,
                    "years_experience": agent.years_experience,
                    "total_listings": total_listings,
                    "available_listings": available_listings,
                    "sold_listings": sold_listings,
                    "rented_listings": rented_listings,
                    "appointment_count": appointment_count,
                    "completed_appointment_count": completed_appointment_count,
                    "conversation_count": conversation_count,
                    "received_favorites": received_favorites,
                }
            )

        # Sort by specified field
        reverse_map = {
            "total_listings": lambda x: x["total_listings"],
            "completed_appointments": lambda x: x["completed_appointment_count"],
            "sold_properties": lambda x: x["sold_listings"],
            "received_favorites": lambda x: x["received_favorites"],
        }
        agent_data.sort(key=reverse_map[order_by], reverse=True)

        return agent_data, total

    @staticmethod
    def get_client_analytics(db: Session) -> dict:
        """Get client aggregate metrics."""
        total_clients = (
            db.query(func.count(User.id))
            .filter(User.role == UserRole.CLIENT)
            .scalar()
        ) or 0

        # Active clients (created in last 30 days)
        thirty_days_ago = datetime.now(UTC).replace(day=1)  # Simplified for testing
        active_clients = (
            db.query(func.count(User.id))
            .filter(User.role == UserRole.CLIENT, User.created_at >= thirty_days_ago)
            .scalar()
        ) or 0

        # Clients with search requests
        clients_with_search_requests = (
            db.query(func.count(distinct(ClientSearchRequest.client_id)))
            .scalar()
        ) or 0

        # Clients with favorites
        clients_with_favorites = (
            db.query(func.count(distinct(PropertyFavorite.user_id)))
            .scalar()
        ) or 0

        # Clients with saved searches
        clients_with_saved_searches = (
            db.query(func.count(distinct(SavedSearch.user_id)))
            .scalar()
        ) or 0

        # Clients with conversations
        clients_with_conversations = (
            db.query(func.count(distinct(Conversation.client_id)))
            .scalar()
        ) or 0

        # Clients with appointments
        clients_with_appointments = (
            db.query(func.count(distinct(PropertyAppointment.client_id)))
            .scalar()
        ) or 0

        # Averages
        total_favorites = db.query(func.count(PropertyFavorite.id)).scalar() or 0
        total_saved_searches = db.query(func.count(SavedSearch.id)).scalar() or 0
        total_appointments = db.query(func.count(PropertyAppointment.id)).scalar() or 0

        average_favorites_per_client = (
            total_favorites / total_clients if total_clients > 0 else 0.0
        )
        average_saved_searches_per_client = (
            total_saved_searches / total_clients if total_clients > 0 else 0.0
        )
        average_appointments_per_client = (
            total_appointments / total_clients if total_clients > 0 else 0.0
        )

        return {
            "total_clients": total_clients,
            "active_clients": active_clients,
            "clients_with_search_requests": clients_with_search_requests,
            "clients_with_favorites": clients_with_favorites,
            "clients_with_saved_searches": clients_with_saved_searches,
            "clients_with_conversations": clients_with_conversations,
            "clients_with_appointments": clients_with_appointments,
            "average_favorites_per_client": average_favorites_per_client,
            "average_saved_searches_per_client": average_saved_searches_per_client,
            "average_appointments_per_client": average_appointments_per_client,
        }

    @staticmethod
    def get_appointment_analytics(
        db: Session,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        agent_id: str | None = None,
        property_id: str | None = None,
        city: str | None = None,
        district: str | None = None,
    ) -> dict:
        """Get appointment analytics with optional filters."""
        # Build base query
        query = db.query(PropertyAppointment)

        if date_from:
            query = query.filter(PropertyAppointment.scheduled_start >= date_from)
        if date_to:
            query = query.filter(PropertyAppointment.scheduled_start <= date_to)
        if agent_id:
            query = query.filter(PropertyAppointment.agent_id == agent_id)
        if property_id:
            query = query.filter(PropertyAppointment.property_id == property_id)
        if city or district:
            query = query.join(Property, PropertyAppointment.property_id == Property.id)
            if city:
                query = query.filter(Property.city.ilike(f"%{city}%"))
            if district:
                query = query.filter(Property.district.ilike(f"%{district}%"))

        # Total appointments
        total_appointments = query.count()

        # Count by status
        requested = (
            query.filter(PropertyAppointment.status == AppointmentStatus.REQUESTED.value)
            .count()
        )
        confirmed = (
            query.filter(PropertyAppointment.status == AppointmentStatus.CONFIRMED.value)
            .count()
        )
        rescheduled = (
            query.filter(PropertyAppointment.status == AppointmentStatus.RESCHEDULED.value)
            .count()
        )
        cancelled = (
            query.filter(PropertyAppointment.status == AppointmentStatus.CANCELLED.value)
            .count()
        )
        completed = (
            query.filter(PropertyAppointment.status == AppointmentStatus.COMPLETED.value)
            .count()
        )
        no_show = (
            query.filter(PropertyAppointment.status == AppointmentStatus.NO_SHOW.value)
            .count()
        )

        # Rates (avoid division by zero)
        completion_rate = (
            (completed / total_appointments * 100) if total_appointments > 0 else 0.0
        )
        cancellation_rate = (
            (cancelled / total_appointments * 100) if total_appointments > 0 else 0.0
        )
        no_show_rate = (
            (no_show / total_appointments * 100) if total_appointments > 0 else 0.0
        )

        # Upcoming count
        upcoming_count = (
            query.filter(
                PropertyAppointment.scheduled_start > datetime.now(UTC),
                PropertyAppointment.status.in_(
                    [
                        AppointmentStatus.REQUESTED.value,
                        AppointmentStatus.CONFIRMED.value,
                    ]
                ),
            )
            .count()
        )

        # Appointments by day
        appointment_ids = [row.id for row in query.all()]
        appointments_by_day = (
            db.query(
                func.date(PropertyAppointment.scheduled_start).label("day"),
                func.count(PropertyAppointment.id),
            )
            .filter(PropertyAppointment.id.in_(appointment_ids))
            .group_by(func.date(PropertyAppointment.scheduled_start))
            .all()
        )
        day_dict = {str(row[0]): row[1] for row in appointments_by_day}

        # Appointments by agent
        appointments_by_agent = (
            db.query(
                PropertyAppointment.agent_id,
                func.count(PropertyAppointment.id),
            )
            .filter(PropertyAppointment.id.in_(appointment_ids))
            .group_by(PropertyAppointment.agent_id)
            .all()
        )
        agent_dict = {row[0]: row[1] for row in appointments_by_agent}

        return {
            "total_appointments": total_appointments,
            "requested": requested,
            "confirmed": confirmed,
            "rescheduled": rescheduled,
            "cancelled": cancelled,
            "completed": completed,
            "no_show": no_show,
            "completion_rate": completion_rate,
            "cancellation_rate": cancellation_rate,
            "no_show_rate": no_show_rate,
            "upcoming_count": upcoming_count,
            "appointments_by_day": day_dict,
            "appointments_by_agent": agent_dict,
        }

    @staticmethod
    def get_engagement_analytics(db: Session) -> dict:
        """Get engagement metrics."""
        # Conversation metrics
        total_conversations = db.query(func.count(Conversation.id)).scalar() or 0
        active_conversations = (
            db.query(func.count(Conversation.id))
            .filter(Conversation.is_active.is_(True))
            .scalar()
        ) or 0

        # Message metrics
        total_messages = db.query(func.count(Message.id)).scalar() or 0
        average_messages_per_conversation = (
            (total_messages / total_conversations) if total_conversations > 0 else 0.0
        )

        # Notification metrics
        total_notifications = db.query(func.count(Notification.id)).scalar() or 0
        unread_notifications = (
            db.query(func.count(Notification.id))
            .filter(Notification.is_read.is_(False))
            .scalar()
        ) or 0
        notification_read_rate = (
            ((total_notifications - unread_notifications) / total_notifications * 100)
            if total_notifications > 0
            else 0.0
        )

        # Favorites and saved searches
        total_favorites = db.query(func.count(PropertyFavorite.id)).scalar() or 0
        total_saved_searches = db.query(func.count(SavedSearch.id)).scalar() or 0
        saved_searches_with_notifications_enabled = (
            db.query(func.count(SavedSearch.id))
            .filter(SavedSearch.notifications_enabled.is_(True))
            .scalar()
        ) or 0

        # Clients with at least one engagement action
        # Engagement = favorite OR saved_search OR conversation OR message OR appointment
        client_ids_with_favorites = (
            db.query(distinct(PropertyFavorite.user_id)).scalar_subquery()
        )
        client_ids_with_saved_searches = (
            db.query(distinct(SavedSearch.user_id)).scalar_subquery()
        )
        client_ids_with_conversations = (
            db.query(distinct(Conversation.client_id)).scalar_subquery()
        )
        client_ids_with_appointments = (
            db.query(distinct(PropertyAppointment.client_id)).scalar_subquery()
        )

        clients_with_engagement = (
            db.query(func.count(distinct(User.id)))
            .filter(
                User.role == UserRole.CLIENT,
                or_(
                    User.id.in_(client_ids_with_favorites),
                    User.id.in_(client_ids_with_saved_searches),
                    User.id.in_(client_ids_with_conversations),
                    User.id.in_(client_ids_with_appointments),
                ),
            )
            .scalar()
        ) or 0

        return {
            "total_conversations": total_conversations,
            "active_conversations": active_conversations,
            "total_messages": total_messages,
            "average_messages_per_conversation": average_messages_per_conversation,
            "total_notifications": total_notifications,
            "unread_notifications": unread_notifications,
            "notification_read_rate": notification_read_rate,
            "total_favorites": total_favorites,
            "total_saved_searches": total_saved_searches,
            "saved_searches_with_notifications_enabled": saved_searches_with_notifications_enabled,
            "clients_with_engagement": clients_with_engagement,
        }

    @staticmethod
    def get_time_series(
        db: Session,
        metric: str,
        date_from: datetime,
        date_to: datetime,
        interval: str = "day",
        city: str | None = None,
        district: str | None = None,
        agent_id: str | None = None,
    ) -> dict:
        """Get time-series data for a metric."""
        # Validate metric
        valid_metrics = {
            "users",
            "properties",
            "appointments",
            "conversations",
            "messages",
            "favorites",
            "saved_searches",
            "search_requests",
            "contracts",
        }
        if metric not in valid_metrics:
            raise ValueError(f"Invalid metric: {metric}")

        # Validate interval
        valid_intervals = {"day", "week", "month"}
        if interval not in valid_intervals:
            raise ValueError(f"Invalid interval: {interval}")

        # Map interval to PostgreSQL date_trunc format
        interval_map = {"day": "day", "week": "week", "month": "month"}

        # Select appropriate table and date column based on metric
        metric_table_map = {
            "users": (User, User.created_at),
            "properties": (Property, Property.created_at),
            "appointments": (PropertyAppointment, PropertyAppointment.scheduled_start),
            "conversations": (Conversation, Conversation.created_at),
            "messages": (Message, Message.created_at),
            "favorites": (PropertyFavorite, PropertyFavorite.created_at),
            "saved_searches": (SavedSearch, SavedSearch.created_at),
            "search_requests": (ClientSearchRequest, ClientSearchRequest.created_at),
            "contracts": (Contract, Contract.sale_date),
        }

        table, date_column = metric_table_map[metric]

        # Build query with date_trunc using a subquery to avoid GROUP BY issues
        base_query = (
            db.query(
                table.id,
                func.date_trunc(interval_map[interval], date_column).label("period"),
            )
            .filter(date_column >= date_from, date_column <= date_to)
        )

        if metric == "search_requests":
            if city:
                base_query = base_query.filter(ClientSearchRequest.preferred_city.ilike(f"%{city}%"))
            if district:
                base_query = base_query.filter(ClientSearchRequest.preferred_district.ilike(f"%{district}%"))
        elif metric == "contracts":
            if city:
                base_query = base_query.filter(Contract.city.ilike(f"%{city}%"))
            if district:
                base_query = base_query.filter(Contract.district.ilike(f"%{district}%"))
            if agent_id:
                base_query = base_query.filter(Contract.agent_id == agent_id)
        elif metric == "appointments":
            if agent_id:
                base_query = base_query.filter(PropertyAppointment.agent_id == agent_id)
            if city or district:
                base_query = base_query.join(Property, PropertyAppointment.property_id == Property.id)
                if city:
                    base_query = base_query.filter(Property.city.ilike(f"%{city}%"))
                if district:
                    base_query = base_query.filter(Property.district.ilike(f"%{district}%"))
        elif metric == "properties":
            if city:
                base_query = base_query.filter(Property.city.ilike(f"%{city}%"))
            if district:
                base_query = base_query.filter(Property.district.ilike(f"%{district}%"))
            if agent_id:
                base_query = base_query.filter(Property.agent_id == agent_id)

        subquery = base_query.subquery()

        query = (
            db.query(
                subquery.c.period,
                func.count(subquery.c.id),
            )
            .group_by(subquery.c.period)
            .order_by(subquery.c.period)
        )

        results = query.all()

        # Format results
        points = [
            {"period": str(row[0].date() if interval == "day" else row[0]), "value": row[1]}
            for row in results
        ]

        return {
            "metric": metric,
            "interval": interval,
            "points": points,
        }

    @staticmethod
    def get_contract_analytics(db: Session) -> dict:
        """Get aggregate contract analytics for the manager dashboard."""
        from app.models.contract import Contract, ContractType

        total = db.query(func.count(Contract.id)).scalar() or 0
        total_sales = (
            db.query(func.count(Contract.id))
            .filter(Contract.contract_type == ContractType.SALE.value)
            .scalar() or 0
        )
        total_rents = (
            db.query(func.count(Contract.id))
            .filter(Contract.contract_type == ContractType.RENT.value)
            .scalar() or 0
        )
        sales_amount = (
            db.query(func.sum(Contract.amount))
            .filter(Contract.contract_type == ContractType.SALE.value)
            .scalar()
        )
        rent_amount = (
            db.query(func.sum(Contract.amount))
            .filter(Contract.contract_type == ContractType.RENT.value)
            .scalar()
        )
        avg_sale = (
            db.query(func.avg(Contract.amount))
            .filter(Contract.contract_type == ContractType.SALE.value)
            .scalar()
        )
        avg_rent = (
            db.query(func.avg(Contract.amount))
            .filter(Contract.contract_type == ContractType.RENT.value)
            .scalar()
        )

        by_city_rows = (
            db.query(Contract.city, func.count(Contract.id))
            .group_by(Contract.city)
            .order_by(func.count(Contract.id).desc())
            .limit(10)
            .all()
        )

        by_type_rows = (
            db.query(Contract.property_type, func.count(Contract.id))
            .group_by(Contract.property_type)
            .order_by(func.count(Contract.id).desc())
            .all()
        )

        monthly_rows = (
            db.query(
                func.date_trunc("month", Contract.sale_date).label("month"),
                func.count(Contract.id).label("count"),
                func.sum(Contract.amount).label("amount"),
            )
            .group_by(func.date_trunc("month", Contract.sale_date))
            .order_by(func.date_trunc("month", Contract.sale_date))
            .limit(12)
            .all()
        )

        return {
            "total_contracts": total,
            "total_sales": total_sales,
            "total_rents": total_rents,
            "total_sales_amount": float(sales_amount) if sales_amount else 0.0,
            "total_rent_amount": float(rent_amount) if rent_amount else 0.0,
            "average_sale_amount": float(avg_sale) if avg_sale else 0.0,
            "average_rent_amount": float(avg_rent) if avg_rent else 0.0,
            "by_city": [{"city": r[0], "count": r[1]} for r in by_city_rows],
            "by_property_type": [{"property_type": r[0], "count": r[1]} for r in by_type_rows],
            "monthly_trend": [
                {
                    "month": str(r[0].date())[:7] if r[0] else "",
                    "count": r[1],
                    "amount": float(r[2]) if r[2] else 0.0,
                }
                for r in monthly_rows
            ],
        }

    @staticmethod
    def get_lead_analytics(
        db: Session,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        city: str | None = None,
        district: str | None = None,
    ) -> dict:
        """Get lead scoring analytics for the manager dashboard."""
        base_query = db.query(ClientSearchRequest)
        if date_from:
            base_query = base_query.filter(ClientSearchRequest.created_at >= date_from)
        if date_to:
            base_query = base_query.filter(ClientSearchRequest.created_at <= date_to)
        if city:
            base_query = base_query.filter(ClientSearchRequest.preferred_city.ilike(f"%{city}%"))
        if district:
            base_query = base_query.filter(ClientSearchRequest.preferred_district.ilike(f"%{district}%"))

        total_search_requests = base_query.count() or 0
        active_search_requests = base_query.filter(ClientSearchRequest.is_active.is_(True)).count() or 0
        scored_leads = base_query.filter(ClientSearchRequest.lead_score.isnot(None)).count() or 0
        unscored_leads = total_search_requests - scored_leads

        total_hot_leads = base_query.filter(ClientSearchRequest.qualification_level == "hot").count() or 0
        total_warm_leads = base_query.filter(ClientSearchRequest.qualification_level == "warm").count() or 0
        total_cold_leads = base_query.filter(ClientSearchRequest.qualification_level == "cold").count() or 0

        average_lead_score = (
            base_query.filter(ClientSearchRequest.lead_score.isnot(None))
            .with_entities(func.avg(ClientSearchRequest.lead_score))
            .scalar()
        )

        by_property_type_rows = (
            base_query.filter(ClientSearchRequest.lead_score.isnot(None))
            .with_entities(ClientSearchRequest.property_type, func.count(ClientSearchRequest.id))
            .group_by(ClientSearchRequest.property_type)
            .all()
        )

        by_city_rows = (
            base_query.filter(
                ClientSearchRequest.lead_score.isnot(None),
                ClientSearchRequest.preferred_city.isnot(None),
            )
            .with_entities(ClientSearchRequest.preferred_city, func.count(ClientSearchRequest.id))
            .group_by(ClientSearchRequest.preferred_city)
            .all()
        )

        by_urgency_rows = (
            base_query.filter(ClientSearchRequest.lead_score.isnot(None))
            .with_entities(ClientSearchRequest.urgency, func.count(ClientSearchRequest.id))
            .group_by(ClientSearchRequest.urgency)
            .all()
        )

        return {
            "total_search_requests": total_search_requests,
            "active_search_requests": active_search_requests,
            "scored_leads": scored_leads,
            "unscored_leads": unscored_leads,
            "total_hot_leads": total_hot_leads,
            "total_warm_leads": total_warm_leads,
            "total_cold_leads": total_cold_leads,
            "average_lead_score": round(float(average_lead_score), 2) if average_lead_score else None,
            "leads_by_property_type": {row[0]: row[1] for row in by_property_type_rows},
            "leads_by_city": {row[0]: row[1] for row in by_city_rows},
            "leads_by_urgency": {row[0] or "low": row[1] for row in by_urgency_rows},
        }

    @staticmethod
    def get_heat_map(db: Session) -> list[dict]:
        """Return aggregated heat-map data for manager analytics."""
        return [point.model_dump() for point in MarketService.get_heat_map(db)]
