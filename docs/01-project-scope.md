# Project Scope

## Product

RE/MAX Smile AI is a role-based real-estate web platform for the Tunisian market. It connects clients, agents, and managers through property discovery, lead matching, communication, operational workflows, analytics, and decision-support tools.

## Implemented scope

- Public landing page, registration, login, property catalogue, and property details
- JWT authentication and role-based access for `client`, `agent`, and `manager`
- Filtered property search, geospatial property/agent maps, favorites, and saved searches
- Client search requests with deterministic lead scores and ranked agent matches
- Client property recommendations, price estimation, and investment scoring
- Conversations, messages, notifications, and property appointments
- Client deal tracking linked to contracts and properties
- Agent profiles, territories, property-type expertise, availability, leads, and listing management
- Manager administration for users, agents, properties, appointments, conversations, contracts, knowledge-base articles, analytics, heat maps, and ML model status
- A knowledge-base-backed assistant with intent detection, citations, suggested actions, and safe fallback responses
- Trainable ML pipelines for property recommendations, sale/rent price estimates, and lead-conversion prediction, each with deterministic fallbacks

## Technical boundary

The system is a React 18/TypeScript single-page application backed by FastAPI, SQLAlchemy, Alembic, and PostgreSQL. Maps use Leaflet and OpenStreetMap tiles. The application does not require Google Maps or an external LLM to provide its current core behavior.

## Out of scope

Native mobile apps, online payments, electronic signatures, government-registry integration, virtual tours, and automated calendar-provider synchronization are not implemented. Production hosting, monitoring, backups, TLS termination, and CI/CD infrastructure are deployment responsibilities rather than repository features.

## Geographic and data scope

The seed data and market tools focus on Tunisian locations and use TND/EUR-aware real-estate data. The repository supports synthetic/demo data where confidential agency data is unavailable.
