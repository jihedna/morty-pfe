"""User interaction tracking service.

Records implicit and explicit user interactions for ML training.
Tracking failures are non-blocking for critical user actions.
Does not log message contents, passwords, tokens, or private chatbot content.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.models.user_interaction import UserInteraction

logger = logging.getLogger(__name__)

# Valid event types
VALID_EVENT_TYPES = {
    "property_view",
    "search_click",
    "favorite_add",
    "favorite_remove",
    "saved_search",
    "agent_contact",
    "conversation_created",
    "message_sent",
    "appointment_requested",
    "appointment_confirmed",
    "appointment_completed",
    "appointment_cancelled",
    "contract_completed",
    "property_sold",
    "property_rented",
    "property_price_changed",
}


class InteractionTrackingService:
    """Service for recording user interaction events."""

    @staticmethod
    def track(
        db: Session,
        user_id: str,
        event_type: str,
        property_id: str | None = None,
        search_request_id: str | None = None,
        agent_id: str | None = None,
        event_value: str | None = None,
        metadata: dict | None = None,
        commit: bool = False,
    ) -> UserInteraction | None:
        """Record a user interaction event.

        Non-blocking: logs and returns None on failure instead of raising.
        """
        if event_type not in VALID_EVENT_TYPES:
            logger.warning("Unknown event type: %s — skipping tracking", event_type)
            return None

        try:
            interaction = UserInteraction(
                user_id=user_id,
                event_type=event_type,
                property_id=property_id,
                search_request_id=search_request_id,
                agent_id=agent_id,
                event_value=event_value,
                metadata_json=metadata,
            )
            db.add(interaction)
            if commit:
                db.commit()
            return interaction
        except Exception as e:
            logger.warning("Failed to track interaction %s for user %s: %s", event_type, user_id, e)
            db.rollback()
            return None

    @staticmethod
    def get_user_interactions(
        db: Session,
        user_id: str,
        limit: int = 200,
    ) -> list[UserInteraction]:
        """Return recent interactions for a user."""
        return (
            db.query(UserInteraction)
            .filter(UserInteraction.user_id == user_id)
            .order_by(UserInteraction.occurred_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_property_interactions(
        db: Session,
        property_id: str,
        limit: int = 100,
    ) -> list[UserInteraction]:
        """Return interactions for a specific property."""
        return (
            db.query(UserInteraction)
            .filter(UserInteraction.property_id == property_id)
            .order_by(UserInteraction.occurred_at.desc())
            .limit(limit)
            .all()
        )
