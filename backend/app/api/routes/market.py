from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_active_user, get_current_manager
from app.database.session import get_db
from app.schemas.market import MarketAreaCreate, MarketAreaResponse, MarketAreaUpdate, HeatMapPoint
from app.services.market_service import MarketService

router = APIRouter()


@router.get("", response_model=list[MarketAreaResponse])
def list_market_areas(
    city: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_active_user),
):
    return MarketService.list_areas(db, city=city)


@router.get("/price-per-sqm")
def get_price_per_sqm(
    db: Session = Depends(get_db),
    _user=Depends(get_current_active_user),
):
    return MarketService.get_price_per_sqm(db)


@router.get("/heat-map", response_model=list[HeatMapPoint])
def get_heat_map(
    db: Session = Depends(get_db),
    _user=Depends(get_current_active_user),
):
    return MarketService.get_heat_map(db)


@router.get("/{area_id}", response_model=MarketAreaResponse)
def get_market_area(
    area_id: str,
    db: Session = Depends(get_db),
    _user=Depends(get_current_active_user),
):
    area = MarketService.get_area(db, area_id)
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Market area not found")
    return area


@router.post("", response_model=MarketAreaResponse, status_code=status.HTTP_201_CREATED)
def create_market_area(
    data: MarketAreaCreate,
    db: Session = Depends(get_db),
    _manager=Depends(get_current_manager),
):
    return MarketService.create_area(db, data)


@router.patch("/{area_id}", response_model=MarketAreaResponse)
def update_market_area(
    area_id: str,
    data: MarketAreaUpdate,
    db: Session = Depends(get_db),
    _manager=Depends(get_current_manager),
):
    area = MarketService.update_area(db, area_id, data)
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Market area not found")
    return area
