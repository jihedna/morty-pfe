from enum import Enum
from typing import List
from fastapi import HTTPException, status


class UserRole(str, Enum):
    """User roles for the application."""
    CLIENT = "client"
    AGENT = "agent"
    MANAGER = "manager"


def require_roles(allowed_roles: List[UserRole]) -> callable:
    """
    Create a dependency that checks if the user has one of the allowed roles.
    
    Args:
        allowed_roles: List of roles that are allowed to access the endpoint
        
    Returns:
        Dependency function that checks user role
    """
    async def role_checker(current_user) -> dict:
        if current_user["role"] not in [role.value for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return role_checker


def require_any_authenticated_user() -> callable:
    """
    Create a dependency that requires any authenticated user.
    
    Returns:
        Dependency function that checks if user is authenticated
    """
    async def auth_checker(current_user) -> dict:
        if not current_user.get("is_active", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        return current_user
    
    return auth_checker


def require_agent_or_manager() -> callable:
    """
    Create a dependency that requires agent or manager role.
    
    Returns:
        Dependency function that checks if user is agent or manager
    """
    return require_roles([UserRole.AGENT, UserRole.MANAGER])


def require_manager() -> callable:
    """
    Create a dependency that requires manager role.
    
    Returns:
        Dependency function that checks if user is manager
    """
    return require_roles([UserRole.MANAGER])
