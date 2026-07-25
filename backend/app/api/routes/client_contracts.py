from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_client
from app.database.session import get_db
from app.models.contract import Contract
from app.models.property import Property
from app.schemas.contract import ContractListResponse
from app.schemas.property import PropertyResponse

router = APIRouter()


@router.get("/me", response_model=ContractListResponse)
def list_my_contracts(
    status_filter: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_client),
):
    """Return only contracts belonging to the authenticated client."""
    query = db.query(Contract).filter(Contract.client_id == current_user["id"])
    if status_filter:
        query = query.filter(Contract.status == status_filter)
    total = query.count()
    contracts = query.order_by(Contract.sale_date.desc()).offset(skip).limit(limit).all()
    return ContractListResponse(contracts=contracts, total=total, skip=skip, limit=limit)


@router.get("/{contract_id}/property", response_model=PropertyResponse)
def get_my_deal_property(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_client),
):
    """Return a read-only property snapshot for a contract owned by this client."""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.client_id == current_user["id"],
    ).first()
    if not contract or not contract.property_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal property not found")
    property_obj = db.query(Property).filter(Property.id == contract.property_id).first()
    if not property_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal property not found")
    return PropertyResponse.model_validate(property_obj)
