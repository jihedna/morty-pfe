from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType


class NotificationService:
    """Service for in-app notifications."""

    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: dict[str, Any] | None = None,
    ) -> Notification:
        """Create a new notification for a user."""
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type.value,
            title=title,
            message=message,
            data=data,
            is_read=False,
        )

        db.add(notification)
        db.flush()  # Flush but don't commit - let caller control transaction
        db.refresh(notification)
        return notification

    @staticmethod
    def list_user_notifications(
        db: Session,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        is_read: bool | None = None,
        notification_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[Notification], int]:
        """List notifications for a user with filtering and pagination."""
        query = db.query(Notification).filter(
            Notification.user_id == user_id
        )

        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)

        if notification_type:
            query = query.filter(
                Notification.notification_type == notification_type
            )

        if date_from:
            query = query.filter(Notification.created_at >= date_from)

        if date_to:
            query = query.filter(Notification.created_at <= date_to)

        total = query.count()

        notifications = query.order_by(
            Notification.created_at.desc()
        ).offset(skip).limit(limit).all()

        return notifications, total

    @staticmethod
    def get_unread_count(db: Session, user_id: str) -> int:
        """Return unread notification count for a user."""
        return (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
            .count()
        )

    @staticmethod
    def get_notification_by_id(
        db: Session,
        notification_id: str,
    ) -> Notification | None:
        """Return a notification by ID."""
        return (
            db.query(Notification)
            .filter(Notification.id == notification_id)
            .first()
        )

    @staticmethod
    def mark_as_read(
        db: Session,
        notification_id: str,
        user_id: str,
    ) -> Notification:
        """Mark a notification as read."""
        notification = NotificationService.get_notification_by_id(
            db, notification_id
        )
        if notification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        if notification.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(UTC)
            db.flush()
            db.refresh(notification)

        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        count = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
            .update(
                {
                    "is_read": True,
                    "read_at": datetime.now(UTC),
                },
                synchronize_session=False,
            )
        )
        db.flush()
        return count

    @staticmethod
    def delete_notification(
        db: Session,
        notification_id: str,
        user_id: str,
    ) -> None:
        """Delete a notification."""
        notification = NotificationService.get_notification_by_id(
            db, notification_id
        )
        if notification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        if notification.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        db.delete(notification)
        db.flush()
