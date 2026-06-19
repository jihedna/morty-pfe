# RE/MAX Smile AI Backend API

FastAPI-based backend API for the RE/MAX Smile AI platform with authentication, authorization, and user management.

## Prerequisites

- Python 3.12 or higher
- PostgreSQL 14 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Environment Setup

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv

# macOS/Linux
python3 -m venv venv
```

### 2. Activate Virtual Environment

```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your actual configuration:

```env
APP_NAME=REMAX Smile AI API
APP_ENV=development
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/remax_smile_ai

JWT_SECRET_KEY=replace-with-a-secure-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Important**: Never commit the `.env` file or real credentials to version control.

## PostgreSQL Configuration

### 1. Install PostgreSQL

- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: Use Homebrew: `brew install postgresql`
- **Linux**: Use package manager: `sudo apt-get install postgresql`

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE remax_smile_ai;

# Create test database
CREATE DATABASE test_remax_smile_ai;

# Exit
\q
```

### 3. Update DATABASE_URL

Update the `DATABASE_URL` in your `.env` file with your PostgreSQL credentials:

```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/remax_smile_ai
```

## Database Migrations

### 1. Initialize Alembic (if not already initialized)

```bash
alembic init alembic
```

### 2. Configure Alembic

The `alembic.ini` and `alembic/env.py` files are already configured. Ensure the `DATABASE_URL` in your `.env` file is correct.

### 3. Generate Initial Migration

```bash
alembic revision --autogenerate -m "Initial users table"
```

### 4. Apply Migration

```bash
alembic upgrade head
```

### 5. Rollback Migration (if needed)

```bash
alembic downgrade -1
```

### 6. View Migration History

```bash
alembic history
```

## Application Startup

### Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

### API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## Testing

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_auth.py
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
```

### Run with Verbose Output

```bash
pytest -v
```

### Test Database Configuration

Tests use a separate test database. Ensure the test database exists:

```bash
psql -U postgres -c "CREATE DATABASE test_remax_smile_ai;"
```

The test database URL is configured in `tests/conftest.py`.

## Linting

### Run Linter

```bash
ruff check .
```

### Auto-fix Linting Issues

```bash
ruff check --fix .
```

### Format Code

```bash
ruff format .
```

## Available Endpoints

### Health Check

- `GET /health` - Health check endpoint

### Authentication

- `POST /api/v1/auth/register` - Register new user (client role only)
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current authenticated user info

### Users

- `GET /api/v1/users/me` - Get current user profile (any authenticated user)
- `GET /api/v1/users/agent-area` - Agent-only demonstration endpoint
- `GET /api/v1/users/manager-area` - Manager-only demonstration endpoint

## Example Requests

### Register a New User

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Get Current User

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "id": "user-uuid",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "client",
  "is_active": true
}
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── dependencies/
│   │   │   └── __init__.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── users.py
│   │       └── __init__.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── permissions.py
│   ├── database/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   ├── user.py
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── __init__.py
│   ├── services/
│   │   ├── user_service.py
│   │   └── __init__.py
│   ├── main.py
│   └── __init__.py
├── alembic/
│   ├── versions/
│   │   └── 001_initial_users_table.py
│   ├── env.py
│   └── script.py.mako
├── tests/
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_auth.py
│   └── test_authz.py
├── alembic.ini
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

## User Roles

The system supports three user roles:

- **client**: Regular users seeking real estate services
- **agent**: Real estate professionals managing properties and leads
- **manager**: Administrators overseeing platform operations

Public registration automatically assigns the `client` role. Agent and manager roles must be assigned by administrators.

## Security Features

- **Password Hashing**: Uses bcrypt with passlib
- **JWT Authentication**: OAuth2-compatible bearer token authentication
- **Role-Based Access Control**: Reusable dependencies for role-based authorization
- **Input Validation**: Pydantic schemas for request validation
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **Password Strength**: Enforces uppercase, lowercase, and digit requirements

## Error Handling

The API returns consistent JSON error responses:

```json
{
  "detail": "Error message describing the issue"
}
```

Common error codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `422`: Unprocessable Entity (validation errors)
- `500`: Internal Server Error

## Docker Support

### Build Docker Image

```bash
docker build -t remax-smile-ai-backend .
```

### Run Docker Container

```bash
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql+psycopg://postgres:password@db:5432/remax_smile_ai \
  -e JWT_SECRET_KEY=your-secret-key \
  remax-smile-ai-backend
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify the DATABASE_URL in `.env` is correct
- Check that the database exists

### Migration Issues

- Ensure the database exists before running migrations
- Check that Alembic is properly configured
- Verify the DATABASE_URL is set correctly

### Import Errors

- Ensure the virtual environment is activated
- Verify all dependencies are installed
- Check that PYTHONPATH includes the app directory

## Development Notes

- Use type annotations for all functions
- Keep business logic in service layer, not in routes
- Use async/await for database operations where appropriate
- Never expose password_hash in API responses
- Always validate input data before processing
- Use environment variables for sensitive configuration
