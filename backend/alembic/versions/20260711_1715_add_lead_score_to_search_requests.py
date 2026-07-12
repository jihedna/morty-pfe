"""add_lead_score_to_search_requests

Revision ID: a1b2c3d4e5f6
Revises: 6d3fb2c4a31a
Create Date: 2026-07-11 17:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '6d3fb2c4a31a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'client_search_requests',
        sa.Column('lead_score', sa.Integer(), nullable=True),
    )
    op.add_column(
        'client_search_requests',
        sa.Column('qualification_level', sa.String(length=20), nullable=True),
    )
    op.add_column(
        'client_search_requests',
        sa.Column('lead_score_reasons', sa.JSON(), nullable=True),
    )
    op.add_column(
        'client_search_requests',
        sa.Column('lead_score_updated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('client_search_requests', 'lead_score_updated_at')
    op.drop_column('client_search_requests', 'lead_score_reasons')
    op.drop_column('client_search_requests', 'qualification_level')
    op.drop_column('client_search_requests', 'lead_score')
