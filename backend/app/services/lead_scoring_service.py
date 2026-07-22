"""
Lead Scoring Service — deterministic rule-based scoring.

Formula (0-100):
  budget_clarity   20 pts
  location_clarity 20 pts
  type_clarity     15 pts
  urgency          20 pts
  engagement       15 pts  — favourites, saved searches, messages, appointments
  match_quality    10 pts  — active request with clear criteria / notes

Qualification: 0-39 cold | 40-69 warm | 70-100 hot

This is a transparent, rule-based score.  It is deterministic and ML-ready:
all inputs are explicit and auditable, so a future model can be trained on the
same features and swapped in without changing the API contract.
"""
from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.agent_property_type import AgentPropertyType
from app.models.agent_territory import AgentTerritory
from app.models.client_search_request import ClientSearchRequest
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.property import Property
from app.models.property_appointment import PropertyAppointment
from app.models.property_favorite import PropertyFavorite
from app.models.saved_search import SavedSearch


_URGENCY_SCORES: dict[str, int] = {
    "immediate": 20,
    "high": 15,
    "medium": 10,
    "low": 5,
}

_QUALIFICATION_ORDER = ["cold", "warm", "hot"]


class LeadScoringService:
    """Service for calculating and storing lead scores for search requests."""

    @staticmethod
    def calculate_qualification_level(score: int) -> str:
        """Return the qualification bucket for a score."""
        if score >= 70:
            return "hot"
        if score >= 40:
            return "warm"
        return "cold"

    @staticmethod
    def calculate_lead_score(
        request: ClientSearchRequest,
        db: Session,
    ) -> dict:
        """Return the score (0-100), level, reasons and urgency for a request."""
        reasons: list[str] = []
        score = 0

        # 1. Budget clarity (20 pts)
        if request.minimum_budget and request.maximum_budget:
            score += 20
            reasons.append("Budget range fully specified (+20)")
        elif request.minimum_budget or request.maximum_budget:
            score += 10
            reasons.append("Partial budget specified (+10)")
        else:
            reasons.append("No budget specified (+0)")

        # 2. Location clarity (20 pts)
        if request.preferred_city and request.preferred_district:
            score += 20
            reasons.append("City and district specified (+20)")
        elif request.preferred_city:
            score += 12
            reasons.append("City specified, no district (+12)")
        else:
            reasons.append("No location specified (+0)")

        # 3. Property type / listing type clarity (15 pts)
        type_pts = 0
        if request.property_type:
            type_pts += 8
        if request.listing_type:
            type_pts += 7
        score += type_pts
        if type_pts > 0:
            reasons.append(f"Property/listing type specified (+{type_pts})")
        else:
            reasons.append("No property type specified (+0)")

        # 4. Urgency (20 pts)
        urgency = (request.urgency or "low").lower()
        urgency_pts = _URGENCY_SCORES.get(urgency, 5)
        score += urgency_pts
        reasons.append(f"Urgency '{urgency}' (+{urgency_pts})")

        # 5. Engagement (15 pts)
        fav_count = (
            db.query(PropertyFavorite)
            .filter(PropertyFavorite.user_id == request.client_id)
            .count()
        )
        saved_search_count = (
            db.query(SavedSearch)
            .filter(
                SavedSearch.user_id == request.client_id,
                SavedSearch.is_active.is_(True),
            )
            .count()
        )
        message_count = (
            db.query(Message)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .filter(Conversation.search_request_id == request.id)
            .count()
        )
        conv_count = (
            db.query(Conversation)
            .filter(
                Conversation.search_request_id == request.id,
                Conversation.is_active.is_(True),
            )
            .count()
        )
        appt_count = (
            db.query(PropertyAppointment)
            .join(
                Conversation,
                PropertyAppointment.conversation_id == Conversation.id,
                isouter=True,
            )
            .filter(Conversation.search_request_id == request.id)
            .count()
        )

        eng_pts = min(
            15,
            fav_count * 2
            + saved_search_count * 2
            + min(message_count, 5)
            + conv_count * 5
            + appt_count * 4,
        )
        score += eng_pts
        reasons.append(
            f"Engagement: {fav_count} favourites, {saved_search_count} saved searches, "
            f"{message_count} messages, {conv_count} conversations, "
            f"{appt_count} appointments (+{eng_pts})"
        )

        # 6. Match quality (10 pts)
        match_pts = 0
        if request.is_active:
            match_pts += 7
            reasons.append("Request is active (+7)")
        else:
            reasons.append("Request inactive (+0)")
        if request.notes and len(request.notes.strip()) > 10:
            match_pts += 3
            reasons.append("Detailed notes provided (+3)")
        score += match_pts

        score = min(100, max(0, score))
        qualification = LeadScoringService.calculate_qualification_level(score)

        return {
            "lead_score": score,
            "qualification_level": qualification,
            "urgency": urgency,
            "lead_score_reasons": reasons,
            "recommended_action": LeadScoringService.get_recommended_action(
                score, qualification, urgency
            ),
        }

    @staticmethod
    def get_recommended_action(
        lead_score: int,
        qualification_level: str | None = None,
        urgency: str | None = None,
        match_percentage: int | None = None,
    ) -> str:
        """Return a recommended next action for an agent."""
        if match_percentage is not None and match_percentage < 30:
            return "Review fit — match is low; consider referring to a better-suited agent"

        if lead_score >= 80 and urgency in ("high", "immediate"):
            return "Contact client immediately — hot, urgent lead with strong fit"
        if lead_score >= 70:
            return "Reach out today — hot lead with good qualification signals"
        if lead_score >= 40:
            if urgency in ("high", "immediate"):
                return "Follow up soon — warm lead with urgency"
            return "Nurture — warm lead; share matching properties and stay in touch"
        if urgency in ("high", "immediate"):
            return "Follow up carefully — urgent but low qualification; gather more details"
        return "Continue nurturing — cold lead; provide market updates and wait for signals"

    @staticmethod
    def _agent_match_score(
        agent: Agent,
        request: ClientSearchRequest,
        db: Session,
    ) -> int:
        """Return a 0-100 match score for an agent against a search request.

        Mirrors the logic in ClientSearchRequestService.get_agent_matches but is
        optimised for a single agent/request pair.
        """
        if not request.is_active:
            return 0

        property_type_match = (
            db.query(AgentPropertyType)
            .filter(
                AgentPropertyType.agent_id == agent.id,
                AgentPropertyType.property_type == request.property_type,
            )
            .first()
            is not None
        )

        territory_match = False
        if request.preferred_city:
            territory = (
                db.query(AgentTerritory)
                .filter(
                    AgentTerritory.agent_id == agent.id,
                    AgentTerritory.territory.ilike(f"%{request.preferred_city}%"),
                )
                .first()
            )
            territory_match = territory is not None

        # Budget overlap (0-25)
        budget_score = 0
        if request.minimum_budget is not None or request.maximum_budget is not None:
            agent_min = Decimal(agent.minimum_budget) if agent.minimum_budget else Decimal(0)
            agent_max = Decimal(agent.maximum_budget) if agent.maximum_budget else Decimal(0)
            client_min = request.minimum_budget or Decimal(0)
            client_max = request.maximum_budget or Decimal(0)

            if agent_max > 0 and not (client_max > 0 and client_max < agent_min or client_min > agent_max):
                overlap_min = max(client_min, agent_min)
                overlap_max = min(client_max, agent_max) if client_max > 0 else agent_max
                overlap = max(overlap_max - overlap_min, Decimal(0))
                client_range = (client_max - client_min) if client_max > 0 else Decimal(1)
                if client_range > 0:
                    budget_score = int(min(overlap / client_range * 25, 25))

        availability_score = 10 if agent.availability_status == "available" else 0
        experience_score = int(min(agent.years_experience / 2, 5))

        return (
            (30 if property_type_match else 0)
            + (30 if territory_match else 0)
            + budget_score
            + availability_score
            + experience_score
        )

    @staticmethod
    def get_agent_match_details(
        agent: Agent,
        request: ClientSearchRequest,
        db: Session,
    ) -> dict:
        """Return match percentage and matched/unmatched criteria for an agent."""
        score = LeadScoringService._agent_match_score(agent, request, db)
        return {
            "match_score": score,
            "match_percentage": score,
            "matched_criteria": {
                "property_type": bool(
                    db.query(AgentPropertyType)
                    .filter(
                        AgentPropertyType.agent_id == agent.id,
                        AgentPropertyType.property_type == request.property_type,
                    )
                    .first()
                ),
                "territory": bool(
                    request.preferred_city
                    and db.query(AgentTerritory)
                    .filter(
                        AgentTerritory.agent_id == agent.id,
                        AgentTerritory.territory.ilike(f"%{request.preferred_city}%"),
                    )
                    .first()
                ),
                "budget": score > 0 and (
                    request.minimum_budget is not None or request.maximum_budget is not None
                ),
                "availability": agent.availability_status == "available",
            },
        }

    @staticmethod
    def recalculate_request_score(
        db: Session,
        request_id: str,
    ) -> ClientSearchRequest | None:
        """Recalculate and store the lead score for a single request.

        Does not commit; the caller is responsible for committing the transaction.
        """
        request = (
            db.query(ClientSearchRequest)
            .filter(ClientSearchRequest.id == request_id)
            .first()
        )
        if request is None:
            return None

        result = LeadScoringService.calculate_lead_score(request, db)
        request.lead_score = result["lead_score"]
        request.qualification_level = result["qualification_level"]
        request.lead_score_reasons = result["lead_score_reasons"]
        request.lead_score_updated_at = datetime.now(UTC)
        return request

    @staticmethod
    def recalculate_client_requests(db: Session, client_id: str) -> None:
        """Recalculate lead scores for all active requests owned by a client."""
        requests = (
            db.query(ClientSearchRequest)
            .filter(
                ClientSearchRequest.client_id == client_id,
                ClientSearchRequest.is_active.is_(True),
            )
            .all()
        )
        for request in requests:
            LeadScoringService.recalculate_request_score(db, request.id)

    @staticmethod
    def recalculate_request_for_conversation(db: Session, conversation_id: str) -> None:
        """Recalculate the lead score for the search request linked to a conversation."""
        from app.models.conversation import Conversation

        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )
        if conversation and conversation.search_request_id:
            LeadScoringService.recalculate_request_score(
                db, conversation.search_request_id
            )

    @staticmethod
    def get_agent_leads(
        db: Session,
        agent_id: str,
        qualification: str | None = None,
        min_score: int | None = None,
        city: str | None = None,
        district: str | None = None,
        property_type: str | None = None,
        urgency: str | None = None,
        skip: int = 0,
        limit: int = 20,
        order_by: str = "lead_score",
        sort: str = "desc",
    ) -> tuple[list[dict], int]:
        """Return leads visible to an agent with filtering, pagination and ordering.

        A request is visible when it is active and the agent is a valid match
        OR the agent already has a conversation or appointment linked to the request.
        """
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if agent is None:
            return [], 0

        query = db.query(ClientSearchRequest).filter(
            ClientSearchRequest.is_active.is_(True)
        )

        if qualification:
            query = query.filter(
                ClientSearchRequest.qualification_level == qualification.lower()
            )
        if min_score is not None:
            query = query.filter(ClientSearchRequest.lead_score >= min_score)
        if city:
            query = query.filter(
                ClientSearchRequest.preferred_city.ilike(f"%{city}%")
            )
        if district:
            query = query.filter(
                ClientSearchRequest.preferred_district.ilike(f"%{district}%")
            )
        if property_type:
            query = query.filter(
                ClientSearchRequest.property_type == property_type
            )
        if urgency:
            query = query.filter(
                ClientSearchRequest.urgency == urgency.lower()
            )

        # Ordering validation
        valid_order_by = {
            "lead_score",
            "urgency",
            "created_at",
            "match_percentage",
        }
        if order_by not in valid_order_by:
            order_by = "lead_score"
        sort = sort.lower()
        if sort not in {"asc", "desc"}:
            sort = "desc"

        order_column = {
            "lead_score": ClientSearchRequest.lead_score,
            "urgency": ClientSearchRequest.urgency,
            "created_at": ClientSearchRequest.created_at,
            "match_percentage": ClientSearchRequest.lead_score,
        }[order_by]

        if order_by == "urgency":
            # Urgency is not numeric; keep a stable deterministic order
            from sqlalchemy import case
            urgency_order = case(
                (ClientSearchRequest.urgency == "immediate", 4),
                (ClientSearchRequest.urgency == "high", 3),
                (ClientSearchRequest.urgency == "medium", 2),
                (ClientSearchRequest.urgency == "low", 1),
                else_=0,
            )
            order_column = urgency_order

        if sort == "asc":
            query = query.order_by(order_column.asc(), ClientSearchRequest.created_at.desc())
        else:
            query = query.order_by(order_column.desc(), ClientSearchRequest.created_at.desc())

        # We must post-filter for agent visibility because match logic is not in SQL
        candidate_requests = query.offset(skip).limit(limit * 3).all()

        # Preload engagement signals for all candidates
        request_ids = [r.id for r in candidate_requests]
        conversation_ids_for_request = {
            row[0]: row[1]
            for row in db.query(
                Conversation.search_request_id,
                Conversation.id,
            )
            .filter(
                Conversation.search_request_id.in_(request_ids),
                Conversation.agent_id == agent_id,
            )
            .all()
        }
        appointment_counts = {
            row[0]: row[1]
            for row in db.query(
                Conversation.search_request_id,
                func.count(PropertyAppointment.id),
            )
            .join(
                PropertyAppointment,
                PropertyAppointment.conversation_id == Conversation.id,
            )
            .filter(
                Conversation.search_request_id.in_(request_ids),
                Conversation.agent_id == agent_id,
            )
            .group_by(Conversation.search_request_id)
            .all()
        }

        results = []
        for request in candidate_requests:
            listing_agent_id = None
            if request.property_id:
                listing_agent_id = db.query(Property.agent_id).filter(
                    Property.id == request.property_id
                ).scalar()
                # Exact-property requests belong exclusively to the listing agent.
                if listing_agent_id != agent_id:
                    continue

            match_details = LeadScoringService.get_agent_match_details(agent, request, db)
            has_engagement = request.id in conversation_ids_for_request
            is_listing_agent = bool(request.property_id and listing_agent_id == agent_id)

            # A visible lead is either a match or already engaged
            if match_details["match_score"] == 0 and not has_engagement and not is_listing_agent:
                continue

            lead_score = request.lead_score
            if lead_score is None:
                score_result = LeadScoringService.calculate_lead_score(request, db)
                lead_score = score_result["lead_score"]
                qualification_level = score_result["qualification_level"]
                reasons = score_result["lead_score_reasons"]
                recommended_action = score_result["recommended_action"]
            else:
                qualification_level = request.qualification_level
                reasons = request.lead_score_reasons or []
                recommended_action = LeadScoringService.get_recommended_action(
                    lead_score,
                    qualification_level,
                    request.urgency,
                    match_details["match_percentage"],
                )

            results.append(
                {
                    "request_id": request.id,
                    "property_id": request.property_id,
                    "client_id": request.client_id,
                    "summary": request.notes,
                    "preferred_city": request.preferred_city,
                    "preferred_district": request.preferred_district,
                    "property_type": request.property_type,
                    "listing_type": request.listing_type,
                    "minimum_budget": request.minimum_budget,
                    "maximum_budget": request.maximum_budget,
                    "minimum_bedrooms": request.minimum_bedrooms,
                    "minimum_bathrooms": request.minimum_bathrooms,
                    "urgency": request.urgency,
                    "lead_score": lead_score,
                    "qualification_level": qualification_level,
                    "lead_score_reasons": reasons,
                    "match_percentage": match_details["match_percentage"],
                    "matched_criteria": match_details["matched_criteria"],
                    "recommended_action": recommended_action,
                    "created_at": request.created_at,
                    "conversation_id": conversation_ids_for_request.get(request.id),
                    "appointment_count": appointment_counts.get(request.id, 0),
                }
            )

        # Apply ordering by match_percentage in memory when requested
        if order_by == "match_percentage":
            reverse = sort == "desc"
            results.sort(key=lambda x: x["match_percentage"], reverse=reverse)

        total = len(results)
        return results[skip : skip + limit], total

    @staticmethod
    def get_agent_lead(
        db: Session,
        agent_id: str,
        request_id: str,
    ) -> dict | None:
        """Return a single lead for an agent if it is visible."""
        request = (
            db.query(ClientSearchRequest)
            .filter(
                ClientSearchRequest.id == request_id,
                ClientSearchRequest.is_active.is_(True),
            )
            .first()
        )
        if request is None:
            return None

        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if agent is None:
            return None

        if request.property_id:
            listing_agent_id = db.query(Property.agent_id).filter(
                Property.id == request.property_id
            ).scalar()
            if listing_agent_id != agent_id:
                return None

        match_details = LeadScoringService.get_agent_match_details(agent, request, db)

        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.search_request_id == request_id,
                Conversation.agent_id == agent_id,
            )
            .first()
        )

        appointment_count = (
            db.query(func.count(PropertyAppointment.id))
            .join(
                Conversation,
                PropertyAppointment.conversation_id == Conversation.id,
            )
            .filter(
                Conversation.search_request_id == request_id,
                Conversation.agent_id == agent_id,
            )
            .scalar()
        ) or 0

        has_engagement = conversation is not None
        is_listing_agent = bool(
            request.property_id
            and db.query(Property.id).filter(
                Property.id == request.property_id,
                Property.agent_id == agent_id,
            ).first()
        )
        if match_details["match_score"] == 0 and not has_engagement and not is_listing_agent:
            return None

        if request.lead_score is None:
            score_result = LeadScoringService.calculate_lead_score(request, db)
            lead_score = score_result["lead_score"]
            qualification_level = score_result["qualification_level"]
            reasons = score_result["lead_score_reasons"]
            recommended_action = score_result["recommended_action"]
        else:
            lead_score = request.lead_score
            qualification_level = request.qualification_level
            reasons = request.lead_score_reasons or []
            recommended_action = LeadScoringService.get_recommended_action(
                lead_score,
                qualification_level,
                request.urgency,
                match_details["match_percentage"],
            )

        return {
            "request_id": request.id,
            "property_id": request.property_id,
            "client_id": request.client_id,
            "summary": request.notes,
            "preferred_city": request.preferred_city,
            "preferred_district": request.preferred_district,
            "property_type": request.property_type,
            "listing_type": request.listing_type,
            "minimum_budget": request.minimum_budget,
            "maximum_budget": request.maximum_budget,
            "minimum_bedrooms": request.minimum_bedrooms,
            "minimum_bathrooms": request.minimum_bathrooms,
            "urgency": request.urgency,
            "lead_score": lead_score,
            "qualification_level": qualification_level,
            "lead_score_reasons": reasons,
            "match_percentage": match_details["match_percentage"],
            "matched_criteria": match_details["matched_criteria"],
            "recommended_action": recommended_action,
            "created_at": request.created_at,
            "conversation_id": conversation.id if conversation else None,
            "appointment_count": appointment_count,
        }


def compute_lead_score(request: ClientSearchRequest, db: Session) -> dict:
    """Backward-compatible wrapper for the existing lead-score endpoint."""
    return LeadScoringService.calculate_lead_score(request, db)
