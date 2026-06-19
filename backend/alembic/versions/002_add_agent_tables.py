"""Add agent management tables

Revision ID: 002
Revises: 001
Create Date: 2024-06-19 18:35:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create agents table
    op.create_table(
        'agents',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('office', sa.String(length=200), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('biography', sa.String(length=2000), nullable=True),
        sa.Column('years_experience', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('minimum_budget', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('maximum_budget', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('availability_status', sa.String(length=20), nullable=False, server_default='available'),
        sa.Column('active_lead_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('success_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('closed_deals', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('languages', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index(op.f('ix_agents_user_id'), 'agents', ['user_id'], unique=True)
    
    # Create agent_territories table
    op.create_table(
        'agent_territories',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('agent_id', sa.String(length=36), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('territory', sa.String(length=100), nullable=False),
        sa.Column('expertise_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index(op.f('ix_agent_territories_agent_id'), 'agent_territories', ['agent_id'])
    
    # Create agent_property_types table
    op.create_table(
        'agent_property_types',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('agent_id', sa.String(length=36), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('property_type', sa.String(length=20), nullable=False),
        sa.Column('expertise_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index(op.f('ix_agent_property_types_agent_id'), 'agent_property_types', ['agent_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_agent_property_types_agent_id'), table_name='agent_property_types')
    op.drop_table('agent_property_types')
    op.drop_index(op.f('ix_agent_territories_agent_id'), table_name='agent_territories')
    op.drop_table('agent_territories')
    op.drop_index(op.f('ix_agents_user_id'), table_name='agents')
    op.drop_table('agents')
