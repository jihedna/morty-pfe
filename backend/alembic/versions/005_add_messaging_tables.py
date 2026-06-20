"""Add messaging tables

Revision ID: 005
Revises: 004
Create Date: 2024-06-19 21:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('client_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('agent_id', sa.String(length=36), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('property_id', sa.String(length=36), sa.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True),
        sa.Column('search_request_id', sa.String(length=36), sa.ForeignKey('client_search_requests.id', ondelete='SET NULL'), nullable=True),
        sa.Column('subject', sa.String(length=200), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('client_last_read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('agent_last_read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index(op.f('ix_conversations_client_id'), 'conversations', ['client_id'])
    op.create_index(op.f('ix_conversations_agent_id'), 'conversations', ['agent_id'])
    op.create_index(op.f('ix_conversations_property_id'), 'conversations', ['property_id'])
    op.create_index(op.f('ix_conversations_search_request_id'), 'conversations', ['search_request_id'])
    op.create_index(op.f('ix_conversations_is_active'), 'conversations', ['is_active'])
    op.create_index(op.f('ix_conversations_updated_at'), 'conversations', ['updated_at'])

    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('conversation_id', sa.String(length=36), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index(op.f('ix_messages_conversation_id'), 'messages', ['conversation_id'])
    op.create_index(op.f('ix_messages_sender_user_id'), 'messages', ['sender_user_id'])
    op.create_index(op.f('ix_messages_is_deleted'), 'messages', ['is_deleted'])
    op.create_index(op.f('ix_messages_created_at'), 'messages', ['created_at'])


def downgrade() -> None:
    op.drop_index(op.f('ix_messages_created_at'), table_name='messages')
    op.drop_index(op.f('ix_messages_is_deleted'), table_name='messages')
    op.drop_index(op.f('ix_messages_sender_user_id'), table_name='messages')
    op.drop_index(op.f('ix_messages_conversation_id'), table_name='messages')
    op.drop_table('messages')
    
    op.drop_index(op.f('ix_conversations_updated_at'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_is_active'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_search_request_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_property_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_agent_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_client_id'), table_name='conversations')
    op.drop_table('conversations')
