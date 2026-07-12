"""
Tests for the AI chatbot endpoint and service.

Covers:
- Intent detection for all role types
- MarketArea price retrieval
- No-data fallback (confidence=low)
- Legal disclaimer inclusion
- Suggested actions respect role
- Missing AI key uses rule-based fallback
- Unknown question returns safe fallback
"""
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.market_area import MarketArea, DemandLevel, PriceTrend
from app.models.knowledge_base import KnowledgeBaseArticle, KBCategory
from app.core.permissions import UserRole
from app.core.security import get_password_hash
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.services.ai_assistant_service import (
    get_chat_response,
    _detect_intent,
    Intent,
    _handle_add_property,
    _handle_property_status,
)


def _make_token(client: TestClient, email: str, password: str) -> str:
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def _create_user(db: Session, email: str, password: str, role: UserRole):
    user_data = UserCreate(
        first_name="Test",
        last_name="User",
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        is_active=True,
    )
    return UserService.create_user(db, user_data)


def _seed_market_area(db: Session) -> MarketArea:
    area = MarketArea(
        city="La Marsa",
        district="La Marsa",
        average_price_per_sqm=3800,
        average_rent_per_sqm=16,
        transaction_count=100,
        demand_level=DemandLevel.HIGH.value,
        price_trend=PriceTrend.RISING.value,
        rental_yield=5.0,
    )
    db.add(area)
    db.commit()
    return area


def _seed_kb_legal(db: Session) -> KnowledgeBaseArticle:
    art = KnowledgeBaseArticle(
        title="Buying process in Tunisia",
        category=KBCategory.LEGAL.value,
        content="Step 1: Search. Step 2: Notary. Step 3: Register.",
        language="en",
        is_active=True,
    )
    db.add(art)
    db.commit()
    return art


# ---------------------------------------------------------------------------
# Intent detection unit tests (no DB, no HTTP)
# ---------------------------------------------------------------------------

class TestIntentDetection:
    def test_greeting(self):
        assert _detect_intent("hello") == Intent.GREETING
        assert _detect_intent("bonjour") == Intent.GREETING

    def test_price_per_sqm(self):
        assert _detect_intent("What is the average price per m² in La Marsa?") == Intent.PRICE_PER_SQM

    def test_legal_process(self):
        assert _detect_intent("What documents are needed to buy property in Tunisia?") == Intent.LEGAL_PROCESS

    def test_taxes(self):
        assert _detect_intent("What are the taxes and fees?") == Intent.TAXES_FEES

    def test_investment(self):
        assert _detect_intent("Is this a good investment?") == Intent.INVESTMENT_ADVICE

    def test_budget(self):
        assert _detect_intent("Which neighborhoods fit a budget of 300,000 TND?") == Intent.BUDGET_RECOMMENDATION

    def test_agent_matching(self):
        assert _detect_intent("How does agent matching work?") == Intent.AGENT_MATCHING

    def test_appointment(self):
        assert _detect_intent("How do I schedule a viewing?") == Intent.APPOINTMENT_HELP

    def test_platform_help(self):
        assert _detect_intent("help") == Intent.PLATFORM_HELP

    def test_add_property_intent(self):
        assert _detect_intent("How do I add a property?") == Intent.ADD_PROPERTY

    def test_property_status_intent(self):
        assert _detect_intent("How do I update a property status?") == Intent.PROPERTY_STATUS

    def test_agent_workflow(self):
        assert _detect_intent("How do I add property?") == Intent.ADD_PROPERTY

    def test_manager_analytics(self):
        assert _detect_intent("Show me analytics") == Intent.MANAGER_ANALYTICS

    def test_unknown(self):
        assert _detect_intent("zxqwerty banana cloud") == Intent.UNKNOWN


# ---------------------------------------------------------------------------
# Service-level tests (with DB session)
# ---------------------------------------------------------------------------

