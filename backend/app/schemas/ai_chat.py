from pydantic import BaseModel, Field


class ChatContext(BaseModel):
    current_route: str | None = None
    role: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    role: str | None = None
    context: ChatContext | None = None


class SuggestedAction(BaseModel):
    label: str
    route: str


class ChatResponse(BaseModel):
    reply: str
    source: str
    confidence: str = "medium"
    suggested_actions: list[SuggestedAction] = []
