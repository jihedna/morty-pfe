from decimal import Decimal

from pydantic import BaseModel, Field


class InvestmentScoreRequest(BaseModel):
    city: str = Field(..., min_length=1, max_length=100)
    district: str | None = None
    budget: Decimal = Field(..., gt=0)
    property_type: str
    listing_type: str = "sale"
    investment_goal: str | None = None


class InvestmentScoreResponse(BaseModel):
    investment_score: float
    demand_score: float
    affordability_score: float
    rental_yield_score: float
    growth_score: float
    liquidity_score: float
    explanation: str
    risks: list[str]
    recommendation: str
    data_note: str
