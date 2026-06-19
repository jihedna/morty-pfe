# Database Schema Design

## Overview

The RE/MAX Smile AI platform uses PostgreSQL as the primary database. The schema is designed to support the three user roles (Client, Agent, Manager), property listings, agent matching, AI chatbot functionality, and analytics. The database follows third normal form (3NF) principles to ensure data integrity and minimize redundancy.

## Entity-Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │  user_profiles  │       │ agent_profiles  │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │───┐   │ id (PK)         │
│ email           │   │   │ user_id (FK)    │   │   │ user_id (FK)    │
│ password_hash   │   │   │ full_name       │   │   │ license_number  │
│ role            │   │   │ phone           │   │   │ agency_name     │
│ status          │   │   │ avatar_url      │   │   │ years_experience│
│ created_at      │   │   │ created_at      │   │   │ availability    │
│ updated_at      │   │   │ updated_at      │   │   │ expertise_areas │
└─────────────────┘   │   └─────────────────┘   │   │ service_regions │
                      │                         │   │ performance_metrics│
                      │                         │   │ created_at      │
                      │                         │   │ updated_at      │
                      │                         │   └─────────────────┘
                      │
                      │
                      ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ client_reqs     │       │     leads       │       │  lead_notes     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │───┐   │ id (PK)         │
│ client_id (FK)  │   │   │ client_req_id   │   │   │ lead_id (FK)    │
│ property_type   │   │   │ agent_id (FK)   │   │   │ agent_id (FK)   │
│ min_budget      │   │   │ status          │   │   │ note            │
│ max_budget      │   │   │ assigned_at     │   │   │ created_at      │
│ locations       │   │   │ contacted_at    │   │   └─────────────────┘
│ min_size        │   │   │ converted_at    │   │
│ max_size        │   │   │ created_at      │   │
│ num_rooms       │   │   │ updated_at      │   │
│ amenities       │   │   └─────────────────┘   │
│ condition       │   │                         │
│ created_at      │   │                         │
│ updated_at      │   │                         │
└─────────────────┘   │                         │
                      │                         │
                      ▼                         │
┌─────────────────┐       ┌─────────────────┐   │
│   properties    │       │ property_images │   │
├─────────────────┤       ├─────────────────┤   │
│ id (PK)         │───┐   │ id (PK)         │   │
│ title           │   │   │ property_id (FK)│   │
│ description     │   │   │ image_url       │   │
│ property_type   │   │   │ is_primary      │   │
│ price           │   │   │ created_at      │   │
│ size_sqm        │   │   └─────────────────┘   │
│ num_rooms       │   │                         │
│ num_bathrooms   │   │                         │
│ address         │   │                         │
│ city            │   │                         │
│ latitude        │   │                         │
│ longitude       │   │                         │
│ amenities       │   │                         │
│ condition       │   │                         │
│ listed_by (FK)  │───┘                         │
│ status          │                             │
│ created_at      │                             │
│ updated_at      │                             │
└─────────────────┘                             │
                                               │
┌─────────────────┐       ┌─────────────────┐   │
│ client_favorites│       │ chat_sessions   │   │
├─────────────────┤       ├─────────────────┤   │
│ id (PK)         │       │ id (PK)         │   │
│ client_id (FK)  │       │ user_id (FK)    │   │
│ property_id (FK)│       │ started_at      │   │
│ created_at      │       │ ended_at        │   │
└─────────────────┘       └─────────────────┘   │
                                               │
                                               ▼
