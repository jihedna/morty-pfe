from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user, get_current_agent_or_manager, get_current_manager

router = APIRouter()


@router.get("/me")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the current user's profile.
    Accessible by any authenticated user.
    """
    return current_user


@router.get("/agent-area")
async def get_agent_area(current_user: dict = Depends(get_current_agent_or_manager)):
    """
    Demonstration endpoint for agent-only area.
    Accessible by agents and managers only.
    """
    return {
        "message": "Welcome to the agent area",
        "user": current_user
    }


@router.get("/manager-area")
async def get_manager_area(current_user: dict = Depends(get_current_manager)):
    """
    Demonstration endpoint for manager-only area.
    Accessible by managers only.
    """
    return {
        "message": "Welcome to the manager area",
        "user": current_user
    }
