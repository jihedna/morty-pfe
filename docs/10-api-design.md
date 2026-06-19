# API Design

## Overview

The RE/MAX Smile AI platform uses FastAPI to build RESTful APIs. The API follows REST principles with JSON request/response formats, JWT-based authentication, and role-based access control. All endpoints are organized by functional area and include comprehensive error handling, validation, and documentation.

## Base URL

```
Production: https://api.remaxsmileai.com/v1
Development: http://localhost:8000/v1
```

## Authentication

### Authentication Flow

The API uses JWT (JSON Web Tokens) for authentication:

1. **Registration**: User registers with email and password
2. **Email Verification**: User verifies email via token
3. **Login**: User receives access token and refresh token
4. **Token Usage**: Access token included in Authorization header
5. **Token Refresh**: Refresh token used to obtain new access token
6. **Logout**: Tokens are invalidated on the server

### Authorization Header

```
Authorization: Bearer <access_token>
```

### Token Expiration

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Verification Token**: 24 hours
- **Reset Token**: 1 hour

## API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone": "+21612345678",
  "role": "client",
  "license_number": "string (agent only)",
  "agency_name": "string (agent only)",
  "years_experience": 5 (agent only)
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please verify your email.",
  "user_id": "uuid"
}
```

**Error Responses:**
- 400: Invalid input data
- 409: Email already registered

---

#### POST /auth/login

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "jwt_token",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client"
  }
}
```

**Error Responses:**
- 401: Invalid credentials
- 403: Account not verified or locked
- 423: Account locked

---

#### POST /auth/verify-email

Verify user email address.

**Request Body:**
```json
{
  "token": "verification_token"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Error Responses:**
- 400: Invalid or expired token

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "jwt_token"
}
```

**Response (200):**
```json
{
  "access_token": "new_jwt_token",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Error Responses:**
- 401: Invalid or expired refresh token

---

#### POST /auth/forgot-password

Initiate password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent if email exists"
}
```

---

#### POST /auth/reset-password

Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token",
  "new_password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- 400: Invalid or expired token

---

#### POST /auth/logout

Logout user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### User Profile Endpoints

