
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import create_access_token
from app.database.session import get_db
from app.schemas.auth import Token, UserLogin, UserRegister
from app.services.user_service import UserService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
) -> Token:
    """
    Register a new user with the client role.

    Public registration automatically assigns the client role.
    """
    try:
        user = UserService.create_client_user(
            db=db,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            password=user_data.password,
        )

        access_token = create_access_token(
            data={"sub": str(user.id)}
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()

        # Displays the complete traceback in the Uvicorn terminal.
        logger.exception("Registration failed")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration",
        ) from exc


@router.post(
    "/login",
    response_model=Token,
)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db),
) -> Token:
    """
    Authenticate a user and return a JWT access token.
    """
    user = UserService.authenticate_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
    )


@router.get("/me")
def get_current_user_info(
    current_user=Depends(get_current_user),
):
    """
    Return the current authenticated user's public information.
    """
    return current_user