from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_manager
from app.database.session import get_db
from app.models.contract import Contract, ContractStatus
from app.models.agent import Agent
from app.models.client_search_request import ClientSearchRequest
from app.models.notification import NotificationType
from app.models.property import Property, PropertyStatus
from app.services.notification_service import NotificationService
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
    updates = data.model_dump(exclude_none=True)
    if "status" in updates and updates["status"] not in {item.value for item in ContractStatus}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid contract status")
    previous_status = contract.status
    for field, value in updates.items():
        setattr(contract, field, value)

    if updates.get("status") == ContractStatus.APPROVED.value and previous_status != ContractStatus.APPROVED.value:
        if not contract.property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An approved contract must have a property")
        property_obj = db.query(Property).filter(Property.id == contract.property_id).first()
        if not property_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract property not found")

        property_obj.status = (
            PropertyStatus.SOLD.value
            if contract.contract_type == "sale"
            else PropertyStatus.RENTED.value
        )

        if contract.search_request_id:
            request = db.query(ClientSearchRequest).filter(ClientSearchRequest.id == contract.search_request_id).first()
            if request:
                request.is_active = False

        notification_data = {
            "contract_id": contract.id,
            "property_id": contract.property_id,
            "status": contract.status,
        }
        if contract.client_id:
            NotificationService.create_notification(
                db,
                contract.client_id,
                NotificationType.PROPERTY_STATUS_CHANGED,
                "Deal approved",
                f"Your {contract.contract_type} agreement has been approved.",
                notification_data,
            )
        agent = db.query(Agent).filter(Agent.id == contract.agent_id).first()
        if agent:
            NotificationService.create_notification(
                db,
                agent.user_id,
                NotificationType.PROPERTY_STATUS_CHANGED,
                "Contract approved",
                f"The manager approved your {contract.contract_type} deal.",
                notification_data,
            )
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
