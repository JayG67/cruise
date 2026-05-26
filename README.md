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

Cruise Explorer is a full-stack cruise management and Principal SQA engineering portfolio project. It is designed to show more than basic CRUD functionality: the application demonstrates role-aware UI behavior, relational data modeling, accessibility-focused frontend engineering, CI/CD quality gates, layered automated testing, mobile-first operational UX, and AI-enabled quality strategy.

The project currently includes:

- Cruise line, ship, sailing, itinerary, customer, booking, and passenger data workflows
- Admin, passenger, and group-leader demo roles
- Workspace-first navigation for faster movement through operational areas
- A recommended operations path that turns the page from a long feature list into a guided console workflow
- Principal SQA / AI-enabled quality positioning documented in the README instead of consuming functional application workspace
- Admin customer-centered workflow management with inline expandable child bookings
- Passenger self-service profile and booking preference updates
- Itinerary activity browsing and favorite activity selection
- Searchable customer workflows that also match linked booking, passenger, cabin, ship, route, status, and loyalty data
- Progressive disclosure through expandable customer rows, linked booking rows, and booking detail panels
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


## 🧭 Workspace-First Navigation

The first phase of the UX redesign introduces a workspace navigation layer.

The application now includes:

- A dedicated workspace rail for moving between major operational regions
- Direct links to role simulation, admin operations, fleet management, create workflows, ship/sailing/itinerary panels, and quality controls
- Workspace overview cards that act as intentional entry points rather than disconnected decorative cards
- Faster movement between role simulation, fleet management, admin operations, and quality controls
- Accessible landmark and link structure for keyboard and screen-reader users
- Layout-regression tests that verify the workspace rail can be brought fully into view at desktop, tablet, and mobile sizes without horizontal overflow
- Scroll-offset protection so admin edit forms remain reachable without forced Cypress clicks
- AI Quality workspace access from both primary navigation and workspace navigation

This is the first step away from a purely vertical feature stack and toward a more realistic enterprise operations console. The current phase intentionally stabilizes navigation and admin edit reachability before larger Tier 1 roadmap work such as tabbed workspaces, sortable tables, pagination, filtering, and slide-out detail drawers.

### Current UX Stabilization Batch

The workspace navigation has been hardened for a cleaner mobile-first operations-console experience:

- Workspace navigation now wraps instead of hiding actions behind horizontal rail scrolling.
- The rail is constrained to the viewport with explicit max-width and overflow protection.
- Primary navigation now wraps at tablet widths so long recruiter-facing labels do not widen the document and push the workspace rail offscreen.
- In-page navigation uses deterministic scrolling so Cypress, keyboard users, and anchor links land predictably.
- Cypress coverage now validates rail containment across desktop, tablet, narrow desktop, and mobile viewport sizes, including repeated anchor jumps after selecting workspace links.
- The previous README-style Principal SQA / AI quality showcase was removed from the application because it did not provide user-facing workflow functionality. The README still carries that positioning; the application now reserves screen space for operational tasks.
- Static coverage was updated to guard against reintroducing documentation-only content into the app chrome while keeping the quality controls reachable from the recommended workflow.


## 🤖 Principal SQA / AI-Enabled Quality Positioning

This repository still intentionally presents Principal SQA and AI-enabled quality thinking, but that story belongs primarily in the README, tests, and project structure rather than taking up application workspace with non-interactive marketing content.

The portfolio positioning emphasizes:

- **Release readiness:** quality-gate judgment instead of test-count-only reporting
- **AI-assisted risk review:** hallucination safeguards, human review expectations, and source-backed acceptance criteria
- **Healthcare-grade audit thinking:** traceability, high-risk data change validation, accessibility, and no-silent-failure behavior
- **Automation architecture:** unit, integration, API, Cypress, Playwright, performance, Lighthouse, and CI/CD quality layers

This is especially relevant for AI-enabled QA roles where the value is not simply using AI to generate tests. The value is knowing how to evaluate AI output, constrain risk, preserve auditability, and turn AI acceleration into reviewed engineering assets.


## ⚛️ React Migration Track

The project now includes the first safe stage of a React migration under `frontend/react`. The production application still runs from the existing `public/` DOM implementation, but the repository now has a dedicated React/Vite workspace for incremental modernization.

This migration is intentionally staged because the current application already has meaningful maturity and broad regression coverage. The goal is not to rewrite a working app for fashion. The goal is to demonstrate a realistic modernization path: keep the stable Express/Postgres API, preserve the existing quality gates, and migrate one high-value workflow at a time.

The first migration candidate is the Admin Customer → Booking hierarchy because it contains the most UI state: customer search, expandable parent rows, linked child bookings, duplicate booking visibility, booking detail panels, and edit workflow reachability.

