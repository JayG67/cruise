# 🚢 Cruise Explorer

## Full-Stack Cruise Management Platform & SQA Engineering Portfolio

[![Cruise CI](https://github.com/JayG67/cruise/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JayG67/cruise/actions/workflows/ci.yml)
[![Production App](https://img.shields.io/badge/production-live-00b894)](https://cruise-explorer.onrender.com/)
[![Quality Dashboard](https://img.shields.io/badge/quality-dashboard-0984e3)](https://jayg67.github.io/cruise/)
[![Jest Coverage](https://img.shields.io/badge/jest-coverage%20report-C21325)](https://jayg67.github.io/cruise/coverage/)
[![Lighthouse](https://img.shields.io/badge/lighthouse-mobile%20quality-f39c12)](https://jayg67.github.io/cruise/lighthouse/)
![Accessibility](https://img.shields.io/badge/accessibility-tested-6c5ce7)
![Cypress](https://img.shields.io/badge/cypress-e2e-17202C)
![Playwright](https://img.shields.io/badge/playwright-mobile%20%2B%20responsive-2d3436)
![k6](https://img.shields.io/badge/k6-performance%20smoke-7D3C98)
![PostgreSQL](https://img.shields.io/badge/postgresql-integration%20tested-336791)
![Node.js](https://img.shields.io/badge/node.js-express-43853D)

---

## 🔗 Live Links

- **Production app:** https://cruise-explorer.onrender.com/
- **Quality dashboard:** https://jayg67.github.io/cruise/
- **Coverage report:** https://jayg67.github.io/cruise/coverage/
- **Mobile Lighthouse report:** https://jayg67.github.io/cruise/lighthouse/
- **GitHub Actions:** https://github.com/JayG67/cruise/actions/workflows/ci.yml

---

## 📖 Overview

Cruise Explorer is a full-stack cruise management and SQA engineering portfolio project. It is designed to show more than basic CRUD functionality: the application demonstrates role-aware UI behavior, relational data modeling, accessibility-focused frontend engineering, CI/CD quality gates, and layered automated testing.

The project currently includes:

- Cruise line, ship, sailing, itinerary, customer, booking, and passenger data workflows
- Admin, passenger, and group-leader demo roles
- Admin customer and booking management
- Passenger self-service profile and booking preference updates
- Itinerary activity browsing and favorite activity selection
- Searchable and scrollable admin data tables
- Progressive disclosure for large admin datasets
- Mobile, tablet, and desktop responsive behavior
- Accessibility-oriented HTML, CSS, and JavaScript patterns
- Unit, integration, Cypress, Playwright, Lighthouse, and k6 validation

This repository is intentionally maintained as a recruiter-facing engineering and testing showcase.

---

## ✨ Application Features

### Cruise Line Directory

- Browse all cruise lines
- Search cruise lines by name or country
- View ships by cruise line
- Create, update, and delete cruise lines
- Create, update, and delete ships
- Preserve clean startup state so hidden workflow panels do not appear until selected

### Ship, Sailing, and Itinerary Workflows

- View sailings by ship
- View itinerary details by sailing
- Manage sailing CRUD workflows
- Manage itinerary days and activity CRUD workflows
- Display expanded itinerary activity schedules
- Include cruise-realistic itinerary activities, dress nights, onboard events, sea days, and disembarkation-focused final-day activities

### Demo Role System

The application supports demo personas without adding real authentication yet. This keeps the portfolio easy for recruiters and engineers to review while still demonstrating role-aware product behavior.

Supported role perspectives include:

- **Admin:** full operational visibility and management workflows
- **Passenger:** limited access to personal bookings and profile preferences
- **Group leader:** visibility into grouped passenger bookings

Role switching resets selected workflow state so stale admin or cruise details are not accidentally carried into another perspective.

---

## 🛠️ Admin Operations Dashboard

The admin dashboard has been redesigned around scalable operational workflows.

### Admin Search

Admin search is visible immediately and works before any large table is opened. It searches across:

- Customer names
- Customer email
- Phone
- Loyalty number
- Booking ID
- Booking status
- Cabin number
- Fare code
- Cruise line
- Ship
- Sailing date
- Route
- Passenger names

### Progressive Disclosure

Large datasets are hidden by default.

The admin can explicitly open or close:

- **Show All Customers → Hide Customers**
- **Show All Bookings → Hide Bookings**

This keeps the page manageable when there are many customers or bookings.

### Admin Tables

The admin tables are:

- Scrollable
- Search-filtered
- Accessible with captions and labeled regions
- Designed for large operational datasets
- Protected by Cypress, Playwright, and static accessibility tests

### Admin Editing

Admin users can:

- Edit customer profile details
- Edit booking details
- Update cabin, fare, route, and booking metadata
- Save changes through API-backed workflows

---

## 🧳 Passenger Experience

Passenger users can:

- View only their authorized bookings
- View cruise, ship, cabin, route, and sailing details
- See visible passengers on their booking
- Update limited personal profile fields
- Select controlled dining preferences from a dropdown
- Mark itinerary activities as favorites
- Filter itinerary activities to show all items or only favorites
- Open multiple booking detail panels at the same time
- Hide individual booking detail panels

---

## ♿ Accessibility Engineering

Accessibility is treated as a core engineering requirement.

The application includes:

- Semantic landmarks
- Skip navigation
- Accessible form labels
- ARIA live regions
- ARIA expanded/collapsed states
- ARIA hidden states for collapsed panels
- Screen-reader-friendly status messages
- Keyboard-focus visibility
- Accessible star-style favorite controls
- Semantic admin tables with captions
- Hidden-panel checks so collapsed admin datasets are not exposed incorrectly

Accessibility is validated through static unit tests, Cypress accessibility tests, and responsive Playwright checks.

---

## 📱 Responsive and Mobile Engineering

The application is tested across desktop, tablet, and mobile workflows.

Responsive validation includes:

- Mobile Chrome
- Mobile Safari
- Tablet Safari
- Desktop Chrome
- Desktop Safari
- Tablet Chrome

The tests verify:

- No unexpected horizontal overflow
- Touch targets remain usable
- Admin tables remain manageable
- Role dashboard remains readable
- Passenger booking panels remain anchored correctly
- Fleet, ship, sailing, and itinerary workflows remain usable across viewports

---

## 🧪 Testing Strategy

Testing is the centerpiece of this portfolio.

The project intentionally includes both positive and negative testing. The goal is not only to prove that features work, but also to prove that incorrect UI states, stale data, unauthorized controls, and hidden panels do not appear when they should not.

### Unit Tests

Unit and static tests cover:

- Controllers
- Validation schemas
- Middleware
- Security headers
- Seed data integrity
- Accessibility markup safeguards
- Playwright coverage inventory
- Quality dashboard configuration
- Admin progressive disclosure expectations
- Hidden-state and ARIA-state safeguards

### Integration Tests

Integration tests validate API behavior against PostgreSQL-backed workflows, including:

- Cruise lines
- Ships
- Sailings
- Itinerary days
- Activities
- Customers
- Bookings
- Demo roles
- Admin reset
- Accessibility payload support
- Passenger booking preferences
- Itinerary favorites

### Cypress E2E Tests

Cypress validates real browser workflows, including:

- Cruise line CRUD
- Ship CRUD
- Sailing and itinerary workflows
- Search
- Reset demo data
- SQA control panel
- Accessibility checks
- Role switching
- Admin customer and booking search
- Admin show/hide table behavior
- Admin edit workflows
- Passenger profile updates
- Passenger itinerary favorites
- Negative assertions for hidden and unauthorized UI

### Playwright Tests

Playwright validates:

- Mobile role dashboard behavior
- Mobile Safari and Chrome workflows
- Tablet behavior
- Desktop responsive behavior
- Keyboard navigation
- Horizontal overflow protection
- Admin progressive disclosure on mobile

### Performance and Quality Gates

The project includes:

- Lighthouse CI
- k6 performance smoke checks
- Jest coverage reports
- GitHub Pages quality dashboard publication
- CI pipeline validation

---

## 🧰 Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Accessible responsive UI patterns

### Backend

- Node.js
- Express
- RESTful APIs

### Database

- PostgreSQL
- Drizzle ORM

### Testing and Quality

- Jest
- Supertest
- Cypress
- Playwright
- Lighthouse CI
- k6
- GitHub Actions

### Deployment

- Render
- GitHub Pages quality dashboard
- GitHub Actions CI/CD

---

## 🚀 Getting Started

### Install dependencies

```bash
npm install
```

### Start the app locally

```bash
npm start
```

The application runs locally at:

```text
http://localhost:8000
```

---

## 🧪 Test Commands

### Unit tests

```bash
npm run unitTests
```

### Coverage

```bash
npm run coverage
```

### Integration tests

```bash
npm run integrationTests
```

### Cypress UI tests

```bash
npm run uiTests
```

### Playwright mobile tests

```bash
npm run playwright:mobile:local
```

### Playwright responsive tests

```bash
npm run playwright:responsive:local
```

### k6 performance smoke tests

```bash
npm run perf:smoke:local
```

### Lighthouse CI locally

```bash
npm run lighthouse:ci:local
```

### Full validation suite

```bash
npm run test:all
```

---

## 📊 Quality Dashboard

The project publishes a GitHub Pages quality dashboard that links to:

- Latest quality summary
- Lighthouse report
- Jest coverage report
- CI evidence

Dashboard:

```text
https://jayg67.github.io/cruise/
```

---

## 🧹 Repository Hygiene

Generated artifacts should not be committed directly unless they are intentionally part of the repository.

Examples of generated outputs that should stay out of normal commits include:

- Local Lighthouse output
- Playwright reports
- Cypress screenshots/videos
- Temporary test output
- Local coverage artifacts unless intentionally published through CI

The repository includes hygiene checks and documentation to keep the portfolio clean and reviewable.

---

## 🎯 Portfolio Purpose

This project is built to demonstrate complete project engineering, not just isolated coding ability.

It highlights:

- Senior SQA thinking
- Full-stack engineering capability
- Test automation design
- Accessibility engineering
- CI/CD quality gates
- Responsive UI validation
- API and database validation
- Negative-path testing
- Production deployment awareness
- Recruiter-friendly documentation

---

## 🧭 Future Roadmap

Potential next steps include:

- Real authentication after the demo experience remains easy to review
- Pagination for admin customer and booking tables
- Column sorting for admin tables
- Larger simulated booking datasets
- More granular admin permissions
- Booking creation workflows
- Role-specific audit history
- Modularizing frontend JavaScript into smaller feature files

---

## 👤 Author

**Jay Gallagher**

Senior SQA / Automation Engineering Portfolio Project
