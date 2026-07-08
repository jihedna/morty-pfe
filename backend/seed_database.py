"""
Seed database with fake data for testing.
Run this script to populate the database with sample users, properties, agents, etc.
"""

import random
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine
from app.core.security import get_password_hash
from app.core.permissions import UserRole
from app.models.user import User
from app.models.agent import Agent, AvailabilityStatus
from app.models.property import Property, ListingType, PropertyStatus, Currency
from app.models.agent_territory import AgentTerritory
from app.models.agent_property_type import AgentPropertyType
from app.models.property_feature import PropertyFeature, PropertyFeatureEnum
from app.models.property_image import PropertyImage
from app.models.client_search_request import ClientSearchRequest
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.property_appointment import PropertyAppointment
from app.models.notification import Notification
from app.models.property_favorite import PropertyFavorite
from app.models.saved_search import SavedSearch


def seed_database():
    """Seed the database with fake data."""
    db = SessionLocal()
    
    try:
        print("Starting database seed...")
        
        # Clear existing data (in reverse order of dependencies)
        print("Clearing existing data...")
        db.query(SavedSearch).delete()
        db.query(PropertyFavorite).delete()
        db.query(Notification).delete()
        db.query(PropertyAppointment).delete()
        db.query(Message).delete()
        db.query(Conversation).delete()
        db.query(ClientSearchRequest).delete()
        db.query(PropertyImage).delete()
        db.query(PropertyFeature).delete()
        db.query(Property).delete()
        db.query(AgentPropertyType).delete()
        db.query(AgentTerritory).delete()
        db.query(Agent).delete()
        db.query(User).delete()
        db.commit()
        
        # Create Users
        print("Creating users...")
        users = []
        
        # Manager user
        manager = User(
            first_name="Manager",
            last_name="User",
            email="manager@remax.tn",
            password_hash=get_password_hash("Manager123"),
            role=UserRole.MANAGER,
            is_active=True
        )
        db.add(manager)
        users.append(manager)
        
        # Agent users
        agent_users = []
        for i in range(1, 3):  # Reduced from 5 to 2
            agent_user = User(
                first_name=f"Agent{i}",
                last_name=f"Smith{i}",
                email=f"agent{i}@remax.tn",
                password_hash=get_password_hash("Agent123"),
                role=UserRole.AGENT,
                is_active=True
            )
            db.add(agent_user)
            db.flush()
            db.commit()
            agent_users.append(agent_user)
            users.append(agent_user)
        
        # Client users
        client_users = []
        for i in range(1, 4):  # Reduced from 10 to 3
            client_user = User(
                first_name=f"Client{i}",
                last_name=f"Johnson{i}",
                email=f"client{i}@gmail.com",
                password_hash=get_password_hash("Client123"),
                role=UserRole.CLIENT,
                is_active=True
            )
            db.add(client_user)
            db.flush()
            db.commit()
            client_users.append(client_user)
            users.append(client_user)
        
        db.flush()  # Get IDs
        
        # Create Agent profiles
        print("Creating agent profiles...")
        agents = []
        cities = ["Tunis", "Sfax", "Sousse", "Bizerte", "Gabès"]
        property_types = ["apartment", "house", "villa", "land"]
        
        for i, agent_user in enumerate(agent_users):
            agent = Agent(
                user_id=agent_user.id,
                office=f"RE/MAX {cities[i % len(cities)]}",
                phone=f"+216 71 000 00{i}",
                biography=f"Experienced real estate agent with {i+2} years of expertise in the {cities[i % len(cities)]} market.",
                years_experience=i + 2,
                minimum_budget=50000.0,
                maximum_budget=500000.0,
                availability_status=AvailabilityStatus.AVAILABLE,
                active_lead_count=random.randint(5, 20),
                success_rate=random.uniform(0.7, 0.95),
                closed_deals=random.randint(10, 50),
                languages="Arabic, French, English"
            )
            db.add(agent)
            agents.append(agent)
        
        db.flush()
        
        # Create Agent territories and property types
        print("Creating agent territories and property types...")
        for agent in agents:
            # Add territories
            for city in random.sample(cities, random.randint(1, 3)):
                territory = AgentTerritory(
                    agent_id=agent.id,
                    territory=city,
                    expertise_score=random.uniform(0.5, 1.0)
                )
                db.add(territory)
            
            # Add property types
            for prop_type in random.sample(property_types, random.randint(2, 4)):
                prop_type_entry = AgentPropertyType(
                    agent_id=agent.id,
                    property_type=prop_type
                )
                db.add(prop_type_entry)
        
        db.flush()
        
        # Create Properties
        print("Creating properties...")
        properties = []
        property_titles = [
            "Modern Apartment in Downtown",
            "Luxury Villa with Pool",
            "Cozy House in Suburbs",
            "Commercial Space",
            "Land for Development",
            "Penthouse with Sea View",
            "Traditional Tunisian House",
            "Studio Apartment",
            "Family Home with Garden",
            "Investment Property"
        ]
        
        for i in range(10):  # Reduced from 20 to 10
            agent = random.choice(agents)
            property = Property(
                reference_code=f"PROP-{i+1:04d}",
                agent_id=agent.id,
                title=random.choice(property_titles),
                description=f"Beautiful {random.choice(['apartment', 'house', 'villa'])} located in {random.choice(cities)}. Features include modern amenities, great location, and excellent investment potential.",
                property_type=random.choice(property_types),
                listing_type=random.choice([ListingType.SALE.value, ListingType.RENT.value]),
                status=random.choice([PropertyStatus.AVAILABLE.value, PropertyStatus.RESERVED.value, PropertyStatus.SOLD.value]),
                price=Decimal(random.uniform(50000, 500000)),
                currency=Currency.TND.value,
                area_sqm=Decimal(random.uniform(50, 500)),
                land_area_sqm=Decimal(random.uniform(100, 1000)) if random.random() > 0.5 else None,
                rooms=random.randint(1, 10),
                bedrooms=random.randint(1, 5),
                bathrooms=random.randint(1, 3),
                floor_number=random.randint(0, 10),
                total_floors=random.randint(1, 15),
                construction_year=random.randint(2000, 2024),
                is_furnished=random.choice([True, False]),
                is_featured=random.random() > 0.7,
                address_line=f"{random.randint(1, 100)} {random.choice(['Avenue', 'Rue', 'Street'])} {random.choice(['Habib Bourguiba', 'Farhat Hached', 'Independence'])}",
                city=random.choice(cities),
                district=random.choice(["Centre", "North", "South", "East", "West"]),
                governorate=random.choice(cities),
                postal_code=random.randint(1000, 9999),
                latitude=Decimal(random.uniform(33.8, 37.0)),
                longitude=Decimal(random.uniform(8.0, 11.0)),
                published_at=datetime.now() - timedelta(days=random.randint(1, 365))
            )
            db.add(property)
            db.flush()
            db.commit()
            properties.append(property)
        
        # Create Property Features
        print("Creating property features...")
        features_enum = list(PropertyFeatureEnum)
        
        for property in properties:
            num_features = random.randint(2, 6)
            for feature in random.sample(features_enum, num_features):
                property_feature = PropertyFeature(
                    property_id=property.id,
                    feature=feature.value
                )
                db.add(property_feature)
                db.flush()
            db.commit()
        
        # Create Property Images
        print("Creating property images...")
        for property in properties:
            num_images = random.randint(1, 5)
            for i in range(num_images):
                property_image = PropertyImage(
                    property_id=property.id,
                    image_url=f"https://example.com/images/{property.id}_{i+1}.jpg",
                    is_primary=(i == 0),
                    position=i
                )
                db.add(property_image)
                db.flush()
            db.commit()
        
        db.flush()
        
        # Create Client Search Requests
        print("Creating client search requests...")
        for client in client_users:
            num_requests = random.randint(1, 3)
            for _ in range(num_requests):
                search_request = ClientSearchRequest(
                    client_id=client.id,
                    property_type=random.choice(property_types),
                    listing_type=random.choice([ListingType.SALE.value, ListingType.RENT.value]),
                    minimum_budget=Decimal(random.uniform(50000, 200000)),
                    maximum_budget=Decimal(random.uniform(200000, 500000)),
                    minimum_area_sqm=Decimal(random.uniform(50, 150)),
                    minimum_bedrooms=random.randint(1, 3),
                    minimum_bathrooms=random.randint(1, 2),
                    preferred_city=random.choice(cities),
                    preferred_district=random.choice(["Centre", "North", "South", "East", "West"]),
                    is_active=random.choice([True, False])
                )
                db.add(search_request)
        
        db.flush()
        
        # Create Conversations
        print("Creating conversations...")
        conversations = []
        for i in range(5):  # Reduced from 15 to 5
            client = random.choice(client_users)
            agent = random.choice(agents)
            property = random.choice(properties) if random.random() > 0.3 else None
            
            conversation = Conversation(
                client_id=client.id,
                agent_id=agent.id,
                property_id=property.id if property else None,
                subject=f"Property inquiry - {random.choice(['Buying', 'Renting', 'Information'])}",
                is_active=random.choice([True, False])
            )
            db.add(conversation)
            db.flush()
            db.commit()
            conversations.append(conversation)
        
        db.flush()
        
        # Create Messages
        print("Creating messages...")
        message_templates = [
            "Hello, I'm interested in this property.",
            "Can you provide more information?",
            "Is this property still available?",
            "What is the asking price?",
            "Can I schedule a viewing?",
            "The property looks great!",
            "I have some questions about the location.",
            "Is the price negotiable?"
        ]
        
        for conversation in conversations:
            num_messages = random.randint(2, 10)
            for i in range(num_messages):
                is_from_client = (i % 2 == 0)
                # Get the user ID directly
                sender_id = conversation.client_id if is_from_client else conversation.agent.user_id
                message = Message(
                    conversation_id=conversation.id,
                    sender_user_id=sender_id,
                    content=random.choice(message_templates),
                    is_deleted=False
                )
                db.add(message)
                db.flush()
            db.commit()
        
        # Create Appointments
        print("Creating appointments...")
        for i in range(3):  # Reduced from 10 to 3
            client = random.choice(client_users)
            agent = random.choice(agents)
            property = random.choice(properties)
            
            appointment = PropertyAppointment(
                client_id=client.id,
                agent_id=agent.id,
                property_id=property.id,
                conversation_id=random.choice(conversations).id if random.random() > 0.5 else None,
                scheduled_start=datetime.now() + timedelta(days=random.randint(1, 30)),
                scheduled_end=datetime.now() + timedelta(days=random.randint(1, 30), hours=1),
                status=random.choice(["pending", "confirmed", "completed", "cancelled"]),
                client_notes="Interested in viewing this property."
            )
            db.add(appointment)
            db.flush()
            db.commit()
        
        db.flush()
        
        # Create Notifications
        print("Creating notifications...")
        notification_types = ["new_message", "appointment_confirmed", "property_match", "price_change"]
        
        for client in client_users:
            num_notifications = random.randint(1, 2)  # Reduced from 1-5 to 1-2
            for _ in range(num_notifications):
                notification = Notification(
                    user_id=client.id,
                    title=random.choice(["New Message", "Appointment Confirmed", "New Property Match", "Price Update"]),
                    message=random.choice([
                        "You have a new message from your agent.",
                        "Your appointment has been confirmed.",
                        "A new property matching your search is available.",
                        "Price has been updated for a property you're following."
                    ]),
                    notification_type=random.choice(notification_types),
                    is_read=random.choice([True, False]),
                    data={"property_id": random.choice(properties).id} if random.random() > 0.5 else None
                )
                db.add(notification)
                db.flush()
                db.commit()
        
        db.flush()
        
        # Create Favorites
        print("Creating favorites...")
        # Skip favorites due to database schema issue (missing updated_at column)
        # for client in client_users:
        #     num_favorites = random.randint(1, 2)  # Reduced from 1-5 to 1-2
        #     for _ in range(num_favorites):
        #         favorite = PropertyFavorite(
        #             user_id=client.id,
        #             property_id=random.choice(properties).id
        #         )
        #         db.add(favorite)
        #         db.flush()
        #         db.commit()
        print("Skipped favorites due to schema issue")
        
        db.flush()
        
        # Create Saved Searches
        print("Creating saved searches...")
        for client in client_users:
            num_saved = random.randint(1, 2)  # Reduced from 1-3 to 1-2
            for _ in range(num_saved):
                saved_search = SavedSearch(
                    user_id=client.id,
                    name=f"Search in {random.choice(cities)}",
                    filters={
                        "property_type": random.choice(property_types),
                        "listing_type": random.choice([ListingType.SALE.value, ListingType.RENT.value]),
                        "min_price": float(random.uniform(50000, 200000)),
                        "max_price": float(random.uniform(200000, 500000)),
                        "city": random.choice(cities)
                    },
                    notifications_enabled=random.choice([True, False])
                )
                db.add(saved_search)
                db.flush()
                db.commit()
        
        db.commit()
        
        print("\n✅ Database seeded successfully!")
        print(f"Created {len(users)} users:")
        print(f"  - 1 manager")
        print(f"  - {len(agent_users)} agents")
        print(f"  - {len(client_users)} clients")
        print(f"Created {len(agents)} agent profiles")
        print(f"Created {len(properties)} properties")
        print(f"Created {len(conversations)} conversations")
        print(f"Created 10 appointments")
        print(f"\nTest credentials:")
        print(f"  Manager: manager@remax.tn / Manager123")
        print(f"  Agent: agent1@remax.tn / Agent123")
        print(f"  Client: client1@gmail.com / Client123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
