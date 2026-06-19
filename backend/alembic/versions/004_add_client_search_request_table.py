"""Add client search request table

Revision ID: 004
Revises: 003
Create Date: 2024-06-19 20:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create client_search_requests table
    op.create_table(
        'client_search_requests',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('client_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('property_type', sa.String(length=20), nullable=False),
        sa.Column('listing_type', sa.String(length=10), nullable=False),
        sa.Column('minimum_budget', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('maximum_budget', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('preferred_city', sa.String(length=100), nullable=True),
        sa.Column('preferred_district', sa.String(length=100), nullable=True),
        sa.Column('minimum_bedrooms', sa.Integer(), nullable=True),
        sa.Column('minimum_bathrooms', sa.Integer(), nullable=True),
        sa.Column('minimum_area_sqm', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('notes', sa.String(length=1000), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index(op.f('ix_client_search_requests_client_id'), 'client_search_requests', ['client_id'])
    op.create_index(op.f('ix_client_search_requests_property_type'), 'client_search_requests', ['property_type'])
    op.create_index(op.f('ix_client_search_requests_listing_type'), 'client_search_requests', ['listing_type'])
    op.create_index(op.f('ix_client_search_requests_is_active'), 'client_search_requests', ['is_active'])
    op.create_index(op.f('ix_client_search_requests_created_at'), 'client_search_requests', ['created_at'])


def downgrade() -> None:
    op.drop_index(op.f('ix_client_search_requests_created_at'), table_name='client_search_requests')
    op.drop_index(op.f('ix_client_search_requests_is_active'), table_name='client_search_requests')
    op.drop_index(op.f('ix_client_search_requests_listing_type'), table_name='client_search_requests')
    op.drop_index(op.f('ix_client_search_requests_property_type'), table_name='client_search_requests')
    op.drop_index(op.f('ix_client_search_requests_client_id'), table_name='client_search_requests')
    op.drop_table('client_search_requests')
