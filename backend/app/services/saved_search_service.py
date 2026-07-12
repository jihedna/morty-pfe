from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import NotificationType
from app.models.property import Property
from app.models.saved_search import SavedSearch
from app.schemas.saved_search import SavedSearchFilters
from app.services.lead_scoring_service import LeadScoringService
from app.services.notification_service import NotificationService
from app.services.property_service import PropertyService


class SavedSearchService:
    """Service for saved property searches."""

    @staticmethod
    def _convert_filters_for_jsonb(filters: dict[str, Any]) -> dict[str, Any]:
        """Convert Decimal values to float for JSONB storage."""
        converted = {}
        for key, value in filters.items():
            if isinstance(value, Decimal):
                converted[key] = float(value)
            elif isinstance(value, dict):
                converted[key] = SavedSearchService._convert_filters_for_jsonb(value)
            elif isinstance(value, list):
                converted[key] = [
                    float(v) if isinstance(v, Decimal) else v
                    for v in value
                ]
            else:
                converted[key] = value
        return converted

    @staticmethod
    def create_saved_search(
        db: Session,
        user_id: str,
        name: str,
        filters: dict[str, Any],
        notifications_enabled: bool = True,
    ) -> SavedSearch:
        """Create a new saved search for a user."""
        # Validate filters using Pydantic schema
        try:
            validated_filters = SavedSearchFilters(**filters)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e),
            )

        # Check name is not blank or whitespace-only
        if not name or name.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name cannot be blank or whitespace-only",
            )

        # Convert Decimal values to float for JSONB storage
        filters_dict = validated_filters.model_dump(exclude_none=True)
        converted_filters = SavedSearchService._convert_filters_for_jsonb(filters_dict)

        saved_search = SavedSearch(
            user_id=user_id,
            name=name,
            filters=converted_filters,
            notifications_enabled=notifications_enabled,
            is_active=True,
        )

        db.add(saved_search)
        db.flush()
        LeadScoringService.recalculate_client_requests(db, user_id)
        db.refresh(saved_search)
        return saved_search

    @staticmethod
    def list_user_saved_searches(
        db: Session,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        include_inactive: bool = False,
    ) -> tuple[list[SavedSearch], int]:
        """List user's saved searches with pagination."""
        query = db.query(SavedSearch).filter(
            SavedSearch.user_id == user_id
        )

        if not include_inactive:
            query = query.filter(SavedSearch.is_active.is_(True))

        total = query.count()

        saved_searches = query.order_by(
            SavedSearch.created_at.desc()
        ).offset(skip).limit(limit).all()

        return saved_searches, total

    @staticmethod
    def get_saved_search(
        db: Session,
        saved_search_id: str,
        user_id: str,
    ) -> SavedSearch:
        """Get a saved search by ID for a user."""
        saved_search = (
            db.query(SavedSearch)
            .filter(
                SavedSearch.id == saved_search_id,
                SavedSearch.user_id == user_id,
            )
            .first()
        )
        if not saved_search:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved search not found",
            )
        return saved_search

    @staticmethod
    def update_saved_search(
        db: Session,
        saved_search: SavedSearch,
        name: str | None = None,
        filters: dict[str, Any] | None = None,
        notifications_enabled: bool | None = None,
    ) -> SavedSearch:
        """Update a saved search."""
        if name is not None:
            if not name or name.strip() == "":
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Name cannot be blank or whitespace-only",
                )
            saved_search.name = name

        if filters is not None:
            try:
                validated_filters = SavedSearchFilters(**filters)
                saved_search.filters = validated_filters.model_dump(exclude_none=True)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=str(e),
                )

        if notifications_enabled is not None:
            saved_search.notifications_enabled = notifications_enabled

        saved_search.updated_at = datetime.now(UTC)
        db.flush()
        LeadScoringService.recalculate_client_requests(db, saved_search.user_id)
        db.refresh(saved_search)
        return saved_search

    @staticmethod
    def deactivate_saved_search(
        db: Session,
        saved_search: SavedSearch,
    ) -> SavedSearch:
        """Soft delete a saved search by setting is_active to false."""
        saved_search.is_active = False
        saved_search.updated_at = datetime.now(UTC)
        db.flush()
        LeadScoringService.recalculate_client_requests(db, saved_search.user_id)
        db.refresh(saved_search)
        return saved_search

    @staticmethod
    def get_matching_properties(
        db: Session,
        saved_search: SavedSearch,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Property], int]:
        """Get properties matching a saved search's filters."""
        filters = saved_search.filters

        # Use existing property service filtering logic
        # Note: feature parameter expects a single value, not a list
        features = filters.get("features")
        feature = features[0] if features and isinstance(features, list) else features

        properties = PropertyService.get_properties(
            db,
            property_type=filters.get("property_type"),
            listing_type=filters.get("listing_type"),
            minimum_price=filters.get("minimum_price"),
            maximum_price=filters.get("maximum_price"),
            city=filters.get("city"),
            district=filters.get("district"),
            minimum_bedrooms=filters.get("minimum_bedrooms"),
            minimum_bathrooms=filters.get("minimum_bathrooms"),
            minimum_area=filters.get("minimum_area_sqm"),
            maximum_area=filters.get("maximum_area_sqm"),
            feature=feature,
            agent_id=filters.get("agent_id"),
            is_featured=filters.get("is_featured"),
            public_only=True,
            skip=skip,
            limit=limit,
        )

        # Get total count using PropertyService
        total = PropertyService.count_properties(
            db,
            property_type=filters.get("property_type"),
            listing_type=filters.get("listing_type"),
            minimum_price=filters.get("minimum_price"),
            maximum_price=filters.get("maximum_price"),
            city=filters.get("city"),
            district=filters.get("district"),
            minimum_bedrooms=filters.get("minimum_bedrooms"),
            minimum_bathrooms=filters.get("minimum_bathrooms"),
            minimum_area=filters.get("minimum_area_sqm"),
            maximum_area=filters.get("maximum_area_sqm"),
            feature=feature,
            agent_id=filters.get("agent_id"),
            is_featured=filters.get("is_featured"),
            public_only=True,
        )

        return properties, total

    @staticmethod
    def evaluate_property_against_saved_searches(
        db: Session,
        property_obj: Property,
    ) -> None:
        """
        Evaluate a property against all active saved searches and create notifications for matches.
        
        This method is designed to be called when a property becomes publicly available.
        It does not generate notifications on every GET request.
        It prevents duplicate notifications for the same user, property, and saved search.
        """
        from app.models.notification import Notification

        # Get all active saved searches with notifications enabled
        active_searches = (
            db.query(SavedSearch)
            .filter(
                SavedSearch.notifications_enabled.is_(True),
                SavedSearch.is_active.is_(True),
            )
            .all()
        )

        for saved_search in active_searches:
            # Check if property matches the saved search filters
            if SavedSearchService._property_matches_filters(
                property_obj, saved_search.filters
            ):
                # Check for existing notification to prevent duplicates
                existing_notification = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == saved_search.user_id,
                        Notification.notification_type == NotificationType.PROPERTY_STATUS_CHANGED.value,
                    )
                    .first()
                )

                if existing_notification:
                    # Update notification data to include this property if not already present
                    data = existing_notification.data or {}
                    property_ids = data.get("property_ids", [])
                    if property_obj.id not in property_ids:
                        property_ids.append(property_obj.id)
                        data["property_ids"] = property_ids
                        data["saved_search_id"] = saved_search.id
                        existing_notification.data = data
                        existing_notification.updated_at = datetime.now(UTC)
                else:
                    # Create new notification
                    NotificationService.create_notification(
                        db,
                        user_id=saved_search.user_id,
                        notification_type=NotificationType.PROPERTY_STATUS_CHANGED,
                        title="New property matches your saved search",
                        message=f"A new property matches your saved search: {saved_search.name}",
                        data={
                            "property_id": property_obj.id,
                            "saved_search_id": saved_search.id,
                        },
                    )
                    saved_search.last_notified_at = datetime.now(UTC)

        db.flush()

    @staticmethod
    def _property_matches_filters(
        property_obj: Property,
        filters: dict[str, Any],
    ) -> bool:
        """Check if a property matches the given filters."""
        if filters.get("property_type") and property_obj.property_type != filters["property_type"]:
            return False
        if filters.get("listing_type") and property_obj.listing_type != filters["listing_type"]:
            return False
        if filters.get("minimum_price") and property_obj.price < filters["minimum_price"]:
            return False
        if filters.get("maximum_price") and property_obj.price > filters["maximum_price"]:
            return False
        if filters.get("currency") and property_obj.currency != filters["currency"]:
            return False
        if filters.get("city") and property_obj.city != filters["city"]:
            return False
        if filters.get("district") and property_obj.district != filters["district"]:
            return False
        if filters.get("minimum_bedrooms") and property_obj.bedrooms < filters["minimum_bedrooms"]:
            return False
        if filters.get("minimum_bathrooms") and property_obj.bathrooms < filters["minimum_bathrooms"]:
            return False
        if filters.get("minimum_area_sqm") and property_obj.area_sqm < filters["minimum_area_sqm"]:
            return False
        if filters.get("maximum_area_sqm") and property_obj.area_sqm > filters["maximum_area_sqm"]:
            return False
        if filters.get("agent_id") and property_obj.agent_id != filters["agent_id"]:
            return False
        if filters.get("is_featured") is not None and property_obj.is_featured != filters["is_featured"]:
            return False

        # Check features if specified
        if filters.get("features"):
            property_features = [f.feature for f in property_obj.features]
            for required_feature in filters["features"]:
                if required_feature not in property_features:
                    return False

        return True
