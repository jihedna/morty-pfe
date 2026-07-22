from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ContractResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    property_id: str | None
    search_request_id: str | None
    agent_id: str
    client_id: str | None
    sale_date: datetime
    amount: Decimal
    city: str
    district: str | None
    property_type: str
    area_sqm: Decimal | None
    contract_type: str
    status: str
    created_at: datetime


class ContractCreate(BaseModel):
    property_id: str | None = None
    search_request_id: str | None = None
    agent_id: str
    client_id: str | None = None
    sale_date: datetime
    amount: Decimal = Field(..., gt=0)
    city: str = Field(..., min_length=1, max_length=100)
    district: str | None = None
    property_type: str
    area_sqm: Decimal | None = None
    contract_type: str = "sale"
    status: str = "approved"


class ContractUpdate(BaseModel):
    sale_date: datetime | None = None
    amount: Decimal | None = None
    city: str | None = None
    district: str | None = None
    property_type: str | None = None
    area_sqm: Decimal | None = None
    contract_type: str | None = None
    status: str | None = None


class DealAgreedCreate(BaseModel):
    property_id: str
    amount: Decimal = Field(..., gt=0)


class ContractListResponse(BaseModel):
    contracts: list[ContractResponse]
    total: int
    skip: int
    limit: int
