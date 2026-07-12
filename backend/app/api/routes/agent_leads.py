from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

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
from app.services.agent_service import AgentService
from app.services.lead_scoring_service import LeadScoringService

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
