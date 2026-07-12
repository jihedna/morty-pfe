"""
Investment scoring service.

Formula is TRANSPARENT and DETERMINISTIC — not a trained ML model.
All scores are based on market area data seeded in the database.
Values marked as DEMO/SAMPLE unless real contract data is imported.
"""
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.market_area import MarketArea
from app.schemas.investment import InvestmentScoreRequest, InvestmentScoreResponse

DEMAND_SCORES = {"low": 20.0, "medium": 50.0, "high": 75.0, "very_high": 95.0}
TREND_GROWTH = {"falling": 10.0, "stable": 40.0, "rising": 70.0, "surging": 90.0}

WEIGHTS = {
    "demand": 0.30,
    "affordability": 0.25,
    "rental_yield": 0.20,
    "growth": 0.15,
    "liquidity": 0.10,
}


def _affordability_score(budget: Decimal, avg_price_sqm: Decimal | None) -> float:
    """Higher score when budget is well above local prices (more choice)."""
    if not avg_price_sqm or avg_price_sqm == 0:
        return 50.0
    typical_sqm = float(budget) / float(avg_price_sqm)
    if typical_sqm >= 150:
        return 95.0
    if typical_sqm >= 100:
        return 80.0
    if typical_sqm >= 70:
        return 65.0
    if typical_sqm >= 40:
        return 50.0
    if typical_sqm >= 20:
        return 30.0
    return 15.0


def _rental_yield_score(rental_yield: Decimal | None) -> float:
    if not rental_yield:
        return 40.0
    y = float(rental_yield)
    if y >= 8:
        return 95.0
    if y >= 6:
        return 80.0
    if y >= 4:
        return 60.0
    if y >= 2:
        return 40.0
    return 20.0


def _liquidity_score(transaction_count: int, demand_level: str) -> float:
    base = DEMAND_SCORES.get(demand_level, 50.0)
    if transaction_count >= 50:
        return min(base + 10, 100)
    if transaction_count >= 20:
        return base
    if transaction_count >= 5:
        return max(base - 15, 10)
    return max(base - 25, 10)


def calculate_investment_score(
    db: Session, req: InvestmentScoreRequest
) -> InvestmentScoreResponse:
    area = None
    if req.district:
        area = (
            db.query(MarketArea)
            .filter(
                MarketArea.city.ilike(f"%{req.city}%"),
                MarketArea.district.ilike(f"%{req.district}%"),
            )
            .first()
        )
    if not area:
        area = (
            db.query(MarketArea)
            .filter(MarketArea.city.ilike(f"%{req.city}%"))
            .first()
        )

    if area:
        demand_s = DEMAND_SCORES.get(area.demand_level, 50.0)
        afford_s = _affordability_score(req.budget, area.average_price_per_sqm)
        rental_s = _rental_yield_score(area.rental_yield)
        growth_s = TREND_GROWTH.get(area.price_trend, 40.0)
        liquid_s = _liquidity_score(area.transaction_count, area.demand_level)
        data_note = (
            f"Based on DEMO market data for {area.city} / {area.district}. "
            "Import real contract data for accurate scores."
        )
        location_label = f"{area.city} – {area.district}"
        price_label = (
            f"{float(area.average_price_per_sqm):,.0f} TND/m²"
            if area.average_price_per_sqm
            else "price data unavailable"
        )
        rent_label = (
            f"{float(area.average_rent_per_sqm):,.0f} TND/m²/month"
            if area.average_rent_per_sqm
            else "rental data unavailable"
        )
        yield_label = (
            f"{float(area.rental_yield):.1f}%"
            if area.rental_yield
            else "N/A"
        )
    else:
        demand_s = afford_s = rental_s = growth_s = liquid_s = 40.0
        data_note = (
            f"No market data found for '{req.city}'. "
            "Scores use default values. Add market area data for accuracy."
        )
        location_label = req.city
        price_label = rent_label = yield_label = "N/A"

    investment_score = round(
        demand_s * WEIGHTS["demand"]
        + afford_s * WEIGHTS["affordability"]
        + rental_s * WEIGHTS["rental_yield"]
        + growth_s * WEIGHTS["growth"]
        + liquid_s * WEIGHTS["liquidity"],
        1,
    )

    risks: list[str] = []
    if demand_s < 40:
        risks.append("Low demand in this area — resale may be slow.")
    if afford_s < 40:
        risks.append("Budget may be tight for this location — limited choice of properties.")
    if rental_s < 40:
        risks.append("Rental yield is low — rental income may not cover costs.")
    if growth_s < 40:
        risks.append("Price trend is falling or flat — limited capital appreciation expected.")
    if liquid_s < 40:
        risks.append("Low transaction volume — market may be illiquid.")
    if not risks:
        risks.append("No major risks identified based on available data.")

    goal = req.investment_goal or "general"
    if investment_score >= 75:
        rec = f"Strong investment opportunity in {location_label} for {goal}."
    elif investment_score >= 55:
        rec = f"Moderate opportunity in {location_label}. Suitable with careful due diligence."
    elif investment_score >= 35:
        rec = f"Below-average score for {location_label}. Consider alternative areas."
    else:
        rec = f"Low score for {location_label}. High risk relative to expected return."

    explanation = (
        f"Location: {location_label} | "
        f"Avg price: {price_label} | "
        f"Avg rent: {rent_label} | "
        f"Rental yield: {yield_label} | "
        f"Demand: {area.demand_level if area else 'unknown'} | "
        f"Trend: {area.price_trend if area else 'unknown'}"
    )

    return InvestmentScoreResponse(
        investment_score=investment_score,
        demand_score=round(demand_s, 1),
        affordability_score=round(afford_s, 1),
        rental_yield_score=round(rental_s, 1),
        growth_score=round(growth_s, 1),
        liquidity_score=round(liquid_s, 1),
        explanation=explanation,
        risks=risks,
        recommendation=rec,
        data_note=data_note,
    )
