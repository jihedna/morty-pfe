# User Roles and Permissions

Public registration creates a `client`. Agent and manager identities are provisioned administratively or by seed data.

| Capability | Public | Client | Agent | Manager |
|---|---:|---:|---:|---:|
| Browse active properties | Yes | Yes | Yes | Yes |
| Use authenticated maps/assistant | No | Yes | Yes | Yes |
| Manage own requests, favorites, saved searches | No | Yes | No | No |
| View own matches, recommendations, deals | No | Yes | No | No |
| Book/manage own appointments | No | Yes | No | No |
| Manage own profile and availability | No | No | Yes | No |
| Manage own listings and assigned leads | No | No | Yes | No |
| Participate in own conversations | No | Yes | Yes | No |
| Review all conversations/appointments | No | No | No | Yes |
| Manage users, agents, contracts, knowledge base | No | No | No | Yes |
| View agency analytics and ML registry | No | No | No | Yes |

## Enforcement

The frontend uses protected and role routes for navigation. The backend remains authoritative: FastAPI dependencies validate JWTs, active-user state, roles, ownership, conversation membership, listing ownership, and manager-only operations. UI hiding is not treated as authorization.