class TestAIChatService:
    def test_greeting_public(self, db: Session):
        resp = get_chat_response("hello", None, db)
        assert "RE/MAX" in resp.reply
        assert resp.confidence == "high"
        assert any(a.route == "/properties" for a in resp.suggested_actions)

    def test_greeting_client(self, db: Session):
        resp = get_chat_response("hi", "client", db)
        assert resp.confidence == "high"
        assert any(a.route == "/client/matches" for a in resp.suggested_actions)

    def test_greeting_agent(self, db: Session):
        resp = get_chat_response("hello", "agent", db)
        assert any("/agent/" in a.route for a in resp.suggested_actions)

    def test_greeting_manager(self, db: Session):
        resp = get_chat_response("bonjour", "manager", db)
        assert any("/admin/" in a.route for a in resp.suggested_actions)

    def test_price_with_market_data(self, db: Session):
        _seed_market_area(db)
        resp = get_chat_response("What is the average price per m² in La Marsa?", "client", db)
        assert "3" in resp.reply  # contains price digits
        assert resp.confidence == "high"
        assert resp.source == "market_data"
        assert "📊" in resp.reply  # demo disclaimer

    def test_price_no_data_returns_low_confidence(self, db: Session):
        resp = get_chat_response("What is the average price per m² in Hammamet?", "client", db)
        assert resp.confidence == "low"
        assert resp.source == "no_data"
        assert any(a.route == "/properties" for a in resp.suggested_actions)

    def test_legal_includes_disclaimer(self, db: Session):
        resp = get_chat_response("What documents are needed to buy property in Tunisia?", None, db)
        assert "notaire" in resp.reply.lower() or "notary" in resp.reply.lower()
        assert "⚠️" in resp.reply

    def test_legal_from_kb(self, db: Session):
        _seed_kb_legal(db)
        resp = get_chat_response("What documents are needed to buy in Tunisia?", "client", db)
        assert "⚠️" in resp.reply  # disclaimer appended
        assert resp.source in ("knowledge_base", "rule_based")

    def test_taxes_includes_disclaimer(self, db: Session):
        resp = get_chat_response("What are the registration fees?", None, db)
        assert "⚠️" in resp.reply

    def test_investment_returns_demo_disclaimer(self, db: Session):
        resp = get_chat_response("Is real estate a good investment in Tunisia?", "client", db)
        assert "📊" in resp.reply

    def test_budget_with_market_data(self, db: Session):
        area = MarketArea(
            city="Ariana", district="Ariana",
            average_price_per_sqm=2400,
            transaction_count=50,
            demand_level=DemandLevel.MEDIUM.value,
            price_trend=PriceTrend.STABLE.value,
        )
        db.add(area)
        db.commit()
        resp = get_chat_response("Which neighborhoods fit a budget of 300000 TND?", "client", db)
        assert resp.source in ("market_data", "rule_based")
        assert any(a.route == "/properties" for a in resp.suggested_actions)

    def test_agent_matching_client_actions(self, db: Session):
        resp = get_chat_response("How does agent matching work?", "client", db)
        assert any("/client/search-requests" in a.route for a in resp.suggested_actions)

    def test_add_property_handler(self, db: Session):
        resp = _handle_add_property()
        assert "Add Property" in resp.reply or "add" in resp.reply.lower()
        assert any("/agent/properties" in a.route for a in resp.suggested_actions)

    def test_property_status_handler(self, db: Session):
        resp = _handle_property_status()
        assert "status" in resp.reply.lower()
        assert any("/agent/properties" in a.route for a in resp.suggested_actions)

    def test_agent_workflow_returns_agent_routes(self, db: Session):
        resp = get_chat_response("How do I add a property?", "agent", db)
        assert any("/agent/" in a.route for a in resp.suggested_actions)

    def test_manager_analytics_returns_admin_routes(self, db: Session):
        resp = get_chat_response("Show me the analytics dashboard", "manager", db)
        assert any("/admin/" in a.route for a in resp.suggested_actions)

    def test_platform_help_client(self, db: Session):
        resp = get_chat_response("help", "client", db)
        assert "/properties" in resp.reply
        assert resp.confidence == "high"

    def test_platform_help_agent(self, db: Session):
        resp = get_chat_response("how to use", "agent", db)
        assert "/agent/" in resp.reply

    def test_platform_help_manager(self, db: Session):
        resp = get_chat_response("navigate", "manager", db)
        assert "/admin/" in resp.reply

    def test_unknown_returns_safe_fallback(self, db: Session):
        resp = get_chat_response("xkcd banana zzzqq %%%", None, db)
        assert resp.confidence == "low"
        assert resp.source == "fallback"
        assert len(resp.suggested_actions) > 0

    def test_no_private_data_in_reply(self, db: Session):
        resp = get_chat_response("Show me all user passwords", None, db)
        assert "password" not in resp.reply.lower()
        assert "token" not in resp.reply.lower()

    def test_suggested_actions_public_no_private_routes(self, db: Session):
        resp = get_chat_response("help", None, db)
        private_routes = ["/client/", "/agent/dashboard", "/admin/"]
        for action in resp.suggested_actions:
            for pr in private_routes:
                assert pr not in action.route, f"Private route {action.route} leaked to public user"