┌─────────────────┐       ┌─────────────────┐
│ chat_messages   │       │ kb_documents    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ session_id (FK) │       │ title           │
│ role            │       │ content         │
│ content         │       │ category        │
│ sources         │       │ tags            │
│ created_at      │       │ uploaded_by (FK)│
└─────────────────┘       │ version         │
                          │ status          │
                          │ created_at      │
                          │ updated_at      │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│ system_logs     │       │ analytics_events│
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ event_type      │
│ action          │       │ user_id (FK)    │
│ ip_address      │       │ property_id (FK)│
│ user_agent      │       │ metadata        │
│ timestamp       │       │ timestamp       │
│ success         │       └─────────────────┘
└─────────────────┘
```

## Table Definitions

### 1. users

Stores authentication and basic user information for all user types.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | ENUM('client', 'agent', 'manager') | NOT NULL | User role |
| status | ENUM('pending', 'active', 'inactive', 'suspended') | NOT NULL, DEFAULT 'pending' | Account status |
| email_verified | BOOLEAN | NOT NULL, DEFAULT FALSE | Email verification status |
| verification_token | VARCHAR(255) | NULLABLE | Email verification token |
| reset_token | VARCHAR(255) | NULLABLE | Password reset token |
| reset_token_expires | TIMESTAMP | NULLABLE | Password reset token expiration |
| failed_login_attempts | INTEGER | NOT NULL, DEFAULT 0 | Failed login attempt count |
| locked_until | TIMESTAMP | NULLABLE | Account lock expiration |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_users_email` on email
- `idx_users_role` on role
- `idx_users_status` on status

---

### 2. user_profiles

Stores extended profile information for all users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Profile identifier |
| user_id | UUID | FOREIGN KEY (users.id), UNIQUE, NOT NULL | Reference to user |
| full_name | VARCHAR(255) | NOT NULL | User full name |
| phone | VARCHAR(20) | NULLABLE | Phone number |
| avatar_url | VARCHAR(500) | NULLABLE | Profile image URL |
| preferred_contact | ENUM('email', 'phone', 'both') | NULLABLE | Preferred contact method |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Profile creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_user_profiles_user_id` on user_id

---

### 3. agent_profiles

Stores agent-specific information and performance metrics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Agent profile identifier |
| user_id | UUID | FOREIGN KEY (users.id), UNIQUE, NOT NULL | Reference to user |
| license_number | VARCHAR(100) | UNIQUE, NOT NULL | Real estate license number |
| agency_name | VARCHAR(255) | NOT NULL | Agency affiliation |
| years_experience | INTEGER | NOT NULL, DEFAULT 0 | Years of experience |
| availability | ENUM('available', 'busy', 'unavailable') | NOT NULL, DEFAULT 'available' | Current availability status |
| expertise_areas | JSONB | NOT NULL, DEFAULT '[]' | Array of expertise areas |
| service_regions | JSONB | NOT NULL, DEFAULT '[]' | Array of service regions |
| performance_metrics | JSONB | NOT NULL, DEFAULT '{}' | Performance metrics (conversion rate, response time, etc.) |
| total_leads | INTEGER | NOT NULL, DEFAULT 0 | Total leads assigned |
| converted_leads | INTEGER | NOT NULL, DEFAULT 0 | Successfully converted leads |
| avg_response_time_hours | DECIMAL(10,2) | NULLABLE | Average response time in hours |
| rating_avg | DECIMAL(3,2) | NULLABLE | Average client rating |
| rating_count | INTEGER | NOT NULL, DEFAULT 0 | Number of ratings |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Profile creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_agent_profiles_user_id` on user_id
- `idx_agent_profiles_license_number` on license_number
- `idx_agent_profiles_availability` on availability
- `idx_agent_profiles_service_regions` on service_regions (GIN index for JSONB)

---

### 4. client_requirements

