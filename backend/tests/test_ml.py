"""Tests for the ML system — model loader, inference fallbacks, and API endpoints."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from ml.config import ARTIFACT_COMPAT_VERSION
from ml.inference.model_loader import (
    get_model_status,
    load_artifact,
    load_metadata,
    save_artifact,
)

from app.core.permissions import UserRole
from app.core.security import get_password_hash
from app.schemas.user import UserCreate
from app.services.user_service import UserService


# ── Helpers ────────────────────────────────────────────────────────────


def create_test_user(db: Session, email: str, role: UserRole):
    user_data = UserCreate(
        first_name="Test",
        last_name="User",
        email=email,
        password_hash=get_password_hash("SecurePass123"),
        role=role,
        is_active=True,
    )
    return UserService.create_user(db, user_data)


def get_auth_token(client: TestClient, email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    return response.json()["access_token"]


def create_test_agent(db: Session, email: str):
    from app.schemas.agent import AgentCreate
    from app.services.agent_service import AgentService

    user = create_test_user(db, email, UserRole.AGENT)
    agent_data = AgentCreate(
        user_id=user.id,
        office="RE/MAX Tunis",
        phone="+21612345678",
        years_experience=5,
        minimum_budget=100000.0,
        maximum_budget=500000.0,
    )
    agent = AgentService.create_agent(db, agent_data)
    return user, agent


def create_test_property(db: Session, agent_id: str):
    from decimal import Decimal

    from app.models.agent_property_type import PropertyType
    from app.models.property import ListingType
    from app.schemas.property import PropertyAgentCreate
    from app.services.property_service import PropertyService

    property_data = PropertyAgentCreate(
        title="Test Property",
        description="A test property",
        property_type=PropertyType.APARTMENT,
        listing_type=ListingType.SALE,
        price=Decimal("200000.0"),
        area_sqm=Decimal("150.0"),
        bedrooms=3,
        bathrooms=2,
        address_line="123 Test Street",
        city="Tunis",
        postal_code="1001",
        reference_code="REF123",
    )
    return PropertyService.create_property_for_agent(db, agent_id, property_data)


def create_test_search_request(db: Session, client_id: str):
    from app.models.client_search_request import ClientSearchRequest

    req = ClientSearchRequest(
        client_id=client_id,
        property_type="apartment",
        listing_type="sale",
        minimum_budget=100000,
        maximum_budget=300000,
        preferred_city="Tunis",
        preferred_district="Lac",
        minimum_bedrooms=2,
        minimum_bathrooms=1,
        minimum_area_sqm=80,
        urgency="high",
        is_active=True,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


# ── Model Loader Tests ─────────────────────────────────────────────────


class TestModelLoader:
    def test_get_model_status_not_trained(self):
        assert get_model_status("nonexistent_model") == "not_trained"

    def test_load_metadata_missing(self):
        assert load_metadata("nonexistent_model_xyz") is None

    def test_load_artifact_missing(self):
        assert load_artifact("nonexistent_model_xyz") is None

    def test_save_and_load_artifact(self, tmp_path):
        with patch("ml.inference.model_loader.ARTIFACTS_DIR", tmp_path), \
             patch("ml.inference.model_loader.METADATA_DIR", tmp_path):
            save_artifact(
                model_name="test_model",
                model={"predict": "not_a_lambda"},
                metadata={
                    "model_name": "test_model",
                    "status": "ready",
                    "model_version": "1.0.0",
                    "compatibility_version": ARTIFACT_COMPAT_VERSION,
                    "training_rows": 100,
                },
            )
            artifact = load_artifact("test_model")
            assert artifact is not None
            assert artifact["metadata"]["status"] == "ready"

    def test_load_artifact_wrong_compat_version(self, tmp_path):
        with patch("ml.inference.model_loader.ARTIFACTS_DIR", tmp_path), \
             patch("ml.inference.model_loader.METADATA_DIR", tmp_path):
            save_artifact(
                model_name="test_compat",
                model={"predict": "not_a_lambda"},
                metadata={
                    "model_name": "test_compat",
                    "status": "ready",
                    "model_version": "1.0.0",
                    "compatibility_version": "0.9",
                },
            )
            assert load_artifact("test_compat") is None

    def test_load_artifact_insufficient_data_status(self, tmp_path):
        with patch("ml.inference.model_loader.ARTIFACTS_DIR", tmp_path), \
             patch("ml.inference.model_loader.METADATA_DIR", tmp_path):
            save_artifact(
                model_name="test_insufficient",
                model=None,
                metadata={
                    "model_name": "test_insufficient",
                    "status": "insufficient_training_data",
                    "compatibility_version": ARTIFACT_COMPAT_VERSION,
                },
            )
            assert load_artifact("test_insufficient") is None
            assert get_model_status("test_insufficient") == "insufficient_training_data"


# ── Inference Fallback Tests ───────────────────────────────────────────


class TestInferenceFallbacks:
    def test_recommender_fallback_popularity(self):
        from ml.inference.recommender import get_recommendations

        props = []
        for i in range(5):
            prop = MagicMock()
            prop.id = f"prop-{i}"
            prop.status = "available"
            prop.is_featured = i < 2
            prop.published_at = None
            prop.city = "Tunis"
            prop.district = "Lac"
            prop.property_type = "apartment"
            prop.price = 100000 + i * 10000
            prop.features = []
            props.append(prop)

        result = get_recommendations(
            db=MagicMock(),
            user_id="user-1",
            user_preferences={},
            interactions=[],
            properties=props,
            limit=3,
        )
        assert len(result) == 3
        assert all(r["fallback"] for r in result)

    def test_lead_conversion_fallback(self):
        from datetime import datetime, timezone

        from ml.inference.lead_conversion import predict_conversion

        request = MagicMock()
        request.id = "req-1"
        request.client_id = "client-1"
        request.created_at = datetime.now(timezone.utc)
        request.minimum_budget = 100000
        request.maximum_budget = 200000
        request.preferred_city = "Tunis"
        request.preferred_district = "Lac"
        request.property_type = "apartment"
        request.listing_type = "sale"
        request.urgency = "high"
        request.minimum_bedrooms = 2
        request.minimum_bathrooms = 1
        request.minimum_area_sqm = 80

        db = MagicMock()
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 0
        mock_query.all.return_value = []
        mock_query.first.return_value = MagicMock(created_at=datetime.now(timezone.utc))
        db.query.return_value = mock_query

        result = predict_conversion(db, request)
        assert 0 <= result["conversion_probability"] <= 1
        assert result["fallback"] is True

    def test_price_estimator_fallback(self):
        from ml.inference.price_estimator import estimate_price

        db = MagicMock()
        mock_props = []
        for i in range(20):
            p = MagicMock()
            p.price = 100000 + i * 5000
            p.area_sqm = 80 + i * 2
            p.listing_type = "sale"
            p.status = "available"
            p.city = "Tunis"
            p.property_type = "apartment"
            mock_props.append(p)

        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = mock_props
        mock_query.limit.return_value.all.return_value = mock_props
        db.query.return_value = mock_query

        result = estimate_price(
            db=db, listing_type="sale", city="Tunis",
            property_type="apartment", area_sqm=100,
        )
        assert result["estimate"] > 0
        assert result["fallback"] is True


# ── API Endpoint Tests ─────────────────────────────────────────────────


class TestMLAPI:
    def test_recommendations_endpoint(self, client: TestClient, db: Session):
        create_test_user(db, "client_ml@example.com", UserRole.CLIENT)
        token = get_auth_token(client, "client_ml@example.com", "SecurePass123")

        response = client.get(
            "/api/v1/ml/recommendations",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)

    def test_price_estimation_endpoint(self, client: TestClient, db: Session):
        create_test_user(db, "client_price@example.com", UserRole.CLIENT)
        _, agent = create_test_agent(db, "agent_price@example.com")
        create_test_property(db, agent.id)
        token = get_auth_token(client, "client_price@example.com", "SecurePass123")

        response = client.post(
            "/api/v1/ml/price-estimation",
            json={
                "listing_type": "sale", "city": "Tunis",
                "property_type": "apartment", "area_sqm": 100,
                "bedrooms": 2, "bathrooms": 1,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "estimate" in data
        assert "disclaimer" in data

    def test_models_endpoint_manager(self, client: TestClient, db: Session):
        create_test_user(db, "manager_ml@example.com", UserRole.MANAGER)
        token = get_auth_token(client, "manager_ml@example.com", "SecurePass123")

        response = client.get(
            "/api/v1/ml/models",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["models"]) == 4

    def test_models_endpoint_client_forbidden(self, client: TestClient, db: Session):
        create_test_user(db, "client_forbidden@example.com", UserRole.CLIENT)
        token = get_auth_token(client, "client_forbidden@example.com", "SecurePass123")

        response = client.get(
            "/api/v1/ml/models",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    def test_lead_conversion_endpoint(self, client: TestClient, db: Session):
        client_user = create_test_user(db, "client_lead@example.com", UserRole.CLIENT)
        create_test_agent(db, "agent_lead@example.com")
        req = create_test_search_request(db, client_user.id)
        agent_token = get_auth_token(client, "agent_lead@example.com", "SecurePass123")

        response = client.get(
            f"/api/v1/ml/leads/{req.id}/conversion-prediction",
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversion_probability" in data
        assert "experimental_label" in data

    def test_lead_conversion_not_found(self, client: TestClient, db: Session):
        create_test_agent(db, "agent_nf@example.com")
        agent_token = get_auth_token(client, "agent_nf@example.com", "SecurePass123")

        response = client.get(
            "/api/v1/ml/leads/nonexistent-id/conversion-prediction",
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        assert response.status_code == 404


# ── Interaction Tracking Tests ─────────────────────────────────────────


class TestInteractionTracking:
    def test_track_valid_event(self, db: Session):
        from app.services.interaction_tracking_service import InteractionTrackingService

        client_user = create_test_user(db, "client_track@example.com", UserRole.CLIENT)
        interaction = InteractionTrackingService.track(
            db=db, user_id=client_user.id,
            event_type="property_view",
            commit=True,
        )
        assert interaction is not None
        assert interaction.event_type == "property_view"

    def test_track_invalid_event_type(self, db: Session):
        from app.services.interaction_tracking_service import InteractionTrackingService

        client_user = create_test_user(db, "client_invalid@example.com", UserRole.CLIENT)
        result = InteractionTrackingService.track(
            db=db, user_id=client_user.id,
            event_type="invalid_event_type", commit=True,
        )
        assert result is None

    def test_get_user_interactions(self, db: Session):
        from app.services.interaction_tracking_service import InteractionTrackingService

        client_user = create_test_user(db, "client_get@example.com", UserRole.CLIENT)
        InteractionTrackingService.track(
            db=db, user_id=client_user.id, event_type="property_view", commit=True
        )
        InteractionTrackingService.track(
            db=db, user_id=client_user.id, event_type="favorite_add", commit=True
        )
        interactions = InteractionTrackingService.get_user_interactions(db, client_user.id)
        assert len(interactions) == 2