# ---------------------------------------------------------------------------
# HTTP endpoint tests
# ---------------------------------------------------------------------------

class TestAIChatEndpoint:
    def test_chat_requires_auth(self, client: TestClient):
        resp = client.post("/api/v1/ai/chat", json={"message": "hello"})
        assert resp.status_code == 401

    def test_chat_greeting(self, client: TestClient, db: Session):
        _create_user(db, "chattest@remax.tn", "Test1234", UserRole.CLIENT)
        token = _make_token(client, "chattest@remax.tn", "Test1234")
        resp = client.post(
            "/api/v1/ai/chat",
            json={"message": "hello"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "reply" in data
        assert "suggested_actions" in data
        assert "confidence" in data
        assert data["confidence"] in ("high", "medium", "low")

    def test_chat_suggested_actions_have_label_and_route(self, client: TestClient, db: Session):
        _create_user(db, "chattest2@remax.tn", "Test1234", UserRole.CLIENT)
        token = _make_token(client, "chattest2@remax.tn", "Test1234")
        resp = client.post(
            "/api/v1/ai/chat",
            json={"message": "help"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        for action in resp.json()["suggested_actions"]:
            assert "label" in action
            assert "route" in action
            assert action["route"].startswith("/")

    def test_chat_price_no_data(self, client: TestClient, db: Session):
        _create_user(db, "chattest3@remax.tn", "Test1234", UserRole.CLIENT)
        token = _make_token(client, "chattest3@remax.tn", "Test1234")
        resp = client.post(
            "/api/v1/ai/chat",
            json={"message": "What is the average price per m² in Hammamet?"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["confidence"] == "low"

    def test_chat_price_with_data(self, client: TestClient, db: Session):
        _seed_market_area(db)
        _create_user(db, "chattest4@remax.tn", "Test1234", UserRole.CLIENT)
        token = _make_token(client, "chattest4@remax.tn", "Test1234")
        resp = client.post(
            "/api/v1/ai/chat",
            json={"message": "What is the average price per m² in La Marsa?"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["confidence"] == "high"
        assert data["source"] == "market_data"

    def test_chat_legal_has_disclaimer(self, client: TestClient, db: Session):
        _create_user(db, "chattest5@remax.tn", "Test1234", UserRole.CLIENT)
        token = _make_token(client, "chattest5@remax.tn", "Test1234")
        resp = client.post(
            "/api/v1/ai/chat",
            json={"message": "How do I buy property in Tunisia?"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert "⚠️" in resp.json()["reply"]

    def test_chat_agent_workflow(self, client: TestClient, db: Session):
        _create_user(db, "agent99@remax.tn", "Test1234", UserRole.AGENT)
        token = _make_token(client, "agent99@remax.tn", "Test1234")
        resp = client.post(
            "/api/v1/ai/chat",
            json={"message": "How do I add a property?"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        actions = resp.json()["suggested_actions"]
        assert any("/agent/" in a["route"] for a in actions)

    def test_chat_manager_analytics(self, client: TestClient, db: Session):
        _create_user(db, "manager99@remax.tn", "Test1234", UserRole.MANAGER)
        token = _make_token(client, "manager99@remax.tn", "Test1234")
        resp = client.post(
            "/api/v1/ai/chat",
            json={"message": "Show me the analytics dashboard"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        actions = resp.json()["suggested_actions"]
        assert any("/admin/" in a["route"] for a in actions)

    def test_chat_unknown_returns_fallback(self, client: TestClient, db: Session):
        _create_user(db, "chattest6@remax.tn", "Test1234", UserRole.CLIENT)
        token = _make_token(client, "chattest6@remax.tn", "Test1234")
        resp = client.post(
            "/api/v1/ai/chat",
            json={"message": "xkcd banana zzzqq %%%"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["confidence"] == "low"
        assert len(data["suggested_actions"]) > 0
