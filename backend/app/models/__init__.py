"""SQLAlchemy ORM models for the application.

Importing all models here ensures SQLAlchemy has every mapper configured
before any code starts issuing queries. Always import this module from
the application entry point, not individual models directly.
"""

from app.models.agent import Agent, AvailabilityStatus
from app.models.agent_property_type import AgentPropertyType
from app.models.agent_territory import AgentTerritory
from app.models.client_search_request import ClientSearchRequest
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.notification import Notification
from app.models.property import Currency, ListingType, Property, PropertyStatus
from app.models.property_appointment import PropertyAppointment
from app.models.property_favorite import PropertyFavorite
from app.models.property_feature import PropertyFeature, PropertyFeatureEnum
from app.models.property_image import PropertyImage
from app.models.saved_search import SavedSearch
from app.models.user import User, UserRole
from app.models.market_area import MarketArea, DemandLevel, PriceTrend
from app.models.knowledge_base import KnowledgeBaseArticle, KBCategory
from app.models.contract import Contract, ContractType
from app.models.user_interaction import UserInteraction

__all__ = [
    "Agent",
    "AgentPropertyType",
    "AgentTerritory",
    "AvailabilityStatus",
    "ClientSearchRequest",
    "Conversation",
    "Currency",
    "ListingType",
    "Message",
    "Notification",
    "Property",
    "PropertyAppointment",
    "PropertyFavorite",
    "PropertyFeature",
    "PropertyFeatureEnum",
    "PropertyImage",
    "PropertyStatus",
    "SavedSearch",
    "User",
    "UserRole",
    "MarketArea",
    "DemandLevel",
    "PriceTrend",
    "KnowledgeBaseArticle",
    "KBCategory",
    "Contract",
    "ContractType",
    "UserInteraction",
]
