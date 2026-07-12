"""Admin user management API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_manager, get_db
from app.models.user import User
from app.core.permissions import UserRole

router = APIRouter()


def _user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }


@router.get("")
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: str | None = Query(None),
    is_active: bool | None = Query(None),
    q: str | None = Query(None, description="Search first name, last name or email"),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> dict:
    """List all users with optional filters."""
    query = db.query(User)
    if role:
        try:
            query = query.filter(User.role == UserRole(role))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Invalid role: {role}")
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                User.first_name.ilike(search),
                User.last_name.ilike(search),
                User.email.ilike(search),
            )
        )
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "users": [_user_to_dict(u) for u in users],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{user_id}")
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_manager),
) -> dict:
    """Get a user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_to_dict(user)


@router.patch("/{user_id}/activate")
def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_manager: dict = Depends(get_current_manager),
) -> dict:
    """Activate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if str(user.id) == current_manager["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify your own account")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return _user_to_dict(user)


@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_manager: dict = Depends(get_current_manager),
) -> dict:
    """Deactivate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if str(user.id) == current_manager["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify your own account")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return _user_to_dict(user)
