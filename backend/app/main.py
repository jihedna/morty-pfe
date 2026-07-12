from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.models import *  # noqa: F401,F403  # Ensure all SQLAlchemy mappers are configured
from app.api.routes import auth, users, agents, agent_leads, properties, client_search_requests, messaging, property_appointments, notifications, favorites, saved_searches, admin_analytics, admin_users, market, knowledge_base, contracts, investment, ai_chat, map_data

app = FastAPI(
    title=settings.APP_NAME,
    description="RE/MAX Smile AI Backend API",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["users"])
app.include_router(agents.router, prefix=f"{settings.API_V1_PREFIX}/agents", tags=["agents"])
app.include_router(agent_leads.router, prefix=f"{settings.API_V1_PREFIX}/agent", tags=["agent-leads"])
app.include_router(properties.router, prefix=f"{settings.API_V1_PREFIX}/properties", tags=["properties"])
app.include_router(client_search_requests.router, prefix=f"{settings.API_V1_PREFIX}/client-requests", tags=["client-requests"])
app.include_router(messaging.router, prefix=f"{settings.API_V1_PREFIX}/conversations", tags=["conversations"])
app.include_router(property_appointments.router, prefix=f"{settings.API_V1_PREFIX}/appointments", tags=["appointments"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_PREFIX}/notifications", tags=["notifications"])
app.include_router(favorites.router, prefix=f"{settings.API_V1_PREFIX}/favorites", tags=["favorites"])
app.include_router(saved_searches.router, prefix=f"{settings.API_V1_PREFIX}/saved-searches", tags=["saved-searches"])
app.include_router(admin_analytics.router, tags=["admin-analytics"])
app.include_router(admin_users.router, prefix=f"{settings.API_V1_PREFIX}/admin/users", tags=["admin-users"])
app.include_router(market.router, prefix=f"{settings.API_V1_PREFIX}/market/areas", tags=["market"])
app.include_router(knowledge_base.router, prefix=f"{settings.API_V1_PREFIX}/knowledge-base", tags=["knowledge-base"])
app.include_router(contracts.router, prefix=f"{settings.API_V1_PREFIX}/admin/contracts", tags=["contracts"])
app.include_router(investment.router, prefix=f"{settings.API_V1_PREFIX}/investment", tags=["investment"])
app.include_router(ai_chat.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["ai"])
app.include_router(map_data.router, prefix=f"{settings.API_V1_PREFIX}/map", tags=["map"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "application": settings.APP_NAME
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "RE/MAX Smile AI API",
        "version": "1.0.0",
        "docs": "/docs"
    }
