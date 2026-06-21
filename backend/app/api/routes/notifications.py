from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.schemas.notification import (
    MarkAllReadResponse,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/me", response_model=NotificationListResponse)
def get_my_notifications(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(ge=0, default=0),
    limit: int = Query(ge=1, le=100, default=20),
    is_read: bool | None = Query(default=None),
    notification_type: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
) -> NotificationListResponse:
    """Return the authenticated user's notifications."""
    notifications, total = NotificationService.list_user_notifications(
        db,
        current_user["id"],
        skip=skip,
        limit=limit,
        is_read=is_read,
        notification_type=notification_type,
        date_from=date_from,
        date_to=date_to,
    )

    return NotificationListResponse(
        notifications=[
            NotificationResponse.model_validate(notif)
            for notif in notifications
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UnreadCountResponse:
    """Return unread notification count for the authenticated user."""
    count = NotificationService.get_unread_count(db, current_user["id"])
    return UnreadCountResponse(unread_count=count)


@router.patch("/read-all", response_model=MarkAllReadResponse)
def mark_all_as_read(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MarkAllReadResponse:
    """Mark all notifications as read for the authenticated user."""
    count = NotificationService.mark_all_as_read(db, current_user["id"])
    db.commit()
    return MarkAllReadResponse(marked_count=count)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationResponse:
    """Mark a notification as read."""
    notification = NotificationService.mark_as_read(
        db,
        notification_id,
        current_user["id"],
    )
    db.commit()
    db.refresh(notification)
    return NotificationResponse.model_validate(notification)


@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a notification."""
    NotificationService.delete_notification(
        db,
        notification_id,
        current_user["id"],
    )
    db.commit()