React migration commands:

```bash
npm install
npm run react:dev
npm run react:build
npm run react:scaffold:audit
```

Supporting documentation:

- `docs/react-migration-plan.md`
- `docs/branching-strategy.md`

### Branching model for the migration

Use `main` as the stable, recruiter-safe branch and create a long-lived `dev` branch for integration work. React migration feature branches should branch from `dev`, merge back into `dev` after focused validation, and only promote to `main` after the full quality gate is clean. This mirrors real-world development while keeping the production portfolio stable.

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

### Customer-Centered Parent / Child Workflows

The admin dashboard now uses customers as the operational parent record. Bookings are no longer displayed as a disconnected top-level table. Instead, admins open the customer workflow table, expand a customer row to view linked booking child rows, then expand an individual booking to view additional details.

This better reflects the real relationship between customer records, bookings, passengers, and cruise operations while making better use of application space.

### Edit Workflow Reachability

Customer and booking edit workflows are still rendered inline for this phase, but they now appear in the correct hierarchy:

- Customer edits open from the parent customer row.
- Booking edits open from the expanded booking child row.
- Booking details can be expanded and collapsed independently before choosing to edit.

The layout and Cypress coverage treat reachability as part of the UX contract. Edit forms are scrolled into a usable workspace position before typing, and CSS scroll margins keep focused editor fields clear of sticky navigation.

### Progressive Disclosure

Large datasets are hidden by default. The admin can explicitly open or close the customer workflow table with:

- **Show Customer Workflows → Hide Customer Workflows**

Bookings are intentionally revealed only in the customer context, which reduces disconnected tables and makes the page more manageable when there are many customers or bookings.

### Admin Tables

The admin workflow table is:

- Customer-centered
- Parent/child expandable
- Search-filtered across customer and booking fields
- Accessible with captions and labeled regions
- Designed for large operational datasets without forcing bookings into a separate unrelated table
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

- Workspace navigation and operational overview cards
- Workspace rail viewport containment and horizontal-overflow prevention
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
- Workspace navigation usability across responsive layouts
- Desktop and tablet workspace rail containment
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

### Test Run Hygiene Update

The default `npm run coverage` command intentionally runs the full Jest coverage pass across both unit and integration tests so the portfolio-level coverage percentage continues to reflect the real backend surface area. To avoid duplicate database-backed integration execution during the normal local pipeline, `npm run test` does not run `npm run integrationTests` after coverage. The dedicated `npm run integrationTests` command remains available for focused API validation, and `npm run coverage:all` is kept as an explicit alias for a full Jest coverage pass.


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

## 🧭 Current UX Direction

The current UX direction is mobile-first and workflow-first. The application is being intentionally moved away from a long vertically stacked CRUD page toward an operations console that helps a reviewer understand the intended path through the system:

1. choose a role,
2. review the visible customer and booking context,
3. manage fleet, ships, sailings, and itinerary data,
4. run the quality control checks that verify health, contracts, CRUD safety, performance, rendering consistency, seed integrity, and deployment diagnostics.

The recommended workflow guide near the top of the app is the first step in making the portfolio feel more like an enterprise operations platform and less like a collection of unrelated feature panels.



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

`npm run coverage`, `npm run coverage:all`, and `npm run integrationTests` start the local Docker PostgreSQL service and wait for the test database before running database-backed tests. The full `npm run test` path uses coverage as the single Jest pass that includes integration coverage, then proceeds to Cypress UI coverage without rerunning the integration suite a second time.

If the database ever needs a clean local reset, run:

