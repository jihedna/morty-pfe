"""Add property favorites and saved searches tables

Revision ID: 008
Revises: 007
Create Date: 2024-06-22 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '008'
down_revision: Union[str, None] = '007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create property_favorites table
    op.create_table(
        'property_favorites',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('property_id', sa.String(length=36), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_id', 'property_id', name='uq_user_property_favorite')
    )
    op.create_index(op.f('ix_property_favorites_user_id'), 'property_favorites', ['user_id'])
    op.create_index(op.f('ix_property_favorites_property_id'), 'property_favorites', ['property_id'])
    op.create_index(op.f('ix_property_favorites_created_at'), 'property_favorites', ['created_at'])

    # Create saved_searches table
    op.create_table(
        'saved_searches',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('filters', sa.JSON(), nullable=False),
        sa.Column('notifications_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_notified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index(op.f('ix_saved_searches_user_id'), 'saved_searches', ['user_id'])
    op.create_index(op.f('ix_saved_searches_is_active'), 'saved_searches', ['is_active'])
    op.create_index(op.f('ix_saved_searches_notifications_enabled'), 'saved_searches', ['notifications_enabled'])
    op.create_index(op.f('ix_saved_searches_created_at'), 'saved_searches', ['created_at'])


def downgrade() -> None:
    op.drop_index(op.f('ix_saved_searches_created_at'), table_name='saved_searches')
    op.drop_index(op.f('ix_saved_searches_notifications_enabled'), table_name='saved_searches')
    op.drop_index(op.f('ix_saved_searches_is_active'), table_name='saved_searches')
    op.drop_index(op.f('ix_saved_searches_user_id'), table_name='saved_searches')
    op.drop_table('saved_searches')
    
    op.drop_index(op.f('ix_property_favorites_created_at'), table_name='property_favorites')
    op.drop_index(op.f('ix_property_favorites_property_id'), table_name='property_favorites')
    op.drop_index(op.f('ix_property_favorites_user_id'), table_name='property_favorites')
    op.drop_table('property_favorites')
