"""
AI assistant service — RE/MAX Smile.

Architecture:
1. Intent detection (rule-based, deterministic)
2. Data retrieval (MarketArea, KnowledgeBaseArticle, Property aggregates)
3. Answer construction (grounded, no hallucination)
4. Optional OpenAI enhancement (only if OPENAI_API_KEY is set)

Security:
- Never exposes private user data to other users
- Never reveals API keys or secrets
- Never invents prices or legal facts
- Clearly labels demo/sample data
"""
from __future__ import annotations

import os
import re
from enum import Enum

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.knowledge_base import KnowledgeBaseArticle, KBCategory
from app.models.market_area import MarketArea
from app.models.property import Property
from app.schemas.ai_chat import ChatResponse, SuggestedAction

_OPENAI_AVAILABLE = False
try:
    import openai  # type: ignore
    if os.environ.get("OPENAI_API_KEY"):
        _OPENAI_AVAILABLE = True
except ImportError:
    pass

LEGAL_DISCLAIMER = (
    "\n\n⚠️ *Legal disclaimer*: This information is provided for general guidance only. "
    "It does not constitute legal advice. Consult a licensed notary, lawyer, or the relevant "
    "authorities before making a decision."
)

DEMO_DISCLAIMER = "\n\n📊 *Demo/indicative data* — Contact a RE/MAX agent for current official information."


class Intent(str, Enum):
    GREETING = "greeting"
    PLATFORM_HELP = "platform_help"
    PROPERTY_SEARCH = "property_search_help"
    AGENT_MATCHING = "agent_matching_help"
    PRICE_PER_SQM = "price_per_sqm"
    AREA_RECOMMENDATION = "area_recommendation"
    BUDGET_RECOMMENDATION = "budget_recommendation"
    INVESTMENT_ADVICE = "investment_advice"
    LEGAL_PROCESS = "legal_process"
    TAXES_FEES = "taxes_and_fees"
    REMAX_SERVICES = "remax_services"
    APPOINTMENT_HELP = "appointment_help"
    MESSAGING_HELP = "messaging_help"
    FAVORITES_HELP = "favorites_help"
    SAVED_SEARCH_HELP = "saved_search_help"
    NOTIFICATION_HELP = "notification_help"
    AGENT_WORKFLOW = "agent_workflow_help"
    ADD_PROPERTY = "add_property_help"
    PROPERTY_STATUS = "property_status_help"
    MANAGER_ANALYTICS = "manager_analytics_help"
    HEAT_MAP = "heat_map_help"
    AGENT_PERFORMANCE = "agent_performance_help"
    MANAGE_USERS = "manage_users_help"
    UNKNOWN = "unknown"