Stores client property requirements for agent matching.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Requirement identifier |
| client_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to client user |
| property_type | ENUM('apartment', 'villa', 'land', 'commercial') | NOT NULL | Preferred property type |
| min_budget | DECIMAL(15,2) | NOT NULL | Minimum budget |
| max_budget | DECIMAL(15,2) | NOT NULL | Maximum budget |
| locations | JSONB | NOT NULL, DEFAULT '[]' | Preferred locations (Grand Tunis areas) |
| min_size_sqm | INTEGER | NULLABLE | Minimum size in square meters |
| max_size_sqm | INTEGER | NULLABLE | Maximum size in square meters |
| num_rooms | INTEGER | NULLABLE | Preferred number of rooms |
| amenities | JSONB | NOT NULL, DEFAULT '[]' | Required amenities |
| condition | ENUM('any', 'new', 'good', 'needs_renovation') | NULLABLE | Property condition preference |
| additional_notes | TEXT | NULLABLE | Additional requirements or notes |
| status | ENUM('active', 'matched', 'cancelled') | NOT NULL, DEFAULT 'active' | Requirement status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_client_requirements_client_id` on client_id
- `idx_client_requirements_status` on status
- `idx_client_requirements_locations` on locations (GIN index for JSONB)

---

### 5. leads

Stores lead assignments and tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Lead identifier |
| client_req_id | UUID | FOREIGN KEY (client_requirements.id), NOT NULL | Reference to client requirement |
| agent_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to agent user |
| compatibility_score | DECIMAL(5,2) | NOT NULL | Compatibility score (0-100) |
| compatibility_factors | JSONB | NOT NULL, DEFAULT '{}' | Factors contributing to score |
| status | ENUM('assigned', 'contacted', 'in_progress', 'converted', 'lost') | NOT NULL, DEFAULT 'assigned' | Lead status |
| assigned_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Assignment timestamp |
| contacted_at | TIMESTAMP | NULLABLE | First contact timestamp |
| converted_at | TIMESTAMP | NULLABLE | Conversion timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_leads_client_req_id` on client_req_id
- `idx_leads_agent_id` on agent_id
- `idx_leads_status` on status
- `idx_leads_assigned_at` on assigned_at

---

### 6. lead_notes

Stores notes and interactions for leads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Note identifier |
| lead_id | UUID | FOREIGN KEY (leads.id), NOT NULL | Reference to lead |
| agent_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to agent user |
| note | TEXT | NOT NULL | Note content |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Note creation timestamp |

**Indexes:**
- `idx_lead_notes_lead_id` on lead_id
- `idx_lead_notes_agent_id` on agent_id
- `idx_lead_notes_created_at` on created_at

---

### 7. properties

