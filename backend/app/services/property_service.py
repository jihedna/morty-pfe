import random
import string
from datetime import UTC, datetime
from decimal import Decimal
from enum import Enum

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.agent_property_type import PropertyType
from app.models.property import (
    ListingType,
    Property,
    PropertyStatus,
)
from app.models.property_feature import (
    PropertyFeature,
    PropertyFeatureEnum,
)
from app.models.property_image import PropertyImage
from app.schemas.property import (
    PropertyAgentCreate,
    PropertyAssignmentUpdate,
    PropertyImageCreate,
    PropertyImageUpdate,
    PropertyManagerCreate,
    PropertyStatusUpdate,
    PropertyUpdate,
)


class PropertyService:
    """Service for property-related operations."""

    SORT_ALLOWLIST = {
        "created_at",
        "price",
        "area_sqm",
    }

    AGENT_STATUS_TRANSITIONS = {
        PropertyStatus.DRAFT: {
            PropertyStatus.AVAILABLE,
            PropertyStatus.ARCHIVED,
        },
        PropertyStatus.AVAILABLE: {
            PropertyStatus.RESERVED,
            PropertyStatus.ARCHIVED,
        },
        PropertyStatus.RESERVED: {
            PropertyStatus.AVAILABLE,
            PropertyStatus.ARCHIVED,
        },
    }

    @staticmethod
    def _enum_value(value):
        """Return the raw value for enums and leave other values unchanged."""
        return value.value if isinstance(value, Enum) else value

    @staticmethod
    def _generate_reference_code(db: Session) -> str:
        """Generate a unique property reference code."""
        alphabet = string.ascii_uppercase + string.digits

        while True:
            suffix = "".join(random.choices(alphabet, k=8))
            code = f"RMS-{suffix}"
            exists = (
                db.query(Property)
                .filter(Property.reference_code == code)
                .first()
            )
            if exists is None:
                return code

    @staticmethod
    def _set_published_at_if_needed(property_obj: Property) -> None:
        """Set publication time when a property first becomes available."""
        if (
            property_obj.status == PropertyStatus.AVAILABLE.value
            and property_obj.published_at is None
        ):
            property_obj.published_at = datetime.now(UTC)

    @staticmethod
    def _validate_property_state(
        property_obj: Property,
        update_data: dict | None = None,
    ) -> None:
        """Validate cross-field constraints against the final state."""
        data = update_data or {}

        rooms = data.get("rooms", property_obj.rooms)
        bedrooms = data.get("bedrooms", property_obj.bedrooms)
        floor_number = data.get(
            "floor_number",
            property_obj.floor_number,
        )
        total_floors = data.get(
            "total_floors",
            property_obj.total_floors,
        )
        latitude = data.get("latitude", property_obj.latitude)
        longitude = data.get("longitude", property_obj.longitude)

        if rooms > 0 and bedrooms > rooms:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="bedrooms cannot exceed total rooms",
            )

        if total_floors > 0 and floor_number > total_floors:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="floor_number cannot exceed total_floors",
            )

        if (latitude is None) != (longitude is None):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "latitude and longitude must both be present "
                    "or both be absent"
                ),
            )

    @staticmethod
    def get_property_by_id(
        db: Session,
        property_id: str,
    ) -> Property | None:
        """Return a property by ID."""
        return (
            db.query(Property)
            .filter(Property.id == property_id)
            .first()
        )

    @staticmethod
    def get_property_by_reference_code(
        db: Session,
        reference_code: str,
    ) -> Property | None:
        """Return a property by reference code."""
        return (
            db.query(Property)
            .filter(Property.reference_code == reference_code)
            .first()
        )

    @staticmethod
    def get_properties(
        db: Session,
        search: str | None = None,
        property_type: PropertyType | str | None = None,
        listing_type: ListingType | str | None = None,
        city: str | None = None,
        district: str | None = None,
        governorate: str | None = None,
        agent_id: str | None = None,
        minimum_price: Decimal | float | None = None,
        maximum_price: Decimal | float | None = None,
        minimum_area: Decimal | float | None = None,
        maximum_area: Decimal | float | None = None,
        minimum_bedrooms: int | None = None,
        minimum_bathrooms: int | None = None,
        feature: PropertyFeatureEnum | str | None = None,
        is_furnished: bool | None = None,
        is_featured: bool | None = None,
        status_filter: PropertyStatus | str | None = None,
        reference_code: str | None = None,
        minimum_latitude: float | None = None,
        maximum_latitude: float | None = None,
        minimum_longitude: float | None = None,
        maximum_longitude: float | None = None,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "created_at",
        sort_direction: str = "desc",
        public_only: bool = False,
    ) -> list[Property]:
        """Return filtered and paginated properties."""
        query = db.query(Property)

        if public_only:
            query = query.filter(
                Property.status.in_(
                    [
                        PropertyStatus.AVAILABLE.value,
                        PropertyStatus.RESERVED.value,
                    ]
                )
            )

        if search:
            query = query.filter(Property.title.ilike(f"%{search}%"))

        if property_type:
            query = query.filter(
                Property.property_type
                == PropertyService._enum_value(property_type)
            )

        if listing_type:
            query = query.filter(
                Property.listing_type
                == PropertyService._enum_value(listing_type)
            )

        if city:
            query = query.filter(Property.city.ilike(f"%{city}%"))

        if district:
            query = query.filter(Property.district.ilike(f"%{district}%"))

        if governorate:
            query = query.filter(
                Property.governorate.ilike(f"%{governorate}%")
            )

        if agent_id:
            query = query.filter(Property.agent_id == agent_id)

        if minimum_price is not None:
            query = query.filter(Property.price >= minimum_price)

        if maximum_price is not None:
            query = query.filter(Property.price <= maximum_price)

        if minimum_area is not None:
            query = query.filter(Property.area_sqm >= minimum_area)

        if maximum_area is not None:
            query = query.filter(Property.area_sqm <= maximum_area)

        if minimum_bedrooms is not None:
            query = query.filter(
                Property.bedrooms >= minimum_bedrooms
            )

        if minimum_bathrooms is not None:
            query = query.filter(
                Property.bathrooms >= minimum_bathrooms
            )

        if feature:
            query = query.join(PropertyFeature).filter(
                PropertyFeature.feature
                == PropertyService._enum_value(feature)
            )

        if is_furnished is not None:
            query = query.filter(
                Property.is_furnished == is_furnished
            )

        if is_featured is not None:
            query = query.filter(
                Property.is_featured == is_featured
            )

        if status_filter:
            query = query.filter(
                Property.status
                == PropertyService._enum_value(status_filter)
            )

        if reference_code:
            query = query.filter(
                Property.reference_code.ilike(f"%{reference_code}%")
            )

        if minimum_latitude is not None:
            query = query.filter(
                Property.latitude >= minimum_latitude
            )

        if maximum_latitude is not None:
            query = query.filter(
                Property.latitude <= maximum_latitude
            )

        if minimum_longitude is not None:
            query = query.filter(
                Property.longitude >= minimum_longitude
            )

        if maximum_longitude is not None:
            query = query.filter(
                Property.longitude <= maximum_longitude
            )

        if sort_by not in PropertyService.SORT_ALLOWLIST:
            sort_by = "created_at"

        sort_column = getattr(Property, sort_by)
        if sort_direction.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        return query.distinct().offset(skip).limit(limit).all()

    @staticmethod
    def create_property_for_agent(
        db: Session,
        agent_id: str,
        property_data: PropertyAgentCreate,
    ) -> Property:
        """Create a property owned by the authenticated agent."""
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent profile not found",
            )

        db_property = Property(
            reference_code=PropertyService._generate_reference_code(db),
            agent_id=agent_id,
            title=property_data.title,
            description=property_data.description,
            property_type=property_data.property_type.value,
            listing_type=property_data.listing_type.value,
            status=property_data.status.value,
            price=property_data.price,
            currency=property_data.currency.value,
            area_sqm=property_data.area_sqm,
            land_area_sqm=property_data.land_area_sqm,
            rooms=property_data.rooms,
            bedrooms=property_data.bedrooms,
            bathrooms=property_data.bathrooms,
            floor_number=property_data.floor_number,
            total_floors=property_data.total_floors,
            construction_year=property_data.construction_year,
            is_furnished=property_data.is_furnished,
            is_featured=False,
            address_line=property_data.address_line,
            city=property_data.city,
            district=property_data.district,
            governorate=property_data.governorate,
            postal_code=property_data.postal_code,
            latitude=property_data.latitude,
            longitude=property_data.longitude,
        )
        PropertyService._set_published_at_if_needed(db_property)

        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        return db_property

    @staticmethod
    def create_property_for_manager(
        db: Session,
        property_data: PropertyManagerCreate,
    ) -> Property:
        """Create a property for any valid agent."""
        agent = (
            db.query(Agent)
            .filter(Agent.id == property_data.agent_id)
            .first()
        )
        if agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent profile not found",
            )

        db_property = Property(
            reference_code=PropertyService._generate_reference_code(db),
            agent_id=property_data.agent_id,
            title=property_data.title,
            description=property_data.description,
            property_type=property_data.property_type.value,
            listing_type=property_data.listing_type.value,
            status=property_data.status.value,
            price=property_data.price,
            currency=property_data.currency.value,
            area_sqm=property_data.area_sqm,
            land_area_sqm=property_data.land_area_sqm,
            rooms=property_data.rooms,
            bedrooms=property_data.bedrooms,
            bathrooms=property_data.bathrooms,
            floor_number=property_data.floor_number,
            total_floors=property_data.total_floors,
            construction_year=property_data.construction_year,
            is_furnished=property_data.is_furnished,
            is_featured=property_data.is_featured,
            address_line=property_data.address_line,
            city=property_data.city,
            district=property_data.district,
            governorate=property_data.governorate,
            postal_code=property_data.postal_code,
            latitude=property_data.latitude,
            longitude=property_data.longitude,
        )
        PropertyService._set_published_at_if_needed(db_property)

        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        return db_property

    @staticmethod
    def update_property(
        db: Session,
        property_id: str,
        property_data: PropertyUpdate,
        is_manager: bool,
    ) -> Property:
        """Update a property."""
        db_property = PropertyService.get_property_by_id(db, property_id)
        if db_property is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found",
            )

        update_data = property_data.model_dump(exclude_unset=True)

        if not is_manager:
            update_data.pop("agent_id", None)
            update_data.pop("is_featured", None)

        if "agent_id" in update_data:
            new_agent = (
                db.query(Agent)
                .filter(Agent.id == update_data["agent_id"])
                .first()
            )
            if new_agent is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Target agent profile not found",
                )

        if "status" in update_data:
            new_status = PropertyStatus(
                PropertyService._enum_value(update_data.pop("status"))
            )
            status_data = PropertyStatusUpdate(status=new_status)
            PropertyService.update_property_status(
                db,
                property_id,
                status_data,
                is_manager=is_manager,
                commit=False,
            )

        converted_data = {
            field: PropertyService._enum_value(value)
            for field, value in update_data.items()
        }

        PropertyService._validate_property_state(
            db_property,
            converted_data,
        )

        for field, value in converted_data.items():
            setattr(db_property, field, value)

        PropertyService._set_published_at_if_needed(db_property)
        db.commit()
        db.refresh(db_property)
        return db_property

    @staticmethod
    def update_property_status(
        db: Session,
        property_id: str,
        status_data: PropertyStatusUpdate,
        is_manager: bool = False,
        commit: bool = True,
    ) -> Property:
        """Update status while enforcing role-specific transitions."""
        db_property = PropertyService.get_property_by_id(db, property_id)
        if db_property is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found",
            )

        current_status = PropertyStatus(db_property.status)
        new_status = status_data.status

        if not is_manager:
            allowed = PropertyService.AGENT_STATUS_TRANSITIONS.get(
                current_status,
                set(),
            )

            if new_status not in allowed:
                if new_status in (
                    PropertyStatus.SOLD,
                    PropertyStatus.RENTED,
                ):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            "Only managers can mark property as "
                            "sold or rented"
                        ),
                    )

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid status transition for agent",
                )

        db_property.status = new_status.value
        PropertyService._set_published_at_if_needed(db_property)

        if commit:
            db.commit()
            db.refresh(db_property)

        return db_property

    @staticmethod
    def archive_property(
        db: Session,
        property_id: str,
    ) -> Property:
        """Archive a property without deleting it."""
        db_property = PropertyService.get_property_by_id(db, property_id)
        if db_property is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found",
            )

        db_property.status = PropertyStatus.ARCHIVED.value
        db.commit()
        db.refresh(db_property)
        return db_property

    @staticmethod
    def reassign_property(
        db: Session,
        property_id: str,
        assignment_data: PropertyAssignmentUpdate,
    ) -> Property:
        """Assign a property to another agent."""
        db_property = PropertyService.get_property_by_id(db, property_id)
        if db_property is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found",
            )

        new_agent = (
            db.query(Agent)
            .filter(Agent.id == assignment_data.agent_id)
            .first()
        )
        if new_agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target agent profile not found",
            )

        db_property.agent_id = assignment_data.agent_id
        db.commit()
        db.refresh(db_property)
        return db_property

    @staticmethod
    def add_image(
        db: Session,
        property_id: str,
        image_data: PropertyImageCreate,
    ) -> PropertyImage:
        """Add an image and maintain one primary image."""
        property_obj = PropertyService.get_property_by_id(db, property_id)
        if property_obj is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found",
            )

        existing_images = (
            db.query(PropertyImage)
            .filter(PropertyImage.property_id == property_id)
            .all()
        )

        is_primary = image_data.is_primary or not existing_images

        if is_primary:
            for image in existing_images:
                image.is_primary = False

        db_image = PropertyImage(
            property_id=property_id,
            image_url=image_data.image_url,
            alt_text=image_data.alt_text,
            position=image_data.position,
            is_primary=is_primary,
        )

        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        return db_image

    @staticmethod
    def update_image(
        db: Session,
        property_id: str,
        image_id: str,
        image_data: PropertyImageUpdate,
    ) -> PropertyImage:
        """Update an image belonging to the specified property."""
        db_image = (
            db.query(PropertyImage)
            .filter(
                PropertyImage.id == image_id,
                PropertyImage.property_id == property_id,
            )
            .first()
        )
        if db_image is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found",
            )

        update_data = image_data.model_dump(exclude_unset=True)

        if update_data.get("is_primary") is True:
            (
                db.query(PropertyImage)
                .filter(
                    PropertyImage.property_id == property_id,
                    PropertyImage.id != image_id,
                )
                .update(
                    {PropertyImage.is_primary: False},
                    synchronize_session=False,
                )
            )

        for field, value in update_data.items():
            setattr(db_image, field, value)

        db.commit()
        db.refresh(db_image)
        return db_image

    @staticmethod
    def delete_image(
        db: Session,
        property_id: str,
        image_id: str,
    ) -> None:
        """Delete an image and promote another primary image if needed."""
        db_image = (
            db.query(PropertyImage)
            .filter(
                PropertyImage.id == image_id,
                PropertyImage.property_id == property_id,
            )
            .first()
        )
        if db_image is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found",
            )

        was_primary = db_image.is_primary
        db.delete(db_image)
        db.flush()

        if was_primary:
            replacement = (
                db.query(PropertyImage)
                .filter(PropertyImage.property_id == property_id)
                .order_by(
                    PropertyImage.position.asc(),
                    PropertyImage.created_at.asc(),
                )
                .first()
            )
            if replacement is not None:
                replacement.is_primary = True

        db.commit()

    @staticmethod
    def add_feature(
        db: Session,
        property_id: str,
        feature: PropertyFeatureEnum,
    ) -> PropertyFeature:
        """Add a unique feature to a property."""
        property_obj = PropertyService.get_property_by_id(db, property_id)
        if property_obj is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found",
            )

        feature_value = PropertyService._enum_value(feature)

        existing = (
            db.query(PropertyFeature)
            .filter(
                PropertyFeature.property_id == property_id,
                PropertyFeature.feature == feature_value,
            )
            .first()
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Feature already exists for this property",
            )

        db_feature = PropertyFeature(
            property_id=property_id,
            feature=feature_value,
        )

        db.add(db_feature)
        db.commit()
        db.refresh(db_feature)
        return db_feature

    @staticmethod
    def delete_feature(
        db: Session,
        property_id: str,
        feature_id: str,
    ) -> None:
        """Delete a feature belonging to the specified property."""
        db_feature = (
            db.query(PropertyFeature)
            .filter(
                PropertyFeature.id == feature_id,
                PropertyFeature.property_id == property_id,
            )
            .first()
        )
        if db_feature is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feature not found",
            )

        db.delete(db_feature)
        db.commit()
