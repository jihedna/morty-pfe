from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_client,
    get_current_manager,
    get_current_user,
    get_db,
)
from app.core.permissions import UserRole
from app.schemas.client_search_request import (
    AgentMatchResponse,
    ClientSearchRequestCreate,
    ClientSearchRequestResponse,
    ClientSearchRequestUpdate,
    LeadScoreResponse,
)
from app.services.lead_scoring_service import compute_lead_score
from app.services.client_search_request_service import (
    ClientSearchRequestService,
)

router = APIRouter()


def _authorize_request_owner(
    db: Session,
    current_user: dict,
    request_id: str,
):
    """Return a request after checking client ownership or manager access."""
    request_obj = ClientSearchRequestService.get_request_by_id(
        db,
        request_id,
    )
    if request_obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search request not found",
        )

    if current_user["role"] != UserRole.MANAGER.value:
        if request_obj.client_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own requests",
            )

    return request_obj


@router.post(
    "",
    response_model=ClientSearchRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_search_request(
    request_data: ClientSearchRequestCreate,
    current_user: dict = Depends(get_current_client),
    db: Session = Depends(get_db),
) -> ClientSearchRequestResponse:
    """Create a new property search request (client only)."""
    request_obj = ClientSearchRequestService.create_request(
        db,
        current_user["id"],
        request_data,
    )
    return ClientSearchRequestResponse.model_validate(request_obj)


@router.post(
    "/from-property/{property_id}",
    response_model=ClientSearchRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_search_request_from_property(
    property_id: str,
    current_user: dict = Depends(get_current_client),
    db: Session = Depends(get_db),
) -> ClientSearchRequestResponse:
    request_obj = ClientSearchRequestService.create_request_from_property(
        db, current_user["id"], property_id
    )
    return ClientSearchRequestResponse.model_validate(request_obj)


@router.get("/me", response_model=list[ClientSearchRequestResponse])
def get_my_requests(
    current_user: dict = Depends(get_current_client),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ClientSearchRequestResponse]:
    """Return the authenticated client's search requests."""
    requests = ClientSearchRequestService.get_client_requests(
        db,
        current_user["id"],
        is_active=is_active,
    )
    return [
        ClientSearchRequestResponse.model_validate(req)
        for req in requests
    ]


@router.get(
    "/{request_id}",
    response_model=ClientSearchRequestResponse,
)
def get_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClientSearchRequestResponse:
    """Return a specific search request."""
    request_obj = _authorize_request_owner(
        db,
        current_user,
        request_id,
    )
    return ClientSearchRequestResponse.model_validate(request_obj)


@router.patch(
    "/{request_id}",
    response_model=ClientSearchRequestResponse,
)
def update_request(
    request_id: str,
    request_data: ClientSearchRequestUpdate,
    current_user: dict = Depends(get_current_client),
    db: Session = Depends(get_db),
) -> ClientSearchRequestResponse:
    """Update a search request."""
    _authorize_request_owner(db, current_user, request_id)

    updated_request = ClientSearchRequestService.update_request(
        db,
        request_id,
        request_data,
    )
    return ClientSearchRequestResponse.model_validate(updated_request)


@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_request(
    request_id: str,
    current_user: dict = Depends(get_current_client),
    db: Session = Depends(get_db),
) -> None:
    """Deactivate a search request (soft delete)."""
    _authorize_request_owner(db, current_user, request_id)
    ClientSearchRequestService.deactivate_request(db, request_id)


@router.get(
    "/admin/all",
    response_model=list[ClientSearchRequestResponse],
)
def get_all_requests(
    _current_user: dict = Depends(get_current_manager),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ClientSearchRequestResponse]:
    """Return all search requests (manager only)."""
    requests = ClientSearchRequestService.get_all_requests(
        db,
        is_active=is_active,
    )
    return [
        ClientSearchRequestResponse.model_validate(req)
        for req in requests
    ]


@router.get(
    "/{request_id}/agent-matches",
    response_model=list[AgentMatchResponse],
)
def get_agent_matches(
    request_id: str,
    current_user: dict = Depends(get_current_client),
    db: Session = Depends(get_db),
) -> list[AgentMatchResponse]:
    """Return agents ranked by match score for a search request."""
    request_obj = _authorize_request_owner(
        db,
        current_user,
        request_id,
    )

    if current_user["role"] != UserRole.MANAGER.value:
        if request_obj.client_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only match your own requests",
            )

    matches = ClientSearchRequestService.get_agent_matches(
        db,
        request_id,
    )
    return matches


@router.get("/{request_id}/lead-score", response_model=LeadScoreResponse)
def get_lead_score(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> LeadScoreResponse:
    """Calculate a lead qualification score for a client search request."""
    request_obj = _authorize_request_owner(db, current_user, request_id)
    result = compute_lead_score(request_obj, db)
    return LeadScoreResponse(request_id=request_id, **result)
