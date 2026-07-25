import os

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app

# Import all models to ensure they are registered with SQLAlchemy
# Import order matters: import base models first, then dependent models
from app.models.user import User  # noqa: F401
from app.models.agent import Agent  # noqa: F401
from app.models.agent_property_type import AgentPropertyType  # noqa: F401
from app.models.agent_territory import AgentTerritory  # noqa: F401
from app.models.property import Property  # noqa: F401
from app.models.property_feature import PropertyFeature  # noqa: F401
from app.models.property_image import PropertyImage  # noqa: F401
from app.models.client_search_request import ClientSearchRequest  # noqa: F401
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.property_appointment import PropertyAppointment  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.property_favorite import PropertyFavorite  # noqa: F401
from app.models.saved_search import SavedSearch  # noqa: F401
from app.models.market_area import MarketArea  # noqa: F401
from app.models.knowledge_base import KnowledgeBaseArticle  # noqa: F401
from app.models.contract import Contract  # noqa: F401
from app.models.user_interaction import UserInteraction  # noqa: F401

load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError(
        "TEST_DATABASE_URL is missing from the .env file."
    )

if not (make_url(TEST_DATABASE_URL).database or "").lower().startswith("test_"):
    raise RuntimeError("Refusing destructive fixture cleanup outside a test_ database")

test_engine = create_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    connect_args={"prepare_threshold": None},
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(scope="session", autouse=True)
def test_database_schema():
    """Create the PostgreSQL test schema once for the test session."""
    # PostgreSQL enum types and partially created tables can survive an
    # interrupted run. Recreate only the public schema of the guarded,
    # dedicated test_ database so every test starts from identical state.
    with test_engine.begin() as connection:
        connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(bind=test_engine)

    yield

    with test_engine.begin() as connection:
        connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))
    test_engine.dispose()


@pytest.fixture()
def db(test_database_schema):
    """Create an isolated database session for each test."""
    table_names = ", ".join(
        f'"{table.name}"' for table in reversed(Base.metadata.sorted_tables)
    )
    with test_engine.begin() as connection:
        connection.execute(text(f"TRUNCATE TABLE {table_names} RESTART IDENTITY CASCADE"))

    database_session = TestingSessionLocal()

    try:
        yield database_session
    finally:
        database_session.rollback()
        database_session.close()


@pytest.fixture()
def client(db: Session):
    """Create a test client that uses the test database."""

    def override_get_db():
        yield db

    app.dependency_overrides.clear()
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