_INTENT_PATTERNS: list[tuple[Intent, list[str]]] = [
    (Intent.PRICE_PER_SQM, ["prix.*m²", "prix.*mètre", "price.*m2", "price.*sqm", "average price", "prix moyen", "prix par m", "coût.*m²", "tarif.*m²", "combien.*m²"]),
    (Intent.TAXES_FEES, ["taxe", "impôt", r"droits d'enregistrement", r"frais.*achat", r"frais.*notaire", "registration fee", "stamp duty", "honoraires"]),
    (Intent.LEGAL_PROCESS, ["buying process", r"how.*to.*buy", r"how.*do.*i.*buy", "buy.*property", r"documents nécessaires", "titre foncier", "what documents", "compromis", "acte de vente", "buying property", r"acheter.*propriété", r"étapes.*achat", "notaire", "notary", "legal.*property", "property.*legal"]),
    (Intent.INVESTMENT_ADVICE, ["investir", "investissement", "rendement", "rentabilité", "rental yield", "good investment", r"invest.*real estate", r"good.*invest"]),
    (Intent.BUDGET_RECOMMENDATION, [r"fit.*budget", r"quartier.*budget", r"neighborhood.*budget", r"which.*area.*budget", r"300\s*000", r"300000", r"afford"]),
    (Intent.AREA_RECOMMENDATION, [r"recommand.*quartier", r"recommend.*area", "meilleur quartier", "best area", "good neighborhood", "where to buy", r"où acheter"]),
    (Intent.AGENT_MATCHING, [r"agent matching", r"matching.*work", r"find.*agent", r"recommend.*agent", "agent compatible", r"trouver.*agent"]),
    (Intent.ADD_PROPERTY, [r"how.*add.*property", r"add.*property", r"add.*listing", r"ajouter.*propriété", r"create.*property", r"create.*listing", r"new.*listing", "upload image", "add feature"]),
    (Intent.PROPERTY_STATUS, [r"update.*status", r"change.*status", r"property.*status", r"mark.*sold", r"mark.*reserved", r"mark.*available", r"how.*update.*property"]),
    (Intent.AGENT_WORKFLOW, [r"update.*listing", r"mettre à jour statut", r"manage.*listing", r"gérer.*annonce", r"how.*manage.*appointment"]),

    (Intent.HEAT_MAP, [r"heat.*map", r"what.*heat.*map", r"heat map.*show", r"carte.*chaleur", r"heatmap"]),
    (Intent.AGENT_PERFORMANCE, [r"compare.*agent", r"agent.*performance", r"performance.*agent", r"agent.*ranking", r"agent.*stats", r"best.*agent", r"which.*agent"]),
    (Intent.MANAGE_USERS, [r"manage.*user", r"manage.*user", r"user.*management", r"gérer.*utilisateur", r"add.*user", r"delete.*user", r"deactivate.*user", r"gestion.*utilisateur"]),
    (Intent.MANAGER_ANALYTICS, ["analytics", "statistique", r"dashboard manager", r"analytics.*dashboard", r"read.*analytics", r"manager.*report"]),

    (Intent.REMAX_SERVICES, [r"what is remax", r"how does.*platform.*work", r"qu'est-ce que remax", r"service.*remax"]),
    (Intent.PROPERTY_SEARCH, ["browse properties", r"search.*property", "listing", r"appartement", "villa", r"terrain", r"browse.*listing"]),
    (Intent.APPOINTMENT_HELP, ["appointment", r"rendez-vous", "viewing", "schedule", r"réserver", "confirm", "reschedule"]),
    (Intent.MESSAGING_HELP, [r"contact.*agent", "send message", r"messagerie", "send a message", r"reply.*client", r"respond.*client", r"message.*client", r"chat.*client", r"how.*reply", r"how.*respond"]),

    (Intent.FAVORITES_HELP, [r"favori", "favorite", "bookmark", r"save.*property", "heart icon", "sauvegarder"]),
    (Intent.SAVED_SEARCH_HELP, ["saved search", r"recherche sauvegardée", r"alert.*property", r"notify.*new", "search alert"]),
    (Intent.NOTIFICATION_HELP, ["notification", "non lu"]),
    (Intent.PLATFORM_HELP, ["help", "aide", r"how to use", r"comment utiliser", "navigate", "guide", r"what can you"]),
    (Intent.GREETING, [r"^bonjour$", r"^salut$", r"^hello$", r"^hi$", r"^hey$", r"^salam$", r"^good morning$", r"^bonsoir$",
                       r"^hello!", r"^hi!", r"^hey!", "bonjour !", "salut !"]),
]

_TUNISIAN_AREAS = [
    "la marsa", "marsa", "lac 1", "lac 2", "lac", "ariana", "soukra",
    "manzah", "menzah", "carthage", "ain zaghouan", "zaghouan",
    "tunis", "tunis centre", "bardo", "ksar said",
    "hammamet", "nabeul", "sousse", "sfax", "monastir", "djerba",
    "sfax", "gabès", "gafsa", "bizerte", "kairouan",
]


def _detect_intent(message: str) -> Intent:
    msg = message.lower()
    for intent, patterns in _INTENT_PATTERNS:
        for pattern in patterns:
            if re.search(pattern, msg):
                return intent
    return Intent.UNKNOWN


def _detect_area(message: str) -> str | None:
    msg = message.lower()
    for area in _TUNISIAN_AREAS:
        if area in msg:
            return area
    return None


def _make_action(label: str, route: str) -> SuggestedAction:
    return SuggestedAction(label=label, route=route)


def _role_actions(role: str | None) -> list[SuggestedAction]:
    if role == "client":
        return [
            _make_action("Browse Properties", "/properties"),
            _make_action("My Matches", "/client/matches"),
            _make_action("Contact an Agent", "/client/search-requests"),
        ]
    if role == "agent":
        return [
            _make_action("My Properties", "/agent/properties"),
            _make_action("My Appointments", "/agent/appointments"),
        ]
    if role == "manager":
        return [
            _make_action("Analytics", "/admin/analytics"),
            _make_action("Manage Agents", "/admin/agents"),
        ]
    return [
        _make_action("Browse Properties", "/properties"),
        _make_action("Login", "/login"),
    ]