Stores property listings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Property identifier |
| title | VARCHAR(255) | NOT NULL | Property title |
| description | TEXT | NOT NULL | Property description |
| property_type | ENUM('apartment', 'villa', 'land', 'commercial') | NOT NULL | Property type |
| price | DECIMAL(15,2) | NOT NULL | Property price |
| price_per_sqm | DECIMAL(10,2) | NULLABLE | Price per square meter |
| size_sqm | INTEGER | NOT NULL | Size in square meters |
| num_rooms | INTEGER | NULLABLE | Number of rooms |
| num_bathrooms | INTEGER | NULLABLE | Number of bathrooms |
| address | VARCHAR(500) | NOT NULL | Property address |
| city | VARCHAR(100) | NOT NULL | City (Grand Tunis area) |
| latitude | DECIMAL(10,8) | NULLABLE | Geographic latitude |
| longitude | DECIMAL(11,8) | NULLABLE | Geographic longitude |
| amenities | JSONB | NOT NULL, DEFAULT '[]' | Property amenities |
| condition | ENUM('new', 'good', 'needs_renovation') | NOT NULL | Property condition |
| year_built | INTEGER | NULLABLE | Year built |
| listed_by | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to listing agent |
| status | ENUM('active', 'pending', 'sold', 'rented', 'withdrawn') | NOT NULL, DEFAULT 'active' | Listing status |
| views_count | INTEGER | NOT NULL, DEFAULT 0 | Number of views |
| favorites_count | INTEGER | NOT NULL, DEFAULT 0 | Number of favorites |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_properties_listed_by` on listed_by
- `idx_properties_status` on status
- `idx_properties_city` on city
- `idx_properties_property_type` on property_type
- `idx_properties_price` on price
- `idx_properties_size_sqm` on size_sqm
- `idx_properties_amenities` on amenities (GIN index for JSONB)
- `idx_properties_location` on latitude, longitude (for spatial queries)

---

### 8. property_images

Stores property images.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Image identifier |
| property_id | UUID | FOREIGN KEY (properties.id), NOT NULL | Reference to property |
| image_url | VARCHAR(500) | NOT NULL | Image URL |
| is_primary | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether this is the primary image |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Upload timestamp |

**Indexes:**
- `idx_property_images_property_id` on property_id
- `idx_property_images_is_primary` on is_primary

---

### 9. client_favorites

Stores client favorite properties.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Favorite identifier |
| client_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to client user |
| property_id | UUID | FOREIGN KEY (properties.id), NOT NULL | Reference to property |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Unique Constraint:**
- (client_id, property_id)

**Indexes:**
- `idx_client_favorites_client_id` on client_id
- `idx_client_favorites_property_id` on property_id

---

### 10. chat_sessions

Stores AI chatbot sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Session identifier |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| started_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Session start timestamp |
| ended_at | TIMESTAMP | NULLABLE | Session end timestamp |
| message_count | INTEGER | NOT NULL, DEFAULT 0 | Number of messages in session |

**Indexes:**
- `idx_chat_sessions_user_id` on user_id
- `idx_chat_sessions_started_at` on started_at

---

### 11. chat_messages

Stores individual chat messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Message identifier |
| session_id | UUID | FOREIGN KEY (chat_sessions.id), NOT NULL | Reference to chat session |
| role | ENUM('user', 'assistant') | NOT NULL | Message role |
| content | TEXT | NOT NULL | Message content |
| sources | JSONB | NULLABLE | Source documents used for response |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Message timestamp |

**Indexes:**
- `idx_chat_messages_session_id` on session_id
- `idx_chat_messages_created_at` on created_at

---

### 12. kb_documents

Stores knowledge-base documents for the AI assistant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Document identifier |
| title | VARCHAR(255) | NOT NULL | Document title |
| content | TEXT | NOT NULL | Document text content |
| category | VARCHAR(100) | NOT NULL | Document category |
| tags | JSONB | NOT NULL, DEFAULT '[]' | Document tags |
| uploaded_by | UUID | FOREIGN KEY (users.id), NOT NULL | Reference to uploading manager |
| version | INTEGER | NOT NULL, DEFAULT 1 | Document version |
| status | ENUM('active', 'archived', 'draft') | NOT NULL, DEFAULT 'active' | Document status |
| file_url | VARCHAR(500) | NULLABLE | Original file URL |
| usage_count | INTEGER | NOT NULL, DEFAULT 0 | Number of times used in responses |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_kb_documents_category` on category
- `idx_kb_documents_status` on status
- `idx_kb_documents_tags` on tags (GIN index for JSONB)
- `idx_kb_documents_uploaded_by` on uploaded_by

---

### 13. system_logs

Stores system activity logs for security and auditing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Log identifier |
| user_id | UUID | FOREIGN KEY (users.id), NULLABLE | Reference to user (NULL for system events) |
| action | VARCHAR(100) | NOT NULL | Action performed |
| ip_address | VARCHAR(45) | NULLABLE | IP address |
| user_agent | VARCHAR(500) | NULLABLE | User agent string |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Event timestamp |
| success | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether action succeeded |
| error_message | TEXT | NULLABLE | Error message if failed |

**Indexes:**
- `idx_system_logs_user_id` on user_id
- `idx_system_logs_action` on action
- `idx_system_logs_timestamp` on timestamp
- `idx_system_logs_success` on success

---

### 14. analytics_events

Stores analytics events for reporting.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Event identifier |
| event_type | VARCHAR(100) | NOT NULL | Type of analytics event |
| user_id | UUID | FOREIGN KEY (users.id), NULLABLE | Reference to user |
| property_id | UUID | FOREIGN KEY (properties.id), NULLABLE | Reference to property (if applicable) |
| metadata | JSONB | NOT NULL, DEFAULT '{}' | Additional event metadata |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Event timestamp |

