"""009 add market_areas knowledge_base_articles contracts

Revision ID: 009
Revises: 008
Create Date: 2026-07-09
"""
from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "market_areas",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("district", sa.String(100), nullable=False),
        sa.Column("average_price_per_sqm", sa.Numeric(12, 2), nullable=True),
        sa.Column("average_rent_per_sqm", sa.Numeric(12, 2), nullable=True),
        sa.Column("transaction_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("demand_level", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("price_trend", sa.String(20), nullable=False, server_default="stable"),
        sa.Column("rental_yield", sa.Numeric(5, 2), nullable=True),
        sa.Column("latitude", sa.Numeric(10, 8), nullable=True),
        sa.Column("longitude", sa.Numeric(11, 8), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_market_areas_city", "market_areas", ["city"])
    op.create_index("ix_market_areas_district", "market_areas", ["district"])

    op.create_table(
        "knowledge_base_articles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("source", sa.String(300), nullable=True),
        sa.Column("language", sa.String(10), nullable=False, server_default="fr"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_knowledge_base_articles_category", "knowledge_base_articles", ["category"])

    op.create_table(
        "contracts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("property_id", sa.String(36), sa.ForeignKey("properties.id", ondelete="SET NULL"), nullable=True),
        sa.Column("agent_id", sa.String(36), sa.ForeignKey("agents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("client_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("sale_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("district", sa.String(100), nullable=True),
        sa.Column("property_type", sa.String(20), nullable=False),
        sa.Column("area_sqm", sa.Numeric(10, 2), nullable=True),
        sa.Column("contract_type", sa.String(10), nullable=False, server_default="sale"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_contracts_agent_id", "contracts", ["agent_id"])
    op.create_index("ix_contracts_city", "contracts", ["city"])
    op.create_index("ix_contracts_client_id", "contracts", ["client_id"])
    op.create_index("ix_contracts_property_id", "contracts", ["property_id"])


def downgrade() -> None:
    op.drop_table("contracts")
    op.drop_table("knowledge_base_articles")
    op.drop_table("market_areas")
