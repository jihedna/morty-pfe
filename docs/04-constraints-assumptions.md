# Constraints and Assumptions

## Current constraints

- Model quality depends on the volume, completeness, and representativeness of property and interaction data.
- ML artifacts are optional; recommendation, pricing, and lead-conversion services use documented fallback logic when artifacts are absent or unusable.
- Chat responses are grounded in database knowledge-base articles and rule-based intent handling; they are not a substitute for legal or financial advice.
- Map accuracy depends on stored latitude/longitude values. Leaflet uses third-party OpenStreetMap tiles.
- The default CORS configuration allows all origins for development and must be restricted before production.
- JWT bearer tokens are used; there is no refresh-token, MFA, SSO, payment, or electronic-signature workflow.
- Notifications are persisted and polled by the UI; browser push infrastructure is not included.
- Appointments are internal records and are not synchronized with Google or Outlook calendars.
- Demonstration and seed data may not represent live RE/MAX inventory or market conditions.

## Operating assumptions

- PostgreSQL is available and all Alembic migrations are applied.
- Managers create/maintain agent accounts, market areas, contracts, and knowledge-base content.
- Agents keep availability, territories, property types, and listings current.
- Clients provide sufficiently specific requirements for useful matching and scoring.
- Production operators supply secure secrets, HTTPS, backups, monitoring, and a restricted CORS policy.
