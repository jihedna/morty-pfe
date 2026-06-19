# Testing and Deployment Plan

## Overview

This document outlines the comprehensive testing strategy and deployment plan for the RE/MAX Smile AI platform. The plan covers unit testing, integration testing, end-to-end testing, performance testing, security testing, and deployment procedures for development, staging, and production environments.

## Testing Strategy

### Testing Pyramid

```
        /\
       /  \
      / E2E \        (10% - Critical user flows)
     /______\
    /        \
   /Integration\     (30% - API and component integration)
  /____________\
 /              \
/   Unit Tests   \  (60% - Individual functions and components)
/________________\
```

### Test Coverage Goals

- **Unit Tests**: 80% code coverage minimum
- **Integration Tests**: 70% API endpoint coverage
- **E2E Tests**: 100% critical user flow coverage
- **Security Tests**: 100% authentication and authorization coverage

## Backend Testing

### Unit Testing

**Framework**: pytest with pytest-cov

**Test Structure**:
```
backend/tests/
├── unit/
│   ├── test_auth.py
│   ├── test_users.py
│   ├── test_properties.py
│   ├── test_agents.py
│   ├── test_leads.py
│   ├── test_chatbot.py
│   └── test_matching.py
├── integration/
│   ├── test_api_auth.py
│   ├── test_api_properties.py
│   ├── test_api_agents.py
│   ├── test_api_chatbot.py
│   └── test_database.py
└── e2e/
    ├── test_user_flows.py
    ├── test_agent_flows.py
    └── test_manager_flows.py
```

**Example Unit Test**:
```python
# backend/tests/unit/test_matching.py
import pytest
from backend.services.matching import calculate_location_match

def test_location_match_perfect():
    """Test perfect location match."""
    client_locations = ["Tunis", "La Marsa"]
    agent_regions = ["Tunis", "La Marsa", "Carthage"]
    score = calculate_location_match(client_locations, agent_regions)
    assert score == 100.0

def test_location_match_partial():
    """Test partial location match."""
    client_locations = ["Tunis", "La Marsa", "Carthage"]
    agent_regions = ["Tunis", "Ariana"]
    score = calculate_location_match(client_locations, agent_regions)
    assert score == pytest.approx(33.33, rel=0.01)

def test_location_match_no_data():
    """Test with no data."""
    score = calculate_location_match([], ["Tunis"])
    assert score == 0.0
```

**Running Unit Tests**:
```bash
# Run all unit tests
pytest backend/tests/unit/ -v

# Run with coverage
pytest backend/tests/unit/ --cov=backend --cov-report=html

# Run specific test file
pytest backend/tests/unit/test_matching.py -v
```

### Integration Testing

**Framework**: pytest with test database

**Test Configuration**:
```python
# backend/tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base, get_db

TEST_DATABASE_URL = "postgresql://test_user:test_pass@localhost:5432/test_remax_smile"

@pytest.fixture
def test_db():
    engine = create_engine(TEST_DATABASE_URL)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
```

**Example Integration Test**:
```python
# backend/tests/integration/test_api_properties.py
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_create_property():
    """Test property creation API."""
    response = client.post(
        "/properties",
        json={
            "title": "Test Property",
            "description": "Test description",
            "property_type": "apartment",
            "price": 250000,
            "size_sqm": 100,
            "address": "123 Test St, Tunis",
            "city": "Tunis"
        },
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 201
    assert response.json()["id"] is not None

def test_search_properties():
    """Test property search API."""
    response = client.get("/properties?city=Tunis")
    assert response.status_code == 200
    assert "properties" in response.json()
```

### End-to-End Testing

**Framework**: pytest with Playwright

**Example E2E Test**:
```python
# backend/tests/e2e/test_user_flows.py
from playwright.sync_api import Page, expect

def test_client_requirement_flow(page: Page):
    """Test complete client requirement submission flow."""
    # Navigate to login
    page.goto("http://localhost:3000/login")
    
    # Login as client
    page.fill('input[name="email"]', "client@example.com")
    page.fill('input[name="password"]', "password123")
    page.click('button[type="submit"]')
    
    # Navigate to requirements form
    page.goto("http://localhost:3000/client/requirements")
    
    # Fill form
    page.select_option('select[name="property_type"]', "apartment")
    page.fill('input[name="min_budget"]', "150000")
    page.fill('input[name="max_budget"]', "300000")
    page.check('input[value="Tunis"]')
    page.check('input[value="La Marsa"]')
    
    # Submit form
    page.click('button[type="submit"]')
    
    # Verify recommendations are displayed
    expect(page.locator('.recommendations')).to_be_visible()
    expect(page.locator('.agent-card')).to_have_count(at_least=3)
```