#### GET /users/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "client",
  "profile": {
    "full_name": "John Doe",
    "phone": "+21612345678",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

---

#### PUT /users/me

Update current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "phone": "+21612345678",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "full_name": "John Doe",
    "phone": "+21612345678",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

---

#### PUT /users/me/password

Change user password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- 400: Invalid current password

---

### Agent Profile Endpoints

#### GET /agents/me

Get current agent profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Agent

**Response (200):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "license_number": "TUN-12345",
  "agency_name": "RE/MAX Smile",
  "years_experience": 5,
  "availability": "available",
  "expertise_areas": ["apartments", "luxury"],
  "service_regions": ["Tunis", "La Marsa"],
  "performance_metrics": {
    "conversion_rate": 0.75,
    "avg_response_time_hours": 2.5
  },
  "rating_avg": 4.5,
  "rating_count": 20
}
```

---

#### PUT /agents/me

Update agent profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Agent

**Request Body:**
```json
{
  "availability": "available",
  "expertise_areas": ["apartments", "luxury", "commercial"],
  "service_regions": ["Tunis", "La Marsa", "Carthage"]
}
```

**Response (200):**
```json
{
  "message": "Agent profile updated successfully"
}
```

---

#### GET /agents/{agent_id}

Get public agent profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Client, Manager

**Response (200):**
```json
{
  "id": "uuid",
  "full_name": "Jane Smith",
  "license_number": "TUN-12345",
  "agency_name": "RE/MAX Smile",
  "years_experience": 5,
  "availability": "available",
  "expertise_areas": ["apartments", "luxury"],
  "service_regions": ["Tunis", "La Marsa"],
  "rating_avg": 4.5,
  "rating_count": 20
}
```

---

### Client Requirements Endpoints

#### POST /client-requirements

Submit client property requirements.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Client

**Request Body:**
```json
{
  "property_type": "apartment",
  "min_budget": 150000,
  "max_budget": 300000,
  "locations": ["Tunis", "La Marsa"],
  "min_size_sqm": 80,
  "max_size_sqm": 150,
  "num_rooms": 3,
  "amenities": ["parking", "elevator"],
  "condition": "good",
  "additional_notes": "Near public transport"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "message": "Requirements submitted successfully",
  "recommendations": [
    {
      "agent_id": "uuid",
      "agent_name": "Jane Smith",
      "compatibility_score": 85.5,
      "explanation": "High match based on location expertise and budget experience"
    }
  ]
}
```

---

#### GET /client-requirements

Get client's requirement history.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Client

**Response (200):**
```json
{
  "requirements": [
    {
      "id": "uuid",
      "property_type": "apartment",
      "min_budget": 150000,
      "max_budget": 300000,
      "locations": ["Tunis", "La Marsa"],
      "status": "matched",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### PUT /client-requirements/{req_id}

Update client requirements.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Client

**Request Body:**
```json
{
  "max_budget": 350000
}
```

**Response (200):**
```json
{
  "message": "Requirements updated successfully"
}
```

---

### Agent Recommendation Endpoints

#### GET /recommendations

Get agent recommendations for client requirements.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Client

**Query Parameters:**
- `requirement_id` (optional): UUID of specific requirement

**Response (200):**
```json
{
  "recommendations": [
    {
      "agent_id": "uuid",
      "agent_name": "Jane Smith",
      "agency_name": "RE/MAX Smile",
      "compatibility_score": 85.5,
      "factors": {
        "location_match": 30,
        "budget_match": 25,
        "property_type_match": 20,
        "availability": 10
      },
      "explanation": "Agent specializes in Tunis and La Marsa areas with strong experience in your budget range",
      "availability": "available",
      "rating_avg": 4.5
    }
  ]
}
```

---

### Property Endpoints

#### GET /properties

Search and filter properties.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `location` (optional): City name
- `property_type` (optional): apartment, villa, land, commercial
- `min_price` (optional): Minimum price
- `max_price` (optional): Maximum price
- `min_size` (optional): Minimum size in sqm
- `max_size` (optional): Maximum size in sqm
- `min_rooms` (optional): Minimum number of rooms
- `max_rooms` (optional): Maximum number of rooms
- `amenities` (optional): Comma-separated list
- `condition` (optional): new, good, needs_renovation
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "properties": [
    {
      "id": "uuid",
      "title": "Modern Apartment in Tunis",
      "description": "Beautiful 3-bedroom apartment...",
      "property_type": "apartment",
      "price": 250000,
      "price_per_sqm": 2500,
      "size_sqm": 100,
      "num_rooms": 3,
      "num_bathrooms": 2,
      "address": "123 Avenue Habib Bourguiba, Tunis",
      "city": "Tunis",
      "latitude": 36.8065,
      "longitude": 10.1815,
      "amenities": ["parking", "elevator", "balcony"],
      "condition": "good",
      "listed_by": "uuid",
      "agent_name": "Jane Smith",
      "status": "active",
      "primary_image": "https://example.com/image.jpg",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

#### GET /properties/{property_id}

Get property details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Modern Apartment in Tunis",
  "description": "Beautiful 3-bedroom apartment...",
  "property_type": "apartment",
  "price": 250000,
  "price_per_sqm": 2500,
  "size_sqm": 100,
  "num_rooms": 3,
  "num_bathrooms": 2,
  "address": "123 Avenue Habib Bourguiba, Tunis",
  "city": "Tunis",
  "latitude": 36.8065,
  "longitude": 10.1815,
  "amenities": ["parking", "elevator", "balcony"],
  "condition": "good",
  "year_built": 2015,
  "listed_by": "uuid",
  "agent_name": "Jane Smith",
  "agent_phone": "+21612345678",
  "status": "active",
  "views_count": 125,
  "favorites_count": 15,
  "images": [
    {
      "id": "uuid",
      "image_url": "https://example.com/image1.jpg",
      "is_primary": true
    }
  ],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-16T10:00:00Z"
}
```

---

#### POST /properties

Add new property listing.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Agent, Manager

**Request Body:**
```json
{
  "title": "Modern Apartment in Tunis",
  "description": "Beautiful 3-bedroom apartment...",
  "property_type": "apartment",
  "price": 250000,
  "size_sqm": 100,
  "num_rooms": 3,
  "num_bathrooms": 2,
  "address": "123 Avenue Habib Bourguiba, Tunis",
  "city": "Tunis",
  "latitude": 36.8065,
  "longitude": 10.1815,
  "amenities": ["parking", "elevator", "balcony"],
  "condition": "good",
  "year_built": 2015
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "message": "Property listed successfully"
}
```

---

#### PUT /properties/{property_id}

Update property listing.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Agent (own listings), Manager

**Request Body:**
```json
{
  "price": 260000,
  "status": "active"
}
```

**Response (200):**
```json
{
  "message": "Property updated successfully"
}
```

---

### Favorites Endpoints

#### POST /favorites

Add property to favorites.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Client

**Request Body:**
```json
{
  "property_id": "uuid"
}
```

**Response (201):**
```json
{
  "message": "Property added to favorites"
}
```

**Error Responses:**
- 409: Property already in favorites

---

#### GET /favorites

Get client's favorite properties.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Client

**Response (200):**
```json
{
  "favorites": [
    {
      "id": "uuid",
      "property_id": "uuid",
      "property": {
        "id": "uuid",
        "title": "Modern Apartment in Tunis",
        "price": 250000,
        "city": "Tunis",
        "primary_image": "https://example.com/image.jpg"
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### DELETE /favorites/{property_id}

Remove property from favorites.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Client

**Response (200):**
```json
{
  "message": "Property removed from favorites"
}
```

---

### Lead Management Endpoints

#### GET /leads

Get leads for agent.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Agent (own leads), Manager (all leads)

**Query Parameters:**
- `status` (optional): assigned, contacted, in_progress, converted, lost
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "leads": [
    {
      "id": "uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_phone": "+21612345678",
      "requirements": {
        "property_type": "apartment",
        "min_budget": 150000,
        "max_budget": 300000,
        "locations": ["Tunis", "La Marsa"]
      },
      "compatibility_score": 85.5,
      "status": "assigned",
      "assigned_at": "2024-01-15T10:00:00Z",
      "contacted_at": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

#### GET /leads/{lead_id}

Get lead details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Agent (own leads), Manager

**Response (200):**
```json
{
  "id": "uuid",
  "client": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+21612345678"
  },
  "requirements": {
    "property_type": "apartment",
    "min_budget": 150000,
    "max_budget": 300000,
    "locations": ["Tunis", "La Marsa"],
    "min_size_sqm": 80,
    "max_size_sqm": 150,
    "num_rooms": 3,
    "amenities": ["parking", "elevator"],
    "condition": "good"
  },
  "compatibility_score": 85.5,
  "compatibility_factors": {
    "location_match": 30,
    "budget_match": 25,
    "property_type_match": 20,
    "availability": 10
  },
  "status": "assigned",
  "assigned_at": "2024-01-15T10:00:00Z",
  "contacted_at": null,
  "converted_at": null,
  "notes": [
    {
      "id": "uuid",
      "note": "Client interested in viewing properties next week",
      "created_at": "2024-01-16T10:00:00Z"
    }
  ]
}
```

---

#### PUT /leads/{lead_id}/status

Update lead status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Agent (own leads), Manager

**Request Body:**
```json
{
  "status": "contacted"
}
```

**Response (200):**
```json
{
  "message": "Lead status updated successfully"
}
```

---

#### POST /leads/{lead_id}/notes

Add note to lead.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Agent (own leads), Manager

**Request Body:**
```json
{
  "note": "Client interested in viewing properties next week"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "message": "Note added successfully"
}
```

---

### Chatbot Endpoints

#### POST /chat/sessions

Create new chat session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (201):**
```json
{
  "session_id": "uuid",
  "started_at": "2024-01-15T10:00:00Z"
}
```

---

#### POST /chat/sessions/{session_id}/messages

Send message to chatbot.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "What are the taxes for buying property in Tunisia?"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "role": "assistant",
  "content": "When buying property in Tunisia, you typically need to pay registration fees of approximately 3% of the property value, plus notary fees...",
  "sources": [
    {
      "document_id": "uuid",
      "title": "Tunisian Property Tax Guide",
      "relevance": 0.95
    }
  ],
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

#### GET /chat/sessions

Get user's chat sessions.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "started_at": "2024-01-15T10:00:00Z",
      "ended_at": null,
      "message_count": 5
    }
  ]
}
```

---

#### GET /chat/sessions/{session_id}/messages

Get messages from a session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "What are the taxes for buying property in Tunisia?",
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "When buying property in Tunisia...",
      "sources": [...],
      "created_at": "2024-01-15T10:00:01Z"
    }
  ]
}
```

---

### Knowledge Base Endpoints

#### POST /kb/documents

Upload knowledge-base document.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Request Body:**
```json
{
  "title": "Tunisian Property Tax Guide",
  "content": "Document text content...",
  "category": "legal",
  "tags": ["taxes", "registration", "legal"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "message": "Document uploaded successfully"
}
```

---

#### GET /kb/documents

Get knowledge-base documents.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Query Parameters:**
- `category` (optional): Document category
- `status` (optional): active, archived, draft
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "Tunisian Property Tax Guide",
      "category": "legal",
      "tags": ["taxes", "registration", "legal"],
      "version": 1,
      "status": "active",
      "usage_count": 150,
      "uploaded_by": "Jane Smith",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

---

#### PUT /kb/documents/{document_id}

Update knowledge-base document.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Request Body:**
```json
{
  "title": "Updated Tunisian Property Tax Guide",
  "content": "Updated document content...",
  "status": "active"
}
```

**Response (200):**
```json
{
  "message": "Document updated successfully"
}
```

---

#### DELETE /kb/documents/{document_id}

Delete knowledge-base document.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Response (200):**
```json
{
  "message": "Document deleted successfully"
}
```

---

### Analytics Endpoints

#### GET /analytics/overview

Get analytics overview.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Query Parameters:**
- `start_date` (optional): Start date for analytics period
- `end_date` (optional): End date for analytics period

**Response (200):**
```json
{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "users": {
    "total": 1250,
    "clients": 1000,
    "agents": 200,
    "managers": 50
  },
  "leads": {
    "total": 450,
    "assigned": 300,
    "contacted": 250,
    "converted": 75,
    "conversion_rate": 0.167
  },
  "properties": {
    "total_listings": 500,
    "active": 350,
    "sold": 100,
    "withdrawn": 50
  },
  "chatbot": {
    "total_sessions": 800,
    "total_messages": 3200,
    "avg_messages_per_session": 4.0
  }
}
```

---

#### GET /analytics/agents

Get agent performance analytics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Response (200):**
```json
{
  "agents": [
    {
      "agent_id": "uuid",
      "agent_name": "Jane Smith",
      "total_leads": 25,
      "converted_leads": 10,
      "conversion_rate": 0.4,
      "avg_response_time_hours": 2.5,
      "rating_avg": 4.5
    }
  ]
}
```

---

#### GET /analytics/properties

Get property analytics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Response (200):**
```json
{
  "properties": {
    "total_views": 15000,
    "total_favorites": 2500,
    "avg_views_per_property": 30,
    "most_viewed_cities": [
      {
        "city": "Tunis",
        "views": 5000
      },
      {
        "city": "La Marsa",
        "views": 3500
      }
    ]
  }
}
```

---

### Management Endpoints

#### GET /admin/users

Get all users (admin view).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Query Parameters:**
- `role` (optional): Filter by role
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "client",
      "status": "active",
      "full_name": "John Doe",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "total_pages": 63
  }
}
```

---

#### PUT /admin/users/{user_id}/status

Update user status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Request Body:**
```json
{
  "status": "active"
}
```

**Response (200):**
```json
{
  "message": "User status updated successfully"
}
```

---

#### PUT /admin/users/{user_id}/role

Assign manager role to user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Request Body:**
```json
{
  "role": "manager"
}
```

**Response (200):**
```json
{
  "message": "User role updated successfully"
}
```

---

#### POST /admin/leads/assign

Manually assign lead to agent.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Role Required:** Manager

**Request Body:**
```json
{
  "client_req_id": "uuid",
  "agent_id": "uuid"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "message": "Lead assigned successfully"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST`: Invalid request body or parameters
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., duplicate email)
- `VALIDATION_ERROR`: Input validation failed
- `SERVER_ERROR`: Internal server error
- `SERVICE_UNAVAILABLE`: External service unavailable

## Rate Limiting

- **Anonymous endpoints**: 10 requests per minute
- **Authenticated endpoints**: 100 requests per minute
- **Chatbot endpoints**: 20 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## Pagination

All list endpoints support pagination using `page` and `limit` query parameters. Default page size is 20, maximum is 100.

Pagination metadata is included in responses:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## API Versioning

The API uses URL path versioning (`/v1/`). Breaking changes will result in a new version (`/v2/`). Non-breaking changes may be made to the current version.

## CORS Configuration

CORS is configured to allow requests from:
- `https://remaxsmileai.com` (production)
- `http://localhost:3000` (development)
- `http://localhost:8000` (development)

Allowed methods: GET, POST, PUT, DELETE, OPTIONS
Allowed headers: Authorization, Content-Type
