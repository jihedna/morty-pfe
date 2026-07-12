from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_manager
from app.database.session import get_db
from app.models.contract import Contract
from app.schemas.contract import ContractCreate, ContractListResponse, ContractResponse, ContractUpdate

router = APIRouter()


@router.get("", response_model=ContractListResponse)
def list_contracts(
    city: str | None = Query(default=None),
    contract_type: str | None = Query(default=None),
    agent_id: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _manager=Depends(get_current_manager),
):
    q = db.query(Contract)
    if city:
        q = q.filter(Contract.city.ilike(f"%{city}%"))
    if contract_type:
        q = q.filter(Contract.contract_type == contract_type)
    if agent_id:
        q = q.filter(Contract.agent_id == agent_id)
    total = q.count()
    contracts = q.order_by(Contract.sale_date.desc()).offset(skip).limit(limit).all()
    return ContractListResponse(contracts=contracts, total=total, skip=skip, limit=limit)


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
def create_contract(
    data: ContractCreate,
    db: Session = Depends(get_db),
    _manager=Depends(get_current_manager),
):
    contract = Contract(**data.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: str,
    db: Session = Depends(get_db),
    _manager=Depends(get_current_manager),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return contract


@router.patch("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: str,
    data: ContractUpdate,
    db: Session = Depends(get_db),
    _manager=Depends(get_current_manager),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(contract, field, value)
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: str,
    db: Session = Depends(get_db),
    _manager=Depends(get_current_manager),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    db.delete(contract)
    db.commit()
