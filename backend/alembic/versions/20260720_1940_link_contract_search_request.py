"""link contracts to their originating search request

Revision ID: 20260720_1940
Revises: 20260720_1915
Create Date: 2026-07-20T19:40:00Z
"""
from alembic import op
import sqlalchemy as sa

revision = "20260720_1940"
down_revision = "20260720_1915"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "contracts",
        sa.Column(
            "search_request_id",
            sa.String(36),
            sa.ForeignKey("client_search_requests.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_contracts_search_request_id", "contracts", ["search_request_id"])


def downgrade() -> None:
    op.drop_index("ix_contracts_search_request_id", table_name="contracts")
    op.drop_column("contracts", "search_request_id")
