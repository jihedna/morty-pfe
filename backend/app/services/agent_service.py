from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import UserRole
from app.models.agent import Agent, AvailabilityStatus
from app.models.agent_property_type import AgentPropertyType, PropertyType
from app.models.agent_territory import AgentTerritory
from app.models.user import User
from app.core.security import get_password_hash
from app.services.agent_property_recommendation_service import AgentPropertyRecommendationService
from app.schemas.agent import (
    AgentAvailabilityUpdate,
    AgentCreate,
    AgentAccountCreate,
    AgentPropertyTypeCreate,
    AgentSelfUpdate,
    AgentTerritoryCreate,
    AgentUpdate,
)


class AgentService:
    """Service for agent-related operations."""

    @staticmethod
    def get_agent_by_id(db: Session, agent_id: str) -> Agent | None:
        """Return an agent by profile ID."""
        return db.query(Agent).filter(Agent.id == agent_id).first()

    @staticmethod
    def get_agent_by_user_id(db: Session, user_id: str) -> Agent | None:
        """Return an agent profile by linked user ID."""
        return db.query(Agent).filter(Agent.user_id == user_id).first()

    @staticmethod
    def get_agents(
        db: Session,
        territory: str | None = None,
        property_type: PropertyType | None = None,
        availability_status: AvailabilityStatus | None = None,
        minimum_experience: int | None = None,
        language: str | None = None,
        minimum_budget: float | None = None,
        maximum_budget: float | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Agent]:
        """Return filtered and paginated agent profiles."""
        query = db.query(Agent)

        if territory:
            query = query.join(AgentTerritory).filter(
                AgentTerritory.territory == territory
            )

        if property_type:
            query = query.join(AgentPropertyType).filter(
                AgentPropertyType.property_type == property_type.value
            )

        if availability_status:
            query = query.filter(
                Agent.availability_status == availability_status.value
            )

        if minimum_experience is not None:
            query = query.filter(
                Agent.years_experience >= minimum_experience
            )

        if language:
            query = query.filter(Agent.languages.ilike(f"%{language}%"))

        if minimum_budget is not None:
            query = query.filter(Agent.minimum_budget >= minimum_budget)

        if maximum_budget is not None:
            query = query.filter(Agent.maximum_budget <= maximum_budget)

        return query.distinct().offset(skip).limit(limit).all()

    @staticmethod
    def create_agent(db: Session, agent_data: AgentCreate) -> Agent:
        """Create an agent profile for an existing agent-role user."""
        user = db.query(User).filter(User.id == agent_data.user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if user.role != UserRole.AGENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must have agent role to create an agent profile",
            )

        if AgentService.get_agent_by_user_id(db, agent_data.user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent profile already exists for this user",
            )

        db_agent = Agent(
            user_id=agent_data.user_id,
            office=agent_data.office,
            phone=agent_data.phone,
            biography=agent_data.biography,
            years_experience=agent_data.years_experience,
            minimum_budget=agent_data.minimum_budget,
            maximum_budget=agent_data.maximum_budget,
            availability_status=agent_data.availability_status,
            active_lead_count=agent_data.active_lead_count,
            success_rate=agent_data.success_rate,
            closed_deals=agent_data.closed_deals,
            languages=agent_data.languages,
        )

        db.add(db_agent)
        db.commit()
        db.refresh(db_agent)
        return db_agent

    @staticmethod
    def create_agent_account(db: Session, data: AgentAccountCreate) -> Agent:
        """Create an agent user and profile atomically."""
        if db.query(User).filter(User.email == str(data.email).lower()).first():
            raise HTTPException(status_code=400, detail="A user with this email already exists")

        user = User(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=str(data.email).lower(),
            password_hash=get_password_hash(data.password),
            role=UserRole.AGENT,
            is_active=True,
        )
        db.add(user)
        db.flush()
        agent = Agent(
            user_id=user.id,
            office=data.office,
            phone=data.phone,
            biography=data.biography,
            years_experience=data.years_experience,
            minimum_budget=data.minimum_budget,
            maximum_budget=data.maximum_budget,
            availability_status=data.availability_status,
            languages=data.languages,
        )
        db.add(agent)
        db.flush()
        for territory in data.territories:
            db.add(AgentTerritory(agent_id=agent.id, territory=territory, expertise_score=1.0))
        for property_type in data.property_types:
            db.add(AgentPropertyType(agent_id=agent.id, property_type=property_type.value, expertise_score=1.0))
        db.flush()
        AgentPropertyRecommendationService.assign_recommended(db, agent, limit=20)
        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def update_agent(
        db: Session,
        agent_id: str,
        agent_data: AgentUpdate,
    ) -> Agent:
        """Update an agent profile as a manager."""
        agent = AgentService.get_agent_by_id(db, agent_id)
        if agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        update_data = agent_data.model_dump(exclude_unset=True)

        new_minimum = update_data.get(
            "minimum_budget",
            agent.minimum_budget,
        )
        new_maximum = update_data.get(
            "maximum_budget",
            agent.maximum_budget,
        )
        if new_maximum < new_minimum:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "maximum_budget must be greater than or equal to "
                    "minimum_budget"
                ),
            )

        for field, value in update_data.items():
            setattr(agent, field, value)

        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def update_agent_profile(
        db: Session,
        agent_id: str,
        agent_data: AgentSelfUpdate,
    ) -> Agent:
        """Update fields an agent is allowed to manage."""
        agent = AgentService.get_agent_by_id(db, agent_id)
        if agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent profile not found",
            )

        update_data = agent_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(agent, field, value)

        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def update_agent_availability(
        db: Session,
        agent_id: str,
        availability_data: AgentAvailabilityUpdate,
    ) -> Agent:
        """Update an agent's availability."""
        agent = AgentService.get_agent_by_id(db, agent_id)
        if agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent profile not found",
            )

        agent.availability_status = availability_data.availability_status
        db.commit()
        db.refresh(agent)
        return agent

    @staticmethod
    def delete_agent(db: Session, agent_id: str) -> None:
        """Delete an agent profile and its login account."""
        agent = AgentService.get_agent_by_id(db, agent_id)
        if agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        user_id = agent.user_id
        from app.models.property import Property

        fallback_agent = db.query(Agent).filter(Agent.id != agent_id).first()
        owned_property_count = db.query(Property).filter(Property.agent_id == agent_id).count()
        if owned_property_count and fallback_agent is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete the only agent while properties are assigned to them",
            )
        if fallback_agent is not None:
            db.query(Property).filter(Property.agent_id == agent_id).update(
                {Property.agent_id: fallback_agent.id}, synchronize_session=False
            )
        # Use a database-level delete so ON DELETE CASCADE removes the agent
        # profile without ORM nulling foreign keys.
        db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
        db.commit()

    @staticmethod
    def add_territory(
        db: Session,
        agent_id: str,
        territory_data: AgentTerritoryCreate,
    ) -> AgentTerritory:
        """Add a territory specialization to an agent."""
        agent = AgentService.get_agent_by_id(db, agent_id)
        if agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        existing = (
            db.query(AgentTerritory)
            .filter(
                AgentTerritory.agent_id == agent_id,
                AgentTerritory.territory == territory_data.territory,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Territory already exists for this agent",
            )

        db_territory = AgentTerritory(
            agent_id=agent_id,
            territory=territory_data.territory,
            expertise_score=territory_data.expertise_score,
        )
        db.add(db_territory)
        db.commit()
        db.refresh(db_territory)
        return db_territory

    @staticmethod
    def remove_territory(
        db: Session,
        agent_id: str,
        territory_id: str,
    ) -> None:
        """Remove a territory belonging to the specified agent."""
        territory = (
            db.query(AgentTerritory)
            .filter(
                AgentTerritory.id == territory_id,
                AgentTerritory.agent_id == agent_id,
            )
            .first()
        )
        if territory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Territory not found",
            )

        db.delete(territory)
        db.commit()

    @staticmethod
    def add_property_type(
        db: Session,
        agent_id: str,
        property_type_data: AgentPropertyTypeCreate,
    ) -> AgentPropertyType:
        """Add a property-type specialization to an agent."""
        agent = AgentService.get_agent_by_id(db, agent_id)
        if agent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        existing = (
            db.query(AgentPropertyType)
            .filter(
                AgentPropertyType.agent_id == agent_id,
                AgentPropertyType.property_type
                == property_type_data.property_type.value,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Property type already exists for this agent",
            )

        db_property_type = AgentPropertyType(
            agent_id=agent_id,
            property_type=property_type_data.property_type,
            expertise_score=property_type_data.expertise_score,
        )
        db.add(db_property_type)
        db.commit()
        db.refresh(db_property_type)
        return db_property_type

    @staticmethod
    def remove_property_type(
        db: Session,
        agent_id: str,
        property_type_id: str,
    ) -> None:
        """Remove a property specialization belonging to an agent."""
        property_type = (
            db.query(AgentPropertyType)
            .filter(
                AgentPropertyType.id == property_type_id,
                AgentPropertyType.agent_id == agent_id,
            )
            .first()
        )
        if property_type is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property type not found",
            )

        db.delete(property_type)
        db.commit()
