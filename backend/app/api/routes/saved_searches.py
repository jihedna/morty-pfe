from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.core.permissions import UserRole
from app.schemas.property import PropertyListResponse
from app.schemas.saved_search import (
    SavedSearchCreate,
    SavedSearchListResponse,
    SavedSearchResponse,
    SavedSearchUpdate,
)
from app.services.saved_search_service import SavedSearchService

router = APIRouter()


@router.post("", response_model=SavedSearchResponse, status_code=status.HTTP_201_CREATED)
def create_saved_search(
    search_data: SavedSearchCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SavedSearchResponse:
    """Create a new saved search for the authenticated user."""
    if current_user["role"] != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients may create saved searches",
        )

    saved_search = SavedSearchService.create_saved_search(
        db,
        current_user["id"],
        search_data.name,
        search_data.filters,
        search_data.notifications_enabled,
    )
    db.commit()
    db.refresh(saved_search)

    return SavedSearchResponse.model_validate(saved_search)


@router.get("/me", response_model=SavedSearchListResponse)
def list_my_saved_searches(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(ge=0, default=0),
    limit: int = Query(ge=1, le=100, default=20),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> SavedSearchListResponse:
    """List the authenticated user's saved searches."""
    saved_searches, total = SavedSearchService.list_user_saved_searches(
        db,
        current_user["id"],
        skip=skip,
        limit=limit,
        include_inactive=include_inactive,
    )

    return SavedSearchListResponse(
        saved_searches=[
            SavedSearchResponse.model_validate(ss) for ss in saved_searches
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{saved_search_id}", response_model=SavedSearchResponse)
def get_saved_search(
    saved_search_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SavedSearchResponse:
    """Get a saved search by ID."""
    saved_search = SavedSearchService.get_saved_search(
        db,
        saved_search_id,
        current_user["id"],
    )

    return SavedSearchResponse.model_validate(saved_search)


@router.patch("/{saved_search_id}", response_model=SavedSearchResponse)
def update_saved_search(
    saved_search_id: str,
    update_data: SavedSearchUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SavedSearchResponse:
    """Update a saved search."""
    saved_search = SavedSearchService.get_saved_search(
        db,
        saved_search_id,
        current_user["id"],
    )

    updated = SavedSearchService.update_saved_search(
        db,
        saved_search,
        name=update_data.name,
        filters=update_data.filters,
        notifications_enabled=update_data.notifications_enabled,
    )
    db.commit()
    db.refresh(updated)

    return SavedSearchResponse.model_validate(updated)


@router.delete("/{saved_search_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_search(
    saved_search_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Soft delete a saved search by setting is_active to false."""
    saved_search = SavedSearchService.get_saved_search(
        db,
        saved_search_id,
        current_user["id"],
    )

    SavedSearchService.deactivate_saved_search(db, saved_search)
    db.commit()


@router.get("/{saved_search_id}/results", response_model=PropertyListResponse)
def get_saved_search_results(
    saved_search_id: str,
    current_user: dict = Depends(get_current_user),
    skip: int = Query(ge=0, default=0),
    limit: int = Query(ge=1, le=100, default=20),
    db: Session = Depends(get_db),
) -> PropertyListResponse:
    """Get properties matching a saved search's filters."""
    saved_search = SavedSearchService.get_saved_search(
        db,
        saved_search_id,
        current_user["id"],
    )

    properties, total = SavedSearchService.get_matching_properties(
        db,
        saved_search,
        skip=skip,
        limit=limit,
    )

    return PropertyListResponse(
        properties=properties,
        total=total,
        skip=skip,
        limit=limit,
    )
