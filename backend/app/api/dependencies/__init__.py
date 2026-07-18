from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.permissions import (
    require_agent_or_manager,
    require_any_authenticated_user,
    require_manager,
    require_client,
)
from app.core.security import decode_access_token
from app.database.session import get_db
from app.services.user_service import UserService


security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> dict:
    """Get the current authenticated user from the JWT access token."""

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = UserService.get_user_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "is_active": user.is_active,
    }


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> dict | None:
    """Get the current authenticated user, or None if no valid token."""
    if credentials is None:
        return None

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = UserService.get_user_by_id(db, user_id)
    if user is None:
        return None

    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "is_active": user.is_active,
    }


async def get_current_active_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Return the current user when the account is active."""
    return await require_any_authenticated_user()(current_user)


async def get_current_agent_or_manager(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Return the current user when the role is agent or manager."""
    return await require_agent_or_manager()(current_user)


async def get_current_manager(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Return the current user when the role is manager."""
    return await require_manager()(current_user)


async def get_current_client(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Return the current user when the role is client."""
    return await require_client()(current_user)
