from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_active_user
from app.database.session import get_db
from app.models.property import Property, PropertyStatus
from app.models.agent import Agent

router = APIRouter()


@router.get("/properties")
def map_properties(
    city: str | None = Query(default=None),
    property_type: str | None = Query(default=None),
    listing_type: str | None = Query(default=None),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_active_user),
):
    q = db.query(Property).filter(
        Property.latitude.isnot(None),
        Property.longitude.isnot(None),
    )
    if status:
        q = q.filter(Property.status == status)
    else:
        q = q.filter(Property.status.in_([
            PropertyStatus.AVAILABLE.value,
            PropertyStatus.RESERVED.value,
        ]))
    if city:
        q = q.filter(Property.city.ilike(f"%{city}%"))
    if property_type:
        q = q.filter(Property.property_type == property_type)
    if listing_type:
        q = q.filter(Property.listing_type == listing_type)
    if min_price is not None:
        q = q.filter(Property.price >= min_price)
    if max_price is not None:
        q = q.filter(Property.price <= max_price)

    props = q.limit(2000).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "property_type": p.property_type,
            "listing_type": p.listing_type,
            "price": float(p.price),
            "currency": p.currency,
            "area_sqm": float(p.area_sqm),
            "city": p.city,
            "district": p.district,
            "latitude": float(p.latitude),
            "longitude": float(p.longitude),
            "bedrooms": p.bedrooms,
            "bathrooms": p.bathrooms,
        }
        for p in props
    ]


@router.get("/agents")
def map_agents(
    db: Session = Depends(get_db),
    _user=Depends(get_current_active_user),
):
    agents = db.query(Agent).all()
    result = []
    for a in agents:
        if not a.user:
            continue
        territories = [t.territory for t in a.territories] if a.territories else []
        result.append({
            "id": a.id,
            "name": f"{a.user.first_name} {a.user.last_name}",
            "email": a.user.email,
            "office": a.office,
            "phone": a.phone,
            "availability_status": a.availability_status,
            "years_experience": a.years_experience,
            "territories": territories,
            "languages": a.languages,
        })
    return result
