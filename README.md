# 🚢 Cruise Explorer

<div align="center">

# Full-Stack Cruise Management Platform & SQA Engineering Portfolio

[![CI](https://github.com/JayG67/cruise/actions/workflows/ci.yml/badge.svg)](https://github.com/JayG67/cruise/actions)
[![Coverage](https://img.shields.io/badge/coverage-enforced-green)](https://github.com/JayG67/cruise)
[![Live Demo](https://img.shields.io/badge/live-demo-brightgreen)](https://cruise-explorer.onrender.com/)
[![Deployment](https://img.shields.io/badge/render-deployed-blue)](https://cruise-explorer.onrender.com/)
[![Performance](https://img.shields.io/badge/k6-performance%20smoke-purple)](./performance/cruise-api-smoke.js)

## 🌐 Live Production Application

# 👉 [Launch Cruise Explorer](https://cruise-explorer.onrender.com/)

</div>

---

# ⚡ Quick Start

## Run The Full Application Locally

```bash
npm install
npm start
```

Application:

```text
http://localhost:8000
```

---

## Run Standard Validation

```bash
npm test
```

Runs:

* Unit tests
* Integration tests
* Cypress UI tests

---

## Run Full Pre-Push Validation

```bash
npm run test:all
```

Runs:

* Unit tests
* Integration tests
* Cypress UI tests
* k6 performance smoke tests

This is the same command intended for final local validation before pushing into CI/CD.

---

# 📌 What This Repository Demonstrates

This repository is intentionally designed as a:

```text
Senior-Level Software Quality Engineering Portfolio Project
```

It demonstrates:

* Full-stack application development
* Enterprise-style layered testing architecture
* API contract validation
* CRUD workflow engineering
* Frontend + backend integration testing
* CI/CD deployment pipelines
* Infrastructure-aware engineering
* Maintainable automation design
* Quality-first system architecture
* Production-style deployment workflows
* Performance smoke testing with k6
* Incremental feature delivery with expanding regression coverage
* Public-demo operational safety controls
* Browser-driven validation tooling
* Deterministic test isolation
* Centralized Cypress selector architecture

Unlike a tutorial or sample project, this application evolved incrementally through:

* architecture refactors
* UI redesigns
* deployment improvements
* expanding CRUD workflows
* growing automated regression coverage
* real-world negative-path testing
* continuous integration and deployment enforcement
* performance validation
* operational tooling improvements

The result is a portfolio repository designed to show:

```text
how an experienced SQA engineer approaches system quality end-to-end
```

---

# 🚀 Highlights

## ✅ Live Full-Stack Production Deployment

* Deployed on Render
* Managed PostgreSQL
* Continuous deployment enabled
* CI-gated deployments
* Infrastructure-as-code using `render.yaml`
* Dockerized local PostgreSQL infrastructure
* Environment-safe configuration strategy
* Production and local parity workflows

---

## ✅ Enterprise-Style Testing Architecture

### Unit Testing

* Jest
* Validation middleware testing
* Zod schema testing
* Controller business-rule testing
* Service-layer validation
* Negative-path validation

### Integration Testing

* Supertest
* PostgreSQL-backed integration workflows
* Full CRUD API validation
* Relationship integrity testing
* Seed reset validation
* Contract validation

### End-to-End UI Testing

* Cypress
* Positive/negative/edge-case testing
* Mocked API workflows using `cy.intercept`
* CRUD workflow testing
* UI failure-path validation
* Deterministic frontend validation
* SQA operations console testing
* Operational workflow validation

---

## ✅ Interactive SQA Operations Console

The application includes a fully interactive:

```text
SQA Test Control Panel
```

built directly into the deployed application.

The console provides browser-driven operational validation tools including:

* API health validation
* Cruise-data contract verification
* UI smoke testing
* CRUD workflow safety validation
* Performance smoke checks
* Seed-data integrity validation
* Rendering consistency checks
* Deployment diagnostics
* Public demo data recovery

The console intentionally demonstrates:

* operational quality tooling
* runtime diagnostics
* frontend observability
* manual QA tooling design
* production-safe validation workflows
* recruiter-friendly deployment transparency

All SQA console workflows include Cypress regression coverage.

---

## ✅ Performance Smoke Testing

* k6 API performance smoke coverage
* CI-safe response-time thresholds
* Success-rate and JSON-response checks
* Core API workflow coverage for health, cruise lines, and ship lookup
* Environment-driven `BASE_URL` support for local, CI, and deployed targets

The performance test is intentionally lightweight. It is designed to catch obvious response-time or availability regressions without creating a brittle or expensive load-testing process.

```bash
npm run perf:smoke
```

Run against the live deployment:

```bash
BASE_URL=https://cruise-explorer.onrender.com npm run perf:smoke
```

---

## ✅ Full CRUD Workflows

### Cruise Lines

* Create
* Read
* Update
* Delete

### Ships

* Create
* Read
* Update
* Delete

Including:

* Dynamic update forms
* Ship management during cruise line updates
* Ship deletion workflows
* UI refresh synchronization
* Form validation and failure handling
* Search synchronization
* State cleanup after destructive operations

---

## ✅ Modern Deployment Workflow

```text
GitHub Push
    ↓
GitHub Actions CI Pipeline
    ↓
Automated Test Validation
    ↓
Render Continuous Deployment
    ↓
Live Production Application
```

---

# 🖥️ Application Preview

The deployed application currently includes:

* Dashboard-style responsive UI
* Cruise line management
* Ship management by cruise line
* Dynamic search/filtering
* Live API-driven rendering
* CRUD workflow panels
* SQA validation dashboard
* Performance validation tooling
* Deployment diagnostics
* Automated data reseeding behavior
* Full deployment pipeline integration
* Operational testing utilities

Future enhancements may include:

* CI screenshots
* Cypress execution screenshots
* k6 performance output examples
* architecture diagrams
* animated workflow demonstrations
* visual regression testing

---

# 🧱 Architecture

```text
Frontend (HTML / CSS / Vanilla JavaScript)
        ↓
Express API
(Routes → Validation → Controllers → Services)
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
* Zod

## Frontend

* HTML
* CSS
* Vanilla JavaScript

## Testing & Quality Engineering

* Jest
* Supertest
* Cypress
* k6
* GitHub Actions

## Deployment & Infrastructure

* Render Web Services
* Managed PostgreSQL
* Continuous Deployment
* Infrastructure-as-code via `render.yaml`

---

# 📊 Current CRUD Status

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| Cruise Lines | ✅ UI + API | ✅ UI + API | ✅ UI + API | ✅ UI + API |
| Ships | ✅ UI + API | ✅ UI + API | ✅ UI + API | ✅ UI + API |

---

# 🚀 Major Features

## Cruise Explorer Dashboard

* Dynamic cruise line cards
* Search filtering
* Live ship lookup
* Dashboard-style responsive UI
* API-driven frontend rendering
* Operational validation tooling

---

## Create Workflow

Users can:

* Create cruise lines from the UI
* Add multiple ships during creation
* Dynamically add/remove ship rows
* Reset forms
* Receive validation feedback
* Receive API failure feedback

Cypress coverage includes:

* Positive workflows
* Negative workflows
* Edge cases
* Payload validation
* Loading-state validation
* Failure-path testing

---

## Update Workflow

Users can:

* Update cruise line information
* Edit existing ships
* Add new ships during updates
* Delete ships during updates
* Cancel update workflows
* Receive validation and API feedback
* Automatically refresh UI after save

Cypress coverage includes:

* Form rendering
* Validation failures
* Ship update workflows
* Ship delete workflows
* API failure handling
* Partial failure validation
* Edge-case testing
* Request payload validation
* UI synchronization validation

---

## Delete Workflow

Users can:

* Delete cruise lines
* Delete ships independently
* Confirm destructive actions
* Automatically refresh related UI panels

Cypress coverage includes:

* Delete confirmations
* Cancel workflows
* API failure handling
* Refresh synchronization
* Selected-item state cleanup
* Search-filtered deletion
* Failure-path validation

---

## SQA Control Panel

The SQA control panel includes:

| Validation Tool | Purpose |
|---|---|
| API Health Check | Verify application availability |
| Cruise Data Verification | Validate cruise payload responses |
| UI Smoke Check | Validate primary UI workflows |
| API Contract Check | Validate runtime API schema shape |
| Safe CRUD Workflow Check | Create/update/delete temporary records |
| Performance Smoke Check | Validate response-time thresholds |
| Seed Integrity Check | Verify predictable seed-state behavior |
| Rendering Consistency Check | Validate rendered UI against API data |
| Deployment Diagnostics | Show runtime and deployment metadata |
| Demo Data Recovery | Restore production demo data |

This operational tooling was intentionally designed to demonstrate:

* quality observability
* operational diagnostics
* production-safe validation
* recruiter-friendly deployment transparency
* browser-driven QA tooling

---

# 🧪 Testing Philosophy

This repository intentionally follows:

```text
quality-first engineering
```

where:

* validation
* observability
* maintainability
* deployment safety
* regression protection
* deterministic automation

are treated as core architectural concerns.

The project separates:

* schema validation
* middleware validation
* controller business rules
* integration workflows
* browser workflows
* operational tooling validation
* performance validation

into distinct testing layers.

---

# 🧪 Testing Strategy

## Unit Tests

Run:

```bash
npm run unitTests
```

Validates:

* Controller logic
* Validation middleware
* Zod schemas
* Business rules
* Error forwarding
* CRUD orchestration

---

## Integration Tests

Run:

```bash
npm run integrationTests
```

Validates:

* PostgreSQL-backed CRUD behavior
* Relationship integrity
* Validation enforcement
* UUID validation
* API contract integrity
* Cascade delete behavior
* Negative-path workflows
* Demo reset behavior

---

## Cypress UI Tests

Run:

```bash
npm run uiTests
```

Validates:

* Dashboard rendering
* Search filtering
* Ship workflows
* CRUD workflows
* Validation failures
* API failure handling
* Loading states
* Success/error messaging
* Edge-case workflows
* Frontend/API integration
* Delete workflows
* Update workflows
* Create workflows
* Ship delete workflows
* UI synchronization after CRUD actions
* SQA control panel workflows
* Operational validation tooling

The Cypress suite heavily uses:

```text
cy.intercept()
```

for:

* deterministic test behavior
* failure simulation
* payload validation
* UI isolation
* regression stability

---

## k6 Performance Smoke Tests

Run:

```bash
npm run perf:smoke
```

Or run complete validation:

```bash
npm run test:all
```

Validates:

* API responsiveness
* health endpoint availability
* cruise endpoint stability
* ship lookup performance
* JSON contract responses
* response-time thresholds
* CI-safe performance validation

Thresholds:

```js
http_req_failed: ['rate<0.01']
http_req_duration: ['p(95)<500']
checks: ['rate>0.99']
```

---

# 🧩 Cypress Selector Architecture

The Cypress suite uses:

```text
centralized selector management
```

through:

```text
cypress/support/selectors.js
```

This prevents hardcoded selectors from being scattered throughout the automation suite.

Benefits:

* easier maintenance
* reduced duplication
* scalable automation design
* enterprise-style test architecture
* easier UI refactoring

---

# ⚙️ Continuous Integration

This repository uses:

```text
GitHub Actions
```

for:

* unit test execution
* integration test execution
* Cypress execution
* k6 performance smoke validation
* automated validation
* deployment gating

All deployments are protected by CI validation.

---

## ✅ Layered Validation Workflow

This repository intentionally separates testing into distinct quality layers.

| Validation Layer | Purpose |
|---|---|
| Unit Tests | Business-rule and validation isolation |
| Integration Tests | PostgreSQL-backed API validation |
| Cypress UI Tests | Full browser workflow validation |
| SQA Operations Console | Runtime operational validation tooling |
| k6 Performance Smoke Tests | API responsiveness and availability validation |

This layered architecture mirrors real-world enterprise quality engineering practices where different validation layers protect against different classes of defects.

---

# 🚀 Continuous Deployment

The application uses:

* Render Web Services
* Managed PostgreSQL
* CI-gated deployment workflows
* Infrastructure-as-code via `render.yaml`

Deployment workflow:

```text
GitHub Push
    ↓
GitHub Actions Validation
    ↓
Render Deployment
    ↓
Live Production Application
```

This mirrors modern enterprise deployment workflows.

---

# 📂 Project Structure

```text
cruise/
│
├── controllers/
├── middleware/
├── validation/
├── models/
├── routes/
├── services/
├── db/
├── data/
├── public/
├── performance/
├── tests/
│   ├── unit/
│   └── integration/
├── cypress/
│   ├── e2e/
│   ├── support/
│   ├── screenshots/
│   └── videos/
├── .github/workflows/
├── render.yaml
├── docker-compose.yml
├── app.js
└── index.js
```

---

# ▶️ Local Setup

## Install Dependencies

```bash
npm install
```

---

## Install k6 (macOS)

```bash
brew install k6
```

---

## Start The Application

```bash
npm start
```

This automatically:

* Starts PostgreSQL
* Initializes the database
* Clears old data
* Reloads seed data
* Starts the Express server

---

## Open The App

```text
http://localhost:8000
```

---

# 🔌 API Endpoints

## Cruise Lines

```text
GET /cruise
POST /cruise/cruise-line
PATCH /cruise/cruise-line/:id
DELETE /cruise/cruise-line/:id
```

---

## Ships

```text
GET /cruise/ships/:cruiseLineId
POST /cruise/ship
PATCH /cruise/ship/:id
DELETE /cruise/ship/:id
```

---

## Health

```text
GET /health
```

---

# 📊 Data Seeding

Cruise data loads automatically from:

```text
/data/cruise.json
```

on startup.

The startup process reseeds the database so the application always starts from a predictable known state.

This is useful for:

* portfolio demos
* repeatable testing
* consistent UI behavior
* deterministic automation
* recruiter-safe production exploration

The production application also includes:

```text
Reset Demo Data
```

inside the SQA control panel so public demo users can safely restore the dataset after CRUD experimentation.

---

# 🐳 Docker

PostgreSQL runs through Docker.

```bash
docker compose up -d
```

is automatically handled by:

```bash
npm start
```

for local development.

Additional helper commands:

```bash
npm run db:up
npm run db:down
npm run db:reset
```

---

# 🧠 Engineering Focus

This repository emphasizes:

* layered testing strategy
* API contract enforcement
* maintainable automation
* negative-path testing
* edge-case validation
* CRUD workflow engineering
* deployment reliability
* CI/CD discipline
* infrastructure-aware development
* deterministic test architecture
* quality-first system design
* operational tooling
* runtime diagnostics
* maintainable selector architecture

---

# 📈 Future Expansion Roadmap

## Frontend Expansion

* React frontend migration
* Additional dashboard analytics
* Better mobile responsiveness
* Advanced ship management workflows
* Accessibility improvements

---

## Testing Expansion

* Accessibility testing
* Visual regression testing
* Cross-browser Playwright coverage
* Advanced load and stress testing
* Security scanning
* Lighthouse scoring automation

---

## Infrastructure Expansion

* Deployment environments
* Test artifact publishing
* Parallelized CI execution
* Advanced deployment gating
* Observability dashboards

---

# 👤 Author

## Jay Gallagher

Senior / Principal Software Quality Engineer

This project was intentionally built to demonstrate:

* enterprise QA engineering practices
* modern automation architecture
* maintainable test design
* full-stack engineering
* operational validation tooling
* deployment-safe engineering workflows
* quality-first software delivery