def _handle_greeting(role: str | None) -> ChatResponse:
    if role == "client":
        text = (
            "Hello! I'm your RE/MAX Smile assistant. I can help you:\n"
            "• Find and filter properties\n"
            "• Get market price info for Tunisian neighbourhoods\n"
            "• Understand the buying process and legal requirements\n"
            "• Contact and match with agents\n"
            "• Manage favourites, viewings, and saved searches\n\n"
            "What would you like to know?"
        )
        actions = [
            _make_action("Browse Properties", "/properties"),
            _make_action("View my Matches", "/client/matches"),
            _make_action("Investment Score", "/client/investment-score"),
        ]
    elif role == "agent":
        text = (
            "Hello! I'm your RE/MAX Smile assistant. I can help you:\n"
            "• Manage your property listings\n"
            "• Handle client appointments\n"
            "• Reply to client messages\n"
            "• Update your agent profile\n\n"
            "What do you need help with?"
        )
        actions = [
            _make_action("My Properties", "/agent/properties"),
            _make_action("Appointments", "/agent/appointments"),
            _make_action("Messages", "/agent/conversations"),
        ]
    elif role == "manager":
        text = (
            "Hello! I'm your RE/MAX Smile assistant. I can help you:\n"
            "• Read analytics and performance metrics\n"
            "• Manage agents and users\n"
            "• Monitor the market heat map\n"
            "• Review appointments and conversations\n\n"
            "What would you like to explore?"
        )
        actions = [
            _make_action("Analytics Dashboard", "/admin/analytics"),
            _make_action("Manage Agents", "/admin/agents"),
            _make_action("Market Heat Map", "/admin/analytics"),
        ]
    else:
        text = (
            "Hello! I'm the RE/MAX Smile AI assistant. I can help you with:\n"
            "• Browsing properties in Tunisia\n"
            "• Understanding the buying process\n"
            "• Learning about RE/MAX services\n\n"
            "Log in or register to access personalised features."
        )
        actions = [
            _make_action("Browse Properties", "/properties"),
            _make_action("Login", "/login"),
            _make_action("Register", "/register"),
        ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_platform_help(role: str | None) -> ChatResponse:
    if role == "client":
        text = (
            "Here's what you can do as a **client**:\n"
            "• **Browse Properties** → /properties\n"
            "• **Favourites** → /client/favorites\n"
            "• **Search Requests & Agent Matching** → /client/search-requests\n"
            "• **My Matches** → /client/matches\n"
            "• **Appointments** → /client/appointments\n"
            "• **Messages** → /client/conversations\n"
            "• **Saved Searches** → /client/saved-searches\n"
            "• **Notifications** → /client/notifications\n"
            "• **Investment Score** → /client/investment-score\n"
            "• **Property Map** → /map\n"
            "• **Market Heat Map** → /market-map"
        )
        actions = [
            _make_action("Browse Properties", "/properties"),
            _make_action("My Matches", "/client/matches"),
            _make_action("Appointments", "/client/appointments"),
        ]
    elif role == "agent":
        text = (
            "Here's what you can do as an **agent**:\n"
            "• **Dashboard** → /agent/dashboard\n"
            "• **My Profile** → /agent/profile\n"
            "• **My Listings** → /agent/properties\n"
            "• **Messages** → /agent/conversations\n"
            "• **Appointments** → /agent/appointments\n"
            "• **Notifications** → /agent/notifications"
        )
        actions = [
            _make_action("My Listings", "/agent/properties"),
            _make_action("Appointments", "/agent/appointments"),
            _make_action("Messages", "/agent/conversations"),
        ]
    elif role == "manager":
        text = (
            "Here's what you can do as a **manager**:\n"
            "• **Dashboard** → /admin/dashboard\n"
            "• **Analytics** → /admin/analytics\n"
            "• **Agents** → /admin/agents\n"
            "• **Properties** → /admin/properties\n"
            "• **Users** → /admin/users\n"
            "• **Appointments** → /admin/appointments\n"
            "• **Conversations** → /admin/conversations"
        )
        actions = [
            _make_action("Analytics", "/admin/analytics"),
            _make_action("Manage Agents", "/admin/agents"),
            _make_action("Manage Users", "/admin/users"),
        ]
    else:
        text = (
            "RE/MAX Smile AI helps you find properties, match with agents, and navigate the Tunisian real estate market. "
            "Log in to access your personalised dashboard."
        )
        actions = [_make_action("Browse Properties", "/properties"), _make_action("Login", "/login")]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_price_per_sqm(message: str, role: str | None, db: Session) -> ChatResponse:
    area_name = _detect_area(message)
    if area_name:
        msg = message.lower()
        areas = db.query(MarketArea).all()
        match = None
        for a in areas:
            if a.city.lower() in msg or a.district.lower() in msg:
                match = a
                break
        if match and match.average_price_per_sqm:
            price = f"{float(match.average_price_per_sqm):,.0f}"
            rent = f"{float(match.average_rent_per_sqm):,.0f}" if match.average_rent_per_sqm else "N/A"
            yld = f"{float(match.rental_yield):.1f}%" if match.rental_yield else "N/A"
            text = (
                f"📍 **{match.city} — {match.district}**\n"
                f"• Average sale price: **{price} TND/m²**\n"
                f"• Average rent: {rent} TND/m²/month\n"
                f"• Rental yield: {yld}\n"
                f"• Market demand: {match.demand_level}\n"
                f"• Price trend: {match.price_trend}\n"
                f"• Transactions recorded: {match.transaction_count}"
                + DEMO_DISCLAIMER
            )
            actions = [
                _make_action(f"Properties in {match.city}", f"/properties?city={match.city}"),
                _make_action("Investment Score", "/client/investment-score" if role == "client" else "/properties"),
            ]
            return ChatResponse(reply=text, source="market_data", confidence="high", suggested_actions=actions)

        prop_agg = (
            db.query(
                func.avg(Property.price / Property.area_sqm).label("avg_psm"),
                func.count(Property.id).label("cnt"),
            )
            .filter(
                Property.city.ilike(f"%{area_name}%"),
                Property.area_sqm > 0,
                Property.latitude.isnot(None),
            )
            .first()
        )
        if prop_agg and prop_agg.cnt and prop_agg.cnt >= 3:
            price = f"{float(prop_agg.avg_psm):,.0f}"
            text = (
                f"📍 Based on **{prop_agg.cnt} active listings** in this area:\n"
                f"• Estimated average price: **{price} TND/m²**\n\n"
                "Note: This is computed from current listing data and may not reflect final sale prices."
                + DEMO_DISCLAIMER
            )
            actions = [_make_action("Browse listings", f"/properties?city={area_name}")]
            return ChatResponse(reply=text, source="property_aggregate", confidence="medium", suggested_actions=actions)

        text = (
            f"I don't have verified market data for **{area_name}** yet. "
            "You can still browse available listings or contact a RE/MAX Smile agent for current pricing."
        )
        actions = [
            _make_action("Browse Properties", "/properties"),
            _make_action("Contact an Agent", "/client/search-requests" if role == "client" else "/properties"),
        ]
        return ChatResponse(reply=text, source="no_data", confidence="low", suggested_actions=actions)

    text = (
        "I can give you price per m² data for specific Tunisian neighbourhoods. "
        "Try asking: *'What is the average price per m² in La Marsa?'* or *'Price in Lac 2?'*\n\n"
        "Available areas with data: La Marsa, Lac 1, Lac 2, Ariana, Soukra, Manzah, Carthage, Ain Zaghouan, Tunis Centre."
    )
    return ChatResponse(reply=text, source="rule_based", confidence="medium", suggested_actions=[
        _make_action("Browse Properties", "/properties"),
        _make_action("Market Map", "/market-map"),
    ])


def _handle_legal(db: Session) -> ChatResponse:
    articles = (
        db.query(KnowledgeBaseArticle)
        .filter(
            KnowledgeBaseArticle.is_active.is_(True),
            KnowledgeBaseArticle.category == KBCategory.LEGAL.value,
            KnowledgeBaseArticle.language == "en",
        )
        .order_by(KnowledgeBaseArticle.created_at)
        .limit(1)
        .all()
    )
    if articles:
        text = articles[0].content + LEGAL_DISCLAIMER
        return ChatResponse(reply=text, source="knowledge_base", confidence="high", suggested_actions=[
            _make_action("Buying Process", "/properties"),
            _make_action("Contact an Agent", "/client/search-requests"),
        ])
    text = (
        "**Buying process in Tunisia (general steps):**\n"
        "1. Property search and visits\n"
        "2. Preliminary sale agreement (compromis de vente) with a notary\n"
        "3. Verification of the title deed (titre foncier) at the Land Registry\n"
        "4. Payment of registration taxes (~5% for primary residence)\n"
        "5. Final sale deed signed before a notary\n"
        "6. Registration at the Land Conservation office\n\n"
        "Typical timeline: 2–3 months."
        + LEGAL_DISCLAIMER
    )
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=[
        _make_action("Browse Properties", "/properties"),
        _make_action("Contact an Agent", "/client/search-requests"),
    ])


