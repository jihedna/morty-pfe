# Testing and Deployment

## Local setup

Backend prerequisites are Python, PostgreSQL, and the packages in `backend/requirements.txt`.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python seed_database.py
uvicorn app.main:app --reload
```

Frontend prerequisites are Node.js/npm:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The configured frontend variable is `VITE_API_BASE_URL`, for example `http://127.0.0.1:8000/api/v1`. Backend settings include `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, and `ACCESS_TOKEN_EXPIRE_MINUTES`.

## Verification

```bash
cd backend
pytest -q
ruff check .

cd ../frontend
npm run typecheck
npm run test -- --run
npm run build
```

Backend tests cover health, authentication/authorization, properties, agents, requests/matching, lead scoring, messaging, appointments, notifications, favorites, saved searches, analytics, ML, and purchase/deal workflows. Frontend tests cover authentication, public pages, property flows, role workspaces, and investment components.

## ML training

From `backend/`, training scripts under `ml/training/` can produce artifacts, metadata, metrics, and reports. Inference remains operational through fallbacks when artifacts are absent. Train/evaluate only against approved data and retain model reports with the deployed artifact version.

## Deployment checklist

- Use PostgreSQL and run `alembic upgrade head` before application startup.
- Provide a strong external JWT secret; do not ship `.env` files.
- Restrict CORS origins in `app/main.py` for the deployed frontend.
- Terminate HTTPS, configure database backups, logs, monitoring, and alerting externally.
- Build the SPA with `npm run build` and configure the web server to fall back to `index.html` for client routes.
- Run backend/frontend verification in CI and smoke-test `/health`, login, property browsing, and each role workspace.
- Review knowledge-base freshness and ML artifact/metric status before release.

The repository contains a backend Dockerfile but does not contain a complete production orchestration, CI/CD, monitoring, backup, or rollback implementation. Those items must be supplied by the deployment environment.