## Frontend Testing

### Unit Testing

**Framework**: React Testing Library + Vitest

**Test Structure**:
```
frontend/src/
├── components/
│   ├── __tests__/
│   │   ├── PropertyCard.test.jsx
│   │   ├── LoginForm.test.jsx
│   │   └── ChatInterface.test.jsx
├── hooks/
│   └── __tests__/
│       ├── useAuth.test.js
│       └── useProperties.test.js
└── services/
    └── __tests__/
        └── api.test.js
```

**Example Component Test**:
```javascript
// frontend/src/components/__tests__/PropertyCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyCard from '../PropertyCard';

describe('PropertyCard', () => {
  const mockProperty = {
    id: '1',
    title: 'Test Property',
    price: 250000,
    city: 'Tunis',
    primary_image: 'https://example.com/image.jpg'
  };

  it('renders property information', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Test Property')).toBeInTheDocument();
    expect(screen.getByText('250,000 TND')).toBeInTheDocument();
    expect(screen.getByText('Tunis')).toBeInTheDocument();
  });

  it('calls onFavorite when favorite button is clicked', () => {
    const onFavorite = jest.fn();
    render(<PropertyCard property={mockProperty} onFavorite={onFavorite} />);
    
    fireEvent.click(screen.getByLabelText('Add to favorites'));
    expect(onFavorite).toHaveBeenCalledWith('1');
  });
});
```

**Running Frontend Tests**:
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Integration Testing

**Framework**: React Testing Library with MSW (Mock Service Worker)

**Example Integration Test**:
```javascript
// frontend/src/pages/__tests__/PropertySearch.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PropertySearch from '../PropertySearch';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/v1/properties', (req, res, ctx) => {
    return res(
      ctx.json({
        properties: [
          { id: '1', title: 'Property 1', price: 250000, city: 'Tunis' }
        ],
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1 }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PropertySearch Integration', () => {
  it('loads and displays properties', async () => {
    render(
      <BrowserRouter>
        <PropertySearch />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Property 1')).toBeInTheDocument();
    });
  });
});
```

### E2E Testing

**Framework**: Playwright

**Test Structure**:
```
frontend/e2e/
├── auth.spec.ts
├── property-search.spec.ts
├── agent-recommendation.spec.ts
├── chatbot.spec.ts
└── dashboard.spec.ts
```

**Example E2E Test**:
```typescript
// frontend/e2e/property-search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Property Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('search for properties', async ({ page }) => {
    // Login
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'client@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to property search
    await page.click('text=Properties');
    await expect(page).toHaveURL(/.*properties/);

    // Apply filters
    await page.selectOption('select[name="city"]', 'Tunis');
    await page.fill('input[name="min_price"]', '150000');
    await page.fill('input[name="max_price"]', '300000');
    await page.click('button:has-text("Search")');

    // Verify results
    await expect(page.locator('.property-card')).toHaveCount(at_least(1);
  });
});
```

**Running E2E Tests**:
```bash
# Run all E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test file
npx playwright test property-search.spec.ts
```

## Performance Testing

### Load Testing

**Tool**: k6 or Locust

**Example k6 Script**:
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],     // Less than 1% failures
  },
};

