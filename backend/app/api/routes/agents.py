from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_active_user,
    get_current_agent_or_manager,
    get_current_manager,
)
from app.database.session import get_db
from app.models.agent import AvailabilityStatus
from app.models.agent_property_type import PropertyType
from app.schemas.agent import (
    AgentAvailabilityUpdate,
    AgentCreate,
    AgentPropertyTypeCreate,
    AgentPropertyTypeResponse,
    AgentPublicResponse,
    AgentResponse,
    AgentSelfUpdate,
    AgentTerritoryCreate,
    AgentTerritoryResponse,
    AgentUpdate,
)
from app.services.agent_service import AgentService

router = APIRouter()


@router.get("", response_model=list[AgentPublicResponse])
def list_agents(
    territory: str | None = Query(default=None),
    property_type: PropertyType | None = Query(default=None),
    availability_status: AvailabilityStatus | None = Query(default=None),
    minimum_experience: int | None = Query(default=None, ge=0),
    language: str | None = Query(default=None),
    minimum_budget: float | None = Query(default=None, ge=0.0),
    maximum_budget: float | None = Query(default=None, ge=0.0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[AgentPublicResponse]:
    """List agents using optional filters and pagination."""
    agents = AgentService.get_agents(
        db=db,
        territory=territory,
        property_type=property_type,
        availability_status=availability_status,
        minimum_experience=minimum_experience,
        language=language,
        minimum_budget=minimum_budget,
        maximum_budget=maximum_budget,
        skip=skip,
        limit=limit,
    )
    return [AgentPublicResponse.model_validate(agent) for agent in agents]


@router.get("/me/profile", response_model=AgentResponse)
def get_my_profile(
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> AgentResponse:
    """Return the authenticated agent's profile."""
    agent = AgentService.get_agent_by_user_id(db, current_user["id"])
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found",
        )
    return AgentResponse.model_validate(agent)


@router.patch("/me/profile", response_model=AgentResponse)
def update_my_profile(
    profile_data: AgentSelfUpdate,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> AgentResponse:
    """Update fields that agents are permitted to manage themselves."""
    agent = AgentService.get_agent_by_user_id(db, current_user["id"])
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found",
        )

    updated_agent = AgentService.update_agent_profile(
        db,
        agent.id,
        profile_data,
    )
    return AgentResponse.model_validate(updated_agent)


@router.patch("/me/availability", response_model=AgentResponse)
def update_my_availability(
    availability_data: AgentAvailabilityUpdate,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> AgentResponse:
    """Update the authenticated agent's availability."""
    agent = AgentService.get_agent_by_user_id(db, current_user["id"])
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found",
        )

    updated_agent = AgentService.update_agent_availability(
        db,
        agent.id,
        availability_data,
    )
    return AgentResponse.model_validate(updated_agent)


@router.post(
    "",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_agent(
    agent_data: AgentCreate,
    _current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> AgentResponse:
    """Create an agent profile. Managers only."""
    try:
        agent = AgentService.create_agent(db, agent_data)
        return AgentResponse.model_validate(agent)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the agent profile",
        ) from exc


@router.get("/{agent_id}", response_model=AgentPublicResponse)
def get_agent(
    agent_id: str,
    _current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> AgentPublicResponse:
    """Return one agent profile to an authenticated user."""
    agent = AgentService.get_agent_by_id(db, agent_id)
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    return AgentPublicResponse.model_validate(agent)


@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    _current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> AgentResponse:
    """Fully update an agent profile. Managers only."""
    try:
        agent = AgentService.update_agent(db, agent_id, agent_data)
        return AgentResponse.model_validate(agent)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the agent profile",
        ) from exc


@router.delete(
    "/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_agent(
    agent_id: str,
    _current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> None:
    """Delete an agent profile. Managers only."""
    try:
        AgentService.delete_agent(db, agent_id)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the agent profile",
        ) from exc


@router.post(
    "/{agent_id}/territories",
    response_model=AgentTerritoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_territory(
    agent_id: str,
    territory_data: AgentTerritoryCreate,
    _current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> AgentTerritoryResponse:
    """Add a territory specialization. Managers only."""
    try:
        territory = AgentService.add_territory(
            db,
            agent_id,
            territory_data,
        )
        return AgentTerritoryResponse.model_validate(territory)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while adding the territory",
        ) from exc


@router.delete(
    "/{agent_id}/territories/{territory_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_territory(
    agent_id: str,
    territory_id: str,
    _current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> None:
    """Remove an agent territory specialization. Managers only."""
    try:
        AgentService.remove_territory(db, agent_id, territory_id)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while removing the territory",
        ) from exc


@router.post(
    "/{agent_id}/property-types",
    response_model=AgentPropertyTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_property_type(
    agent_id: str,
    property_type_data: AgentPropertyTypeCreate,
    _current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> AgentPropertyTypeResponse:
    """Add a property-type specialization. Managers only."""
    try:
        specialization = AgentService.add_property_type(
            db,
            agent_id,
            property_type_data,
        )
        return AgentPropertyTypeResponse.model_validate(specialization)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while adding the property type",
        ) from exc


@router.delete(
    "/{agent_id}/property-types/{property_type_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_property_type(
    agent_id: str,
    property_type_id: str,
    _current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> None:
    """Remove a property-type specialization. Managers only."""
    try:
        AgentService.remove_property_type(
            db,
            agent_id,
            property_type_id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while removing the property type",
        ) from exc
