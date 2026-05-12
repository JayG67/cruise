# 🚢 Cruise Explorer API & Frontend

![CI](https://github.com/JayG67/cruise/actions/workflows/ci.yml/badge.svg)

![Coverage](https://img.shields.io/badge/coverage-enforced-green)

[![Live Demo](https://img.shields.io/badge/live-demo-brightgreen)](https://cruise-explorer.onrender.com/)

A full-stack cruise data application built with **Node.js, Express, PostgreSQL (Drizzle ORM), Zod, Cypress, Jest, Supertest, GitHub Actions, Render, and Docker**.

This repository has evolved into an **enterprise-style Software Quality Engineering showcase**, demonstrating layered testing architecture, API contract validation, CI/CD enforcement, integration testing, validation middleware, negative-path testing, frontend/API integration, CRUD workflows, and maintainable automation design.

---

# 📌 Project Purpose

This repository serves as a **portfolio project focused on demonstrating advanced Software Quality Engineering practices within a full-stack application**.

The primary goals are to demonstrate:

* Enterprise-style layered testing architecture
* API contract validation and negative-path testing
* Unit, integration, and end-to-end UI testing
* API-driven Cypress testing using mocked and live application behavior
* Validation middleware and schema enforcement
* CI-driven quality gates and automated validation
* Real-world test architecture and maintainable automation patterns
* Practical full-stack engineering with quality-first design
* Incremental feature delivery with parallel automated regression coverage
* Production-style deployment workflows
* Infrastructure-as-code concepts using Render blueprints

Rather than relying on sample applications, this project was intentionally designed and developed as a controlled environment for implementing modern QA engineering practices, tooling, automation strategies, and portfolio-quality engineering workflows.

This repository reflects the mindset of a:

```text
Principal Software Quality Engineer
```

where reliability, validation, automation, observability, maintainability, deployment strategy, and testability are treated as foundational architectural concerns.

---

# 🚀 Live Demo

```text
https://cruise-explorer.onrender.com/
```

---

# 🧱 Architecture

```text
Frontend (HTML/CSS/Vanilla JavaScript)
        ↓
Express API
(Routes → Validation Middleware → Controllers → Services)
        ↓
Drizzle ORM
        ↓
PostgreSQL
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

## Deployment & Infrastructure

* Render Web Services
* Managed PostgreSQL
* Continuous Deployment
* GitHub-based deployment automation
* Infrastructure-as-code via `render.yaml`

---

# 🚀 Features

* ✅ Cruise line management
* ✅ Ship management by cruise line
* ✅ RESTful API architecture
* ✅ Automatic database initialization
* ✅ Automatic seed data loading from JSON
* ✅ Database reset/reseed behavior on application startup
* ✅ Frontend dashboard consuming API data
* ✅ Professional dashboard-style UI
* ✅ Live deployment with continuous deployment workflows
* ✅ Built-in SQA Test Control Panel
* ✅ Real-time cruise line search filtering
* ✅ Dynamic result counts
* ✅ API-driven frontend rendering
* ✅ Full CRUD API support
* ✅ Create cruise line from the UI
* ✅ Create ships during the new cruise line workflow
* ✅ Update cruise lines from the UI
* ✅ Update existing ships during cruise line updates
* ✅ Add new ships during cruise line updates
* ✅ Dynamic update workflow panels
* ✅ Form validation and user feedback in the UI
* ✅ Loading and reset states in CRUD workflows
* ✅ Zod-based API contract validation
* ✅ Strict request payload validation
* ✅ UUID validation
* ✅ URL validation
* ✅ Standardized validation error responses
* ✅ Negative-path API validation
* ✅ Integration testing against PostgreSQL
* ✅ Cypress UI testing with mocked API responses where appropriate
* ✅ Reusable integration test helpers/factories
* ✅ Validation middleware unit testing
* ✅ Zod schema unit testing
* ✅ Controller business-rule unit testing
* ✅ Expanded Cypress positive, negative, and edge-case coverage
* ✅ Centralized Cypress selector management
* ✅ Stable UI automation using data-cy attributes
* ✅ CI-driven quality enforcement
* ✅ Enforced test coverage thresholds
* ✅ Continuous deployment through Render
* ✅ CI-gated deployment workflows

---

# 📊 Current CRUD Status

The API supports full CRUD for cruise lines and ships.

The frontend is being expanded incrementally so each workflow can be designed, reviewed, and tested in manageable steps.

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| Cruise Lines | ✅ UI + API | ✅ UI + API | ✅ UI + API | ✅ API |
| Ships | ✅ UI during cruise line creation + API | ✅ UI + API | ✅ UI during cruise line updates + API | ✅ API |

## Current Frontend CRUD Behavior

The UI currently supports:

* Viewing cruise lines
* Searching/filtering cruise lines
* Viewing ships for a selected cruise line
* Creating a new cruise line
* Adding one or more ships while creating a cruise line
* Updating cruise line information
* Updating existing ships during cruise line updates
* Adding new ships during cruise line updates
* Resetting the create form
* Cancelling update workflows
* Dynamic update form rendering
* Handling create-workflow validation errors
* Handling update-workflow validation errors
* Handling create-workflow API failures
* Handling update-workflow API failures
* Automatic UI refresh after successful updates
* Automatic update-panel dismissal after successful saves

Planned future UI work includes:

* Deleting cruise lines from the UI
* Deleting ships from the UI
* Managing ship removal during update workflows
* Editing ships independently from cruise line updates

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
│   ├── support/        # Shared selectors/helpers
│   └── videos/         # Cypress recordings
├── .github/workflows/  # GitHub Actions CI workflows
├── render.yaml         # Render infrastructure blueprint
├── app.js              # Express app export for testing
├── index.js            # Server startup
├── docker-compose.yml  # PostgreSQL container
```

---

# 🧩 Cypress Selector Architecture

The Cypress automation suite uses:

```text
centralized selector management
```

through shared selector definitions stored in:

```text
cypress/support/selectors.js
```

This allows UI selectors to be maintained in a single location instead of being hardcoded across all test files.

Benefits include:

* Easier maintenance when UI identifiers change
* Improved automation readability
* Reduced selector duplication
* Cleaner regression updates
* More maintainable enterprise-style test architecture

This mirrors enterprise automation engineering practices used in large-scale QA organizations.

---

# ▶️ Getting Started

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
* Clears existing cruise and ship data
* Reloads cruise seed data from JSON
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

Returns application health status.

---

# 🖥️ Frontend

The frontend is served from:

```text
/public
```

## Frontend Features

* Professional dashboard-style landing page
* Live cruise line rendering
* Ship lookup by cruise line
* Real-time search filtering
* Dynamic search result counts
* API-driven UI rendering
* Create cruise line workflow
* Update cruise line workflow
* Dynamic ship editing during updates
* Add new ships during update workflows
* Optional country and website fields
* Form reset behavior
* Dynamic update-panel rendering
* Automatic update-panel dismissal after successful updates
* Loading states during CRUD requests
* Success and error messaging
* SQA Test Control Panel
* API health validation from the UI
* Cruise data validation from the UI
* UI smoke testing from the UI
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
* Dashboard workflow rendering
* Cruise line rendering
* Cruise line search filtering
* Ship rendering by selected cruise line
* Cruise line selection behavior
* Empty-state behavior
* Invalid API response behavior
* Ship API failure behavior
* Cruise line switching behavior
* UI messaging when no ships exist
* Relationship behavior between cruise lines and ships
* SQA test panel workflows
* Health-check workflows
* UI smoke test workflows
* Create workflow validation
* Update workflow validation
* CRUD loading-state behavior
* CRUD success/failure messaging
* API request payload validation
* Mocked failure-path behavior
* Edge-case UI validation
* Deterministic frontend behavior through cy.intercept

---

## Create Cruise Line Coverage

The create cruise line Cypress suite validates:

* Form rendering
* Successful cruise line creation without ships
* Successful cruise line creation with one or more ships
* Multiple ship creation
* Whitespace trimming before submission
* Optional country and website handling
* Blank ship row handling
* Duplicate ship handling
* Remove ship row behavior
* Reset form behavior
* Missing cruise line name validation
* Blank-space-only cruise line name validation
* Create API failure handling
* Fallback error messaging
* Missing cruise line ID response handling
* Ship creation failure after cruise line creation
* Submit button loading/disabled state
* Form clearing after successful create
* Mocked API behavior to avoid persistent database pollution

---

## Update Cruise Line Coverage

The update cruise line Cypress suite validates:

* Update form rendering
* Existing cruise line data prepopulation
* Existing ship prepopulation
* Cruise line detail updates
* Existing ship name updates
* New ship creation during update workflows
* Dynamic ship input rendering
* Validation failures during updates
* Blank cruise line name validation
* Update API failure handling
* Ship-update failure handling
* New-ship creation failure handling
* Cancel update behavior
* Update-form dismissal after successful save
* Loading-state behavior during updates
* UI refresh behavior after updates
* Edge-case update workflows
* Request payload validation
* Mocked API behavior to avoid persistent database pollution

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

# 🚀 Continuous Deployment

This application is deployed using:

* Render Web Services
* Managed PostgreSQL
* GitHub-based automatic deployments

Deployment workflow:

```text
GitHub Push
    ↓
GitHub Actions Test Pipeline
    ↓
Render Automatic Deployment
    ↓
Live Production Demo
```

This architecture demonstrates a production-style continuous deployment workflow where application updates are automatically deployed after code changes are pushed to GitHub.

The deployed environment includes:

* Node.js/Express backend hosting
* Managed PostgreSQL database hosting
* Environment-variable-based configuration
* Automatic application redeployment
* Persistent production hosting
* Predictable startup reseeding behavior for consistent demo data
* Infrastructure-as-code configuration via render.yaml

---

# 📊 Data Seeding

Cruise data is automatically loaded from:

```text
/data/cruise.json
```

on application startup.

The startup seed process resets the cruise and ship data back to the JSON seed state.

This keeps the application predictable by ensuring that only seed data is present when the app starts.

This is useful for:

* Portfolio demos
* Local development
* Repeatable manual testing
* Repeatable UI testing
* Preventing old test-created records from lingering in the application

No manual migrations or seed commands are required for normal startup.

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
* Mocked UI failure-path validation
* Reusable testing architecture
* CI-driven quality enforcement
* CD-driven deployment validation
* Negative-path testing strategy
* Edge-case testing strategy
* Enterprise-style validation patterns
* Production-style project organization
* Maintainable automation architecture
* Incremental feature delivery
* Quality-first frontend and backend development
* Infrastructure-aware engineering workflows

---

# 📈 Testing Roadmap & Future Enhancements

This repository will continue evolving into a broader quality engineering platform.

## Frontend CRUD Expansion

* Add delete cruise line workflow to the UI
* Add ship removal during update workflows
* Add standalone ship management workflows
* Continue expanding Cypress coverage with each new CRUD slice

---

## API & Integration Testing

* Expand transactional integration testing
* Add schema-based response validation
* Add fault-injection testing
* Add resilience testing patterns
* Add more advanced failure-mode validation

---

## Cypress Expansion

* Continue expanding Cypress coverage for full CRUD workflows
* Add advanced UI interaction scenarios
* Add additional frontend negative-path testing
* Add multi-step workflow validation
* Add accessibility-focused UI validation

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

where testing, validation, deployment reliability, and maintainability are treated as core system architecture concerns.

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
* Incremental feature delivery with strong automated regression coverage
* Professional deployment and infrastructure workflows

---

# 📄 License

ISC

