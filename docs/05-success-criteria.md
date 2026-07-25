# Success Criteria

The current build is functionally successful when the following acceptance checks pass:

- A client can register, log in, restore an authenticated session, and is blocked from agent/manager routes.
- Each role can access its own workspace and receives `401`/`403` responses for unauthorized API operations.
- Public users can browse active properties; authenticated clients can favorite them, save searches, and submit search requests.
- A search request produces a 0-100 lead score plus ranked agent matches with factor-level explanations.
- Agents can maintain their profile and listings and process assigned leads, conversations, and appointments.
- Clients and agents can exchange messages and see unread counts; relevant actions create notifications.
- Clients can view recommendations, request a price estimate, calculate an investment score, and inspect linked deal properties.
- Managers can administer core records and view analytics, heat-map data, and ML model status.
- The assistant returns an intent, answer, sources when found, suggested actions, and a disclaimer where appropriate.
- `pytest` passes for the backend and `npm run typecheck`, `npm run test -- --run`, and `npm run build` pass for the frontend.

Prediction accuracy and performance targets must be measured against an approved production-like dataset; they should not be inferred from demo data alone.
