# Use Cases

## Use Case: UC-001 - User Registration

**Actor**: Client, Agent, Manager
**Description**: A new user registers an account on the platform.

**Preconditions**:
- User has access to the registration page
- User has valid email address

**Main Flow**:
1. User navigates to the registration page
2. User enters full name
3. User enters email address
4. User enters phone number
5. User creates a password
6. User confirms password
7. (Agent only) User enters license number and agency affiliation
8. User submits registration form
9. System validates all required fields
10. System validates email format
11. System validates password strength
12. System sends verification email
13. System creates user account with pending status
14. System displays confirmation message

**Alternative Flows**:
- **Invalid email**: System displays error message and prompts for correct email
- **Weak password**: System displays password requirements and prompts for stronger password
- **Email already registered**: System displays error and offers login or password reset
- **Agent registration**: System requires manager approval before account activation

**Postconditions**:
- User account is created in pending status
- Verification email is sent
- User cannot log in until verification is complete

---

## Use Case: UC-002 - User Login

**Actor**: Client, Agent, Manager
**Description**: A registered user logs in to the platform.

**Preconditions**:
- User has a verified account
- User knows their email and password

**Main Flow**:
1. User navigates to the login page
2. User enters email address
3. User enters password
4. User submits login form
5. System validates credentials
6. System creates user session
7. System redirects user to role-appropriate dashboard
8. System displays welcome message

**Alternative Flows**:
- **Invalid credentials**: System displays error message and offers password reset
- **Account locked**: System displays message about account lock and recovery options
- **Account not verified**: System prompts user to complete email verification

**Postconditions**:
- User is authenticated and logged in
- User has access to role-appropriate features

---

## Use Case: UC-003 - Submit Client Requirements

**Actor**: Client
**Description**: A client submits their property requirements to find suitable agents.

**Preconditions**:
- Client is logged in
- Client has access to the requirement form

**Main Flow**:
1. Client navigates to the requirement form
2. Client selects property type (apartment, villa, land, commercial)
3. Client enters minimum budget
4. Client enters maximum budget
5. Client selects preferred locations from Grand Tunis areas
6. Client enters minimum size in square meters
7. Client enters maximum size in square meters
8. Client selects number of rooms preference
9. Client selects additional amenities preferences
10. Client submits the form
11. System validates all required fields
12. System validates numeric ranges for consistency
13. System saves requirements to database
14. System triggers agent recommendation algorithm
15. System displays recommended agents

**Alternative Flows**:
- **Missing required field**: System highlights missing field and prevents submission
- **Invalid numeric range**: System displays error and prompts for correction
- **No agents match**: System displays message indicating no matches and suggests adjusting criteria

**Postconditions**:
- Client requirements are stored in database
- Agent recommendations are generated and displayed
- Client can view and contact recommended agents

---

## Use Case: UC-004 - Ask AI Real Estate Assistant

**Actor**: Client, Agent, Manager
**Description**: A user asks the AI chatbot a real estate question.

**Preconditions**:
- User is logged in
- User has access to the AI assistant interface

**Main Flow**:
1. User navigates to the AI assistant page
2. User types a question in natural language
3. User submits the question
4. System processes the question using NLP
5. System searches knowledge-base documents for relevant information
6. System generates response using RAG
7. System displays response with source citations
8. System adds question and response to chat history

**Alternative Flows**:
- **No relevant information found**: System displays message that information is not available in knowledge base
- **Ambiguous question**: System asks clarifying questions to understand intent
- **System error**: System displays error message and suggests trying again later

**Postconditions**:
- User receives an answer to their question
- User can view source citations for verification
- Chat history is updated with the interaction

---

## Use Case: UC-005 - Search Properties

**Actor**: Client, Agent, Manager
**Description**: A user searches for properties using various criteria.

**Preconditions**:
- User is logged in
- Property data is available in the system

**Main Flow**:
1. User navigates to property search page
2. User enters search criteria (location, price, type, size)
3. User applies additional filters (rooms, amenities, condition)
4. User submits search
5. System queries database for matching properties
6. System displays search results
7. User views property details by clicking on a listing

