from sqlalchemy.orm import Session

from app.models.market_area import MarketArea
from app.schemas.market import MarketAreaCreate, MarketAreaUpdate, HeatMapPoint


class MarketService:
    @staticmethod
    def list_areas(db: Session, city: str | None = None) -> list[MarketArea]:
        q = db.query(MarketArea)
        if city:
            q = q.filter(MarketArea.city.ilike(f"%{city}%"))
        return q.order_by(MarketArea.city, MarketArea.district).all()

    @staticmethod
    def get_area(db: Session, area_id: str) -> MarketArea | None:
        return db.query(MarketArea).filter(MarketArea.id == area_id).first()

    @staticmethod
    def create_area(db: Session, data: MarketAreaCreate) -> MarketArea:
        area = MarketArea(**data.model_dump())
        db.add(area)
        db.commit()
        db.refresh(area)
        return area

    @staticmethod
    def update_area(db: Session, area_id: str, data: MarketAreaUpdate) -> MarketArea | None:
        area = MarketService.get_area(db, area_id)
        if not area:
            return None
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(area, field, value)
        db.commit()
        db.refresh(area)
        return area

    @staticmethod
    def get_heat_map(db: Session) -> list[HeatMapPoint]:
        areas = (
            db.query(MarketArea)
            .filter(
                MarketArea.latitude.isnot(None),
                MarketArea.longitude.isnot(None),
            )
            .order_by(MarketArea.city, MarketArea.district)
            .limit(200)
            .all()
        )

        if not areas:
            return []

        prices = [float(a.average_price_per_sqm) for a in areas if a.average_price_per_sqm]
        counts = [a.transaction_count for a in areas]
        max_price = max(prices) if prices else 1.0
        min_price = min(prices) if prices else 0.0
        price_range = max_price - min_price or 1.0
        max_count = max(counts) if counts else 1

        result = []
        for a in areas:
            price_val = float(a.average_price_per_sqm) if a.average_price_per_sqm else 0.0
            cnt = a.transaction_count
            normalized_price = (price_val - min_price) / price_range if price_range else 0.0
            normalized_demand = cnt / max_count if max_count else 0.0
            result.append(HeatMapPoint(
                id=a.id,
                city=a.city,
                district=a.district,
                latitude=float(a.latitude) if a.latitude else None,
                longitude=float(a.longitude) if a.longitude else None,
                average_price_per_sqm=round(price_val, 2) if price_val else None,
                average_rent_per_sqm=float(a.average_rent_per_sqm) if a.average_rent_per_sqm else None,
                demand_level=a.demand_level,
                price_trend=a.price_trend,
                rental_yield=float(a.rental_yield) if a.rental_yield else None,
                transaction_count=cnt,
                normalized_price=round(normalized_price, 3),
                normalized_demand=round(normalized_demand, 3),
            ))
        return result

    @staticmethod
    def get_price_per_sqm(db: Session) -> list[dict]:
        areas = db.query(MarketArea).filter(MarketArea.average_price_per_sqm.isnot(None)).all()
        return [
            {
                "city": a.city,
                "district": a.district,
                "average_price_per_sqm": float(a.average_price_per_sqm),
                "average_rent_per_sqm": float(a.average_rent_per_sqm) if a.average_rent_per_sqm else None,
                "demand_level": a.demand_level,
                "price_trend": a.price_trend,
            }
            for a in areas
        ]
