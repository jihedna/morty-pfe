import os

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app

# Import all models to ensure they are registered with SQLAlchemy
from app.models.agent import Agent  # noqa: F401
from app.models.agent_property_type import AgentPropertyType  # noqa: F401
from app.models.agent_territory import AgentTerritory  # noqa: F401
from app.models.client_search_request import ClientSearchRequest  # noqa: F401
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.property import Property  # noqa: F401
from app.models.property_appointment import PropertyAppointment  # noqa: F401
from app.models.property_feature import PropertyFeature  # noqa: F401
from app.models.property_image import PropertyImage  # noqa: F401
from app.models.user import User  # noqa: F401

load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError(
        "TEST_DATABASE_URL is missing from the .env file."
    )

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


@pytest.fixture()
def db():
    """Create an isolated database session for each test."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    database_session = TestingSessionLocal()

    try:
        yield database_session
    finally:
        database_session.rollback()
        database_session.close()
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


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
