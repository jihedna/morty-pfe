from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_active_user
from app.database.session import get_db
from app.schemas.ai_chat import ChatRequest, ChatResponse
from app.services.ai_assistant_service import get_chat_response

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    role = getattr(current_user, "role", None)
    if hasattr(role, "value"):
        role = role.value
    if not role and req.context and req.context.role:
        role = req.context.role
    return get_chat_response(req.message, role, db)
