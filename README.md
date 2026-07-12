# RE/MAX Smile AI: An Intelligent Real Estate Assistant and Agent Matching Platform

## Project Description

RE/MAX Smile AI is an intelligent web-based platform designed to improve communication between clients and RE/MAX Smile real estate agents. The platform leverages artificial intelligence, recommendation algorithms, geographic information systems, and data analytics to enhance the real estate service experience.

## Main Problem

The current real estate service model faces several challenges:
- Clients experience delays in receiving answers to common real estate questions
- Agent assignment is often manual and inconsistent
- Clients may be matched with agents who lack relevant location expertise or property specialization
- Leads are not distributed fairly among agents
- Historical data is underutilized for decision-making
- Managers lack centralized analytics for performance monitoring
- Clients struggle to compare agents and properties effectively

## Proposed Solution

The platform provides two primary options for clients:
1. **AI Real Estate Assistant**: An intelligent chatbot that answers real estate questions using approved documents with source citations
2. **Agent Matching System**: A recommendation algorithm that matches clients with suitable agents based on requirements, expertise, and availability

Core components include:
- AI chatbot with Retrieval-Augmented Generation
- Weighted rule-based agent recommendation system
- Property search with advanced filtering
- Interactive geographic maps
- Agent profiles with performance metrics
- Client requirement forms
- Agent and manager dashboards
- Basic analytics and reporting

## Target Users

The platform serves three primary user roles:
- **Client**: Individuals seeking real estate information, properties, or agent services
- **RE/MAX Agent**: Licensed real estate professionals managing leads and client relationships
- **Manager/Administrator**: Agency staff overseeing operations and performance

## Implemented Features

### Client Portal
- Registration, login, and JWT-authenticated sessions
- Property search with filters (type, price, area, city)
- Interactive property map (Leaflet)
- Saved searches and favorites
- Search request form (property type, budget, city, urgency)
- **Lead Score badge** on every search request (0–100, color-coded)
- AI-ranked agent matches with compatibility breakdown per request
- Direct messaging with agents
- Appointment booking and tracking
- Push notifications (real-time unread count)
- Investment score calculator (demand, yield, growth, affordability, liquidity)

### Agent Portal
- Property listings management (create, edit, status, images)
- Appointment management with status workflow
- Conversation inbox
- Notifications with unread indicators

### Manager / Admin Portal
- Dashboard with KPI overview (users, agents, properties, appointments, conversations)
- Full analytics suite: client, agent, property, appointment, engagement time-series
- **Contract management** (list, create, edit, delete) with city/type filters and pagination
- **Contract analytics** (totals, by city, by property type, monthly trend)
- User and agent administration
- Market heat map (price/m² and demand by area)
- Lead Scores view via Investment Score page

### AI Assistant
- Intent classification: MARKET\_INFO, PROPERTY\_SEARCH, AGENT\_FINDER, APPOINTMENT, INVESTMENT\_ADVICE, ADD\_PROPERTY, PROPERTY\_STATUS, GENERAL\_FAQ
- Knowledge-base RAG with source citations
- Suggested follow-up actions per response
- Accessible from all authenticated portals via floating button

### Public Landing Page
- Hero section with interactive demo chat preview
- Agent search form (redirects authenticated clients to search-request flow)
- Feature overview grid
- Role-based CTA cards (Client, Agent, Manager)

---

## Agent Matching Algorithm

The matching engine scores each agent against a client search request using four weighted criteria:

| Criterion | Weight | Logic |
|---|---|---|
| Property type | 30 % | Agent `property_types` list contains the requested type |
| Territory | 30 % | Agent `territories` list contains the requested city |
| Budget | 25 % | Client budget overlaps agent `min_budget`–`max_budget` range |
| Availability | 15 % | Agent `is_available` flag is true |

**Score** = sum of matched weights × 100 → integer 0–100.
Results are sorted descending and the top matches are returned.

---

## Lead Scoring

Each client search request is scored 0–100 using a deterministic formula:

