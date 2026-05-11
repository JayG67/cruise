# 🚢 Cruise Explorer API & Frontend

![CI](https://github.com/JayG67/cruise/actions/workflows/ci.yml/badge.svg)

![Coverage](https://img.shields.io/badge/coverage-enforced-green)

A full-stack cruise data application built with **Node.js, Express, PostgreSQL (Drizzle ORM), Zod, Cypress, Jest, and Supertest**.

This repository evolved into an **enterprise-style Software Quality Engineering showcase**, demonstrating layered testing architecture, API contract validation, CI enforcement, integration testing, validation middleware, negative-path testing, and API-driven UI automation.

---

# 📌 Project Purpose

This repository serves as a **portfolio project focused on demonstrating advanced Software Quality Engineering practices within a full-stack application**.

The primary goals are to demonstrate:

* Enterprise-style layered testing architecture
* API contract validation and negative-path testing
* Unit, integration, and end-to-end UI testing
* API-driven Cypress testing using live application data
* Validation middleware and schema enforcement
* CI-driven quality gates and automated validation
* Real-world test architecture and maintainable automation patterns
* Practical full-stack engineering with quality-first design

Rather than relying on sample applications, this project was intentionally designed and developed as a controlled environment for implementing modern QA engineering practices, tooling, and automation strategies.

This repository reflects the mindset of a:

```text
Principal Software Quality Engineer
```

where reliability, validation, automation, observability, maintainability, and testability are treated as foundational architectural concerns.

---

# 🧱 Architecture

```text
Frontend (Vanilla JS)
        ↓
Express API
(Routes → Validation Middleware → Controllers → Services)
        ↓
Drizzle ORM
        ↓
PostgreSQL (Docker)
```

---

# ⚙️ Tech Stack

## Backend

* Node.js
* Express
* Drizzle ORM
* PostgreSQL
* Docker
* Zod (API contract validation)

## Frontend

* HTML
* CSS
* Vanilla JavaScript (Fetch API)

## Testing & Quality Engineering

* Jest (unit testing)
* Supertest (integration testing)
* Cypress (end-to-end UI testing)
* GitHub Actions (CI automation)

---

# 🚀 Features

* ✅ Cruise line management
* ✅ Ship management by cruise line
* ✅ RESTful API architecture
* ✅ Automatic database initialization
* ✅ Automatic seed data loading from JSON
* ✅ Frontend dashboard consuming live API data
* ✅ Built-in SQA Test Control Panel
* ✅ Real-time cruise line search filtering
* ✅ Dynamic result counts
* ✅ API-driven frontend rendering
* ✅ Full CRUD API support
* ✅ Zod-based API contract validation
* ✅ Strict request payload validation
* ✅ UUID validation
* ✅ URL validation
* ✅ Standardized validation error responses
* ✅ Negative-path API validation
* ✅ Integration testing against live PostgreSQL
* ✅ API-driven Cypress UI testing
* ✅ Reusable integration test helpers/factories
* ✅ Validation middleware unit testing
* ✅ Zod schema unit testing
* ✅ Controller business-rule unit testing
* ✅ CI-driven quality enforcement
* ✅ Enforced test coverage thresholds

---

# 📂 Project Structure

```text
cruise/
│
├── controllers/        # API controllers
├── middleware/         # Logging + validation middleware
├── validation/         # Zod validation schemas
├── models/             # Drizzle schema definitions
├── routes/             # Express routes
├── services/           # DB init + seed loading
├── db/                 # Database connection
├── data/               # Seed JSON data
├── public/             # Frontend UI
├── tests/
│   ├── unit/           # Jest unit tests
│   │   ├── middleware/ # Validation middleware tests
│   │   └── validation/ # Zod schema validation tests
│   ├── integration/    # Supertest integration tests
│   │   └── helpers/    # Integration factories/helpers
├── cypress/
│   ├── e2e/            # Cypress UI tests
│   ├── screenshots/    # Failure screenshots
│   └── videos/         # Cypress recordings
├── app.js              # Express app export for testing
├── index.js            # Server startup
├── docker-compose.yml  # PostgreSQL container
```

---

# ▶️ Getting Started

No environment configuration is required for local development.

Default values are built into the application.

An optional `.env` file can be used to override settings if desired.

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Start the application

```bash
npm start
```

This automatically:

* Starts PostgreSQL in Docker
* Verifies database tables
* Loads cruise seed data
* Starts the Express server

---

## 3. Open the application

```text
http://localhost:8000
```

---

# 🔌 API Endpoints

## Cruise Lines

```text
GET /cruise
```

Returns all cruise lines.

---

```text
GET /cruise/cruise-line/:id
```

Returns a specific cruise line.

---

```text
POST /cruise/cruise-line
```

Creates a cruise line.

---

```text
PATCH /cruise/cruise-line/:id
```

Updates a cruise line.

---

```text
DELETE /cruise/cruise-line/:id
```

Deletes a cruise line and related ships.

---

## Ships

```text
GET /cruise/ships/:cruiseLineId
```

Returns ships for a cruise line.

---

```text
POST /cruise/ship
```

Creates a ship.

---

```text
PATCH /cruise/ship/:id
```

Updates a ship.

---

```text
DELETE /cruise/ship/:id
```

Deletes a ship.

---

## Health Check

```text
GET /health
```

---

# 🖥️ Frontend

The frontend is served from:

```text
/public
```

## Frontend Features

* Cruise-themed landing page
* Live cruise line rendering
* Ship lookup by cruise line
* Real-time search filtering
* Dynamic search result counts
* API-driven UI rendering
* SQA Test Control Panel
* API health validation from the UI
* Live ship relationship validation

---

# 🧪 Testing Strategy

This repository follows a:

```text
Layered enterprise-style testing architecture
```

with validation at the:

* Unit level
* Integration/API level
* End-to-end browser level

The repository intentionally separates:

* Schema validation concerns
* Controller business-rule concerns
* Integration workflow concerns
* Browser/UI validation concerns

for stronger maintainability and clearer testing boundaries.

---

# 🧪 Unit Tests

Run:

```bash
npm run unitTests
```

The unit test architecture validates:

## Controller Business Rules

* Duplicate-name validation
* Relationship validation
* CRUD orchestration behavior
* Cascade delete behavior
* Error forwarding to Express middleware
* Database interaction patterns

using mocked dependencies.

---

## Validation Middleware Testing

Dedicated middleware unit tests validate:

* Successful request validation
* Validation failure handling
* Standardized validation error responses
* Proper Express middleware flow behavior

---

## Zod Schema Unit Testing

Dedicated schema tests validate:

* UUID validation
* URL validation
* Blank-string rejection
* Strict payload enforcement
* Required field enforcement
* Invalid payload rejection

This separates:

```text
validation testing
```

from:

```text
controller business-rule testing
```

which more closely reflects enterprise testing architecture.

---

# 🔗 Integration Tests

Run:

```bash
npm run integrationTests
```

Integration tests validate:

* Real PostgreSQL-backed API behavior
* Full CRUD endpoint workflows
* API contract validation
* Relationship integrity
* Cascade delete behavior
* Negative-path validation
* Validation middleware behavior
* UUID validation
* URL validation
* Strict payload enforcement
* Standardized validation error responses
* Request/response contract integrity

The integration architecture includes:

* Reusable integration test factories
* Automated cleanup helpers
* Test isolation patterns
* Shared test utilities

---

# 🌐 Cypress UI Testing

Run:

```bash
npm run uiTests
```

The Cypress suite validates:

* Homepage rendering
* Cruise line rendering
* Ship lookup workflows
* Search/filter functionality
* Empty-state handling
* Result count validation
* UI state restoration
* API health validation
* SQA Test Control Panel workflows
* Cruise line → ship relationship flows
* API-driven UI assertions
* Dynamic data validation from live endpoints

The Cypress implementation intentionally avoids hardcoded values and instead uses:

```text
live API-driven validation
```

for stronger automation reliability and maintainability.

---

# 🔧 Additional Test Commands

## Open Cypress Interactive Runner

```bash
npm run uiTests:open
```

---

## Run Cypress Headless CI Mode

```bash
npm run uiTests:ci
```

---

## Run Jest In Watch Mode

```bash
npm run unitTestsWatch
```

---

## Run All Tests

```bash
npm test
```

Runs:

* Unit tests
* Integration tests
* Cypress UI tests

---

# 📊 Code Coverage

Run:

```bash
npm run coverage
```

Coverage reporting includes:

* Statement coverage
* Branch coverage
* Function coverage
* Line coverage

Coverage thresholds are enforced to prevent regression in quality standards.

Reports are generated in:

```text
/coverage
```

---

# ⚙️ Continuous Integration

This repository uses:

```text
GitHub Actions
```

for automated quality enforcement.

The CI pipeline includes:

## Unit Test Job

* Controller business-rule validation
* Validation middleware testing
* Zod schema testing

## Integration Test Job

* PostgreSQL-backed API testing
* API contract validation
* Negative-path validation

## Cypress UI Test Job

* Browser-based end-to-end validation
* API-driven UI verification
* Frontend/API integration validation

All pull requests must pass CI validation before merge.

---

# 📊 Data Seeding

Cruise data is automatically loaded from:

```text
/data/cruise.json
```

on application startup.

No manual migrations or seed commands are required.

---

# 🐳 Docker

PostgreSQL runs via Docker.

Run manually if needed:

```bash
docker compose up -d
```

Normally this is automatically handled through:

```bash
npm start
```

---

# 🧠 Design & Engineering Focus

This repository emphasizes:

* Separation of concerns
* Validation middleware architecture
* Testable application design
* API contract enforcement
* Layered testing strategy
* API-driven UI validation
* Reusable testing architecture
* CI-driven quality enforcement
* Negative-path testing strategy
* Enterprise-style validation patterns
* Production-style project organization
* Maintainable automation architecture

---

# 📈 Testing Roadmap & Future Enhancements

This repository will continue evolving into a broader quality engineering platform.

## API & Integration Testing

* Expand transactional integration testing
* Add schema-based response validation
* Add fault-injection testing
* Add resilience testing patterns

---

## Cypress Expansion

* Expand Cypress coverage for full CRUD workflows
* Add advanced UI interaction scenarios
* Add frontend negative-path testing
* Add multi-user workflow validation

---

## Cross-Browser Automation

* Add Playwright cross-browser testing
* Compare automation strategies between Cypress and Playwright

---

## Performance Testing

Add:

* k6
* Artillery

for:

* Load testing
* Throughput analysis
* Response-time benchmarking

---

## Security Testing

Add:

* OWASP ZAP
* Dependency vulnerability scanning
* Injection attack validation
* Automated security scanning workflows

---

## Advanced Test Architecture

Expand:

* Data builders
* Environment-aware configuration
* Advanced fixture strategies
* Contract testing
* Service virtualization

---

## CI/CD Expansion

Add:

* Parallelized test execution
* Test artifacts/report publishing
* Advanced coverage enforcement
* Automated quality dashboards

---

This roadmap reflects a:

```text
quality-first engineering philosophy
```

where testing, validation, and reliability are treated as core system architecture concerns.

---

# 👤 Author

## Jay Gallagher

Principal Software Quality Engineer with:

* 30+ years in SQA
* Automation engineering leadership
* Frontend and API automation expertise
* Enterprise testing architecture experience
* CI/CD and validation strategy experience
* Full-stack development capabilities

This project was built to demonstrate:

* Real-world testing architecture
* Full-system validation strategies
* Modern QA engineering practices
* Maintainable automation design
* Production-minded engineering patterns

---

# 📄 License

MIT

