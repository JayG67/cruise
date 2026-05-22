# 🚢 Cruise Explorer

## Full-Stack Cruise Management Platform & SQA Engineering Portfolio

[![CI](https://github.com/JayG67/cruise/actions/workflows/ci.yml/badge.svg)](https://github.com/JayG67/cruise/actions)
[![Live Demo](https://img.shields.io/badge/live-demo-brightgreen)](https://cruise-explorer.onrender.com/)
[![Quality Dashboard](https://img.shields.io/badge/quality-dashboard-success)](https://jayg67.github.io/cruise/)
[![Coverage Report](https://img.shields.io/badge/jest-coverage-report-brightgreen)](https://jayg67.github.io/cruise/coverage/)
[![Lighthouse Report](https://img.shields.io/badge/mobile-quality-report-orange)](https://jayg67.github.io/cruise/lighthouse/)
[![Playwright Mobile](https://img.shields.io/badge/playwright-mobile%20and%20responsive-45ba4b)](./playwright/mobile/)
[![k6](https://img.shields.io/badge/k6-performance%20smoke-purple)](./performance/cruise-api-smoke.js)

## Live Links

- **Production app:** https://cruise-explorer.onrender.com/
- **Quality dashboard:** https://jayg67.github.io/cruise/
- **Coverage report:** https://jayg67.github.io/cruise/coverage/
- **Mobile Lighthouse report:** https://jayg67.github.io/cruise/lighthouse/

---

## Portfolio Review and Repository Hygiene

This repository is intentionally maintained as a recruiter-facing testing portfolio. Source files, tests, seed data, and documentation should be reviewed as product assets. Generated local artifacts should stay out of source control and be published through CI artifacts or GitHub Pages instead.

Useful review commands:

```bash
npm run unitTests
npm run integrationTests
npm run uiTests
npm run playwright:mobile:local
npm run playwright:responsive:local
npm run perf:smoke:local
npm run lighthouse:ci:local
npm run repo:hygiene
```

A dedicated code review summary is available at [`docs/code-review.md`](docs/code-review.md).

---

## Project Summary

Cruise Explorer is a production-style full-stack portfolio application for managing cruise-line, ship, sailing, itinerary, customer, booking, passenger, and role-aware dashboard data.

The project started as a cruise data administration app and has evolved into a multi-role cruise platform that demonstrates:

- full-stack Node.js and Express API development
- PostgreSQL persistence
- relational data modeling
- role-aware UI behavior
- passenger self-service workflows
- itinerary planning and saved favorites
- booking conflict prevention
- mobile/responsive validation
- accessibility-focused UI hardening
- CI/CD quality gates
- deep automated testing across unit, integration, UI, mobile, performance, coverage, and Lighthouse layers

This repository is intentionally built as a **software testing and SQA engineering showcase**. The goal is not only to show that the application works, but to show how a quality engineer approaches risk, coverage, regression prevention, data integrity, CI feedback, and user-facing quality.

---

## Why This Project Matters

This project demonstrates a QA-first engineering mindset:

- features are expanded with matching automated tests
- bugs found during manual testing are converted into regression coverage
- API and UI behavior are tested separately and together
- seed data is validated as a first-class asset
- CI validates the same quality layers expected in a professional software environment
- accessibility is treated as product quality, not an afterthought
- reporting artifacts are published so reviewers can inspect evidence, not just claims

For a recruiter, hiring manager, development engineer, or QA leader, this project is intended to show both implementation capability and test leadership.

---

## Current Product Capabilities

### Admin Experience

Admin users can:

- view all cruise lines
- search cruise lines by name or country
- create cruise lines with ships
- update cruise-line details
- update, create, and delete ships
- view ship sailings
- create, update, and delete sailings
- create, update, and delete itinerary days
- create, update, and delete itinerary activities
- reset demo data safely from the SQA panel
- run browser-based quality checks from the UI

### Passenger and Group Views

The demo role selector allows the app to be viewed from multiple role perspectives without requiring authentication.

Supported demo perspectives include:

- admin
- individual passenger
- couple/family passenger
- group leader
- multi-cruise passenger
- passengers with different booking combinations

Passenger-facing behavior includes:

- viewing only bookings visible to the selected role
- viewing booked cruise details directly under each booking card
- opening multiple booking detail panels at the same time
- hiding individual booking detail panels
- editing limited passenger profile fields
- selecting dining preference from approved values
- saving itinerary activities as favorite items
- filtering itinerary details to all activities or saved favorites

### Booking Rules

Booking behavior now includes data integrity safeguards:

- booking IDs are 10 characters and start with `B`
- customer IDs are 10 characters and start with `C`
- bookings require exactly one primary guest
- duplicate passengers on one booking are rejected
- invalid customer and sailing references are rejected
- passenger bookings cannot overlap
- adding a passenger to an existing booking checks for overlaps
- seeded demo bookings are validated to avoid impossible passenger schedules

### Itinerary Data

The seeded itinerary data is intentionally rich enough to support meaningful UI and test coverage.

Itineraries include:

- embarkation activities
- port days
- sea days
- dining activities
- entertainment
- theme/dress nights
- family activities
- enrichment events
- theater shows
- late-night activities
- disembarkation-focused final-day schedules

Every final sailing day is focused on disembarkation and includes:

- guests must vacate rooms by **8:00 AM**
- all passengers must be off the ship by **12:00 PM**

---

## Accessibility and ADA/WCAG-Oriented Quality Effort

This project includes a dedicated accessibility pass intended to align the UI with ADA-aware and WCAG-oriented engineering practices.

Important note: this repository does not claim legal certification. Accessibility compliance depends on legal context, full product scope, assistive-technology review, user testing, and ongoing governance. What this project does provide is a serious technical implementation and automated regression strategy based on common WCAG expectations.

### Accessibility Improvements Implemented

The application includes:

- skip link to main content
- focusable main content landmark
- primary navigation landmark with accessible name
- search landmark
- screen-reader-only text support
- visible keyboard focus states
- reduced-motion support
- forced-colors/high-contrast support
- live regions for status messages
- accessible labels for search, status, and SQA output
- accessible names on dynamic cruise, ship, sailing, and booking actions
- contextual `aria-label` values on repeated buttons
- `aria-expanded` for collapsible booking details
- star favorite buttons exposed as checkbox-style controls
- `aria-checked` for saved itinerary favorites
- form labels for visible and screen-reader users
- mobile-safe touch targets
- no-horizontal-overflow validation on mobile/tablet layouts

### Accessibility Testing Added

Accessibility is covered by several layers:

| Layer | Coverage |
|---|---|
| Unit/static tests | Validate skip link, landmarks, ARIA support, focus CSS, reduced motion, forced-colors, and dynamic accessibility strings |
| Cypress UI tests | Validate keyboard/focus behavior, accessible names, search/status landmarks, dynamic controls, and favorite checkbox semantics |
| Playwright mobile tests | Validate accessibility semantics on phone/tablet-sized role dashboards |
| Lighthouse mobile | Audits accessibility along with performance, best practices, and SEO |
| Manual testing workflow | Manual accessibility findings should become regression tests before merging |

---

## Testing Strategy

This is the heart of the portfolio.

The repository includes a broad and layered validation approach:

### Unit Tests

Unit tests cover:

- controllers
- validation schemas
- middleware
- database exports
- seed data integrity
- accessibility static safeguards
- quality dashboard configuration

Command:

```bash
npm run unitTests
```

### Coverage

Jest coverage is generated and published.

Command:

```bash
npm run coverage
```

### Integration Tests

Integration tests run against PostgreSQL-backed API workflows and validate:

- cruise lines
- ships
- sailings
- itinerary days
- itinerary activities
- customers
- bookings
- booking passengers
- demo roles
- passenger self-service
- itinerary favorites
- booking-overlap rejection
- admin reset behavior
- health checks

Command:

```bash
npm run integrationTests
```

### Cypress UI Tests

Cypress validates desktop/browser UI behavior:

- home page rendering
- search behavior
- create cruise line workflow
- update cruise line workflow
- delete cruise line workflow
- ship workflows
- sailing and itinerary workflows
- passenger role dashboard
- passenger profile editing
- itinerary favorites
- reset demo data
- SQA control panel
- accessibility behaviors

Command:

```bash
npm run uiTests
```

### Playwright Mobile and Responsive Tests

Playwright validates:

- mobile Chrome
- mobile Safari
- tablet Safari
- responsive layout behavior
- no horizontal overflow
- touch target usability
- role dashboard behavior
- passenger details behavior
- favorites behavior
- accessibility semantics on mobile

Commands:

```bash
npm run playwright:mobile:local
npm run playwright:responsive:local
```

### k6 Performance Smoke Testing

k6 validates basic API performance and response success thresholds.

Command:

```bash
npm run perf:smoke:local
```

### Lighthouse CI

Lighthouse validates mobile quality gates, including performance and accessibility.

Command:

```bash
npm run lighthouse:ci:local
```

### Full Local Validation

Run the full suite:

```bash
npm run test:all
```

---

## SQA Control Panel

The application includes an in-browser SQA console that allows reviewers to run quality checks from the UI.

The SQA panel includes:

- API health check
- cruise data verification
- UI smoke check
- API contract check
- safe CRUD workflow check
- performance smoke check
- seed data integrity check
- frontend rendering consistency check
- deployment diagnostics
- demo data reset
- quality report links

This is intended to make the portfolio easier to review and to demonstrate practical QA tooling beyond test files alone.

---

## Technology Stack

### Backend

- Node.js
- Express
- PostgreSQL
- Drizzle ORM
- Zod validation

### Frontend

- HTML
- CSS
- Vanilla JavaScript
- Responsive/mobile-first UI behavior
- Accessible semantic markup and ARIA where appropriate

### Testing and Quality

- Jest
- Supertest
- Cypress
- Playwright
- k6
- Lighthouse CI
- GitHub Actions
- GitHub Pages quality dashboard
- Render deployment

---

## Project Structure

```text
.
├── app.js
├── index.js
├── controllers/
├── db/
├── data/
│   └── cruise.json
├── middleware/
├── models/
├── performance/
├── playwright/
│   └── mobile/
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── routes/
├── scripts/
├── services/
├── tests/
│   ├── integration/
│   └── unit/
├── validation/
├── cypress/
│   ├── e2e/
│   └── support/
└── .github/
    └── workflows/
```

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
npm run db:up
```

### 3. Start the application

```bash
npm run start
```

The app runs on:

```text
http://localhost:8000
```

### 4. Run tests

```bash
npm run test:all
```

---

## Environment Variables

Common variables:

```text
DATABASE_URL
TEST_DATABASE_URL
PORT
SUPPRESS_DB_LOGS
LIVE_APP_URL
QUALITY_DASHBOARD_URL
LIGHTHOUSE_REPORT_URL
COVERAGE_REPORT_URL
```

The local Docker-backed setup uses PostgreSQL on port `5433`.

---

## CI/CD

GitHub Actions validates the project with:

- unit tests
- coverage
- integration tests
- Cypress UI tests
- Playwright mobile tests
- Playwright responsive tests
- k6 smoke tests
- Lighthouse CI
- quality dashboard publishing

Reports are published through GitHub Pages.

Generated reports and local artifacts should not be treated as source code. Use `npm run repo:hygiene` before pushing to confirm local reports, logs, and OS files are not accidentally tracked.

---

## Current Quality Posture

This project has grown beyond a simple CRUD demo into a serious portfolio-quality application with layered test coverage and a visible quality posture.

Current strengths:

- strong backend validation
- high integration coverage
- robust browser workflow coverage
- mobile-specific regression tests
- accessibility-focused checks
- browser security headers
- production deployment
- published quality dashboard
- realistic data integrity rules
- manual testing findings converted to regression tests

---

## Roadmap

Planned next steps:

1. Passenger cruise booking workflow
2. Booking availability and cabin selection rules
3. Simulated authentication or reviewer-friendly persona switching
4. Payment-safe mock checkout flow without storing sensitive payment data
5. Expanded accessibility review checklist
6. More granular accessibility reporting in the quality dashboard
7. Additional CI artifact summaries for mobile and accessibility evidence
8. Cruise-line-specific branding
9. Passenger group management workflows

---

## Portfolio Positioning

Cruise Explorer is intended to demonstrate:

- senior QA judgment
- hands-on automation capability
- backend and frontend test strategy
- full-stack engineering ability
- accessibility awareness
- CI/CD quality discipline
- production-minded risk reduction
- testability-first design

The project is deliberately maintained as an evolving example of how quality engineering can guide product development.
