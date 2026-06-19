# User Roles and Permissions

## Overview

The RE/MAX Smile AI platform implements a role-based access control (RBAC) system with three primary user roles: Client, Agent, and Manager. Each role has specific permissions and access levels to ensure appropriate data security and functionality.

## User Roles

### Client

**Description**: Individuals seeking real estate information, property listings, or agent services. Clients may be buyers, sellers, renters, or investors.

**Registration Requirements**:
- Full name
- Email address
- Phone number
- Password
- Optional: Preferred contact method

**Permissions**:

**Authentication & Profile**:
- Register new account
- Log in to the platform
- Update personal profile information
- Change password
- View own account history
- Delete own account (with confirmation)

**AI Assistant**:
- Access AI real estate assistant chatbot
- Submit questions about real estate topics
- View chatbot responses with source citations
- Access chat history
- Clear chat history

**Property Search**:
- Search for properties by location, price, type, size
- Apply advanced filters (rooms, amenities, condition)
- View property details
- View properties on interactive map
- Save properties to favorites list
- Remove properties from favorites
- Share property listings

**Agent Matching**:
- Submit client requirement form
- View recommended agents
- View compatibility scores
- View recommendation explanations
- View agent profiles
- Contact agents through platform
- Request agent consultation

**Data Access**:
- View own submitted requirements
- View own favorite properties
- View own chat history
- View own contact requests

**Restrictions**:
- Cannot view other clients' information
- Cannot view agent internal dashboards
- Cannot access manager analytics
- Cannot modify property listings
- Cannot access knowledge-base management
- Cannot view other users' chat history

---

### Agent

**Description**: Licensed real estate professionals who receive client leads, manage property listings, and provide services to clients. Agents have profiles, performance metrics, and availability status.

**Registration Requirements**:
- Full name
- Email address
- Phone number
- License number
- Password
- Agency affiliation
- Years of experience

**Permissions**:

**Authentication & Profile**:
- Register new account (requires manager approval)
- Log in to the platform
- Update personal profile information
- Change password
- Update availability status
- Update expertise areas
- Update service regions
- View own performance metrics
- Upload profile photo

**Lead Management**:
- View assigned client leads
- View client requirement details
- View client contact information
- Mark leads as contacted
- Add notes to leads
- Update lead status
- View lead history
- Accept or decline lead assignments

**Property Listings**:
- Add new property listings
- Edit own property listings
- Deactivate own property listings
- Upload property photos
- Update property details
- View own listing statistics

**Agent Dashboard**:
- View assigned leads summary
- View lead conversion rates
- View response time metrics
- View client feedback
- View performance comparisons

**AI Assistant**:
- Access AI real estate assistant (limited)
- Submit questions about platform features
- View responses

**Data Access**:
- View own assigned leads
- View own property listings
- View own performance metrics
- View own profile and availability

**Restrictions**:
- Cannot view other agents' assigned leads
- Cannot view other agents' performance metrics
- Cannot access manager analytics
- Cannot modify other agents' listings
- Cannot access knowledge-base management
- Cannot view other clients' information not assigned to them
- Cannot approve new agent registrations
- Cannot modify system settings

---

### Manager / Administrator

**Description**: Agency staff responsible for overseeing operations, monitoring performance, managing content, and ensuring platform quality and compliance.

**Registration Requirements**:
- Full name
- Email address
- Phone number
- Password
- Administrative role designation

**Permissions**:

**Authentication & Profile**:
- Register new account
- Log in to the platform
- Update personal profile information
- Change password

**User Management**:
- View all user accounts
- Approve or reject agent registrations
- Deactivate user accounts
- Reactivate user accounts
- View user activity logs
- Assign manager roles to other users

**Agent Management**:
- View all agent profiles
- View all agent performance metrics
- Assign leads to agents manually
- Reassign leads between agents
- View agent availability
- Modify agent expertise areas
- View agent workload distribution

**Content Management**:
- Upload knowledge-base documents
- Edit knowledge-base documents
- Delete knowledge-base documents
- Approve document versions
- View document usage statistics
- Manage document categories

**Analytics & Reporting**:
- View agency-wide performance metrics
- View lead conversion rates by agent
- View platform usage statistics
- View property listing statistics
- View chatbot usage analytics
- Generate custom reports
- Export analytics data

**Property Oversight**:
- View all property listings
- Review property listing quality
- Flag inappropriate listings
- Remove inappropriate listings
- View listing statistics

**System Administration**:
- View system logs
- Monitor API usage
- Manage API keys
- Configure system settings
- View error reports

**Data Access**:
- Full access to all platform data
- Access to all user information
- Access to all analytics and reports
- Access to system configuration

**Restrictions**:
- Cannot delete critical system data without confirmation
- Cannot modify historical transaction records
- Cannot access external systems without authorization

---

## Permission Matrix

| Feature | Client | Agent | Manager |
|---------|--------|-------|---------|
| Register Account | Yes | Yes (with approval) | Yes |
| Login | Yes | Yes | Yes |
| Update Profile | Own only | Own only | Own only |
| View AI Assistant | Yes | Limited | Full |
| Submit Requirements | Yes | No | No |
| View Agent Recommendations | Yes | No | No |
| Search Properties | Yes | Yes | Yes |
| View Property Map | Yes | Yes | Yes |
| Save Favorites | Yes | No | No |
| View Assigned Leads | No | Yes (own) | Yes (all) |
| Manage Leads | No | Yes (own) | Yes (all) |
| Add Property Listings | No | Yes | Yes |
| Edit Property Listings | No | Own only | All |
| View Performance Metrics | No | Own only | All |
| View Analytics | No | No | Yes |
| Manage Knowledge Base | No | No | Yes |
| Approve Agent Registrations | No | No | Yes |
| View All Users | No | No | Yes |
| System Administration | No | No | Yes |

## Role Assignment Process

1. **Client Registration**: Automatic approval upon valid registration
2. **Agent Registration**: Requires manager approval before account activation
3. **Manager Assignment**: Existing managers can assign manager roles to other users

## Data Privacy Considerations

- Clients can only view their own data and public information
- Agents can only view data related to their assigned leads and own listings
- Managers have full access for oversight purposes but must comply with data protection regulations
- All role changes and permission grants are logged for audit purposes
- Sensitive personal information is encrypted and access-restricted
