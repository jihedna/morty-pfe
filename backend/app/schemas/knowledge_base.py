from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class KnowledgeBaseArticleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    category: str
    content: str
    source: str | None
    language: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class KnowledgeBaseArticleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    category: str
    content: str = Field(..., min_length=1)
    source: str | None = None
    language: str = "fr"
    is_active: bool = True


class KnowledgeBaseArticleUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    content: str | None = None
    source: str | None = None
    language: str | None = None
    is_active: bool | None = None
