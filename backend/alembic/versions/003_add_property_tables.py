"""Add property management tables

Revision ID: 003
Revises: 002
Create Date: 2024-06-19 19:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create properties table
    op.create_table(
        'properties',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('reference_code', sa.String(length=20), nullable=False),
        sa.Column('agent_id', sa.String(length=36), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=5000), nullable=True),
        sa.Column('property_type', sa.String(length=20), nullable=False),
        sa.Column('listing_type', sa.String(length=10), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('price', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='TND'),
        sa.Column('area_sqm', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('land_area_sqm', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('rooms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('bedrooms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('bathrooms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('floor_number', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_floors', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('construction_year', sa.Integer(), nullable=True),
        sa.Column('is_furnished', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('address_line', sa.String(length=300), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('district', sa.String(length=100), nullable=True),
        sa.Column('governorate', sa.String(length=100), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.Column('latitude', sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column('longitude', sa.Numeric(precision=11, scale=8), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('reference_code', name='uq_properties_reference_code')
    )
    op.create_index(op.f('ix_properties_reference_code'), 'properties', ['reference_code'], unique=True)
    op.create_index(op.f('ix_properties_agent_id'), 'properties', ['agent_id'])
    op.create_index(op.f('ix_properties_status'), 'properties', ['status'])
    op.create_index(op.f('ix_properties_property_type'), 'properties', ['property_type'])
    op.create_index(op.f('ix_properties_listing_type'), 'properties', ['listing_type'])
    op.create_index(op.f('ix_properties_price'), 'properties', ['price'])
    op.create_index(op.f('ix_properties_city'), 'properties', ['city'])
    op.create_index(op.f('ix_properties_district'), 'properties', ['district'])
    op.create_index(op.f('ix_properties_created_at'), 'properties', ['created_at'])
    op.create_index('ix_properties_latitude_longitude', 'properties', ['latitude', 'longitude'])

    # Create property_images table
    op.create_table(
        'property_images',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('property_id', sa.String(length=36), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('alt_text', sa.String(length=200), nullable=True),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('position >= 0', name='ck_property_images_position_non_negative')
    )
    op.create_index(op.f('ix_property_images_property_id'), 'property_images', ['property_id'])

    # Create property_features table
    op.create_table(
        'property_features',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('property_id', sa.String(length=36), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('feature', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('property_id', 'feature', name='uq_property_features_property_feature')
    )
    op.create_index(op.f('ix_property_features_property_id'), 'property_features', ['property_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_property_features_property_id'), table_name='property_features')
    op.drop_table('property_features')
    op.drop_index(op.f('ix_property_images_property_id'), table_name='property_images')
    op.drop_table('property_images')
    op.drop_index('ix_properties_latitude_longitude', table_name='properties')
    op.drop_index(op.f('ix_properties_created_at'), table_name='properties')
    op.drop_index(op.f('ix_properties_district'), table_name='properties')
    op.drop_index(op.f('ix_properties_city'), table_name='properties')
    op.drop_index(op.f('ix_properties_price'), table_name='properties')
    op.drop_index(op.f('ix_properties_listing_type'), table_name='properties')
    op.drop_index(op.f('ix_properties_property_type'), table_name='properties')
    op.drop_index(op.f('ix_properties_status'), table_name='properties')
    op.drop_index(op.f('ix_properties_agent_id'), table_name='properties')
    op.drop_index(op.f('ix_properties_reference_code'), table_name='properties')
    op.drop_table('properties')
