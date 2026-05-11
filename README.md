# 🚢 Cruise Explorer API & Frontend

![CI](https://github.com/JayG67/cruise/actions/workflows/ci.yml/badge.svg)

![Coverage](https://img.shields.io/badge/coverage-enforced-green)

A full-stack cruise data application built with **Node.js, Express, PostgreSQL (Drizzle ORM), Zod, Cypress, Jest, and Supertest**.

This repository has evolved into an **enterprise-style Software Quality Engineering showcase**, demonstrating layered testing architecture, API contract validation, CI enforcement, integration testing, validation middleware, negative-path testing, UI automation, frontend/API integration, and incremental full-stack CRUD development.

---

# 📌 Project Purpose

This repository serves as a **portfolio project focused on demonstrating advanced Software Quality Engineering practices within a full-stack application**.

The primary goals are to demonstrate:

* Enterprise-style layered testing architecture
* API contract validation and negative-path testing
* Unit, integration, and end-to-end UI testing
* API-driven Cypress testing using controlled mocked responses and live application behavior where appropriate
* Validation middleware and schema enforcement
* CI-driven quality gates and automated validation
* Real-world test architecture and maintainable automation patterns
* Practical full-stack engineering with quality-first design
* Incremental UI feature delivery with test coverage added alongside functionality

Rather than relying on sample applications, this project was intentionally designed and developed as a controlled environment for implementing modern QA engineering practices, tooling, automation strategies, and portfolio-quality engineering workflows.

This repository reflects the mindset of a:

```text
Principal Software Quality Engineer
```

where reliability, validation, automation, observability, maintainability, and testability are treated as foundational architectural concerns.

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
* ✅ Database reset/reseed behavior on application startup
* ✅ Frontend dashboard consuming API data
* ✅ Built-in SQA Test Control Panel
* ✅ Real-time cruise line search filtering
* ✅ Dynamic result counts
* ✅ API-driven frontend rendering
* ✅ Full CRUD API support
* ✅ Create cruise line from the UI
* ✅ Create ships during the new cruise line workflow
* ✅ Form validation and user feedback in the UI
* ✅ Loading and reset states in the create workflow
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
* ✅ CI-driven quality enforcement
* ✅ Enforced test coverage thresholds
* ✅ Centralized Cypress selector management
* ✅ Stable UI automation using data-cy attributes

---

# 📊 Current CRUD Status

The API supports full CRUD for cruise lines and ships.

The frontend is being expanded incrementally so each workflow can be designed, reviewed, and tested in manageable steps.

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| Cruise Lines | ✅ UI + API | ✅ UI + API | ✅ API | ✅ API |
| Ships | ✅ UI during cruise line creation + API | ✅ UI + API | ✅ API | ✅ API |

## Current Frontend CRUD Behavior

The UI currently supports:

* Viewing cruise lines
* Searching/filtering cruise lines
* Viewing ships for a selected cruise line
* Creating a new cruise line
* Adding one or more ships while creating a cruise line
* Resetting the create form
* Handling create-workflow validation errors
* Handling create-workflow API failures

Planned future UI work includes:

* Editing cruise lines from the UI
* Deleting cruise lines from the UI
* Editing ships from the UI
* Deleting ships from the UI
* Managing ships after a cruise line already exists

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
├── app.js              # Express app export for testing
├── index.js            # Server startup
├── docker-compose.yml  # PostgreSQL container
```

---

# ▶️ Getting Started

No environment configuration is required for standard local development.

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

* Cruise-themed landing page
* Live cruise line rendering
* Ship lookup by cruise line
* Real-time search filtering
* Dynamic search result counts
* API-driven UI rendering
* Create cruise line form
* Add one or more ships during cruise line creation
* Optional country and website fields
* Form reset behavior
* Loading state during create requests
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
* Frontend API interaction concerns
* Mocked UI failure scenarios

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
* Dynamic data validation from API responses
* Create cruise line workflow behavior
* Create cruise line validation behavior
* Create cruise line failure handling
* Edge cases for search, ships, homepage, and create workflow behavior


The Cypress implementation uses a combination of:

```text
live API-driven validation
```

and:

```text
controlled mocked API responses
```

This allows tests to validate real application behavior while also preventing UI tests from polluting the database with persistent test records.

# 🧩 Cypress Selector Architecture

The Cypress automation framework now uses a:

```text
centralized selector architecture
```

to improve maintainability and reduce brittle UI test dependencies.

Rather than hardcoding selectors throughout multiple Cypress test files, shared selectors are now maintained in:

```text
cypress/support/selectors.js
```

This provides:

* Single-source selector management
* Easier UI refactoring support
* Reduced maintenance overhead
* Improved test readability
* Cleaner automation architecture
* More scalable frontend test design

---

## Stable UI Automation Using `data-cy`

The frontend now includes dedicated:

```text
data-cy
```

attributes for Cypress automation targeting.

Example:

```html
<input data-cy="create-cruise-line-name" />
```

instead of relying on:

* Styling classes
* Layout structure
* Fragile DOM traversal
* Presentation-oriented selectors

This reflects modern enterprise UI automation practices where test selectors are intentionally separated from styling concerns.

---

## Benefits of the Selector Architecture

This approach improves:

* UI test stability
* Refactor safety
* Automation maintainability
* Team scalability
* Test readability
* Long-term regression reliability

If a UI identifier changes, selectors only need to be updated in one centralized location instead of throughout all Cypress test suites.

---

## Example Usage

Instead of:

```js
cy.get('#create-cruise-line-name')
```

tests now use shared selectors:

```js
cy.get(selectors.createCruiseLine.nameInput)
```

This creates a cleaner separation between:

```text
automation logic
```

and:

```text
UI implementation details
```

which mirrors enterprise automation engineering practices used in large-scale QA organizations.
---

# ✅ Expanded Cypress Coverage

## Home Page / SQA Control Panel Coverage

The home Cypress suite validates:

* Page rendering
* Manual validation panel rendering
* SQA control availability
* API health check success
* API health check failure
* Cruise data verification success
* Cruise data verification failure
* UI smoke check success
* UI smoke check failure
* Manual test output clearing
* Non-array API response handling
* Failed dependency reporting

---

## Search Coverage

The search Cypress suite validates:

* Cruise line search filtering
* Case-insensitive search behavior
* Partial-match search behavior
* Whitespace handling
* Empty search behavior
* No-result behavior
* Dynamic result count behavior
* Search state restoration
* API-backed rendering behavior
* Edge cases for unusual search input

---

## Ship Coverage

The ship Cypress suite validates:

* Ship rendering by selected cruise line
* Cruise line selection behavior
* Empty ship list behavior
* Missing ship data behavior
* Invalid ship API response behavior
* Ship API failure behavior
* Cruise line switching behavior
* UI messaging when no ships exist
* Relationship behavior between cruise lines and ships

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
* Negative-path testing strategy
* Edge-case testing strategy
* Enterprise-style validation patterns
* Production-style project organization
* Maintainable automation architecture
* Incremental feature delivery
* Quality-first frontend and backend development

---

# 📈 Testing Roadmap & Future Enhancements

This repository will continue evolving into a broader quality engineering platform.

## Frontend CRUD Expansion

* Add edit cruise line workflow to the UI
* Add delete cruise line workflow to the UI
* Add ship management for existing cruise lines
* Add edit ship workflow to the UI
* Add delete ship workflow to the UI
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
* Incremental feature delivery with strong automated regression coverage

---

# 📄 License

ISC