**Alternative Flows**:
- **No results found**: System displays message and suggests adjusting search criteria
- **Too many results**: System suggests applying more filters to narrow results

**Postconditions**:
- User views properties matching their criteria
- User can access detailed property information
- User can save properties to favorites (if client)

---

## Use Case: UC-006 - View Properties on Map

**Actor**: Client, Agent, Manager
**Description**: A user views properties on an interactive map.

**Preconditions**:
- User is logged in
- User has performed a property search

**Main Flow**:
1. User navigates to map view
2. System displays properties on interactive map
3. User zooms and pans to desired area
4. User clicks on a property marker
5. System displays property details in a popup
6. User filters properties displayed on map
7. System updates map display with filtered results

**Alternative Flows**:
- **Property lacks coordinates**: System displays property in list view instead of on map
- **Map service unavailable**: System displays error message and offers list view alternative

**Postconditions**:
- User views properties geographically
- User understands spatial relationships between properties
- User can filter map display by various criteria

---

## Use Case: UC-007 - View Agent Recommendations

**Actor**: Client
**Description**: A client views recommended agents based on their requirements.

**Preconditions**:
- Client has submitted requirements
- Agent recommendations have been generated

**Main Flow**:
1. Client navigates to recommendations page
2. System displays list of recommended agents
3. System displays compatibility score for each agent
4. Client clicks on an agent to view details
5. System displays agent profile
6. System displays recommendation explanation
7. Client views agent expertise and performance metrics
8. Client contacts agent through platform

**Alternative Flows**:
- **No recommendations available**: System displays message and suggests adjusting requirements
- **Agent unavailable**: System displays availability status and suggests alternative agents

**Postconditions**:
- Client views suitable agents for their requirements
- Client understands why agents were recommended
- Client can initiate contact with selected agents

---

## Use Case: UC-008 - Manage Assigned Leads

**Actor**: Agent
**Description**: An agent views and manages leads assigned to them.

**Preconditions**:
- Agent is logged in
- Agent has assigned leads

**Main Flow**:
1. Agent navigates to agent dashboard
2. System displays list of assigned leads
3. Agent clicks on a lead to view details
4. System displays client requirements and contact information
5. Agent marks lead as contacted
6. Agent adds notes about the interaction
7. Agent updates lead status
8. System saves changes to database

**Alternative Flows**:
- **No leads assigned**: System displays message indicating no current leads
- **Lead already contacted**: System displays previous interaction history

**Postconditions**:
- Agent views and manages their assigned leads
- Lead status is updated in database
- Agent can track progress with each lead

---

## Use Case: UC-009 - Update Agent Availability

**Actor**: Agent
**Description**: An agent updates their availability status and schedule.

**Preconditions**:
- Agent is logged in
- Agent has access to profile settings

**Main Flow**:
1. Agent navigates to profile settings
2. Agent selects availability status (available, busy, unavailable)
3. Agent specifies available time slots
4. Agent saves changes
5. System updates availability in database
6. System displays confirmation message

**Alternative Flows**:
- **Invalid time slot**: System displays error and prompts for correct format
- **Concurrent modification**: System alerts if another user modified the profile

**Postconditions**:
- Agent availability is updated in system
- Lead assignment system considers updated availability
- Clients can view current agent availability

---

## Use Case: UC-010 - View Manager Analytics

**Actor**: Manager
**Description**: A manager views agency-wide analytics and performance metrics.

**Preconditions**:
- Manager is logged in
- Manager has access to analytics dashboard

**Main Flow**:
1. Manager navigates to analytics dashboard
2. System displays overview metrics (total users, leads, conversions)
3. Manager selects specific time period
4. System updates metrics for selected period
5. Manager views agent performance comparison
6. Manager views lead conversion rates by agent
7. Manager views platform usage statistics
8. Manager exports analytics data if needed

**Alternative Flows**:
- **No data available**: System displays message indicating insufficient data for selected period
- **Export fails**: System displays error and offers retry option

**Postconditions**:
- Manager views comprehensive agency performance data
- Manager can make data-driven decisions
- Manager can identify areas for improvement

