from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.core.permissions import UserRole
from app.schemas.property_favorite import (
    FavoriteCheckResponse,
    FavoriteListResponse,
    FavoriteResponse,
)
from app.services.favorite_service import FavoriteService

router = APIRouter()


@router.post("/{property_id}", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def add_favorite(
    property_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoriteResponse:
    """Add a property to the authenticated user's favorites."""
    if current_user["role"] != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients may manage favorites",
        )

    favorite = FavoriteService.add_favorite(db, current_user["id"], property_id)
    db.commit()
    db.refresh(favorite)

    return _build_favorite_response(favorite, db)


@router.get("/me", response_model=FavoriteListResponse)
def list_my_favorites(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(ge=0, default=0),
    limit: int = Query(ge=1, le=100, default=20),
    db: Session = Depends(get_db),
) -> FavoriteListResponse:
    """List the authenticated user's favorites."""
    favorites, total = FavoriteService.list_favorites(
        db,
        current_user["id"],
        skip=skip,
        limit=limit,
    )

    return FavoriteListResponse(
        favorites=[
            _build_favorite_response(favorite, db) for favorite in favorites
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/check/{property_id}", response_model=FavoriteCheckResponse)
def check_favorite(
    property_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoriteCheckResponse:
    """Check if a property is favorited by the authenticated user."""
    is_favorited = FavoriteService.is_favorited(db, current_user["id"], property_id)

    return FavoriteCheckResponse(
        property_id=property_id,
        is_favorited=is_favorited,
    )


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    property_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Remove a property from the authenticated user's favorites."""
    FavoriteService.remove_favorite(db, current_user["id"], property_id)
    db.commit()


def _build_favorite_response(favorite, db: Session) -> FavoriteResponse:
    """Build a favorite response with property details."""
    from app.models.property_image import PropertyImage

    # Get primary image
    primary_image = (
        db.query(PropertyImage)
        .filter(
            PropertyImage.property_id == favorite.property_id,
            PropertyImage.is_primary.is_(True),
        )
        .first()
    )

    # Build property summary
    property_summary = {
        "id": favorite.property.id,
        "title": favorite.property.title,
        "property_type": favorite.property.property_type,
        "listing_type": favorite.property.listing_type,
        "price": favorite.property.price,
        "currency": favorite.property.currency,
        "city": favorite.property.city,
        "district": favorite.property.district,
        "bedrooms": favorite.property.bedrooms,
        "bathrooms": favorite.property.bathrooms,
        "area_sqm": favorite.property.area_sqm,
        "status": favorite.property.status,
        "primary_image_url": primary_image.image_url if primary_image else None,
        "agent": {
            "id": favorite.property.agent.id,
            "user_id": favorite.property.agent.user_id,
            "office": favorite.property.agent.office,
        },
    }

    return FavoriteResponse(
        id=favorite.id,
        user_id=favorite.user_id,
        property_id=favorite.property_id,
        property=property_summary,
        favorited_at=favorite.created_at,
    )