```bash
npm run db:reset
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

- Senior and Principal SQA thinking
- Workflow-first UX architecture for operational systems
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

- Continue moving the UI from vertically stacked CRUD into a guided operations console
- Workspace tabs for admin operations
- Slide-out edit drawers for customer and booking management
- Advanced filter controls for admin datasets
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

---

## ⚛️ React migration status

The project is now migrating the frontend incrementally on the long-lived `dev` branch while keeping `main` stable and demo-ready.

Current React migration stages:

- **Stage 0:** Vite/React scaffold isolated under `frontend/react`.
- **Stage 1:** Customer → booking hierarchy proof of concept with extracted domain logic.
- **Stage 2:** API client boundary and retryable loading hook for the React hierarchy snapshot.

Useful commands:

```bash
npm run react:migration:audit
npm run react:build
npm run test:all
```

The production DOM application remains active while the React implementation matures behind guardrail tests.


### React migration Stage 3

The React migration now includes an extracted hierarchy expansion state module. Customer expansion, booking detail expansion keys, and visible-row collapse behavior are centralized under `frontend/react/src/domain/hierarchyExpansionState.js` so the migration is moving toward testable state ownership instead of inline DOM-style UI logic.

Run the migration guardrails with:

```bash
npm run react:migration:audit
npm run react:build
```


### React migration Stage 4

The React migration now includes a customer edit draft state foundation. This adds local draft creation, field updates, validation messaging, and stable test hooks without mutating the production API yet. The goal is to mature the React admin hierarchy toward real edit workflows while preserving the existing passing DOM application as the production baseline.

Run the React migration guardrails with:

```bash
npm run react:migration:audit
npm run react:build
npm run test:all
```


## React migration Stage 5

The React migration shell now includes a customer profile mutation boundary. The production DOM app remains the stable UI, while the isolated React/Vite shell can validate customer draft state and save customer profile updates through the existing Express API.

Useful commands:

```bash
npm run react:migration:audit
npm run react:build
npm run test:all
```


### React Stage 6 migration checkpoint

The React migration now includes booking draft state for the Admin Customer → Booking hierarchy. Stage 6 keeps the production DOM app untouched and deliberately stops before live booking mutation so the state model can be reviewed and tested independently.

Validation commands:

```bash
npm run react:stage6:audit
npm run react:migration:audit
npm run react:build
npm run test:all
```


### React Stage 7 booking mutation boundary

The React migration shell now includes a live booking mutation boundary. The React preview can edit and save booking draft fields through the existing `/cruise/bookings/:id` API while preserving passenger membership and sailing context. The production DOM app remains the source of truth until a later cutover stage.


### React migration Stage 8 checkpoint

Stage 8 extracts the customer and booking draft editors from the React hierarchy component into reusable components. This keeps the migration incremental while reducing component size and preserving stable test IDs for future component-level coverage.


### React migration Stage 9: draft editor field contracts

Stage 9 centralizes React customer and booking draft editor field metadata in domain modules. This improves maintainability by keeping form fields, labels, and stable test IDs aligned while the production DOM UI remains untouched.

Validation commands:

```bash
npm run react:migration:audit
npm run react:build
npm run test:all
```


### React migration Stage 10

Stage 10 adds an accessible draft feedback contract to the isolated React migration shell. Customer and booking draft editors now share centralized feedback helpers and a reusable feedback component so validation, no-change, unavailable-save, success, and mutation-error states are consistent.

Run the Stage 10 guardrail with:

```bash
npm run react:stage10:audit
```

The full React migration audit now includes Stage 10:

```bash
npm run react:migration:audit
```


### React migration Stage 11: Draft field accessibility contracts

Stage 11 centralizes required-field and input-type metadata for the React customer and booking draft editors. The forms now render `required`, `aria-required`, field types, and autocomplete behavior from the same field contracts used by validation guardrails, keeping accessibility expectations aligned with the staged migration.


### SQA console validation hardening

- Tightened the SQA console Safe CRUD workflow so its ship create/update payloads include the required current-port contract and added coverage that verifies the manual console action sends API-valid payloads.


### React migration Stage 12

Stage 12 decomposes the React customer-booking hierarchy into smaller presentation components:

- `CustomerHierarchyRow`
- `BookingCard`

This keeps state orchestration centralized while making customer rows and booking cards easier to review, test, and eventually compare against the legacy DOM implementation during migration.


### React migration Stage 13

Stage 13 hardens accessibility and presentation contracts on the extracted React hierarchy components. Customer expansion buttons now explicitly control their booking panels, and booking detail toggles explicitly control their detail panels using stable IDs derived from the same duplicate-safe hierarchy keys.

This is still an isolated React migration step: the production DOM app remains untouched while the React shell gains stronger component seams and accessibility contracts for future browser/component coverage.


### React migration Stage 14

Stage 14 extracts customer and booking draft workflow orchestration from the React hierarchy container into dedicated hooks:

- `useCustomerDraftWorkflow`
- `useBookingDraftWorkflow`

This keeps `CustomerBookingHierarchy` focused on search, summary, expansion state, and row composition while each draft workflow owns creation, validation, no-change handling, save success/error feedback, and cancel behavior. The production DOM application remains untouched.

Validation commands:

```bash
npm run react:stage14:audit
npm run react:migration:audit
npm run react:build
npm run test:all
```


### React Migration Stage 16

Stage 16 adds shared React migration roadmap metadata so the preview shell and readiness panel describe the current migration state from one source. This keeps the portfolio narrative aligned with the code as the staged React migration continues.


## ⚛️ React Migration Status

The repository is using a staged React migration on the `dev` branch while the existing DOM application remains the stable production baseline.

Current React migration checkpoint: **Stage 17 — Route-level preview shell**.

The React shell now separates the hierarchy workflow, readiness rationale, and roadmap status into route-level preview sections. This keeps the modernization story realistic: the team can grow React workflow parity one screen at a time without destabilizing the existing app.
