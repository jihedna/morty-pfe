# API Design

The FastAPI application exposes JSON under `/api/v1`, plus `/health`, `/`, Swagger UI at `/docs`, and OpenAPI at `/openapi.json`. Protected calls use `Authorization: Bearer <token>`.

| Prefix | Main operations |
|---|---|
| `/auth` | Register, login, current identity |
| `/users` | Current profile and role-protected areas |
| `/agents` | Public profiles, own profile/availability, territories, property types, recommendations |
| `/properties` | Search/list/detail/map, agent/admin lists, CRUD, status, images, features |
| `/client-requests` | Client request CRUD, matches, recommendations, lead score |
| `/agent/leads` | Assigned leads, detail, recalculation, workflow actions, score |
| `/favorites` | Add, list mine, check, remove |
| `/saved-searches` | CRUD and execute saved filters |
| `/conversations` | Conversation/message CRUD, membership/admin views, read state |
| `/appointments` | Client/agent/admin lists, create, update, status, reschedule, delete |
| `/notifications` | Mine, unread count, mark read/all, delete |
| `/admin/users` | Manager user list/detail and activation state |
| `/admin/contracts` | Manager contract CRUD |
| `/client/contracts` | Client deal list and authorized linked property |
| `/admin/analytics` | Overview and domain analytics, heat map, contracts, time series |
| `/market/areas` | Market-area list/detail/management and price/heat-map data |
| `/knowledge-base` | Article list/detail and manager create/update |
| `/investment/score` | Investment calculation |
| `/ai/chat` | Knowledge-backed assistant response |
| `/map` | Property and agent map data |
| `/ml` | Recommendations, conversion prediction, price estimation, model registry/metrics |

## Conventions

- Pydantic schemas define request/response validation.
- Collection endpoints use query parameters for filters and pagination where supported.
- Ownership and role checks run server-side.
- Errors use FastAPI's `{ "detail": ... }` format with standard `400`, `401`, `403`, `404`, and `422` responses.
- `204 No Content` is used for supported deletion operations.

For exact parameters and response models, run the backend and use the generated Swagger/OpenAPI document; it is authoritative and stays synchronized with route code.
