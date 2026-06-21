from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, users, agents, properties, client_search_requests, messaging, property_appointments, notifications

app = FastAPI(
    title=settings.APP_NAME,
    description="RE/MAX Smile AI Backend API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["users"])
app.include_router(agents.router, prefix=f"{settings.API_V1_PREFIX}/agents", tags=["agents"])
app.include_router(properties.router, prefix=f"{settings.API_V1_PREFIX}/properties", tags=["properties"])
app.include_router(client_search_requests.router, prefix=f"{settings.API_V1_PREFIX}/client-requests", tags=["client-requests"])
app.include_router(messaging.router, prefix=f"{settings.API_V1_PREFIX}/conversations", tags=["conversations"])
app.include_router(property_appointments.router, prefix=f"{settings.API_V1_PREFIX}/appointments", tags=["appointments"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_PREFIX}/notifications", tags=["notifications"])


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
