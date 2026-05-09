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
* Unit and integration testing strategies
* CI pipeline with automated validation
* Clean project structure aligned with production patterns

---

## 🧱 Architecture

```
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

### CI/CD

* GitHub Actions

  * Unit test job
  * Integration test + coverage job (PostgreSQL service)

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

---

## 📂 Project Structure

```
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

```
http://localhost:8000
```

---

## 🔌 API Endpoints

### Cruise Lines

```
GET /cruise
```

Returns all cruise lines

---

```
GET /cruise/cruise-line/:id
```

Returns a specific cruise line

---

### Ships

```
GET /cruise/ships/:cruiseLineId
```

Returns ships for a cruise line

---

### Health Check

```
GET /health
```

---

## 🖥️ Frontend

The frontend is served from:

```
/public
```

### Features:

* Cruise-themed landing page
* Stack selection UI
* Cruise line listing
* Ship lookup per cruise line
* API-driven content rendering

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

```
/coverage
```

Coverage thresholds are enforced to ensure code quality does not regress over time.

---

### Run All Tests

```bash
npm test
```

---

## ⚙️ Continuous Integration

This project uses **GitHub Actions** to automatically validate all changes.

Pipeline includes:

* **Unit Tests Job**

  * Fast validation of business logic

* **Integration Tests + Coverage Job**

  * Runs against PostgreSQL service
  * Executes full test suite
  * Generates and enforces code coverage

All pull requests must pass CI before merging.

---

## 📊 Data Seeding

Data is automatically loaded from:

```
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
* Production-style project organization

---

## 📈 Future Enhancements

* React frontend version
* Pagination and filtering
* Authentication layer
* API validation (Zod/Joi)
* Coverage reporting dashboard (optional external tooling)
* Advanced CI/CD (deployment pipeline)

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

This repository serves as a **portfolio project** demonstrating:

* Full-stack development capability
* API + database integration
* Automated testing strategy
* CI/CD workflow implementation

---

## 📄 License

MIT
