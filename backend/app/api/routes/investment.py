from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_active_user
from app.database.session import get_db
from app.schemas.investment import InvestmentScoreRequest, InvestmentScoreResponse
from app.services.investment_service import calculate_investment_score

router = APIRouter()


@router.post("/score", response_model=InvestmentScoreResponse)
def get_investment_score(
    req: InvestmentScoreRequest,
    db: Session = Depends(get_db),
    _user=Depends(get_current_active_user),
):
    return calculate_investment_score(db, req)
