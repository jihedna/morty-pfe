from decimal import Decimal
from enum import Enum

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.agent import Agent
from app.models.agent_property_type import AgentPropertyType
from app.models.agent_territory import AgentTerritory
from app.models.client_search_request import ClientSearchRequest
from app.models.property import Property, PropertyStatus
from app.schemas.client_search_request import (
    AgentMatchCriteria,
    AgentMatchResponse,
    ClientSearchRequestCreate,
    ClientSearchRequestUpdate,
)
from app.services.lead_scoring_service import LeadScoringService
from app.services.user_service import UserService


class ClientSearchRequestService:
    """Service for client search requests and agent matching."""

    @staticmethod
    def get_request_by_id(
        db: Session,
        request_id: str,
    ) -> ClientSearchRequest | None:
        """Return a search request by ID."""
        return (
            db.query(ClientSearchRequest)
            .filter(ClientSearchRequest.id == request_id)
            .first()
        )

    @staticmethod
    def get_client_requests(
        db: Session,
        client_id: str,
        is_active: bool | None = None,
    ) -> list[ClientSearchRequest]:
        """Return all requests for a client."""
        query = db.query(ClientSearchRequest).filter(
            ClientSearchRequest.client_id == client_id
        )

        if is_active is not None:
            query = query.filter(ClientSearchRequest.is_active == is_active)

        return query.order_by(ClientSearchRequest.created_at.desc()).all()

    @staticmethod
    def get_all_requests(
        db: Session,
        is_active: bool | None = None,
    ) -> list[ClientSearchRequest]:
        """Return all search requests (manager only)."""
        query = db.query(ClientSearchRequest)

        if is_active is not None:
            query = query.filter(ClientSearchRequest.is_active == is_active)

        return query.order_by(ClientSearchRequest.created_at.desc()).all()

    @staticmethod
    def create_request(
        db: Session,
        client_id: str,
        request_data: ClientSearchRequestCreate,
    ) -> ClientSearchRequest:
        """Create a new search request for a client."""
        user = UserService.get_user_by_id(db, client_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        from app.core.permissions import UserRole

        if user.role != UserRole.CLIENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can create search requests",
            )

        db_request = ClientSearchRequest(
            client_id=client_id,
            property_type=request_data.property_type.value,
            listing_type=request_data.listing_type.value,
            minimum_budget=request_data.minimum_budget,
            maximum_budget=request_data.maximum_budget,
            preferred_city=request_data.preferred_city,
            preferred_district=request_data.preferred_district,
            minimum_bedrooms=request_data.minimum_bedrooms,
            minimum_bathrooms=request_data.minimum_bathrooms,
            minimum_area_sqm=request_data.minimum_area_sqm,
            notes=request_data.notes,
            is_active=True,
        )

        db.add(db_request)
        db.flush()
        LeadScoringService.recalculate_request_score(db, db_request.id)
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def create_request_from_property(
        db: Session,
        client_id: str,
        property_id: str,
    ) -> ClientSearchRequest:
        """Create an exact-property request using authoritative listing details."""
        property_obj = db.query(Property).filter(Property.id == property_id).first()
        if property_obj is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
        if property_obj.status not in {PropertyStatus.AVAILABLE.value, PropertyStatus.RESERVED.value}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This property is no longer available")

        existing = (
            db.query(ClientSearchRequest)
            .filter(
                ClientSearchRequest.client_id == client_id,
                ClientSearchRequest.property_id == property_id,
                ClientSearchRequest.is_active.is_(True),
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have an active request for this property")

        request_obj = ClientSearchRequest(
            client_id=client_id,
            property_id=property_obj.id,
            property_type=property_obj.property_type,
            listing_type=property_obj.listing_type,
            minimum_budget=property_obj.price,
            maximum_budget=property_obj.price,
            preferred_city=property_obj.city or property_obj.governorate,
            preferred_district=property_obj.district,
            minimum_bedrooms=property_obj.bedrooms,
            minimum_bathrooms=property_obj.bathrooms,
            minimum_area_sqm=property_obj.area_sqm,
            notes=f"Request for {property_obj.title} ({property_obj.reference_code})",
            urgency="medium",
            is_active=True,
        )
        db.add(request_obj)
        db.flush()
        LeadScoringService.recalculate_request_score(db, request_obj.id)
        db.commit()
        db.refresh(request_obj)
        return request_obj

    @staticmethod
    def update_request(
        db: Session,
        request_id: str,
        request_data: ClientSearchRequestUpdate,
    ) -> ClientSearchRequest:
        """Update a search request."""
        db_request = ClientSearchRequestService.get_request_by_id(
            db,
            request_id,
        )
        if db_request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Search request not found",
            )

        update_data = request_data.model_dump(exclude_unset=True)

        # Convert enum values to strings
        if "property_type" in update_data:
            update_data["property_type"] = update_data[
                "property_type"
            ].value
        if "listing_type" in update_data:
            update_data["listing_type"] = update_data[
                "listing_type"
            ].value

        for field, value in update_data.items():
            setattr(db_request, field, value)

        LeadScoringService.recalculate_request_score(db, db_request.id)
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def deactivate_request(
        db: Session,
        request_id: str,
    ) -> ClientSearchRequest:
        """Deactivate a search request (soft delete)."""
        db_request = ClientSearchRequestService.get_request_by_id(
            db,
            request_id,
        )
        if db_request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Search request not found",
            )

        db_request.is_active = False
        LeadScoringService.recalculate_request_score(db, db_request.id)
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def _enum_value(value):
        """Return the raw value for enums and leave other values unchanged."""
        return value.value if isinstance(value, Enum) else value

    @staticmethod
    def _calculate_property_type_score(
        db: Session,
        agent: Agent,
        property_type: str,
    ) -> int:
        """Calculate property type match score (0 or 30)."""
        agent_property_type = (
            db.query(AgentPropertyType)
            .filter(
                AgentPropertyType.agent_id == agent.id,
                AgentPropertyType.property_type == property_type,
            )
            .first()
        )
        return 30 if agent_property_type is not None else 0

    @staticmethod
    def _calculate_territory_score(
        db: Session,
        agent: Agent,
        preferred_city: str | None,
        preferred_district: str | None,
    ) -> int:
        """Calculate territory/city match score (0 or 30)."""
        if preferred_city is None:
            return 0

        agent_territory = (
            db.query(AgentTerritory)
            .filter(
                AgentTerritory.agent_id == agent.id,
                AgentTerritory.territory.ilike(f"%{preferred_city}%"),
            )
            .first()
        )

        if agent_territory is not None:
            return 30

        return 0

    @staticmethod
    def _calculate_budget_score(
        agent: Agent,
        minimum_budget: Decimal | None,
        maximum_budget: Decimal | None,
    ) -> int:
        """Calculate budget overlap score (0 to 25)."""
        if minimum_budget is None and maximum_budget is None:
            return 0

        # Agent budgets are stored as floats while client request budgets are
        # Numeric/Decimal values. Normalize them before doing range arithmetic.
        agent_min = Decimal(str(agent.minimum_budget or 0))
        agent_max = Decimal(str(agent.maximum_budget or 0))

        # If agent has no budget range, no overlap
        if agent_min == 0 and agent_max == 0:
            return 0

        # Calculate overlap
        client_min = minimum_budget if minimum_budget is not None else Decimal(0)
        client_max = (
            maximum_budget if maximum_budget is not None else Decimal(0)
        )

        # Check for overlap
        if client_max < agent_min or client_min > agent_max:
            return 0

        # Calculate overlap percentage
        overlap_min = max(client_min, agent_min)
        overlap_max = min(client_max, agent_max)
        overlap = overlap_max - overlap_min

        if overlap <= 0:
            return 0

        # Score based on overlap relative to client budget range
        client_range = client_max - client_min if client_max > 0 else Decimal(1)
        overlap_ratio = overlap / client_range

        return int(min(overlap_ratio * 25, 25))

    @staticmethod
    def _calculate_availability_score(agent: Agent) -> int:
        """Calculate availability score (0 or 10)."""
        from app.models.agent import AvailabilityStatus

        return (
            10
            if agent.availability_status == AvailabilityStatus.AVAILABLE
            else 0
        )

    @staticmethod
    def _calculate_experience_score(agent: Agent) -> int:
        """Calculate experience bonus score (0 to 5)."""
        # 5 points for 10+ years, scaled down for less experience
        return int(min(agent.years_experience / 2, 5))

    @staticmethod
    def get_agent_matches(
        db: Session,
        request_id: str,
    ) -> list[AgentMatchResponse]:
        """Return agents ranked by match score for a search request."""
        db_request = ClientSearchRequestService.get_request_by_id(
            db,
            request_id,
        )
        if db_request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Search request not found",
            )

        if not db_request.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot match against inactive request",
            )

        # Get all active agents
        agents = (
            db.query(Agent)
            .filter(Agent.user.has(is_active=True))
            .options(joinedload(Agent.user))
            .all()
        )

        matches = []

        for agent in agents:
            # Calculate individual scores
            property_type_score = (
                ClientSearchRequestService._calculate_property_type_score(
                    db,
                    agent,
                    db_request.property_type,
                )
            )
            territory_score = (
                ClientSearchRequestService._calculate_territory_score(
                    db,
                    agent,
                    db_request.preferred_city,
                    db_request.preferred_district,
                )
            )
            budget_score = ClientSearchRequestService._calculate_budget_score(
                agent,
                db_request.minimum_budget,
                db_request.maximum_budget,
            )
            availability_score = (
                ClientSearchRequestService._calculate_availability_score(
                    agent
                )
            )
            experience_score = (
                ClientSearchRequestService._calculate_experience_score(
                    agent
                )
            )

            # Calculate total score
            total_score = (
                property_type_score
                + territory_score
                + budget_score
                + availability_score
                + experience_score
            )

            # Build criteria response
            matched_criteria = AgentMatchCriteria(
                property_type=property_type_score > 0,
                territory=territory_score > 0,
                budget=budget_score > 0,
                availability=availability_score > 0,
            )

            unmatched_criteria = AgentMatchCriteria(
                property_type=property_type_score == 0,
                territory=territory_score == 0,
                budget=budget_score == 0,
                availability=availability_score == 0,
            )

            match = AgentMatchResponse(
                agent_id=agent.id,
                user_id=agent.user_id,
                full_name=f"{agent.user.first_name} {agent.user.last_name}",
                office=agent.office,
                phone=agent.phone,
                years_experience=agent.years_experience,
                match_score=total_score,
                matched_criteria=matched_criteria,
                unmatched_criteria=unmatched_criteria,
            )

            matches.append(match)

        # Sort by match score descending
        matches.sort(key=lambda x: x.match_score, reverse=True)

        return matches