---

## Use Case: UC-011 - Approve Agent Registration

**Actor**: Manager
**Description**: A manager approves or rejects a pending agent registration.

**Preconditions**:
- Manager is logged in
- There are pending agent registrations

**Main Flow**:
1. Manager navigates to user management page
2. System displays pending agent registrations
3. Manager clicks on a pending registration
4. System displays agent details and license information
5. Manager reviews agent information
6. Manager approves or rejects the registration
7. System sends notification email to agent
8. System updates account status accordingly

**Alternative Flows**:
- **Invalid license**: Manager rejects registration and requests valid license
- **Insufficient information**: Manager requests additional information before decision

**Postconditions**:
- Agent account is activated or rejected
- Agent receives notification of decision
- Agent can log in if approved

---

## Use Case: UC-012 - Upload Knowledge-Base Document

**Actor**: Manager
**Description**: A manager uploads a document to the knowledge base for the AI assistant.

**Preconditions**:
- Manager is logged in
- Manager has access to content management

**Main Flow**:
1. Manager navigates to knowledge-base management
2. Manager clicks upload document button
3. Manager selects document file from computer
4. Manager enters document title
5. Manager selects document category
6. Manager adds relevant tags
7. Manager submits upload
8. System validates file format
9. System extracts text content
10. System indexes document for search
11. System saves document to database
12. System displays confirmation message

**Alternative Flows**:
- **Invalid file format**: System displays error and lists supported formats
- **File too large**: System displays error and indicates maximum file size
- **Extraction fails**: System displays error and suggests manual text entry

**Postconditions**:
- Document is added to knowledge base
- Document is indexed for AI assistant retrieval
- AI assistant can use document for answering questions

---

## Use Case: UC-013 - Save Property to Favorites

**Actor**: Client
**Description**: A client saves a property to their favorites list.

**Preconditions**:
- Client is logged in
- Client is viewing a property

**Main Flow**:
1. Client views property details
2. Client clicks on "Add to Favorites" button
3. System adds property to client's favorites
4. System displays confirmation message
5. Client navigates to favorites page
6. System displays saved properties

**Alternative Flows**:
- **Property already in favorites**: System displays message and offers to remove
- **Favorites limit reached**: System displays error and suggests removing some favorites

**Postconditions**:
- Property is saved to client's favorites
- Client can access favorites from any session
- Client can easily revisit saved properties

---

## Use Case: UC-014 - Contact Agent

**Actor**: Client
**Description**: A client initiates contact with a recommended agent.

**Preconditions**:
- Client is logged in
- Client is viewing an agent profile

**Main Flow**:
1. Client views agent profile
2. Client clicks on "Contact Agent" button
3. System displays contact form
4. Client enters message
5. Client selects preferred contact method
6. Client submits contact request
7. System sends notification to agent
8. System creates lead assignment record
9. System displays confirmation to client

**Alternative Flows**:
- **Agent unavailable**: System displays availability status and suggests alternative
- **Message too long**: System displays error and indicates character limit

**Postconditions**:
- Agent receives notification of contact request
- Lead is assigned to agent in database
- Client receives confirmation of request submission

---

## Use Case: UC-015 - Reset Password

**Actor**: Client, Agent, Manager
**Description**: A user resets their forgotten password.

**Preconditions**:
- User has access to email associated with account
- User knows their email address

**Main Flow**:
1. User navigates to login page
2. User clicks on "Forgot Password" link
3. User enters email address
4. User submits request
5. System validates email exists in database
6. System generates password reset token
7. System sends reset link via email
8. User clicks reset link in email
9. User enters new password
10. User confirms new password
11. User submits password change
12. System validates password strength
13. System updates password in database
14. System invalidates reset token
15. System redirects user to login page

**Alternative Flows**:
- **Email not found**: System displays message (without revealing if email exists)
- **Invalid token**: System displays error and requests new reset link
- **Weak password**: System displays requirements and prompts for stronger password

**Postconditions**:
- User password is updated
- User can log in with new password
- Reset token is invalidated for security