**Indexes:**
- `idx_analytics_events_event_type` on event_type
- `idx_analytics_events_user_id` on user_id
- `idx_analytics_events_property_id` on property_id
- `idx_analytics_events_timestamp` on timestamp

---

## Relationships

### Primary Relationships

1. **users → user_profiles**: One-to-one (each user has one profile)
2. **users → agent_profiles**: One-to-one (agent users have agent profiles)
3. **users → client_requirements**: One-to-many (clients can have multiple requirements)
4. **client_requirements → leads**: One-to-many (each requirement can generate multiple leads)
5. **users → leads**: One-to-many (agents can have multiple leads)
6. **leads → lead_notes**: One-to-many (each lead can have multiple notes)
7. **users → properties**: One-to-many (agents can list multiple properties)
8. **properties → property_images**: One-to-many (each property can have multiple images)
9. **users → client_favorites**: One-to-many (clients can favorite multiple properties)
10. **properties → client_favorites**: One-to-many (properties can be favorited by multiple clients)
11. **users → chat_sessions**: One-to-many (users can have multiple chat sessions)
12. **chat_sessions → chat_messages**: One-to-many (each session can have multiple messages)
13. **users → kb_documents**: One-to-many (managers can upload multiple documents)
14. **users → system_logs**: One-to-many (users can generate multiple log entries)
15. **users → analytics_events**: One-to-many (users can generate multiple analytics events)

### Cascade Rules

- **ON DELETE RESTRICT**: Most relationships use RESTRICT to prevent accidental data loss
- **ON DELETE CASCADE**: Used for dependent records (e.g., property_images when property is deleted)
- **ON UPDATE CASCADE**: Used for foreign key updates

---

## Security Considerations

### Data Encryption

- **Passwords**: Stored as bcrypt hashes with minimum 12 rounds
- **Sensitive fields**: Consider encryption for phone numbers and personal identifiers
- **TLS**: All database connections must use TLS/SSL

### Access Control

- **Row-level security**: Implement PostgreSQL RLS to restrict data access by role
- **Views**: Create role-specific views to limit data exposure
- **Stored procedures**: Use for sensitive operations with permission checks

### Audit Trail

- **system_logs**: All authentication attempts and permission changes are logged
- **timestamp**: All tables include created_at and updated_at timestamps
- **user tracking**: All data modifications track the responsible user

### Data Retention

- **chat_sessions**: Retain for 90 days, then archive
- **system_logs**: Retain for 1 year for compliance
- **analytics_events**: Aggregate daily, retain raw data for 6 months

---

## Performance Considerations

### Indexing Strategy

- **Foreign keys**: All foreign key columns are indexed
- **Search columns**: Frequently filtered columns (status, role, city) are indexed
- **JSONB fields**: GIN indexes for JSONB arrays and objects
- **Composite indexes**: For common query patterns (e.g., status + created_at)

### Query Optimization

- **Pagination**: Use LIMIT/OFFSET with indexed columns for large result sets
- **Materialized views**: Consider for complex analytics queries
- **Connection pooling**: Use connection pooling (e.g., PgBouncer) for high concurrency

### Partitioning

- **system_logs**: Consider partitioning by month for large log volumes
- **analytics_events**: Consider partitioning by month for analytics data

---

## Backup Strategy

- **Daily full backups**: Automated daily backups with retention policy
- **Point-in-time recovery**: Enable WAL archiving for PITR capability
- **Backup verification**: Regular restore testing to ensure backup integrity
- **Geographic redundancy**: Store backups in separate geographic location

---

## Migration Strategy

- **Version control**: All schema changes tracked in migration files
- **Rollback capability**: Each migration includes rollback script
- **Zero-downtime deployment**: Use online schema changes for production
- **Data migration**: Separate scripts for data transformation when needed
