from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.property import PropertyStatus
from app.models.property_favorite import PropertyFavorite
from app.services.lead_scoring_service import LeadScoringService
from app.services.property_service import PropertyService


class FavoriteService:
    """Service for property favorites."""

    @staticmethod
    def add_favorite(
        db: Session,
        user_id: str,
        property_id: str,
    ) -> PropertyFavorite:
        """Add a property to user's favorites."""
        # Check if property exists
        property_obj = PropertyService.get_property_by_id(db, property_id)
        if not property_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found",
            )

        # Check if property is archived
        if property_obj.status == PropertyStatus.ARCHIVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot favorite archived properties",
            )

        # Check if favorite already exists (idempotent)
        existing = (
            db.query(PropertyFavorite)
            .filter(
                PropertyFavorite.user_id == user_id,
                PropertyFavorite.property_id == property_id,
            )
            .first()
        )
        if existing:
            return existing

        # Create new favorite
        favorite = PropertyFavorite(
            user_id=user_id,
            property_id=property_id,
            created_at=datetime.now(UTC),
        )

        db.add(favorite)
        db.flush()
        LeadScoringService.recalculate_client_requests(db, user_id)
        db.refresh(favorite)
        return favorite

    @staticmethod
    def list_favorites(
        db: Session,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[PropertyFavorite], int]:
        """List user's favorites with pagination."""
        query = db.query(PropertyFavorite).filter(
            PropertyFavorite.user_id == user_id
        )

        total = query.count()

        favorites = query.order_by(
            PropertyFavorite.created_at.desc()
        ).offset(skip).limit(limit).all()

        return favorites, total

    @staticmethod
    def remove_favorite(
        db: Session,
        user_id: str,
        property_id: str,
    ) -> None:
        """Remove a property from user's favorites."""
        favorite = (
            db.query(PropertyFavorite)
            .filter(
                PropertyFavorite.user_id == user_id,
                PropertyFavorite.property_id == property_id,
            )
            .first()
        )
        if not favorite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Favorite not found",
            )

        db.delete(favorite)
        db.flush()
        LeadScoringService.recalculate_client_requests(db, user_id)

    @staticmethod
    def is_favorited(
        db: Session,
        user_id: str,
        property_id: str,
    ) -> bool:
        """Check if a property is favorited by a user."""
        return (
            db.query(PropertyFavorite)
            .filter(
                PropertyFavorite.user_id == user_id,
                PropertyFavorite.property_id == property_id,
            )
            .first()
            is not None
        )

    @staticmethod
    def get_favorite_by_id(
        db: Session,
        favorite_id: str,
    ) -> PropertyFavorite | None:
        """Return a favorite by ID."""
        return (
            db.query(PropertyFavorite)
            .filter(PropertyFavorite.id == favorite_id)
            .first()
        )
