"""add user_interactions table for ML event tracking

Revision ID: 20260712_2000
Revises: 20260711_1715
Create Date: 2026-07-12T20:00:00Z
"""
from alembic import op
import sqlalchemy as sa

revision = "20260712_2000"
down_revision = "20260711_1715"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_interactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("property_id", sa.String(36), sa.ForeignKey("properties.id", ondelete="SET NULL"), nullable=True),
        sa.Column("search_request_id", sa.String(36), sa.ForeignKey("client_search_requests.id", ondelete="SET NULL"), nullable=True),
        sa.Column("agent_id", sa.String(36), sa.ForeignKey("agents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("event_value", sa.String(200), nullable=True),
        sa.Column("metadata_json", sa.JSON, nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_user_interactions_user_id", "user_interactions", ["user_id"])
    op.create_index("ix_user_interactions_property_id", "user_interactions", ["property_id"])
    op.create_index("ix_user_interactions_event_type", "user_interactions", ["event_type"])
    op.create_index("ix_user_interactions_occurred_at", "user_interactions", ["occurred_at"])
    op.create_index("ix_user_interactions_user_event", "user_interactions", ["user_id", "event_type"])


def downgrade() -> None:
    op.drop_index("ix_user_interactions_user_event", table_name="user_interactions")
    op.drop_index("ix_user_interactions_occurred_at", table_name="user_interactions")
    op.drop_index("ix_user_interactions_event_type", table_name="user_interactions")
    op.drop_index("ix_user_interactions_property_id", table_name="user_interactions")
    op.drop_index("ix_user_interactions_user_id", table_name="user_interactions")
    op.drop_table("user_interactions")
