from decimal import Decimal

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_agent_or_manager,
    get_current_manager,
)
from app.database.session import get_db
from app.models.agent import Agent
from app.models.agent_property_type import PropertyType
from app.models.property import ListingType, PropertyStatus
from app.models.property_feature import PropertyFeatureEnum
from app.schemas.property import (
    PropertyAgentCreate,
    PropertyAgentUpdate,
    PropertyAssignmentUpdate,
    PropertyCreate,
    PropertyImageCreate,
    PropertyImageResponse,
    PropertyImageUpdate,
    PropertyListResponse,
    PropertyManagerCreate,
    PropertyPublicResponse,
    PropertyResponse,
    PropertyStatusUpdate,
    PropertyUpdate,
)
from app.services.agent_service import AgentService
from app.services.property_service import PropertyService

router = APIRouter()


def _is_manager(current_user: dict) -> bool:
    """Return whether the authenticated user is a manager."""
    return current_user["role"] == "manager"


def _get_actor_agent(
    db: Session,
    current_user: dict,
) -> Agent:
    """Return the agent profile for a non-manager authenticated user."""
    agent = AgentService.get_agent_by_user_id(db, current_user["id"])
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent profile not found",
        )
    return agent


def _authorize_property_owner(
    db: Session,
    current_user: dict,
    property_id: str,
):
    """Return a property after checking agent ownership or manager access."""
    property_obj = PropertyService.get_property_by_id(db, property_id)
    if property_obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    if not _is_manager(current_user):
        agent = _get_actor_agent(db, current_user)
        if property_obj.agent_id != agent.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage your own properties",
            )

    return property_obj


