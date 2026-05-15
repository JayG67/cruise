# 🚢 Cruise Explorer

<div align="center">

# Full-Stack Cruise Management Platform & SQA Engineering Portfolio

[![CI](https://github.com/JayG67/cruise/actions/workflows/ci.yml/badge.svg)](https://github.com/JayG67/cruise/actions)
[![Coverage](https://img.shields.io/badge/coverage-enforced-green)](https://github.com/JayG67/cruise)
[![Coverage Report](https://img.shields.io/badge/coverage-report-brightgreen)](https://jayg67.github.io/cruise/coverage/)
[![Live Demo](https://img.shields.io/badge/live-demo-brightgreen)](https://cruise-explorer.onrender.com/)
[![Quality Dashboard](https://img.shields.io/badge/quality-dashboard-success)](https://jayg67.github.io/cruise/)
[![Lighthouse Report](https://img.shields.io/badge/lighthouse-report-orange)](https://jayg67.github.io/cruise/lighthouse/)
[![Deployment](https://img.shields.io/badge/render-deployed-blue)](https://cruise-explorer.onrender.com/)
[![Performance](https://img.shields.io/badge/k6-performance%20smoke-purple)](./performance/cruise-api-smoke.js)
[![Playwright Mobile](https://img.shields.io/badge/playwright-mobile%20testing-45ba4b)](./playwright/mobile/mobile.spec.js)

## 🌐 Live Production Application

# 👉 [Launch Cruise Explorer](https://cruise-explorer.onrender.com/)

## 📊 Live Quality & Validation Visibility

# 👉 [Open Executive Quality Dashboard](https://jayg67.github.io/cruise/)

# 👉 [Open Latest Lighthouse Mobile Audit](https://jayg67.github.io/cruise/lighthouse/)

# 👉 [Open Latest Jest Coverage Report](https://jayg67.github.io/cruise/coverage/)

</div>

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
* Performance validation
* Accessibility and Lighthouse auditing
* Operational QA tooling
* Deployment diagnostics
* Deterministic test isolation
* Centralized Cypress selector architecture

Unlike a tutorial or sample project, this application evolved incrementally through:

* architecture refactors
* UI redesigns
* deployment improvements
* expanding CRUD workflows
* growing automated regression coverage
* real-world negative-path testing
* continuous integration enforcement
* operational tooling expansion
* performance auditing
* production-safe deployment workflows

The result is a portfolio repository designed to demonstrate:

```text
how an experienced SQA engineer approaches system quality end-to-end
```

---

# ⚡ Quick Start

## Install Dependencies

```bash
npm install
```

---

## Start The Application

```bash
npm start
```

Application:

```text
http://localhost:8000
```

---

# ✅ Validation Commands

## Run Standard Validation

```bash
npm test
```

Runs:

* Unit tests
* Jest coverage
* Integration tests
* Cypress UI tests

---

## Run Full Pre-Push Validation

```bash
npm run test:all
```

Runs:

* Unit tests
* Jest coverage
* Integration tests
* Cypress UI tests
* Playwright mobile tests
* k6 performance smoke tests
* Lighthouse mobile audits

This is the same validation flow intended before pushing into CI/CD or production deployment.

---



## Latest Published Quality Dashboard

The latest CI-generated quality dashboard is published through GitHub Pages:

```text
https://jayg67.github.io/cruise/
```

It provides an executive-friendly summary of:

* live deployment status
* CI validation results
* unit, integration, Cypress, k6, and Lighthouse quality gates
* Lighthouse mobile scores
* links to workflow runs and detailed reports

## Latest Published Coverage Report

The latest CI-generated Jest coverage report is published through GitHub Pages:

```text
https://jayg67.github.io/cruise/coverage/
```

Coverage is run as part of:

* `npm test`
* `npm run test:all`
* GitHub Actions CI

The Quality Dashboard also displays coverage summary percentages for statements, branches, functions, and lines.

## Latest Published Lighthouse Report

The latest CI-generated Lighthouse mobile report is published through GitHub Pages:

```text
https://jayg67.github.io/cruise/lighthouse/
```

This same report is linked from:

* the GitHub Actions job summary
* the GitHub Actions artifact list
* the deployed application's SQA control panel


---

# 🔎 Specialized Validation Commands

## Run Cypress UI Tests

```bash
npm run uiTests
```

---

## Run Playwright Mobile Tests

```bash
npm run playwright:mobile:local
```

Validates:

* mobile Chrome rendering
* mobile Safari rendering
* tablet rendering
* responsive navigation
* mobile SQA quality links
* cruise-card action visibility
* no horizontal page overflow

---

## Run k6 Performance Smoke Tests

```bash
npm run perf:smoke:local
```

---

## Run Lighthouse Mobile Audit

```bash
npm run lighthouse:mobile:local
```

Validates:

* Mobile performance
* Accessibility
* SEO quality
* Browser best practices
* Rendering quality

Lighthouse generates:

```text
lighthouse-report.report.html
lighthouse-report.report.json
```

---

# 🚀 Highlights

## ✅ Live Full-Stack Production Deployment

* Deployed on Render
* Managed PostgreSQL
* Continuous deployment enabled
* CI-gated deployments
* Infrastructure-as-code using `render.yaml`
* Dockerized PostgreSQL local infrastructure
* Production/local parity workflows
* Environment-safe configuration strategy

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
* API contract validation

### End-to-End UI Testing

* Cypress
* Positive/negative/edge-case testing
* Mocked API workflows using `cy.intercept`
* CRUD workflow testing
* UI failure-path validation
* Deterministic frontend validation
* Operational workflow validation
* SQA operations console testing

---

## ✅ Interactive SQA Operations Console

The deployed application includes a fully interactive:

```text
SQA Test Control Panel
```

built directly into the production UI.

The console provides browser-driven operational validation tooling including:

* API health validation
* Cruise-data verification
* UI smoke testing
* API contract validation
* CRUD workflow safety validation
* Performance smoke checks
* Seed-data integrity validation
* Rendering consistency validation
* Deployment diagnostics
* Public demo data recovery

The console intentionally demonstrates:

* operational quality tooling
* frontend observability
* runtime diagnostics
* production-safe QA workflows
* recruiter-friendly deployment transparency
* browser-driven operational testing

All SQA console workflows include Cypress regression coverage.

---

# ✅ Performance, Accessibility & Quality Auditing

## k6 Performance Smoke Validation

The project includes lightweight API smoke validation using:

```text
k6
```

The smoke suite validates:

* API responsiveness
* endpoint availability
* JSON contract responses
* response-time thresholds
* runtime stability

Run locally:

```bash
npm run perf:smoke:local
```

Run against production:

```bash
BASE_URL=https://cruise-explorer.onrender.com npm run perf:smoke
```

Thresholds:

```js
http_req_failed: ['rate<0.01']
http_req_duration: ['p(95)<500']
checks: ['rate>0.99']
```

---

## Lighthouse Mobile Auditing

The project includes automated Lighthouse auditing for:

* Mobile performance
* Accessibility
* SEO quality
* Best-practices validation

Run locally:

```bash
npm run lighthouse:mobile:local
```

Generated artifacts:

```text
lighthouse-report.report.html
lighthouse-report.report.json
```

This intentionally demonstrates:

* frontend performance awareness
* accessibility engineering
* production-quality auditing
* deployment validation
* modern browser-quality tooling

---

# ✅ Full CRUD Workflows

## Cruise Lines

* Create
* Read
* Update
* Delete

## Ships

* Create
* Read
* Update
* Delete

Including:

* Dynamic update forms
* Ship management during cruise-line updates
* Ship deletion workflows
* UI refresh synchronization
* Form validation and failure handling
* Search synchronization
* State cleanup after destructive operations

---

# 🖥️ Application Preview

The deployed application currently includes:

* Dashboard-style responsive UI
* Cruise-line management
* Ship management by cruise line
* Dynamic search/filtering
* Live API-driven rendering
* CRUD workflow panels
* SQA validation dashboard
* Performance validation tooling
* Deployment diagnostics
* Automated reseeding workflows
* Operational testing utilities

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
* Lighthouse
* Playwright
* GitHub Actions

## Deployment & Infrastructure

* Render Web Services
* Managed PostgreSQL
* Continuous Deployment
* Infrastructure-as-code via `render.yaml`

---

# 📊 Current CRUD Status

| Entity       | Create     | Read       | Update     | Delete     |
| ------------ | ---------- | ---------- | ---------- | ---------- |
| Cruise Lines | ✅ UI + API | ✅ UI + API | ✅ UI + API | ✅ UI + API |
| Ships        | ✅ UI + API | ✅ UI + API | ✅ UI + API | ✅ UI + API |

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

The project intentionally separates:

* schema validation
* middleware validation
* controller business rules
* integration workflows
* browser workflows
* operational tooling validation
* performance validation
* accessibility auditing

into distinct testing layers.

---

# 🧪 Layered Validation Strategy

| Validation Layer           | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| Unit Tests                 | Business-rule and validation isolation      |
| Integration Tests          | PostgreSQL-backed API validation            |
| Cypress UI Tests           | Full browser workflow validation            |
| SQA Operations Console     | Runtime operational validation tooling      |
| k6 Performance Smoke Tests | API responsiveness and stability validation |
| Lighthouse Audits          | Mobile quality and accessibility auditing   |

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
* k6 performance validation
* Lighthouse mobile score enforcement
* deployment gating
* automated validation

All deployments are protected by CI validation.

---

# 🚀 Continuous Deployment

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
* deterministic automation
* quality-first system design
* operational tooling
* runtime diagnostics
* accessibility awareness
* performance engineering

---

# 📈 Future Expansion Roadmap

## Frontend Expansion

* React frontend migration
* Additional dashboard analytics
* Better mobile responsiveness
* Advanced ship-management workflows
* Additional accessibility improvements

---

## Testing Expansion

* Mobile viewport testing
* Visual regression testing
* Cross-browser Playwright coverage
* Advanced load and stress testing
* Security scanning
* Lighthouse score enforcement in CI

---

# 👤 Author

## Jay Gallagher

Senior / Principal Software Quality Engineer

This project was intentionally built to demonstrate:

* enterprise QA engineering practices
* modern automation architecture
* maintainable test design
* operational validation tooling
* deployment-safe engineering workflows
* quality-first software delivery
* full-stack engineering capability
