# 🚢 Cruise Explorer API & Frontend

![CI](https://github.com/JayG67/cruise/actions/workflows/ci.yml/badge.svg)

![Coverage](https://img.shields.io/badge/coverage-enforced-green)

A full-stack cruise data application built with **Node.js, Express, PostgreSQL (Drizzle ORM), and Vanilla JavaScript**.

This project demonstrates backend API design, database integration, automated data seeding, a lightweight frontend UI, and a **fully tested CI-driven workflow**.

---

## 📌 Overview

Cruise Explorer is designed as a **portfolio-ready application** showcasing:

* RESTful API development
* Database modeling and relationships
* Automated database initialization & seeding
* Frontend integration with live API data
* Unit, integration, and UI testing strategies
* CI pipeline with automated validation
* Clean project structure aligned with production patterns

---

## 🧱 Architecture

```text
Frontend (Vanilla JS)
        ↓
Express API (Routes → Controllers → Services)
        ↓
Drizzle ORM
        ↓
PostgreSQL (Docker)
```

---

## ⚙️ Tech Stack

### Backend

* Node.js
* Express
* Drizzle ORM
* PostgreSQL
* Docker

### Frontend

* HTML
* CSS
* Vanilla JavaScript (Fetch API)

### Testing

* Jest (unit testing)
* Supertest (integration testing)
* Cypress (end-to-end UI testing)

### CI/CD

* GitHub Actions

  * Unit test job
  * Integration test + coverage job (PostgreSQL service)
  * Cypress UI testing with API-driven validation

---

## 🚀 Features

* ✅ Cruise line management
* ✅ Ship management by cruise line
* ✅ RESTful API endpoints
* ✅ Automatic database table creation on startup
* ✅ Automatic seed data loading from JSON
* ✅ Frontend dashboard consuming live API data
* ✅ Logging middleware
* ✅ Dockerized PostgreSQL environment
* ✅ Full CI pipeline with automated test execution
* ✅ End-to-end UI testing with Cypress
* ✅ API-driven UI test validation
* ✅ Enforced code coverage thresholds

---

## 📂 Project Structure

```text
cruise/
│
├── controllers/        # API controllers
├── models/             # Drizzle schema definitions
├── routes/             # Express routes
├── services/           # DB init + data loading
├── middleware/         # Logging & error handling
├── db/                 # Database connection
├── data/               # Seed JSON data
├── public/             # Frontend (HTML/CSS/JS)
├── tests/              # Unit + integration tests
├── cypress/            # Cypress UI test framework
├── app.js              # Express app (exported for testing)
├── index.js            # Server startup
├── docker-compose.yml  # PostgreSQL container
```

---

## ▶️ Getting Started

No environment configuration is required for local development.

Default values are built into the application. An optional `.env` file can be used to override settings if needed.

### 1. Install dependencies

```bash
npm install
```

---

### 2. Start the application

```bash
npm start
```

This will:

* Start PostgreSQL (Docker)
* Create required tables
* Load seed data
* Start the Express server

---

### 3. Open the app

```text
http://localhost:8000
```

---

## 🔌 API Endpoints

### Cruise Lines

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

### Ships

```text
GET /cruise/ships/:cruiseLineId
```

Returns ships for a cruise line.

---

### Health Check

```text
GET /health
```

---

## 🖥️ Frontend

The frontend is served from:

```text
/public
```

### Features

* Cruise-themed landing page
* Stack selection UI
* Cruise line listing
* Ship lookup per cruise line
* API-driven content rendering
* SQA Test Control Panel
* Real-time search filtering
* Dynamic result counts

---

## 🧪 Testing

### Unit Tests

```bash
npm run unitTests
```

* Controller-level validation
* Mocked database interactions

---

### Integration Tests

```bash
npm run integrationTests
```

* Supertest-based API validation
* Real database interaction (PostgreSQL)
* End-to-end request/response testing

---

### UI Tests (Cypress)

```bash
npm run uiTests
```

* Browser-based end-to-end testing using Cypress
* Validates real user interactions with the UI
* Confirms API-driven UI rendering
* Uses dynamic API-backed test data instead of hardcoded values
* Validates search behavior, filtering logic, result counts, and UI state changes

---

#### Current Cypress Coverage

The Cypress suite currently validates:

* Homepage rendering
* API health checks through the UI
* Cruise line rendering from live API data
* Dynamic search filtering
* Case-insensitive search behavior
* Empty-result handling
* Result count updates
* Search state restoration
* Input persistence during filtering
* API-driven test data validation

---

### Run All Tests

```bash
npm test
```

Runs:

* Unit tests
* Integration tests
* Cypress UI tests

---

### Code Coverage

```bash
npm run coverage
```

The project uses **Jest coverage reporting** to measure:

* Statement coverage
* Branch coverage
* Function coverage
* Line coverage

Coverage reports are generated locally in:

```text
/coverage
```

Coverage thresholds are enforced to ensure code quality does not regress over time.

---

## ⚙️ Continuous Integration

This project uses **GitHub Actions** to automatically validate all changes.

Pipeline includes:

* **Unit Tests Job**

  * Fast validation of business logic

* **Integration Tests Job**

  * Runs against PostgreSQL service
  * Verifies real API behavior

* **Cypress UI Tests Job**

  * Runs browser-based end-to-end tests
  * Validates UI and API integration
  * Validates API-driven UI behavior

All pull requests must pass CI before merging.

---

## 📊 Data Seeding

Data is automatically loaded from:

```text
/data/cruise.json
```

On application startup.

No manual migration or seed commands required.

---

## 🐳 Docker

PostgreSQL runs via Docker:

```bash
docker compose up -d
```

(Automatically handled when running `npm start`)

---

## 🧠 Design Notes

This project emphasizes:

* Separation of concerns (routes → controllers → services)
* Idempotent data seeding
* Testable architecture (app/server separation)
* CI-driven development workflow
* Enforced code coverage thresholds for quality control
* API-driven UI testing using dynamic Cypress test data
* Production-style project organization

---

## 📈 Testing Roadmap & Future Enhancements

This project will continue to expand with a strong emphasis on **enterprise-level testing strategies and tooling**, reflecting real-world Software Quality Engineering practices.

### 🧪 API & Integration Testing

* Expand Supertest coverage across all endpoints (POST, PUT, DELETE)
* Add request/response validation using **Joi or Zod**
* Introduce contract testing with **Pact** to validate API consistency

---

### 🧱 End-to-End Testing

* Implement full UI + API workflows using:

  * **Cypress** (primary choice)
  * **Playwright** (cross-browser validation)

* Validate real user journeys:

  * Cruise browsing
  * Ship lookup
  * API-driven UI interactions

---

### ⚙️ Test Automation & Frameworks

* Expand structured test architecture:

  * Test data builders
  * Reusable fixtures
  * Environment-aware test configs

* Introduce:

  * **Mocha/Chai** (alternative test framework exposure)
  * Advanced Jest patterns (mocking, spies, test isolation)

---

### 🗄️ Database Testing

* Implement isolated test databases
* Add data integrity validation tests
* Introduce transactional test rollback strategies

---

### 📊 Performance & Load Testing

* Add performance testing using:

  * **k6**
  * **Artillery**

* Measure:

  * API response times
  * Throughput under load
  * Database performance impact

---

### 🔐 Security Testing

* Add automated security checks:

  * Input validation testing
  * Injection vulnerability checks

* Integrate tools such as:

  * **OWASP ZAP**
  * Dependency vulnerability scanning

---

### 🔁 CI/CD Enhancements

* Enforce stricter quality gates:

  * Coverage thresholds per PR
  * Test failure blocking merges

* Add:

  * Parallel test execution
  * Test result reporting artifacts

---

### 🧠 Observability & Reliability Testing

* Add logging validation tests
* Introduce health monitoring checks
* Simulate failure scenarios (resilience testing)

---

This roadmap reflects a focus on **quality-first engineering**, where testing is treated as a core system design concern rather than an afterthought.

---

## 👤 Author

**Jay Gallagher**

Principal Software Quality Engineer capable of full-stack development.

Built this application to demonstrate testing, automation, and full-system validation without relying on external sample apps.

This project reflects:

* 30+ years in SQA
* Strong focus on testability and automation
* Real-world engineering practices (CI, integration testing, DB-backed APIs)
* Practical, production-minded system design

---

## 📌 Purpose

This repository serves as a **portfolio project focused on demonstrating advanced Software Quality Engineering practices within a full-stack application**.

The primary goal is to showcase:

* End-to-end testing strategies across API, database, and UI layers
* Automated validation through unit, integration, and end-to-end UI validation using Cypress
* API-driven UI testing using dynamically sourced test data
* CI-driven quality gates, including enforced code coverage
* Real-world test architecture and maintainable automation patterns
* A QA-first approach to system design, not just feature development

Rather than relying on pre-built applications, this project was intentionally designed and developed to provide a **controlled environment for implementing and demonstrating modern testing tools, frameworks, and methodologies**.

It reflects the mindset of a **Principal Software Quality Engineer**, where quality, reliability, and testability are foundational to the system—not afterthoughts.

---

## 📄 License

MIT