@router.get("", response_model=PropertyListResponse)
def list_public_properties(
    search: str | None = Query(default=None),
    property_type: PropertyType | None = Query(default=None),
    listing_type: ListingType | None = Query(default=None),
    city: str | None = Query(default=None),
    district: str | None = Query(default=None),
    governorate: str | None = Query(default=None),
    agent_id: str | None = Query(default=None),
    minimum_price: Decimal | None = Query(default=None, gt=0),
    maximum_price: Decimal | None = Query(default=None, gt=0),
    minimum_area: Decimal | None = Query(default=None, gt=0),
    maximum_area: Decimal | None = Query(default=None, gt=0),
    minimum_bedrooms: int | None = Query(default=None, ge=0),
    minimum_bathrooms: int | None = Query(default=None, ge=0),
    feature: PropertyFeatureEnum | None = Query(default=None),
    is_furnished: bool | None = Query(default=None),
    is_featured: bool | None = Query(default=None),
    minimum_latitude: float | None = Query(default=None, ge=-90, le=90),
    maximum_latitude: float | None = Query(default=None, ge=-90, le=90),
    minimum_longitude: float | None = Query(
        default=None,
        ge=-180,
        le=180,
    ),
    maximum_longitude: float | None = Query(
        default=None,
        ge=-180,
        le=180,
    ),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="created_at"),
    sort_direction: str = Query(default="desc"),
    db: Session = Depends(get_db),
) -> PropertyListResponse:
    """List publicly visible properties."""
    filter_kwargs = dict(
        db=db,
        search=search,
        property_type=property_type,
        listing_type=listing_type,
        city=city,
        district=district,
        governorate=governorate,
        agent_id=agent_id,
        minimum_price=minimum_price,
        maximum_price=maximum_price,
        minimum_area=minimum_area,
        maximum_area=maximum_area,
        minimum_bedrooms=minimum_bedrooms,
        minimum_bathrooms=minimum_bathrooms,
        feature=feature,
        is_furnished=is_furnished,
        is_featured=is_featured,
        minimum_latitude=minimum_latitude,
        maximum_latitude=maximum_latitude,
        minimum_longitude=minimum_longitude,
        maximum_longitude=maximum_longitude,
        public_only=True,
    )
    total = PropertyService.count_properties(**filter_kwargs)
    properties = PropertyService.get_properties(
        **filter_kwargs,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_direction=sort_direction,
    )
    return PropertyListResponse(
        properties=[
            PropertyPublicResponse.model_validate(p) for p in properties
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/me/listings", response_model=list[PropertyResponse])
def get_my_listings(
    current_user: dict = Depends(get_current_agent_or_manager),
    status_filter: PropertyStatus | None = Query(
        default=None,
        alias="status",
    ),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[PropertyResponse]:
    """Return all listings belonging to the authenticated agent."""
    agent = _get_actor_agent(db, current_user)

    properties = PropertyService.get_properties(
        db=db,
        agent_id=agent.id,
        status_filter=status_filter,
        skip=skip,
        limit=limit,
    )
    return [
        PropertyResponse.model_validate(property_obj)
        for property_obj in properties
    ]


@router.get("/admin/all", response_model=list[PropertyResponse])
def get_all_properties(
    _current_user: dict = Depends(get_current_manager),
    search: str | None = Query(default=None),
    property_type: PropertyType | None = Query(default=None),
    listing_type: ListingType | None = Query(default=None),
    city: str | None = Query(default=None),
    district: str | None = Query(default=None),
    governorate: str | None = Query(default=None),
    agent_id: str | None = Query(default=None),
    minimum_price: Decimal | None = Query(default=None, gt=0),
    maximum_price: Decimal | None = Query(default=None, gt=0),
    minimum_area: Decimal | None = Query(default=None, gt=0),
    maximum_area: Decimal | None = Query(default=None, gt=0),
    minimum_bedrooms: int | None = Query(default=None, ge=0),
    minimum_bathrooms: int | None = Query(default=None, ge=0),
    feature: PropertyFeatureEnum | None = Query(default=None),
    is_furnished: bool | None = Query(default=None),
    is_featured: bool | None = Query(default=None),
    status_filter: PropertyStatus | None = Query(
        default=None,
        alias="status",
    ),
    reference_code: str | None = Query(default=None),
    minimum_latitude: float | None = Query(default=None, ge=-90, le=90),
    maximum_latitude: float | None = Query(default=None, ge=-90, le=90),
    minimum_longitude: float | None = Query(
        default=None,
        ge=-180,
        le=180,
    ),
    maximum_longitude: float | None = Query(
        default=None,
        ge=-180,
        le=180,
    ),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="created_at"),
    sort_direction: str = Query(default="desc"),
    db: Session = Depends(get_db),
) -> list[PropertyResponse]:
    """Return every property status to managers."""
    properties = PropertyService.get_properties(
        db=db,
        search=search,
        property_type=property_type,
        listing_type=listing_type,
        city=city,
        district=district,
        governorate=governorate,
        agent_id=agent_id,
        minimum_price=minimum_price,
        maximum_price=maximum_price,
        minimum_area=minimum_area,
        maximum_area=maximum_area,
        minimum_bedrooms=minimum_bedrooms,
        minimum_bathrooms=minimum_bathrooms,
        feature=feature,
        is_furnished=is_furnished,
        is_featured=is_featured,
        status_filter=status_filter,
        reference_code=reference_code,
        minimum_latitude=minimum_latitude,
        maximum_latitude=maximum_latitude,
        minimum_longitude=minimum_longitude,
        maximum_longitude=maximum_longitude,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_direction=sort_direction,
    )
    return [
        PropertyResponse.model_validate(property_obj)
        for property_obj in properties
    ]


@router.post(
    "",
    response_model=PropertyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_property(
    property_data: PropertyCreate,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> PropertyResponse:
    """Create a property as an agent or manager."""
    try:
        if _is_manager(current_user):
            if property_data.agent_id is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Managers must provide agent_id",
                )

            manager_data = PropertyManagerCreate(
                **property_data.model_dump()
            )
            property_obj = PropertyService.create_property_for_manager(
                db,
                manager_data,
            )
        else:
            agent = _get_actor_agent(db, current_user)

            if (
                property_data.agent_id is not None
                and property_data.agent_id != agent.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Agents cannot create properties for another agent",
                )

            agent_payload = property_data.model_dump(
                exclude={"agent_id", "is_featured"}
            )
            agent_data = PropertyAgentCreate(**agent_payload)
            property_obj = PropertyService.create_property_for_agent(
                db,
                agent.id,
                agent_data,
            )

        return PropertyResponse.model_validate(property_obj)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the property",
        ) from exc


@router.get("/{property_id}", response_model=PropertyPublicResponse)
def get_public_property(
    property_id: str,
    db: Session = Depends(get_db),
) -> PropertyPublicResponse:
    """Return a publicly visible property."""
    property_obj = PropertyService.get_property_by_id(db, property_id)
    if property_obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    if property_obj.status not in {
        PropertyStatus.AVAILABLE.value,
        PropertyStatus.RESERVED.value,
    }:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    return PropertyPublicResponse.model_validate(property_obj)


@router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: str,
    property_data: PropertyUpdate,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> PropertyResponse:
    """Update a property as its owner or a manager."""
    _authorize_property_owner(db, current_user, property_id)

    is_manager = _is_manager(current_user)

    if is_manager:
        update_data = property_data
    else:
        agent_payload = property_data.model_dump(
            exclude_unset=True,
            exclude={"agent_id", "is_featured"},
        )
        update_data = PropertyAgentUpdate(**agent_payload)

    updated_property = PropertyService.update_property(
        db,
        property_id,
        update_data,
        is_manager=is_manager,
    )
    return PropertyResponse.model_validate(updated_property)


@router.patch("/{property_id}/status", response_model=PropertyResponse)
def update_property_status(
    property_id: str,
    status_data: PropertyStatusUpdate,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> PropertyResponse:
    """Change a property's status."""
    _authorize_property_owner(db, current_user, property_id)

    updated_property = PropertyService.update_property_status(
        db,
        property_id,
        status_data,
        is_manager=_is_manager(current_user),
    )
    return PropertyResponse.model_validate(updated_property)


@router.delete(
    "/{property_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_property(
    property_id: str,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> None:
    """Archive a property without physically deleting it."""
    _authorize_property_owner(db, current_user, property_id)
    PropertyService.archive_property(db, property_id)


@router.patch(
    "/{property_id}/assign-agent",
    response_model=PropertyResponse,
)
def reassign_property(
    property_id: str,
    assignment_data: PropertyAssignmentUpdate,
    _current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> PropertyResponse:
    """Reassign a property to another agent."""
    updated_property = PropertyService.reassign_property(
        db,
        property_id,
        assignment_data,
    )
    return PropertyResponse.model_validate(updated_property)


@router.post(
    "/{property_id}/images",
    response_model=PropertyImageResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_image(
    property_id: str,
    image_data: PropertyImageCreate,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> PropertyImageResponse:
    """Add an image to a property."""
    _authorize_property_owner(db, current_user, property_id)
    image = PropertyService.add_image(db, property_id, image_data)
    return PropertyImageResponse.model_validate(image)


@router.patch(
    "/{property_id}/images/{image_id}",
    response_model=PropertyImageResponse,
)
def update_image(
    property_id: str,
    image_id: str,
    image_data: PropertyImageUpdate,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> PropertyImageResponse:
    """Update an image belonging to a property."""
    _authorize_property_owner(db, current_user, property_id)
    image = PropertyService.update_image(
        db,
        property_id,
        image_id,
        image_data,
    )
    return PropertyImageResponse.model_validate(image)


@router.delete(
    "/{property_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_image(
    property_id: str,
    image_id: str,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> None:
    """Delete an image belonging to a property."""
    _authorize_property_owner(db, current_user, property_id)
    PropertyService.delete_image(db, property_id, image_id)


@router.post(
    "/{property_id}/features",
    response_model=PropertyResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_feature(
    property_id: str,
    feature: PropertyFeatureEnum = Body(...),
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> PropertyResponse:
    """Add a feature to a property."""
    property_obj = _authorize_property_owner(
        db,
        current_user,
        property_id,
    )

    PropertyService.add_feature(
        db,
        property_id,
        feature,
    )

    db.expire(property_obj, ["features"])
    return PropertyResponse.model_validate(property_obj)


@router.delete(
    "/{property_id}/features/{feature_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_feature(
    property_id: str,
    feature_id: str,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> None:
    """Delete a feature belonging to a property."""
    _authorize_property_owner(db, current_user, property_id)
    PropertyService.delete_feature(db, property_id, feature_id)