def _handle_taxes(db: Session) -> ChatResponse:
    articles = (
        db.query(KnowledgeBaseArticle)
        .filter(
            KnowledgeBaseArticle.is_active.is_(True),
            KnowledgeBaseArticle.category == KBCategory.TAX.value,
            KnowledgeBaseArticle.language == "en",
        )
        .limit(1)
        .all()
    )
    if articles:
        text = articles[0].content + LEGAL_DISCLAIMER
        return ChatResponse(reply=text, source="knowledge_base", confidence="high", suggested_actions=[
            _make_action("Contact an Agent", "/client/search-requests"),
        ])
    text = (
        "**Estimated acquisition costs in Tunisia:**\n"
        "• Registration tax: ~5% (primary residence) or ~10% (investment)\n"
        "• Notary fees: ~1–1.5% of sale price\n"
        "• VAT on notary fees: 19%\n"
        "• Land conservation fee: ~1%\n"
        "• **Estimated total: 7–13% of the purchase price**\n\n"
        "These rates may change. Always verify with a notary or the Code des droits d'enregistrement."
        + LEGAL_DISCLAIMER
    )
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=[
        _make_action("Buying Process", "/properties"),
        _make_action("Contact an Agent", "/client/search-requests"),
    ])


def _handle_investment(role: str | None, db: Session) -> ChatResponse:
    articles = (
        db.query(KnowledgeBaseArticle)
        .filter(
            KnowledgeBaseArticle.is_active.is_(True),
            KnowledgeBaseArticle.category == KBCategory.INVESTMENT.value,
            KnowledgeBaseArticle.language == "en",
        )
        .limit(1)
        .all()
    )
    if articles:
        text = articles[0].content + DEMO_DISCLAIMER
        actions = [
            _make_action("Investment Score", "/client/investment-score" if role == "client" else "/properties"),
            _make_action("Market Map", "/market-map"),
        ]
        return ChatResponse(reply=text, source="knowledge_base", confidence="high", suggested_actions=actions)

    text = (
        "**Real estate investment in Tunisia — key factors:**\n"
        "• **Rental yield** = (annual rent / purchase price) × 100\n"
        "• Grand Tunis typical yields: 3%–7% depending on zone\n"
        "• High-demand areas: Lac 1, Lac 2, La Marsa, Carthage → lower yield, higher capital gains\n"
        "• Growing areas: Ariana, Soukra, Ain Zaghouan → better yield potential\n\n"
        "Use the **Investment Score** tool for a detailed analysis of any property."
        + DEMO_DISCLAIMER
    )
    actions = [
        _make_action("Investment Score", "/client/investment-score" if role == "client" else "/properties"),
        _make_action("Market Map", "/market-map"),
        _make_action("Browse Properties", "/properties"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="medium", suggested_actions=actions)


def _handle_budget(message: str, role: str | None, db: Session) -> ChatResponse:
    budget_match = re.search(r"(\d[\d\s,\.]*)\s*(tnd|dt|dinar)?", message.lower())
    budget_val = None
    if budget_match:
        raw = re.sub(r"[\s,\.]", "", budget_match.group(1))
        try:
            budget_val = int(raw)
        except ValueError:
            pass

    if budget_val and budget_val > 1000:
        areas = db.query(MarketArea).filter(MarketArea.average_price_per_sqm.isnot(None)).all()
        fits = [a for a in areas if a.average_price_per_sqm and float(a.average_price_per_sqm) * 60 <= budget_val]
        if fits:
            area_list = "\n".join(
                f"• **{a.district}, {a.city}** — {float(a.average_price_per_sqm):,.0f} TND/m² (demand: {a.demand_level})"
                for a in fits[:5]
            )
            text = f"With a budget of **{budget_val:,} TND**, these neighbourhoods may fit (assuming ~60m²):\n\n{area_list}" + DEMO_DISCLAIMER
            return ChatResponse(reply=text, source="market_data", confidence="medium", suggested_actions=[
                _make_action("Browse Properties", "/properties"),
                _make_action("Create Search Request", "/client/search-requests" if role == "client" else "/properties"),
            ])

    text = (
        "To find neighbourhoods that fit your budget, I need a rough budget figure. "
        "Try asking: *'Which areas fit a budget of 300,000 TND?'*\n\n"
        "As a rough guide:\n"
        "• Under 150,000 TND → Outer suburbs, Manouba, Ariana outskirts\n"
        "• 150,000–300,000 TND → Ariana, Soukra, Manzah, Ain Zaghouan\n"
        "• 300,000–600,000 TND → La Marsa, Carthage, Lac 1 & 2\n"
        "• 600,000+ TND → Prime La Marsa, Gammarth, Lac 2 luxury"
        + DEMO_DISCLAIMER
    )
    return ChatResponse(reply=text, source="rule_based", confidence="medium", suggested_actions=[
        _make_action("Browse Properties", "/properties"),
        _make_action("Market Map", "/market-map"),
    ])


def _handle_agent_matching(role: str | None) -> ChatResponse:
    text = (
        "**How RE/MAX Smile agent matching works:**\n"
        "1. Create a **Search Request** describing what you're looking for\n"
        "2. The system scores agents based on:\n"
        "   • Territory match (35%) — does the agent cover your area?\n"
        "   • Property type (25%) — does the agent specialise in your property type?\n"
        "   • Budget range (20%) — is your budget within their typical range?\n"
        "   • Experience (15%) — years in the market\n"
        "   • Availability (5%) — agent's current workload\n"
        "3. View your **Matches** and click **Contact Agent** to start a conversation"
    )
    actions = [
        _make_action("Create Search Request", "/client/search-requests" if role == "client" else "/properties"),
        _make_action("View Matches", "/client/matches" if role == "client" else "/properties"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_remax_services(role: str | None) -> ChatResponse:
    text = (
        "**RE/MAX Smile AI platform services:**\n"
        "• **Property search** — filter by type, city, price, area, features\n"
        "• **AI agent matching** — automatically matched to agents by your criteria\n"
        "• **Viewing requests** — request property visits directly from listings\n"
        "• **Messaging** — chat directly with your matched agent\n"
        "• **Favourites** — save properties you like\n"
        "• **Saved Searches** — get notified when new matching properties appear\n"
        "• **Investment Score** — analyse a property's investment potential\n"
        "• **Market Heat Map** — visualise price and demand by neighbourhood\n"
        "• **Interactive Map** — see all properties geographically on a Tunisia map"
    )
    actions = [
        _make_action("Browse Properties", "/properties"),
        _make_action("Property Map", "/map"),
        _make_action("Market Map", "/market-map"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_add_property() -> ChatResponse:
    text = (
        "**How to add a property:**\n\n"
        "1. Click **Properties** in the left sidebar\n"
        "2. Click the **Add Property** button (top right)\n"
        "3. Fill in the property details:\n"
        "   • Title, description, type (apartment, villa, land…)\n"
        "   • Listing type (Sale or Rent), price, area (m²)\n"
        "   • City, district, address\n"
        "   • Number of bedrooms, bathrooms, and any extra features\n"
        "4. Upload **photos** — drag and drop or click to browse\n"
        "5. Click **Save** to publish the listing\n\n"
        "The property will appear in search results immediately after saving."
    )
    actions = [
        _make_action("My Properties", "/agent/properties"),
        _make_action("Add Property", "/agent/properties/new"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_property_status() -> ChatResponse:
    text = (
        "**How to update a property status:**\n\n"
        "1. Go to **Properties** in the left sidebar\n"
        "2. Find the property you want to update\n"
        "3. Click the **Edit** button (pencil icon) on the property card\n"
        "4. Change the **Status** field:\n"
        "   • **Available** — actively listed and open for viewings\n"
        "   • **Reserved** — under offer, not yet finalised\n"
        "   • **Sold** / **Rented** — transaction completed\n"
        "   • **Archived** — hidden from public search results\n"
        "5. Click **Save** to apply the change\n\n"
        "Tip: Keeping statuses up to date improves your listing quality score."
    )
    actions = [
        _make_action("My Properties", "/agent/properties"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_agent_workflow() -> ChatResponse:
    text = (
        "**Agent workflow on RE/MAX Smile:**\n\n"
        "**Adding a property:**\n"
        "Go to My Properties → Add New Property. Fill in details, upload images, and set features.\n\n"
        "**Updating property status:**\n"
        "In My Properties, click Edit → change status (Available → Reserved → Sold/Rented).\n\n"
        "**Managing appointments:**\n"
        "Go to Appointments. You can Confirm, Reschedule, Complete, or Cancel requests.\n\n"
        "**Replying to clients:**\n"
        "Go to Messages → open a conversation → type and send your reply.\n\n"
        "**Updating your profile:**\n"
        "Go to My Profile to update bio, territories, and property type specialisations."
    )
    actions = [
        _make_action("My Properties", "/agent/properties"),
        _make_action("Appointments", "/agent/appointments"),
        _make_action("Messages", "/agent/conversations"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_manager_analytics() -> ChatResponse:
    text = (
        "**How to read the Analytics Dashboard:**\n\n"
        "Navigate to **Analytics** in the sidebar. You will find:\n\n"
        "• **Properties panel** — breakdown by status (available, reserved, sold), type, and city\n"
        "• **Client engagement** — favourites, saved searches, and active search requests\n"
        "• **Appointments** — total, upcoming, completed, and cancelled rates\n"
        "• **Messaging** — number of active conversations across all agents\n"
        "• **Time series** — filter by date range to see trend lines for key metrics\n\n"
        "Tip: Click any metric card to drill down into the underlying records."
    )
    actions = [
        _make_action("Analytics Dashboard", "/admin/analytics"),
        _make_action("Manage Agents", "/admin/agents"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_heat_map() -> ChatResponse:
    text = (
        "**Market Heat Map:**\n\n"
        "The heat map (under **Heat Map** in the sidebar) visualises real estate market data across Tunisian neighbourhoods:\n\n"
        "• **Bubble size** — proportional to transaction volume in the area\n"
        "• **Bubble colour** — reflects demand level: 🟢 low → 🟡 medium → 🔴 high / very high\n"
        "• **Hover a bubble** — shows the district name, average price per m², demand level, and price trend\n\n"
        "Use the heat map to quickly identify high-demand zones (Lac 1/2, La Marsa) vs emerging affordable areas (Ain Zaghouan, Soukra)."
    )
    actions = [
        _make_action("Market Heat Map", "/market-map"),
        _make_action("Analytics Dashboard", "/admin/analytics"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_agent_performance() -> ChatResponse:
    text = (
        "**Comparing Agent Performance:**\n\n"
        "Go to **Analytics** → the Agent Performance section shows:\n\n"
        "• **Listings per agent** — how many active, reserved, and sold properties each agent manages\n"
        "• **Appointment completion rate** — percentage of viewing requests confirmed and completed\n"
        "• **Client conversations** — number of active messaging threads per agent\n\n"
        "You can also go to **Agents** in the sidebar to view each agent's profile, assigned properties, and activity.\n\n"
        "To take action on an agent (activate/deactivate), go to **Agents** → select the agent → use the action menu."
    )
    actions = [
        _make_action("Analytics Dashboard", "/admin/analytics"),
        _make_action("Manage Agents", "/admin/agents"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_manage_users() -> ChatResponse:
    text = (
        "**Managing Users:**\n\n"
        "Go to **Users** in the sidebar. From there you can:\n\n"
        "• **View all users** — filter by role (client, agent, manager) or status (active/inactive)\n"
        "• **Deactivate a user** — select a user → toggle their active status to prevent login\n"
        "• **Promote a client to agent** — contact your system administrator (role changes require backend access)\n"
        "• **Search users** — use the search bar to find a user by name or email\n\n"
        "For agent-specific management (assigning properties, viewing performance), use the **Agents** section instead."
    )
    actions = [
        _make_action("Manage Users", "/admin/users"),
        _make_action("Manage Agents", "/admin/agents"),
    ]
    return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)


def _handle_unknown(role: str | None) -> ChatResponse:
    hint = {
        "client": "property search, agent matching, favourites, appointments, messages, market prices",
        "agent": "adding listings, managing appointments, messaging clients, updating profile",
        "manager": "analytics, agent performance, users, heat map",
        None: "property search, buying process, market prices, RE/MAX services",
    }.get(role, "property search, buying process, market prices, RE/MAX services")
    text = (
        f"I'm not sure I understood that. I can help you with: **{hint}**.\n\n"
        "Try rephrasing, or ask *'help'* for a full overview of available features."
    )
    return ChatResponse(reply=text, source="fallback", confidence="low", suggested_actions=_role_actions(role))


def _rule_based_response(message: str, role: str | None, db: Session) -> ChatResponse:
    intent = _detect_intent(message)

    if intent == Intent.GREETING:
        return _handle_greeting(role)
    if intent == Intent.PLATFORM_HELP:
        return _handle_platform_help(role)
    if intent == Intent.PRICE_PER_SQM:
        return _handle_price_per_sqm(message, role, db)
    if intent == Intent.LEGAL_PROCESS:
        return _handle_legal(db)
    if intent == Intent.TAXES_FEES:
        return _handle_taxes(db)
    if intent == Intent.INVESTMENT_ADVICE:
        return _handle_investment(role, db)
    if intent == Intent.BUDGET_RECOMMENDATION:
        return _handle_budget(message, role, db)
    if intent == Intent.AREA_RECOMMENDATION:
        return _handle_budget(message, role, db)
    if intent == Intent.AGENT_MATCHING:
        return _handle_agent_matching(role)
    if intent == Intent.REMAX_SERVICES:
        return _handle_remax_services(role)
    if intent == Intent.ADD_PROPERTY:
        return _handle_add_property()
    if intent == Intent.PROPERTY_STATUS:
        return _handle_property_status()
    if intent == Intent.AGENT_WORKFLOW:
        return _handle_agent_workflow()
    if intent == Intent.MANAGER_ANALYTICS:
        return _handle_manager_analytics()
    if intent == Intent.HEAT_MAP:
        return _handle_heat_map()
    if intent == Intent.AGENT_PERFORMANCE:
        return _handle_agent_performance()
    if intent == Intent.MANAGE_USERS:
        return _handle_manage_users()

    if intent == Intent.APPOINTMENT_HELP:
        if role == "agent":
            text = "Go to **Appointments** to confirm, reschedule, complete, or cancel client viewing requests."
            actions = [_make_action("Appointments", "/agent/appointments")]
        elif role == "client":
            text = "Open a property and click **Request Viewing** to schedule a visit. Track your bookings under **Appointments**."
            actions = [_make_action("My Appointments", "/client/appointments")]
        else:
            text = "Appointments let clients request property viewings and agents confirm them."
            actions = [_make_action("Browse Properties", "/properties")]
        return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)

    if intent == Intent.MESSAGING_HELP:
        if role == "client":
            text = "Go to a property detail page → **Contact Agent** to start a conversation. See all your messages under **Messages**."
            actions = [_make_action("My Messages", "/client/conversations"), _make_action("Browse Properties", "/properties")]
        elif role == "agent":
            text = (
                "**How to reply to clients:**\n\n"
                "1. Click **Messages** in the left sidebar\n"
                "2. Select the conversation with the client\n"
                "3. Type your message in the text box and press **Send**\n\n"
                "**Tips:**\n"
                "• Clients can only start a conversation from a property listing page\n"
                "• You will receive a **notification** when a new message arrives\n"
                "• All active conversations are listed under Messages, sorted by most recent"
            )
            actions = [_make_action("Messages", "/agent/conversations"), _make_action("Notifications", "/agent/notifications")]
        else:
            text = "Messaging is available after login. Clients can contact agents directly from property listings."
            actions = [_make_action("Login", "/login")]
        return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)

    if intent == Intent.FAVORITES_HELP:
        text = "Click the **heart icon** on any property card or listing page to save it. View all saved properties under **Favourites**."
        actions = [_make_action("My Favourites", "/client/favorites" if role == "client" else "/properties")]
        return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)

    if intent == Intent.SAVED_SEARCH_HELP:
        text = (
            "**Saved Searches** let you save your current filter criteria and receive alerts when new matching properties are listed. "
            "Go to **Saved Searches** in the sidebar to manage them."
        )
        actions = [_make_action("Saved Searches", "/client/saved-searches" if role == "client" else "/properties")]
        return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)

    if intent == Intent.NOTIFICATION_HELP:
        text = "Go to **Notifications** to see all your alerts. You can mark them as read individually or all at once."
        route = "/client/notifications" if role == "client" else ("/agent/notifications" if role == "agent" else "/")
        return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=[_make_action("Notifications", route)])

    if intent == Intent.PROPERTY_SEARCH:
        text = (
            "Browse all available properties at **/properties**. "
            "Use the filters to narrow by type (apartment, house, villa…), city, price range, bedrooms, and listing type (sale/rent).\n\n"
            "You can also view properties on the **interactive map** to explore by location."
        )
        actions = [
            _make_action("Browse Properties", "/properties"),
            _make_action("Property Map", "/map"),
        ]
        if role == "client":
            actions.append(_make_action("Create Search Request", "/client/search-requests"))
        return ChatResponse(reply=text, source="rule_based", confidence="high", suggested_actions=actions)

    area_name = _detect_area(message)
    if area_name:
        return _handle_price_per_sqm(message, role, db)

    kb_words = [w for w in re.split(r"\s+", message.lower()) if len(w) > 3]
    kb_articles = db.query(KnowledgeBaseArticle).filter(
        KnowledgeBaseArticle.is_active.is_(True),
        KnowledgeBaseArticle.language == "en",
    ).all()
    for article in kb_articles:
        content_lower = article.content.lower()
        title_lower = article.title.lower()
        if any(w in content_lower or w in title_lower for w in kb_words[:6]):
            text = article.content[:900]
            if article.category in (KBCategory.LEGAL.value, KBCategory.TAX.value):
                text += LEGAL_DISCLAIMER
            elif article.category == KBCategory.MARKET.value:
                text += DEMO_DISCLAIMER
            return ChatResponse(reply=text, source="knowledge_base", confidence="medium", suggested_actions=_role_actions(role))

    return _handle_unknown(role)


def _openai_response(message: str, role: str | None, db: Session) -> ChatResponse:
    try:
        rule_resp = _rule_based_response(message, role, db)
        context_parts = [f"Rule-based answer: {rule_resp.reply[:400]}"]

        areas = db.query(MarketArea).limit(10).all()
        if areas:
            context_parts.append("Market data (DEMO):")
            for a in areas:
                p = f"{float(a.average_price_per_sqm):,.0f}" if a.average_price_per_sqm else "N/A"
                context_parts.append(f"  {a.city}/{a.district}: {p} TND/m², demand={a.demand_level}, trend={a.price_trend}")

        client_obj = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        resp = client_obj.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are the AI assistant for RE/MAX Smile, a Tunisian real estate platform. "
                        "Always answer in English, regardless of the language used in the question. "
                        "Answer only using the provided context. Never invent prices or legal facts. "
                        "If data is marked DEMO, state it clearly. "
                        "For legal questions, always add a disclaimer to consult a notary. "
                        "Never reveal passwords, tokens, or private user data. "
                        f"User role: {role or 'public'}.\n\n"
                        "Context:\n" + "\n".join(context_parts)
                    ),
                },
                {"role": "user", "content": message},
            ],
            max_tokens=500,
            temperature=0.2,
        )
        reply = resp.choices[0].message.content or "Response unavailable."
        return ChatResponse(
            reply=reply,
            source="openai",
            confidence="high",
            suggested_actions=rule_resp.suggested_actions,
        )
    except Exception:
        return _rule_based_response(message, role, db)


def get_chat_response(message: str, role: str | None, db: Session) -> ChatResponse:
    if _OPENAI_AVAILABLE:
        return _openai_response(message, role, db)
    return _rule_based_response(message, role, db)