export default function () {
  let response = http.get('http://localhost:8000/v1/properties');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

**Running Load Tests**:
```bash
k6 run load-test.js
```

### Database Performance Testing

**Tool**: pgbench

```bash
# Initialize database
pgbench -i -s 50 remax_smile_db

# Run benchmark
pgbench -c 50 -j 4 -T 60 remax_smile_db
```

### API Response Time Testing

**Tool**: Apache Bench (ab)

```bash
# Test property search endpoint
ab -n 1000 -c 10 http://localhost:8000/v1/properties
```

## Security Testing

### Authentication and Authorization Testing

**Test Cases**:
- Verify JWT token validation
- Test role-based access control
- Verify password hashing
- Test session management
- Verify token expiration

**Example Security Test**:
```python
# backend/tests/security/test_auth.py
def test_unauthorized_access():
    """Test that unauthorized requests are rejected."""
    response = client.get("/properties")
    assert response.status_code == 401

def test_role_based_access():
    """Test that clients cannot access admin endpoints."""
    response = client.get(
        "/admin/users",
        headers={"Authorization": "Bearer client_token"}
    )
    assert response.status_code == 403

def test_sql_injection_protection():
    """Test SQL injection protection."""
    malicious_input = "'; DROP TABLE users; --"
    response = client.get(f"/properties?city={malicious_input}")
    assert response.status_code == 400  # Should be rejected, not 500
```

### Input Validation Testing

**Test Cases**:
- XSS attack prevention
- SQL injection prevention
- CSRF protection
- File upload validation
- Rate limiting

**Example Input Validation Test**:
```python
def test_xss_prevention():
    """Test XSS attack prevention."""
    xss_payload = "<script>alert('xss')</script>"
    response = client.post(
        "/client-requirements",
        json={"additional_notes": xss_payload},
        headers={"Authorization": "Bearer test_token"}
    )
    assert xss_payload not in response.text
```

### Dependency Scanning

**Tools**:
- **Python**: safety, bandit
- **JavaScript**: npm audit, Snyk

```bash
# Python dependency scanning
safety check
bandit -r backend/

# JavaScript dependency scanning
npm audit
npm audit fix
```

## Deployment Plan

### Environments

#### Development Environment

**Purpose**: Local development and testing

**Configuration**:
- Database: Local PostgreSQL instance
- API: http://localhost:8000
- Frontend: http://localhost:3000
- Environment variables in `.env.local`

**Setup**:
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload

# Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

#### Staging Environment

**Purpose**: Pre-production testing

**Infrastructure**:
- Cloud provider: AWS or similar
- Database: Managed PostgreSQL (RDS)
- API: EC2 or container service
- Frontend: S3 + CloudFront
- Domain: staging.remaxsmileai.com

**Deployment Process**:
1. Create staging branch from main
2. Deploy to staging environment
3. Run automated tests
4. Manual QA testing
5. Performance testing
6. Security scanning
7. Approval for production

#### Production Environment

**Purpose**: Live production system

**Infrastructure**:
- Cloud provider: AWS or similar
- Database: Managed PostgreSQL with read replicas (RDS)
- API: Load-balanced EC2 or Kubernetes
- Frontend: S3 + CloudFront with CDN
- Domain: remaxsmileai.com
- SSL/TLS: Certificate from AWS Certificate Manager
- Monitoring: CloudWatch, Sentry
- Backup: Automated daily backups with point-in-time recovery

### Deployment Pipeline

#### CI/CD Pipeline

**Tools**: GitHub Actions or GitLab CI

**Pipeline Stages**:

1. **Build Stage**
   - Install dependencies
   - Build frontend
   - Run linters
   - Run unit tests

2. **Test Stage**
   - Run integration tests
   - Run E2E tests
   - Security scanning
   - Performance tests

3. **Deploy Stage (Staging)**
   - Deploy to staging environment
   - Run smoke tests
   - Notify team

4. **Deploy Stage (Production)**
   - Manual approval required
   - Deploy to production
   - Run smoke tests
   - Monitor health checks
   - Notify team

**Example GitHub Actions Workflow**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest tests/ --cov=backend --cov-report=xml
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
      - name: Run frontend tests
        run: |
          cd frontend
          npm test

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: |
          # Deployment commands
          echo "Deploying to staging..."

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deployment commands
          echo "Deploying to production..."
```

### Database Migration Strategy

**Tool**: Alembic (Python)

**Migration Process**:
1. Create migration file
2. Review migration in development
3. Test migration on staging database
4. Backup production database
5. Apply migration to production
6. Verify migration success
7. Rollback plan if needed

**Example Migration**:
```bash
# Create migration
alembic revision --autogenerate -m "add_agent_performance_metrics"

# Review migration
# Edit generated migration file if needed

# Apply migration (development)
alembic upgrade head

# Apply migration (staging)
alembic upgrade head

# Apply migration (production)
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

### Rollback Strategy

**Database Rollback**:
- Automated daily backups
- Point-in-time recovery (PITR)
- Migration rollback scripts
- Data validation after rollback

**Application Rollback**:
- Blue-green deployment
- Previous version kept for 24 hours
- Automated rollback on health check failure
- Manual rollback capability

**Rollback Procedure**:
1. Identify issue
2. Assess impact
3. Decide on rollback
4. Execute rollback
5. Verify system health
6. Post-mortem analysis

### Monitoring and Alerting

**Metrics to Monitor**:

**Application Metrics**:
- Response time (p50, p95, p99)
- Error rate
- Request rate
- CPU and memory usage
- Database connection pool usage

**Business Metrics**:
- User registrations
- Property searches
- Agent recommendations
- Chatbot usage
- Lead conversions

**Alerting Thresholds**:
- Error rate > 5% for 5 minutes
- Response time p95 > 2 seconds for 5 minutes
- Database connection pool > 80% for 5 minutes
- CPU usage > 80% for 10 minutes
- Memory usage > 80% for 10 minutes

**Monitoring Tools**:
- **Application Monitoring**: New Relic, Datadog, or Prometheus + Grafana
- **Error Tracking**: Sentry
- **Log Aggregation**: ELK Stack or CloudWatch Logs
- **Uptime Monitoring**: UptimeRobot or Pingdom

### Backup Strategy

**Database Backups**:
- **Frequency**: Daily full backups, hourly transaction log backups
- **Retention**: 30 days for daily backups, 7 days for log backups
- **Storage**: Separate geographic region
- **Testing**: Weekly restore test

**Application Backups**:
- **Code**: Git repository (GitHub/GitLab)
- **Configuration**: Version-controlled configuration files
- **Static Assets**: S3 with versioning enabled

**Backup Verification**:
- Automated backup success/failure alerts
- Weekly restore testing
- Quarterly disaster recovery drill

### Security in Production

**SSL/TLS**:
- Force HTTPS for all connections
- Use TLS 1.2 or higher
- Regular certificate renewal
- HSTS enabled

**Firewall Rules**:
- Restrict database access to application servers only
- Limit API access to specific IP ranges if needed
- Block unnecessary ports

**Secrets Management**:
- Use AWS Secrets Manager or HashiCorp Vault
- Never commit secrets to version control
- Rotate secrets regularly
- Audit secret access

**DDoS Protection**:
- Use AWS Shield or Cloudflare
- Rate limiting at edge
- Web Application Firewall (WAF)

## Launch Checklist

### Pre-Launch

- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Backup and recovery verified
- [ ] Monitoring and alerting configured
- [ ] Documentation updated
- [ ] Legal and compliance review
- [ ] User acceptance testing completed
- [ ] Support team trained

### Launch Day

- [ ] Final backup taken
- [ ] Deployment to production
- [ ] Smoke tests passed
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Support team on standby
- [ ] Communication plan executed

### Post-Launch

- [ ] Monitor system health for 24 hours
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Address any issues
- [ ] Document lessons learned
- [ ] Plan next iteration

## Maintenance and Updates

### Regular Maintenance Tasks

**Daily**:
- Review error logs
- Check system health
- Monitor performance metrics

**Weekly**:
- Review backup status
- Check security alerts
- Analyze user feedback

**Monthly**:
- Review and update dependencies
- Performance optimization
- Security patch assessment
- Capacity planning review

**Quarterly**:
- Full security audit
- Disaster recovery test
- Performance review
- Architecture review

### Update Process

1. **Planning**: Define update scope and impact
2. **Testing**: Test in staging environment
3. **Communication**: Notify users of maintenance window
4. **Deployment**: Deploy during low-traffic period
5. **Verification**: Verify system health after update
6. **Monitoring**: Monitor for issues post-update
7. **Rollback**: Rollback if critical issues detected

### Incident Response

**Severity Levels**:
- **P1 - Critical**: System down, data loss, security breach
- **P2 - High**: Major functionality broken, performance severely degraded
- **P3 - Medium**: Minor functionality broken, performance degraded
- **P4 - Low**: Cosmetic issues, documentation errors

**Response Times**:
- **P1**: 15 minutes
- **P2**: 1 hour
- **P3**: 4 hours
- **P4**: 24 hours

**Incident Process**:
1. Detection and classification
2. Notification of on-call engineer
3. Initial assessment and mitigation
4. Investigation and root cause analysis
5. Resolution and verification
6. Communication with stakeholders
7. Post-mortem and process improvement
