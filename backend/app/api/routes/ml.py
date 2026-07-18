"""ML API routes — recommendations, lead conversion, price estimation, model registry.

All endpoints preserve existing rule-based fallbacks.
ML predictions are additive and clearly labeled as experimental.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_agent_or_manager,
    get_current_client,
    get_current_manager,
    get_current_user,
    get_db,
)
from app.services.lead_conversion_ml_service import LeadConversionMLService
from app.services.ml_model_registry_service import MLModelRegistryService
from app.services.price_estimation_service import PriceEstimationService
from app.services.recommendation_service import RecommendationService

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────


class RecommendationResponse(BaseModel):
    recommendations: list[dict] = Field(default_factory=list)
    model_status: str = "not_trained"
    fallback: bool = True
    count: int = 0


class LeadConversionResponse(BaseModel):
    conversion_probability: float
    predicted_priority: str
    model_version: str
    model_status: str
    top_reasons: list[str] = Field(default_factory=list)
    prediction_timestamp: str
    fallback: bool = True
    experimental_label: str = "Experimental ML estimate"


class PriceEstimationRequest(BaseModel):
    listing_type: str = Field(default="sale", pattern="^(sale|rent)$")
    city: str = ""
    district: str | None = None
    property_type: str = ""
    area_sqm: float = Field(gt=0)
    bedrooms: int = Field(default=0, ge=0)
    bathrooms: int = Field(default=0, ge=0)
    features: list[str] = Field(default_factory=list)


class PriceEstimationResponse(BaseModel):
    estimate: float
    lower_estimate: float
    upper_estimate: float
    reliability: str
    comparable_count: int
    model_version: str
    disclaimer: str
    fallback: bool = True
    data_date_range: str | None = None


class ModelStatusResponse(BaseModel):
    model_name: str
    display_name: str
    model_type: str
    purpose: str
    status: str
    version: str | None = None
    trained_at: str | None = None
    training_rows: int | None = None
    validation_rows: int | None = None
    data_date_range: str | None = None
    target_definition: str | None = None
    compatibility_version: str | None = None


class ModelListResponse(BaseModel):
    models: list[ModelStatusResponse]


class ModelMetricsResponse(BaseModel):
    model_name: str
    status: str
    metrics: dict
    model_version: str | None = None
    trained_at: str | None = None
    training_rows: int | None = None


# ── Routes ─────────────────────────────────────────────────────────────


@router.get("/recommendations", response_model=RecommendationResponse)
def get_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    city: str | None = Query(default=None),
    property_type: str | None = Query(default=None),
    listing_type: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecommendationResponse:
    """Get property recommendations for the authenticated user.

    Uses the trained ML model when available, falls back to popularity-based
    ranking. Results are clearly labeled as ML or fallback.
    """
    result = RecommendationService.get_recommendations(
        db=db,
        user_id=current_user["id"],
        limit=limit,
        city=city,
        property_type=property_type,
        listing_type=listing_type,
    )
    return RecommendationResponse(**result)


@router.get("/leads/{request_id}/conversion-prediction", response_model=LeadConversionResponse)
def get_lead_conversion_prediction(
    request_id: str,
    current_user: dict = Depends(get_current_agent_or_manager),
    db: Session = Depends(get_db),
) -> LeadConversionResponse:
    """Get ML-based conversion prediction for a lead.

    Falls back to rule-based estimation when the ML model is unavailable.
    The existing rule-based lead score is preserved and not replaced.
    """
    result = LeadConversionMLService.get_prediction(db, request_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )
    return LeadConversionResponse(**result)


@router.post("/price-estimation", response_model=PriceEstimationResponse)
def estimate_property_price(
    request: PriceEstimationRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PriceEstimationResponse:
    """Estimate a listing price for a property.

    Uses the trained ML model when available, falls back to median-based
    estimation. The estimate is advisory only and never overwrites
    the entered price automatically.
    """
    result = PriceEstimationService.estimate(
        db=db,
        listing_type=request.listing_type,
        city=request.city,
        district=request.district,
        property_type=request.property_type,
        area_sqm=request.area_sqm,
        bedrooms=request.bedrooms,
        bathrooms=request.bathrooms,
        features=request.features,
    )
    return PriceEstimationResponse(**result)


@router.get("/models", response_model=ModelListResponse)
def list_all_models(
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> ModelListResponse:
    """List all ML models with their current status (manager only)."""
    models = MLModelRegistryService.get_all_models_status()
    return ModelListResponse(models=[ModelStatusResponse(**m) for m in models])


@router.get("/models/{model_name}", response_model=ModelStatusResponse)
def get_model_status(
    model_name: str,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> ModelStatusResponse:
    """Get status for a specific ML model (manager only)."""
    result = MLModelRegistryService.get_model_status(model_name)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found",
        )
    return ModelStatusResponse(**result)


@router.get("/models/{model_name}/metrics", response_model=ModelMetricsResponse)
def get_model_metrics(
    model_name: str,
    current_user: dict = Depends(get_current_manager),
    db: Session = Depends(get_db),
) -> ModelMetricsResponse:
    """Get evaluation metrics for a specific ML model (manager only)."""
    result = MLModelRegistryService.get_model_metrics(model_name)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found",
        )
    return ModelMetricsResponse(**result)
