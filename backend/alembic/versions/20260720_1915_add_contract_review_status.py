"""add contract review status

Revision ID: 20260720_1915
Revises: 20260712_2000
Create Date: 2026-07-20T19:15:00Z
"""
from alembic import op
import sqlalchemy as sa

revision = "20260720_1915"
down_revision = "20260712_2000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("contracts", sa.Column("status", sa.String(20), nullable=False, server_default="approved"))
    op.create_index("ix_contracts_status", "contracts", ["status"])


def downgrade() -> None:
    op.drop_index("ix_contracts_status", table_name="contracts")
    op.drop_column("contracts", "status")
