# Database Schema

PostgreSQL is accessed through SQLAlchemy; Alembic migrations are the source of truth for schema evolution.

| Table | Purpose and principal relationships |
|---|---|
| `users` | Identity, password hash, role, and active state; parent for client/agent activity |
| `agents` | One-to-one agent profile linked to a user; availability, budget, workload, and performance data |
| `agent_territories` | Agent-to-location expertise |
| `agent_property_types` | Agent-to-property-type expertise |
| `properties` | Listing owned by an agent; type, listing status, price, dimensions, address, and coordinates |
| `property_images` | Ordered images belonging to a property |
| `property_features` | Typed property amenities/features |
| `client_search_requests` | Client criteria, urgency, workflow state, lead score, and optional matched property |
| `property_favorites` | Unique client/property favorite relationship |
| `saved_searches` | Named client-owned property filter definitions |
| `user_interactions` | Recommendation signals such as views and favorite activity |
| `conversations` | Client-agent thread, optionally linked to property/context |
| `messages` | Sender, body, and read state within a conversation |
| `property_appointments` | Client/agent/property appointment and status workflow |
| `notifications` | User-owned typed notification with read state and optional link |
| `contracts` | Deal/contract facts, review status, and optional links to a search request/property |
| `market_areas` | Area-level market metrics and map coordinates |
| `knowledge_base_articles` | Manager-maintained assistant source content and active state |

## Integrity rules

Primary keys are UUID-based where defined by the models. Foreign keys connect ownership and workflow records; unique constraints prevent duplicate favorites and duplicate agent expertise entries. Timestamp mixins provide creation/update tracking on operational tables. Enum-like columns constrain roles and workflow states.

Apply every migration from `backend/` with:

```bash
alembic upgrade head
```

Do not infer the live schema solely from this overview; consult `backend/app/models/` and `backend/alembic/versions/` for exact columns, indexes, constraints, and migration history.
