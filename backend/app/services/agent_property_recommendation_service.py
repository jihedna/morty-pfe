"""ML-backed property matching and allocation for agent profiles."""

from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.property import Property, PropertyStatus
from ml.inference.agent_property_matcher import recommend_properties


class AgentPropertyRecommendationService:
    """Recommend and allocate catalog listings to an agent."""

    @staticmethod
    def recommend(db: Session, agent: Agent, limit: int = 20) -> list[dict]:
        properties = (
            db.query(Property)
            .filter(Property.status == PropertyStatus.AVAILABLE.value)
            .all()
        )
        property_types = [item.property_type.value if hasattr(item.property_type, "value") else str(item.property_type) for item in agent.property_types]
        territories = [item.territory for item in agent.territories]
        return recommend_properties(
            properties=properties,
            property_types=property_types,
            territories=territories,
            minimum_budget=float(agent.minimum_budget),
            maximum_budget=float(agent.maximum_budget),
            limit=limit,
        )

    @staticmethod
    def assign_recommended(db: Session, agent: Agent, limit: int = 20) -> list[dict]:
        recommendations = AgentPropertyRecommendationService.recommend(db, agent, limit)
        ids = [item["property_id"] for item in recommendations]
        if ids:
            db.query(Property).filter(Property.id.in_(ids)).update(
                {Property.agent_id: agent.id}, synchronize_session=False
            )
        return recommendations
