"""link an exact property to a client search request

Revision ID: 20260720_2000
Revises: 20260720_1940
Create Date: 2026-07-20T20:00:00Z
"""
from alembic import op
import sqlalchemy as sa

revision = "20260720_2000"
down_revision = "20260720_1940"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "client_search_requests",
        sa.Column("property_id", sa.String(36), sa.ForeignKey("properties.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_client_search_requests_property_id", "client_search_requests", ["property_id"])


def downgrade() -> None:
    op.drop_index("ix_client_search_requests_property_id", table_name="client_search_requests")
    op.drop_column("client_search_requests", "property_id")
