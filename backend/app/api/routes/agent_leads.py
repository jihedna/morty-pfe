from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import UTC, datetime

from app.api.dependencies import (
    get_current_agent_or_manager,
    get_db,
)
from app.core.permissions import UserRole
from app.schemas.client_search_request import (
    AgentLeadListResponse,
    AgentLeadResponse,
    LeadScoreResponse,
)
from app.schemas.messaging import ConversationResponse
from app.schemas.contract import ContractResponse, DealAgreedCreate
from app.models.contract import Contract, ContractStatus
from app.models.property import Property
from app.services.agent_service import AgentService
from app.services.lead_scoring_service import LeadScoringService
from app.services.messaging_service import MessagingService

router = APIRouter()


def _get_agent_id_for_user(
    db: Session,
    current_user: dict,
    requested_agent_id: str | None,
) -> str:
    """Return the agent profile ID for the authenticated user.

    Agents may only access their own profile. Managers may access a specific
    agent via the optional agent_id query parameter.
    """
    if current_user["role"] == UserRole.MANAGER.value:
        if not requested_agent_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agent_id is required for managers",
            )
        return requested_agent_id

    agent = AgentService.get_agent_by_user_id(db, current_user["id"])
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found",
        )
    return str(agent.id)


@router.get("/leads", response_model=AgentLeadListResponse)
def list_agent_leads(
    qualification: str | None = Query(default=None),
    min_score: int | None = Query(default=None, ge=0, le=100),
    city: str | None = Query(default=None),
    district: str | None = Query(default=None),
    property_type: str | None = Query(default=None),
    urgency: str | None = Query(default=None),
    order_by: str = Query(default="lead_score"),
    sort: str = Query(default="desc"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    agent_id: str | None = Query(default=None),
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> AgentLeadListResponse:
    """List leads visible to the authenticated agent."""
    requested_agent_id = _get_agent_id_for_user(db, current_user, agent_id)

    leads, total = LeadScoringService.get_agent_leads(
        db,
        agent_id=requested_agent_id,
        qualification=qualification,
        min_score=min_score,
        city=city,
        district=district,
        property_type=property_type,
        urgency=urgency,
        skip=skip,
        limit=limit,
        order_by=order_by,
        sort=sort,
    )

    return AgentLeadListResponse(
        leads=[AgentLeadResponse(**lead) for lead in leads],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/leads/{request_id}", response_model=AgentLeadResponse)
def get_agent_lead(
    request_id: str,
    agent_id: str | None = Query(default=None),
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> AgentLeadResponse:
    """Return a single lead visible to the authenticated agent."""
    requested_agent_id = _get_agent_id_for_user(db, current_user, agent_id)

    lead = LeadScoringService.get_agent_lead(db, requested_agent_id, request_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    return AgentLeadResponse(**lead)


@router.post("/leads/{request_id}/recalculate", response_model=AgentLeadResponse)
def recalculate_agent_lead(
    request_id: str,
    agent_id: str | None = Query(default=None),
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> AgentLeadResponse:
    """Recalculate the lead score for a request and return the updated lead."""
    requested_agent_id = _get_agent_id_for_user(db, current_user, agent_id)

    # Ensure the agent can see the lead before recalculating
    lead = LeadScoringService.get_agent_lead(db, requested_agent_id, request_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    LeadScoringService.recalculate_request_score(db, request_id)
    db.commit()

    lead = LeadScoringService.get_agent_lead(db, requested_agent_id, request_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    return AgentLeadResponse(**lead)


@router.post(
    "/leads/{request_id}/conversation",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_agent_lead_conversation(
    request_id: str,
    agent_id: str | None = Query(default=None),
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> ConversationResponse:
    """Create or reuse a conversation with the client for this visible lead."""
    requested_agent_id = _get_agent_id_for_user(db, current_user, agent_id)
    lead = LeadScoringService.get_agent_lead(db, requested_agent_id, request_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    subject = lead.get("summary") or (
        f"{str(lead['property_type']).title()} in "
        f"{lead.get('preferred_city') or 'any location'}"
    )
    conversation = MessagingService.create_agent_lead_conversation(
        db,
        agent_id=requested_agent_id,
        client_id=lead["client_id"],
        search_request_id=request_id,
        subject=subject,
    )
    return ConversationResponse.model_validate(conversation)


@router.post(
    "/leads/{request_id}/deal-agreed",
    response_model=ContractResponse,
    status_code=status.HTTP_201_CREATED,
)
def mark_agent_lead_deal_agreed(
    request_id: str,
    data: DealAgreedCreate,
    agent_id: str | None = Query(default=None),
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> ContractResponse:
    """Submit an agreed deal to the manager as a pending contract."""
    requested_agent_id = _get_agent_id_for_user(db, current_user, agent_id)
    lead = LeadScoringService.get_agent_lead(db, requested_agent_id, request_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    property_obj = (
        db.query(Property)
        .filter(Property.id == data.property_id, Property.agent_id == requested_agent_id)
        .first()
    )
    if property_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found for this agent")
    if (
        property_obj.property_type.lower() != str(lead["property_type"]).lower()
        or property_obj.listing_type.lower() != str(lead["listing_type"]).lower()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected property type and listing type must match the client's request",
        )

    existing = (
        db.query(Contract)
        .filter(
            Contract.property_id == property_obj.id,
            Contract.client_id == lead["client_id"],
            Contract.status.in_([ContractStatus.PENDING.value, ContractStatus.APPROVED.value]),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This deal has already been submitted")

    contract = Contract(
        property_id=property_obj.id,
        search_request_id=request_id,
        agent_id=requested_agent_id,
        client_id=lead["client_id"],
        sale_date=datetime.now(UTC),
        amount=data.amount,
        city=property_obj.city or property_obj.governorate or "Unknown",
        district=property_obj.district,
        property_type=property_obj.property_type,
        area_sqm=property_obj.area_sqm,
        contract_type=property_obj.listing_type,
        status=ContractStatus.PENDING.value,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return ContractResponse.model_validate(contract)


@router.get("/leads/{request_id}/score", response_model=LeadScoreResponse)
def get_lead_score_for_agent(
    request_id: str,
    agent_id: str | None = Query(default=None),
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> LeadScoreResponse:
    """Return the stored lead score for a request if visible to the agent."""
    requested_agent_id = _get_agent_id_for_user(db, current_user, agent_id)

    lead = LeadScoringService.get_agent_lead(db, requested_agent_id, request_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    return LeadScoreResponse(
        request_id=lead["request_id"],
        lead_score=lead["lead_score"],
        qualification_level=lead["qualification_level"],
        urgency=lead["urgency"] or "low",
        lead_score_reasons=lead["lead_score_reasons"],
        recommended_action=lead["recommended_action"],
    )
