# Frontend Architecture

The frontend is a React 18 and TypeScript SPA built with Vite and styled with Tailwind CSS. React Router v6 provides navigation; Leaflet/React-Leaflet provides maps.

## Structure

- `src/router/`: public, authenticated, and role-restricted route composition
- `src/pages/`: route pages grouped into `client`, `agent`, `admin`, and `manager`
- `src/components/`: reusable UI plus dashboard, chatbot, property, map, and investment components
- `src/lib/`: feature-specific typed API clients sharing `apiClient.ts`
- `src/hooks/`: data-loading hooks for properties and dashboards
- `src/contexts/AuthContext.tsx`: token/session state and current-user behavior
- `src/types/`: shared domain types
- `src/test/` and colocated `__tests__/`: Vitest/Testing Library setup and suites

## Route groups

Public routes include `/`, `/login`, `/register`, `/properties`, and `/properties/:propertyId`. Authenticated shared routes include `/map`, `/market-map`, `/investment-score`, `/recommendations`, and `/price-estimation`.

Role workspaces are mounted below `/client/*`, `/agent/*`, and `/admin/*`. `ProtectedRoute`, `PublicOnlyRoute`, and `RoleRoute` control client-side navigation; backend authorization remains authoritative.

## State and data flow

Authentication is held in context. Pages/components call modules in `src/lib`, with hooks used for reusable query state. The UI handles loading, errors, empty results, pagination, and confirmation locally; no Redux or server-state framework is used.

## Commands

```bash
npm run dev
npm run typecheck
npm run test -- --run
npm run build
```

The API base URL is read from `VITE_API_BASE_URL` and defaults/configures to the backend `/api/v1` URL.
