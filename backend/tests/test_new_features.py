"""
Tests for new features:
- Market areas
- Knowledge base
- Investment score
- Lead score
- AI chat fallback
- Heat map
- Map data
- Contracts (manager-only)
"""
import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.agent import Agent, AvailabilityStatus
from app.models.knowledge_base import KnowledgeBaseArticle
from app.models.market_area import MarketArea
from app.models.user import User, UserRole
from app.models.client_search_request import ClientSearchRequest
from app.core.security import get_password_hash
from app.schemas.user import UserCreate
from app.services.user_service import UserService


def _make_user(db: Session, role: str = "client", suffix: str = "") -> User:
    email = f"{role}{suffix}@test.com"
    role_enum = {"client": UserRole.CLIENT, "agent": UserRole.AGENT, "manager": UserRole.MANAGER}[role]
    user_data = UserCreate(
        first_name=f"{role.capitalize()}{suffix}",
        last_name="Test",
        email=email,
        password_hash=get_password_hash("Password123"),
        role=role_enum,
        is_active=True,
    )
    return UserService.create_user(db, user_data)


def _make_agent(db: Session, user: User) -> Agent:
    a = Agent(
        id=str(uuid.uuid4()),
        user_id=user.id,
        office="Test Office",
        phone="+21600000000",
        availability_status=AvailabilityStatus.AVAILABLE,
        years_experience=5,
        minimum_budget=100000,
        maximum_budget=500000,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def _make_market_area(db: Session, city: str = "Tunis", district: str = "Lac 1") -> MarketArea:
    area = MarketArea(
        id=str(uuid.uuid4()),
        city=city,
        district=district,
        average_price_per_sqm=4200,
        average_rent_per_sqm=18,
        transaction_count=50,
        demand_level="high",
        price_trend="rising",
        rental_yield=5.1,
        latitude=36.8330,
        longitude=10.2290,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return area


def _make_kb_article(db: Session) -> KnowledgeBaseArticle:
    art = KnowledgeBaseArticle(
        id=str(uuid.uuid4()),
        title="Test Article",
        category="legal",
        content="This is a test article about legal procedures.",
        language="fr",
        is_active=True,
    )
    db.add(art)
    db.commit()
    db.refresh(art)
    return art


def _login(client: TestClient, email: str, password: str = "Password123") -> str:
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── Market Areas ──────────────────────────────────────────────────────────────

class TestMarketAreas:
    def test_list_market_areas_requires_auth(self, client: TestClient):
        r = client.get("/api/v1/market/areas")
        assert r.status_code == 401

    def test_list_market_areas_client(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "1")
        _make_market_area(db)
        token = _login(client, user.email)
        r = client.get("/api/v1/market/areas", headers=_auth(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_get_single_area(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "2")
        area = _make_market_area(db)
        token = _login(client, user.email)
        r = client.get(f"/api/v1/market/areas/{area.id}", headers=_auth(token))
        assert r.status_code == 200
        assert r.json()["district"] == "Lac 1"

    def test_get_area_not_found(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "3")
        token = _login(client, user.email)
        r = client.get("/api/v1/market/areas/nonexistent", headers=_auth(token))
        assert r.status_code == 404

    def test_create_area_requires_manager(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "4")
        token = _login(client, user.email)
        r = client.post("/api/v1/market/areas", headers=_auth(token), json={
            "city": "Test", "district": "Test District"
        })
        assert r.status_code == 403

    def test_create_area_as_manager(self, client: TestClient, db: Session):
        mgr = _make_user(db, "manager", "5")
        token = _login(client, mgr.email)
        r = client.post("/api/v1/market/areas", headers=_auth(token), json={
            "city": "Ariana", "district": "Soukra",
            "average_price_per_sqm": 2200, "demand_level": "high", "price_trend": "stable"
        })
        assert r.status_code == 201
        assert r.json()["district"] == "Soukra"

    def test_heat_map_endpoint(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "6")
        _make_market_area(db)
        token = _login(client, user.email)
        r = client.get("/api/v1/market/areas/heat-map", headers=_auth(token))
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert "normalized_price" in data[0]
        assert "normalized_demand" in data[0]

    def test_price_per_sqm_endpoint(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "7")
        _make_market_area(db)
        token = _login(client, user.email)
        r = client.get("/api/v1/market/areas/price-per-sqm", headers=_auth(token))
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert "average_price_per_sqm" in data[0]

    def test_update_area_as_manager(self, client: TestClient, db: Session):
        mgr = _make_user(db, "manager", "8")
        area = _make_market_area(db)
        token = _login(client, mgr.email)
        r = client.patch(f"/api/v1/market/areas/{area.id}", headers=_auth(token), json={
            "demand_level": "very_high"
        })
        assert r.status_code == 200
        assert r.json()["demand_level"] == "very_high"


# ─── Knowledge Base ─────────────────────────────────────────────────────────────

class TestKnowledgeBase:
    def test_list_articles_requires_auth(self, client: TestClient):
        r = client.get("/api/v1/knowledge-base")
        assert r.status_code == 401

    def test_list_articles_as_client(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "9")
        _make_kb_article(db)
        token = _login(client, user.email)
        r = client.get("/api/v1/knowledge-base", headers=_auth(token))
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_get_article(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "10")
        art = _make_kb_article(db)
        token = _login(client, user.email)
        r = client.get(f"/api/v1/knowledge-base/{art.id}", headers=_auth(token))
        assert r.status_code == 200
        assert r.json()["category"] == "legal"

    def test_create_article_manager_only(self, client: TestClient, db: Session):
        client_user = _make_user(db, "client", "11")
        token = _login(client, client_user.email)
        r = client.post("/api/v1/knowledge-base", headers=_auth(token), json={
            "title": "Test", "category": "legal", "content": "Content here"
        })
        assert r.status_code == 403

    def test_create_article_as_manager(self, client: TestClient, db: Session):
        mgr = _make_user(db, "manager", "12")
        token = _login(client, mgr.email)
        r = client.post("/api/v1/knowledge-base", headers=_auth(token), json={
            "title": "Legal Guide", "category": "legal", "content": "Full legal content..."
        })
        assert r.status_code == 201
        assert r.json()["title"] == "Legal Guide"

    def test_filter_by_category(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "13")
        _make_kb_article(db)
        token = _login(client, user.email)
        r = client.get("/api/v1/knowledge-base?category=legal", headers=_auth(token))
        assert r.status_code == 200
        for art in r.json():
            assert art["category"] == "legal"


# ─── Investment Score ─────────────────────────────────────────────────────────

class TestInvestmentScore:
    def test_requires_auth(self, client: TestClient):
        r = client.post("/api/v1/investment/score", json={
            "city": "Tunis", "budget": 300000, "property_type": "apartment"
        })
        assert r.status_code == 401

    def test_score_with_known_area(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "14")
        _make_market_area(db, city="Tunis", district="Lac 1")
        token = _login(client, user.email)
        r = client.post("/api/v1/investment/score", headers=_auth(token), json={
            "city": "Tunis", "district": "Lac 1", "budget": 300000,
            "property_type": "apartment", "listing_type": "sale"
        })
        assert r.status_code == 200
        data = r.json()
        assert "investment_score" in data
        assert 0 <= data["investment_score"] <= 100
        assert "demand_score" in data
        assert "risks" in data
        assert isinstance(data["risks"], list)
        assert "recommendation" in data
        assert "data_note" in data

    def test_score_with_unknown_area(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "15")
        token = _login(client, user.email)
        r = client.post("/api/v1/investment/score", headers=_auth(token), json={
            "city": "Unknown City", "budget": 200000, "property_type": "land"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["investment_score"] == 40.0
        assert "No market data" in data["data_note"]

    def test_all_score_components_present(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "16")
        _make_market_area(db)
        token = _login(client, user.email)
        r = client.post("/api/v1/investment/score", headers=_auth(token), json={
            "city": "Tunis", "budget": 500000, "property_type": "villa",
            "investment_goal": "rental_income"
        })
        data = r.json()
        for key in ["investment_score", "demand_score", "affordability_score",
                    "rental_yield_score", "growth_score", "liquidity_score"]:
            assert key in data


# ─── Lead Score ───────────────────────────────────────────────────────────────

class TestLeadScore:
    def _make_request(self, db: Session, client_user: User, city: str = "Tunis") -> ClientSearchRequest:
        req = ClientSearchRequest(
            id=str(uuid.uuid4()),
            client_id=client_user.id,
            property_type="apartment",
            listing_type="sale",
            minimum_budget=200000,
            maximum_budget=400000,
            preferred_city=city,
            is_active=True,
        )
        db.add(req)
        db.commit()
        db.refresh(req)
        return req

    def test_lead_score_as_client(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "17")
        req = self._make_request(db, user)
        token = _login(client, user.email)
        r = client.get(f"/api/v1/client-requests/{req.id}/lead-score", headers=_auth(token))
        assert r.status_code == 200
        data = r.json()
        assert "lead_score" in data
        assert "qualification_level" in data
        assert data["qualification_level"] in ("cold", "warm", "hot")
        assert "lead_score_reasons" in data
        assert isinstance(data["lead_score_reasons"], list)

    def test_lead_score_hot_lead(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "18")
        req = ClientSearchRequest(
            id=str(uuid.uuid4()),
            client_id=user.id,
            property_type="apartment",
            listing_type="sale",
            minimum_budget=200000,
            maximum_budget=400000,
            preferred_city="Tunis",
            preferred_district="Lac 1",
            minimum_bedrooms=2,
            notes="Looking for investment",
            is_active=True,
        )
        db.add(req)
        db.commit()
        token = _login(client, user.email)
        r = client.get(f"/api/v1/client-requests/{req.id}/lead-score", headers=_auth(token))
        assert r.status_code == 200
        assert r.json()["lead_score"] >= 70
        assert r.json()["qualification_level"] == "hot"

    def test_lead_score_manager_can_access(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "19")
        mgr = _make_user(db, "manager", "20")
        req = self._make_request(db, user)
        token = _login(client, mgr.email)
        r = client.get(f"/api/v1/client-requests/{req.id}/lead-score", headers=_auth(token))
        assert r.status_code == 200

    def test_lead_score_cannot_access_others(self, client: TestClient, db: Session):
        user1 = _make_user(db, "client", "21")
        user2 = _make_user(db, "client", "22")
        req = self._make_request(db, user1)
        token = _login(client, user2.email)
        r = client.get(f"/api/v1/client-requests/{req.id}/lead-score", headers=_auth(token))
        assert r.status_code == 403


# ─── AI Chat ─────────────────────────────────────────────────────────────────

class TestAiChat:
    def test_chat_requires_auth(self, client: TestClient):
        r = client.post("/api/v1/ai/chat", json={"message": "bonjour"})
        assert r.status_code == 401

    def test_chat_returns_response(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "23")
        token = _login(client, user.email)
        r = client.post("/api/v1/ai/chat", headers=_auth(token), json={"message": "bonjour"})
        assert r.status_code == 200
        data = r.json()
        assert "reply" in data
        assert len(data["reply"]) > 10
        assert data["source"] in ("rule_based", "openai", "market_data", "knowledge_base", "fallback")

    def test_chat_with_market_question(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "24")
        _make_market_area(db, city="Tunis", district="Lac 1")
        token = _login(client, user.email)
        r = client.post("/api/v1/ai/chat", headers=_auth(token), json={"message": "prix lac 1"})
        assert r.status_code == 200
        assert "reply" in r.json()

    def test_chat_fallback_unknown(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "25")
        token = _login(client, user.email)
        r = client.post("/api/v1/ai/chat", headers=_auth(token), json={
            "message": "zxqwerty9182736 unrecognised gibberish"
        })
        assert r.status_code == 200
        assert r.json()["source"] in ("fallback", "rule_based")

    def test_chat_empty_message_rejected(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "26")
        token = _login(client, user.email)
        r = client.post("/api/v1/ai/chat", headers=_auth(token), json={"message": ""})
        assert r.status_code == 422


# ─── Contracts ────────────────────────────────────────────────────────────────

class TestContracts:
    def test_list_contracts_requires_manager(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "27")
        token = _login(client, user.email)
        r = client.get("/api/v1/admin/contracts", headers=_auth(token))
        assert r.status_code == 403

    def test_list_contracts_empty(self, client: TestClient, db: Session):
        mgr = _make_user(db, "manager", "28")
        token = _login(client, mgr.email)
        r = client.get("/api/v1/admin/contracts", headers=_auth(token))
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 0
        assert data["contracts"] == []

    def test_create_contract(self, client: TestClient, db: Session):
        mgr = _make_user(db, "manager", "29")
        agent_user = _make_user(db, "agent", "30")
        agent = _make_agent(db, agent_user)
        token = _login(client, mgr.email)
        r = client.post("/api/v1/admin/contracts", headers=_auth(token), json={
            "agent_id": agent.id,
            "sale_date": "2025-06-01T12:00:00Z",
            "amount": 350000,
            "city": "Tunis",
            "district": "Lac 1",
            "property_type": "apartment",
            "area_sqm": 120,
            "contract_type": "sale",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["city"] == "Tunis"
        assert data["contract_type"] == "sale"

    def test_update_contract(self, client: TestClient, db: Session):
        mgr = _make_user(db, "manager", "31")
        agent_user = _make_user(db, "agent", "32")
        agent = _make_agent(db, agent_user)
        token = _login(client, mgr.email)
        create_r = client.post("/api/v1/admin/contracts", headers=_auth(token), json={
            "agent_id": agent.id,
            "sale_date": "2025-06-01T12:00:00Z",
            "amount": 350000,
            "city": "Tunis",
            "property_type": "apartment",
            "contract_type": "sale",
        })
        contract_id = create_r.json()["id"]
        r = client.patch(f"/api/v1/admin/contracts/{contract_id}", headers=_auth(token), json={
            "city": "La Marsa"
        })
        assert r.status_code == 200
        assert r.json()["city"] == "La Marsa"

    def test_delete_contract(self, client: TestClient, db: Session):
        mgr = _make_user(db, "manager", "33")
        agent_user = _make_user(db, "agent", "34")
        agent = _make_agent(db, agent_user)
        token = _login(client, mgr.email)
        create_r = client.post("/api/v1/admin/contracts", headers=_auth(token), json={
            "agent_id": agent.id,
            "sale_date": "2025-06-01T12:00:00Z",
            "amount": 200000,
            "city": "Ariana",
            "property_type": "land",
            "contract_type": "sale",
        })
        contract_id = create_r.json()["id"]
        r = client.delete(f"/api/v1/admin/contracts/{contract_id}", headers=_auth(token))
        assert r.status_code == 204
        r2 = client.get("/api/v1/admin/contracts", headers=_auth(token))
        assert r2.json()["total"] == 0


# ─── Map Data ─────────────────────────────────────────────────────────────────

class TestMapData:
    def test_map_properties_requires_auth(self, client: TestClient):
        r = client.get("/api/v1/map/properties")
        assert r.status_code == 401

    def test_map_properties_returns_list(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "35")
        token = _login(client, user.email)
        r = client.get("/api/v1/map/properties", headers=_auth(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_map_agents_returns_list(self, client: TestClient, db: Session):
        user = _make_user(db, "client", "36")
        token = _login(client, user.email)
        r = client.get("/api/v1/map/agents", headers=_auth(token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