| Factor | Max points | Signal |
|---|---|---|
| Budget clarity | 25 | Both `minimum_budget` and `maximum_budget` set |
| Location specificity | 25 | Both `preferred_city` and `preferred_district` set |
| Urgency | 25 | `urgency` field: `high` = 25, `medium` = 15, `low` = 5 |
| Engagement | 25 | Notes provided (+10), active status (+10), recency (+5) |

**Qualification levels**: Hot (≥ 70), Warm (≥ 45), Cold (< 45).

Scores are surfaced inline on the client Search Requests list, on the Agent Matches page header, and are accessible to managers via the admin Lead Scores page.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, React Router v6, Vite |
| Backend | FastAPI, SQLAlchemy ORM, Alembic migrations, Pydantic v2 |
| Database | PostgreSQL |
| Auth | JWT (python-jose), bcrypt password hashing |
| Maps | Leaflet + React-Leaflet |
| AI / RAG | Rule-based intent classifier + knowledge-base document retrieval |
| Testing | pytest (backend), Vitest + React Testing Library (frontend) |

---

## Project Structure

```
remax-smile-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI route modules
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic (analytics, lead scoring, matching…)
│   │   └── main.py              # Application entry point
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # pytest test suites
│   └── seed_database.py         # Demo data seeder
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components (layout, chatbot, shared)
│   │   ├── lib/                 # Typed API client modules
│   │   ├── pages/               # Route-level page components (client/, agent/, admin/)
│   │   ├── router/              # React Router configuration
│   │   ├── types/               # Shared TypeScript types
│   │   └── utils/               # Formatting helpers
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Backend
```bash
cd backend
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
alembic upgrade head
python seed_database.py
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:8000
npm run dev
```

### Demo credentials (after seeding)
| Role | Email | Password |
|---|---|---|
| Manager | manager@remax.tn | Manager123 |
| Agent | agent1@remax.tn | Agent123 |
| Client | client1@gmail.com | Client123 |

### Environment variables

Backend (`backend/.env`):
- `DATABASE_URL` — PostgreSQL connection string, e.g. `postgresql+psycopg2://user:password@localhost:5432/remax_smile_ai`
- `SECRET_KEY` — JWT signing secret (keep secret; must be set from environment in production)
- `OPENAI_API_KEY` — optional; if omitted, the chatbot uses the rule-based fallback
- `ALGORITHM` and `ACCESS_TOKEN_EXPIRE_MINUTES` — JWT settings

Frontend (`frontend/.env`):
- `VITE_API_URL` — backend base URL, e.g. `http://127.0.0.1:8000`
- `VITE_MAPBOX_TOKEN` — optional; Leaflet uses free OpenStreetMap tiles by default

### Migrations
Run Alembic from the `backend` directory:
```bash
alembic upgrade head
```

### Seeding
After migrations, run `python seed_database.py` from the `backend` directory. It creates the demo accounts above and Tunisian sample property data.

### Running tests
```bash
cd backend
pytest -q
ruff check .

cd frontend
npm run typecheck
npm run lint
npm run test -- --run
npm run build
```

### API documentation
When the backend is running, interactive docs are available at:
- Swagger UI: http://127.0.0.1:8000/docs
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json

### Chatbot configuration
The AI assistant uses a rule-based intent classifier and a knowledge-base retrieval system. If `OPENAI_API_KEY` is set, the system can be extended to use a generative LLM; otherwise it returns a safe fallback with suggested actions and a legal disclaimer.

### Map configuration
Interactive maps use Leaflet with OpenStreetMap tiles. Map and market data are read from the same property and market-area tables; no external map API key is required.

### Lead scoring
Each client search request is scored 0–100 using a deterministic, rule-based formula (budget clarity, location specificity, urgency, and engagement). Scores are surfaced to clients, agents, and managers.

### Known limitations
- The chatbot does not require external AI to function; it falls back to rule-based answers when `OPENAI_API_KEY` is not set.
- The frontend is a single-page React application; server-side rendering is not used.
- Public map and market map routes require authentication in the current build.

### Deployment notes
- Run `alembic upgrade head` before first start in any new environment.
- Set `SECRET_KEY` from a secure environment variable; never commit `.env` files.
- Restrict `CORS` origins in `app/core/config.py` for production.
- Serve the `frontend/dist/` folder with a static file server or use a CDN.

