from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_active_user, get_current_manager
from app.database.session import get_db
from app.models.knowledge_base import KnowledgeBaseArticle
from app.schemas.knowledge_base import (
    KnowledgeBaseArticleCreate,
    KnowledgeBaseArticleResponse,
    KnowledgeBaseArticleUpdate,
)

router = APIRouter()


@router.get("", response_model=list[KnowledgeBaseArticleResponse])
def list_articles(
    category: str | None = Query(default=None),
    language: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_active_user),
):
    q = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.is_active.is_(True))
    if category:
        q = q.filter(KnowledgeBaseArticle.category == category)
    if language:
        q = q.filter(KnowledgeBaseArticle.language == language)
    return q.order_by(KnowledgeBaseArticle.category, KnowledgeBaseArticle.title).all()


@router.get("/{article_id}", response_model=KnowledgeBaseArticleResponse)
def get_article(
    article_id: str,
    db: Session = Depends(get_db),
    _user=Depends(get_current_active_user),
):
    article = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


@router.post("", response_model=KnowledgeBaseArticleResponse, status_code=status.HTTP_201_CREATED)
def create_article(
    data: KnowledgeBaseArticleCreate,
    db: Session = Depends(get_db),
    _manager=Depends(get_current_manager),
):
    article = KnowledgeBaseArticle(**data.model_dump())
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.patch("/{article_id}", response_model=KnowledgeBaseArticleResponse)
def update_article(
    article_id: str,
    data: KnowledgeBaseArticleUpdate,
    db: Session = Depends(get_db),
    _manager=Depends(get_current_manager),
):
    article = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(article, field, value)
    db.commit()
    db.refresh(article)
    return article
