# 🚢 Cruise Explorer API & Frontend

A full-stack cruise data application built with **Node.js, Express, PostgreSQL (Drizzle ORM), and Vanilla JavaScript**.

This project demonstrates backend API design, database integration, automated data seeding, and a lightweight frontend UI that consumes real endpoints.

---

## 📌 Overview

Cruise Explorer is designed as a **portfolio-ready application** showcasing:

* RESTful API development
* Database modeling and relationships
* Automated database initialization & seeding
* Frontend integration with live API data
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
├── docker-compose.yml  # PostgreSQL container
├── index.js            # App entry point
```

---

## ▶️ Getting Started

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

### Current

* Jest-based unit tests
* Controller and model-level validation

---

## 🧪 Testing Roadmap

While the project currently includes foundational unit testing, expanding the testing strategy is a key focus area.

Planned enhancements include:

### Integration Testing

* API endpoint validation using tools like Supertest
* End-to-end request/response verification

### Database Testing

* Test isolation strategies
* Seeded test data environments
* Validation of relational data integrity

### Contract Testing

* Ensuring API responses remain consistent as the application evolves

### Frontend Testing

* DOM interaction testing for Vanilla JS components
* UI behavior validation

### Test Automation Strategy

* Structured test suites aligned with real-world QA practices
* Increased coverage across services, controllers, and data layers

This expanded testing approach reflects a strong emphasis on **quality, reliability, and maintainability**, leveraging extensive experience in Software Quality Assurance.

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
* Minimal frontend with real API interaction
* Production-style project organization

---

## 📈 Future Enhancements

* React frontend version
* Pagination and filtering
* Authentication layer
* API validation (Zod/Joi)
* Integration tests (Supertest)
* CI/CD pipeline

---

## 👤 Author

**Jay Gallagher**

Principle Software Quality Engineer showcasing flexability to learn front and backend development.

This project reflects:

* 30+ years in SQA
* Strong focus on testability and structure
* Practical, production-minded engineering

---

## 📌 Purpose

This repository serves as a **portfolio project** demonstrating real-world backend and frontend integration, not just isolated code samples.

---

## 📄 License

MIT
