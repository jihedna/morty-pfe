from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.permissions import UserRole
from app.core.security import get_password_hash
from app.schemas.agent import AgentCreate
from app.schemas.user import UserCreate
from app.services.agent_service import AgentService
from app.services.user_service import UserService


def create_staff(db: Session, email: str, role: UserRole):
    user = UserService.create_user(db, UserCreate(
        first_name="Journey",
        last_name=role.value.title(),
        email=email,
        password_hash=get_password_hash("SecurePass123"),
        role=role,
        is_active=True,
    ))
    if role == UserRole.AGENT:
        agent = AgentService.create_agent(db, AgentCreate(
            user_id=user.id,
            office="RE/MAX Journey",
            phone="+21612345678",
            years_experience=5,
            minimum_budget=100000,
            maximum_budget=500000,
        ))
        return user, agent
    return user, None


def login(client: TestClient, email: str, password: str = "SecurePass123") -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_complete_client_purchase_journey(client: TestClient, db: Session):
    """Exercise registration through approval and secure read-only deal access."""
    _, agent = create_staff(db, "journey-agent@example.com", UserRole.AGENT)
    create_staff(db, "journey-manager@example.com", UserRole.MANAGER)
    agent_token = login(client, "journey-agent@example.com")
    manager_token = login(client, "journey-manager@example.com")

    registration = client.post("/api/v1/auth/register", json={
        "first_name": "Purchase",
        "last_name": "Client",
        "email": "purchase-client@example.com",
        "password": "SecurePass123",
    })
    assert registration.status_code == 201
    client_token = registration.json()["access_token"]

    property_response = client.post("/api/v1/properties", headers=auth(agent_token), json={
        "title": "Journey Test Apartment",
        "description": "A complete transaction test property.",
        "property_type": "apartment",
        "listing_type": "sale",
        "status": "available",
        "price": 250000,
        "currency": "TND",
        "area_sqm": 120,
        "rooms": 3,
        "bedrooms": 2,
        "bathrooms": 1,
        "city": "Tunis",
        "district": "Lac 1",
    })
    assert property_response.status_code == 201
    property_id = property_response.json()["id"]
    assert property_response.json()["agent_id"] == agent.id

    image_response = client.post(
        f"/api/v1/properties/{property_id}/images",
        headers=auth(agent_token),
        json={"image_url": "https://example.com/journey-property.jpg", "alt_text": "Property front", "is_primary": True},
    )
    assert image_response.status_code == 201
    feature_response = client.post(
        f"/api/v1/properties/{property_id}/features",
        headers=auth(agent_token),
        json="parking",
    )
    assert feature_response.status_code == 201

    search_request = client.post(
        f"/api/v1/client-requests/from-property/{property_id}",
        headers=auth(client_token),
        json={},
    )
    assert search_request.status_code == 201
    request_id = search_request.json()["id"]

    leads_response = client.get("/api/v1/agent/leads", headers=auth(agent_token))
    assert leads_response.status_code == 200
    assert request_id in {lead["request_id"] for lead in leads_response.json()["leads"]}

    deal_response = client.post(
        f"/api/v1/agent/leads/{request_id}/deal-agreed",
        headers=auth(agent_token),
        json={"property_id": property_id, "amount": 240000},
    )
    assert deal_response.status_code == 201
    assert deal_response.json()["status"] == "pending"
    contract_id = deal_response.json()["id"]

    approval = client.patch(
        f"/api/v1/admin/contracts/{contract_id}",
        headers=auth(manager_token),
        json={"status": "approved"},
    )
    assert approval.status_code == 200
    assert approval.json()["status"] == "approved"

    public_property = client.get(f"/api/v1/properties/{property_id}")
    assert public_property.status_code == 404

    deals = client.get("/api/v1/client/contracts/me", headers=auth(client_token))
    assert deals.status_code == 200
    assert deals.json()["total"] == 1
    assert deals.json()["contracts"][0]["status"] == "approved"

    deal_property = client.get(
        f"/api/v1/client/contracts/{contract_id}/property",
        headers=auth(client_token),
    )
    assert deal_property.status_code == 200
    assert deal_property.json()["status"] == "sold"
    assert deal_property.json()["images"][0]["alt_text"] == "Property front"
    assert deal_property.json()["features"][0]["feature"] == "parking"

    requests = client.get("/api/v1/client-requests/me", headers=auth(client_token))
    assert requests.status_code == 200
    assert requests.json()[0]["is_active"] is False

    notifications = client.get("/api/v1/notifications/me", headers=auth(client_token))
    assert notifications.status_code == 200
    assert any(item["title"] == "Deal approved" for item in notifications.json()["notifications"])

    other_registration = client.post("/api/v1/auth/register", json={
        "first_name": "Other",
        "last_name": "Client",
        "email": "other-purchase-client@example.com",
        "password": "SecurePass123",
    })
    other_token = other_registration.json()["access_token"]
    forbidden_record = client.get(
        f"/api/v1/client/contracts/{contract_id}/property",
        headers=auth(other_token),
    )
    assert forbidden_record.status_code == 404
