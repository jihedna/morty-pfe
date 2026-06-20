"""Add property appointments table

Revision ID: 006
Revises: 005
Create Date: 2024-06-20 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create property_appointments table
    op.create_table(
        'property_appointments',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('client_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('agent_id', sa.String(length=36), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('property_id', sa.String(length=36), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('conversation_id', sa.String(length=36), sa.ForeignKey('conversations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('scheduled_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('scheduled_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='requested'),
        sa.Column('client_notes', sa.Text(), nullable=True),
        sa.Column('agent_notes', sa.Text(), nullable=True),
        sa.Column('cancellation_reason', sa.String(length=1000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index(op.f('ix_property_appointments_client_id'), 'property_appointments', ['client_id'])
    op.create_index(op.f('ix_property_appointments_agent_id'), 'property_appointments', ['agent_id'])
    op.create_index(op.f('ix_property_appointments_property_id'), 'property_appointments', ['property_id'])
    op.create_index(op.f('ix_property_appointments_conversation_id'), 'property_appointments', ['conversation_id'])
    op.create_index(op.f('ix_property_appointments_status'), 'property_appointments', ['status'])
    op.create_index(op.f('ix_property_appointments_scheduled_start'), 'property_appointments', ['scheduled_start'])
    op.create_index(op.f('ix_property_appointments_scheduled_end'), 'property_appointments', ['scheduled_end'])


def downgrade() -> None:
    op.drop_index(op.f('ix_property_appointments_scheduled_end'), table_name='property_appointments')
    op.drop_index(op.f('ix_property_appointments_scheduled_start'), table_name='property_appointments')
    op.drop_index(op.f('ix_property_appointments_status'), table_name='property_appointments')
    op.drop_index(op.f('ix_property_appointments_conversation_id'), table_name='property_appointments')
    op.drop_index(op.f('ix_property_appointments_property_id'), table_name='property_appointments')
    op.drop_index(op.f('ix_property_appointments_agent_id'), table_name='property_appointments')
    op.drop_index(op.f('ix_property_appointments_client_id'), table_name='property_appointments')
    op.drop_table('property_appointments')
