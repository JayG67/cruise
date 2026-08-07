# 🚢 Cruise Fleet Operations Platform

## Enterprise Cruise Operations, Passenger Services, Turnaround Coordination, and Quality Engineering

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

- **Production application:** https://cruise-explorer.onrender.com/
- **Quality dashboard:** https://jayg67.github.io/cruise/
- **Coverage report:** https://jayg67.github.io/cruise/coverage/
- **Mobile Lighthouse report:** https://jayg67.github.io/cruise/lighthouse/
- **GitHub Actions:** https://github.com/JayG67/cruise/actions/workflows/ci.yml
- **Go-live manual review guide:** [docs/go-live-manual-review.md](docs/go-live-manual-review.md)
- **Maintenance policy:** [docs/maintenance-mode.md](docs/maintenance-mode.md)

---

## 📑 Contents

- [Platform Overview](#-platform-overview)
- [Product Surfaces](#-product-surfaces)
- [Architecture](#%EF%B8%8F-architecture)
- [CSS Architecture](#-css-architecture)
- [Accessibility](#-accessibility)
- [Responsive Engineering](#-responsive-engineering)
- [AI Quality and Turnaround Briefing](#-ai-quality-and-turnaround-briefing)
- [Testing and Quality Strategy](#-testing-and-quality-strategy)
- [Quality Gates](#-quality-gates)
- [Quality Dashboard and Published Evidence](#-quality-dashboard-and-published-evidence)
- [Repository Hygiene](#-repository-hygiene)
- [Local Development](#-local-development)
- [Deployment and Configuration](#-deployment-and-configuration)
- [Maintenance Mode](#%EF%B8%8F-maintenance-mode)
- [Product Roadmap](#-product-roadmap)
- [Author](#-author)

---

## 📖 Platform Overview

Cruise Fleet Operations Platform is a production-oriented full-stack application for cruise-line administration, fleet and sailing management, passenger services, booking operations, turnaround coordination, operational assurance, and AI-assisted quality control.

The repository is intentionally engineered as an enterprise application rather than a lightweight demonstration. It emphasizes explicit ownership boundaries, normalized domain behavior, role-aware access, relational data, production deployment controls, accessibility, auditability, release evidence, and layered automated validation.

The product currently supports:

- Cruise lines, ships, sailings, itineraries, customers, bookings, passengers, and operational users
- Administrative customer and booking workflows
- Passenger profile, booking, itinerary, and preference workflows
- Passenger-group visibility
- Cruise-line operations, commercial analytics, port planning, and fleet readiness
- Turnaround command, staffing, tasks, dependencies, handoffs, escalations, signoffs, timelines, closeout, and release evidence
- Role-aware operational workspaces for turnaround managers and department leads
- AI turnaround briefing, evaluation, adversarial testing, CI evidence, and release-policy review
- PostgreSQL-backed integration behavior
- Responsive desktop, tablet, and mobile operation
- Repository, deployment, dependency, source-package, CSS, accessibility, browser, performance, and release audits

Technical implementation details, architecture history, validation strategy, and maintenance policy belong in this README and supporting documentation. They are intentionally excluded from the user-facing application unless they directly support an operational task.

---

## 🧭 Product Surfaces

### Administration

Administrators can manage cruise lines, ships, sailings, itineraries, customers, bookings, passengers, platform users, and turnaround setup. Customer workflows use a parent-child hierarchy so bookings remain connected to the customer context rather than appearing as unrelated top-level records.

Administrative capabilities include:

- Search across customer identity, loyalty, booking, passenger, cabin, fare, ship, route, status, and sailing data
- Create, edit, and remove customers and bookings
- Expand customer records to inspect linked bookings
- Manage fleet, sailing, and itinerary records
- Configure operational users and turnaround assignments
- Review platform audit history and controlled baseline recovery

### Passenger and Group Workflows

Passenger-facing capabilities include:

- Authorized booking visibility
- Profile and controlled preference updates
- Cruise, ship, cabin, route, fare, sailing, and passenger details
- Itinerary browsing and favorite activity selection
- New booking workflows with guest selection and guest-profile creation
- Group-leader access to linked passenger manifests and booking context

### Cruise-Line Operations

Cruise-line operations include:

- Fleet and sailing normalization
- Booking-derived voyage context
- Passenger manifests
- Revenue mix and occupancy analysis
- Guest-experience summaries
- Port operations planning
- Commercial operating flow and narrative

### Turnaround Operations

Turnaround operations are organized around a selected sailing and focused workspaces:

- Command overview
- Tasks
- Dependencies
- Handoffs
- Escalations
- Staffing
- Readiness approvals
- AI briefing
- Lifecycle progress
- Audit history and unified timeline
- Operational evidence, release dossier, and closeout information

The command surface provides fleet-level readiness, selected-operation drill-down, role-specific priorities, department directory health, mutation feedback, and controlled editing workflows.

---

## 🏗️ Architecture

### Frontend

The production frontend uses React and Vite. The architecture separates:

- **Application shell:** top-level data composition, role routing, navigation, and browser-test bridges
- **Components:** rendering, accessibility, forms, and interaction surfaces
- **Hooks:** state, effects, API orchestration, mutation lifecycles, selection repair, and draft ownership
- **Domain modules:** pure filtering, normalization, selectors, summaries, analytics, and payload construction
- **API client:** HTTP communication and identity context
- **CSS layers:** tokens, themes, foundations, layouts, utilities, and component-specific rules

Large feature areas retain stable façade modules where useful so internal decomposition does not force broad consumer churn.

### Backend

The backend uses Node.js, Express, PostgreSQL, Drizzle ORM, Zod validation, service-layer domain logic, request identity middleware, tenant and authorization safeguards, audit events, and controller decomposition.

Primary backend layers include:

- Routes
- Validation
- Controllers
- Services
- Domain reference data
- Database access and migrations
- Middleware
- AI provider, evaluation, telemetry, evidence, and policy services

### Data Direction

The architecture is designed for continued normalization and multi-tenant evolution:

- Stable entity identifiers rather than display-name joins
- Proper timestamp and date handling
- Constrained status values
- Indexed relational access
- User and role normalization
- Tenant-aware boundaries
- Immutable audit and entity history
- Cruise-line-specific branding and configuration
- External service integration when production credentials and contracts are available

---

## 🎨 CSS Architecture

The application uses a modular CSS foundation with shared tokens, themes, layouts, utilities, and component layers.

The retired `app.css` and `design-system.css` files are deleted. Automated audits prevent references to those legacy files from returning.

The current foundation includes:

- Shared color, spacing, radius, shadow, focus, and transition tokens
- Reusable panels, cards, forms, buttons, feedback messages, status treatments, and field layouts
- Responsive operational workspaces
- Mobile-safe form controls and tables
- Visible keyboard focus
- Viewport containment and overflow protection

Run before shared CSS changes:

```bash
npm run css:foundation:audit
npm run react:production:complete
```

---

## ♿ Accessibility

Accessibility is a release requirement, not a cosmetic enhancement.

The application includes:

- Semantic landmarks and headings
- Skip navigation
- Explicit form labels
- Keyboard-operable controls
- Visible focus states
- Live status and error regions
- Expanded, pressed, and selected states
- Accessible tables and captions
- Screen-reader-compatible hidden-state behavior
- Responsive touch targets
- Negative checks for hidden or unauthorized controls

Accessibility is protected by static tests, integration payload tests, Cypress checks, and responsive Playwright workflows.

---

## 📱 Responsive Engineering

Responsive validation covers desktop, tablet, mobile Chrome, mobile Safari, desktop Safari, and tablet browsers.

The browser suites verify:

- No unexpected horizontal overflow
- Reachable workspace navigation
- Usable touch targets
- Stable admin editing
- Readable passenger and role surfaces
- Functional fleet, sailing, itinerary, and turnaround workflows
- Deterministic scrolling and focus behavior

---

## 🤖 AI Quality and Turnaround Briefing

The AI subsystem is server-controlled and deployment-safe when generation is disabled.

Implemented capabilities include:

- Provider abstraction
- Structured output contracts
- Runtime configuration
- Credential isolation
- Timeout and retry policy
- Context-size guards
- Cost estimation
- Sanitized telemetry and correlation
- Persistent evidence and audit events
- Turnaround briefing generation and review
- Evaluation cases, scoring, baselines, and comparisons
- Adversarial operational, prompt-instruction, and provider-runtime scenarios
- CI quality gates and machine-readable evidence
- Release-policy preview and historical evidence comparison

The Quality Console exposes operational quality controls and release evidence without presenting internal development commentary to ordinary product users.

---

## 🧪 Testing and Quality Strategy

The test strategy validates positive behavior, negative behavior, ownership boundaries, accessibility, security, data integrity, release evidence, and deployment readiness.

### Jest

Jest covers:

- Unit services and controllers
- Static architecture contracts
- Validation and middleware
- Database and data-architecture rules
- Accessibility safeguards
- AI foundation and evaluation behavior
- Repository, release, deployment, and maintenance contracts
- Coverage publication inputs

### Integration

PostgreSQL-backed integration suites cover:

- Health and preview endpoints
- Cruise lines, ships, sailings, customers, and bookings
- Passenger and accessibility payloads
- Turnaround operations
- Role behavior
- Administrative reset behavior

### Cypress

Cypress covers:

- Administrative CRUD and search
- Fleet, sailing, and itinerary workflows
- Passenger and group workflows
- Role switching
- Turnaround operational workspaces
- Quality Console controls
- Accessibility and responsive behavior
- Negative visibility and authorization assertions

### Playwright

Playwright covers mobile and responsive production behavior, including keyboard navigation, viewport containment, workspace reachability, and horizontal-overflow protection.

### Performance and Reports

The quality pipeline also includes:

- k6 API smoke checks
- Lighthouse CI
- Jest coverage
- GitHub Pages quality dashboard publication
- GitHub Actions artifacts
- Source-package audits
- Production dependency and deployment audits

---

## 🚦 Quality Gates

The complete release-quality sequence is:

```bash
npm run test:all
```

It includes repository repair and cleanup, test inventory, release-source validation, production deployment and dependency audits, React and CSS production checks, all AI phase audits, Jest coverage, Cypress, Playwright, k6, and Lighthouse.

For routine maintenance changes, run:

```bash
npm run maintenance:readiness
```

The maintenance command verifies repository hygiene, source quality, test inventory, release packaging, deployment and dependency expectations, frontend production readiness, and all completed AI phases. See [docs/maintenance-mode.md](docs/maintenance-mode.md).

Useful focused commands:

```bash
npm run unitTests
npm run integrationTests
npm run jest:coverage:all
npm run uiTests:react
npm run playwright:mobile:react
npm run playwright:responsive:react
npm run perf:smoke:local
npm run lighthouse:ci:local
npm run quality:static
npm run release:preflight
```

---

## 📊 Quality Dashboard and Published Evidence

The GitHub Pages quality dashboard provides direct access to published validation evidence:

- Quality dashboard: https://jayg67.github.io/cruise/
- Jest coverage: https://jayg67.github.io/cruise/coverage/
- Mobile Lighthouse report: https://jayg67.github.io/cruise/lighthouse/

Coverage and browser inventory audits ensure expected Jest and React Cypress tests remain represented in the complete pipeline. CI publishes quality artifacts without weakening release gates when a test fails.

---

## 🧹 Repository Hygiene

Repository audits and repair scripts protect against:

- Generated reports committed as source
- Finder metadata
- Retired CSS files
- Misplaced or obsolete files
- Stale workflow commands
- Missing test inventory
- Source-package contamination
- Architecture growth beyond reviewed boundaries

Generated paths such as `dist`, `coverage`, Lighthouse output, Playwright output, test results, and logs are removed by the generated-artifact cleanup workflow and excluded from release source.

Commands and scripts are retained only when they provide a verified CI, release, test, deployment, maintenance, or developer-operation entry point. New aliases should not be added when an existing canonical command already serves the purpose.

---

## 🚀 Local Development

### Requirements

- Node.js 22
- Docker and Docker Compose
- PostgreSQL test container support

### Install

```bash
npm install
```

### Start the application

```bash
npm start
```

Local URL:

```text
http://localhost:8000
```

### Frontend development server

```bash
npm run react:dev
```

### Database operations

```bash
npm run db:up
npm run db:down
npm run db:reset
```

---

## 🔐 Deployment and Configuration

The production deployment targets Node.js 22 on Render and exposes `/health` for deployment health checks.

AI generation remains disabled unless a supported provider, model, runtime configuration, and server-only credentials are configured. The application is designed to deploy safely with AI generation disabled while retaining evaluation, evidence, and quality-console capabilities.

Never expose provider credentials, database credentials, or production secrets in frontend code, committed environment files, reports, or screenshots.

---

## 🛠️ Maintenance Mode

The application is in **Maintenance Mode**.

Maintenance-mode changes should be limited to:

- Verified defects
- Accessibility corrections
- Security and dependency health
- Production reliability
- Documentation accuracy
- Clearly justified feature additions
- Bounded architecture improvements with measurable ownership or maintainability value

Avoid speculative abstraction, cosmetic file movement, duplicate commands, temporary compatibility layers, and refactoring based only on line count.

Before routine pushes:

```bash
npm run maintenance:readiness
```

Before public releases or broad workflow changes:

```bash
npm run test:all
```

The complete policy, release gate, defect triage, and review checklist are documented in [docs/maintenance-mode.md](docs/maintenance-mode.md).

---

## 🧭 Product Roadmap

Future work should be driven by validated product needs rather than continued refactoring for its own sake.

Potential directions include:

- Production authentication and authorization
- Multi-cruise-line tenancy
- Live reservation, manifest, port, weather, and shipboard integrations
- Cruise-line-specific branding and configuration
- Expanded hotel, food and beverage, marine, engineering, crew, logistics, and executive operations
- Production notifications and event-driven workflows
- Database migration hardening and operational observability
- External AI provider enablement under approved governance controls

Any roadmap work must preserve current quality gates, accessibility, coverage, audit history, tenant boundaries, and release safeguards.

---

## 👤 Author

**Jay Gallagher**

This project was built by me using ChatGPT as an engineering tool. I made the architectural decisions, designed the product, directed the development, reviewed the code, and was responsible for the final implementation.

I chose the cruise line industry for this project because of the complexity involved in the systems that support it. While I have no professional experience in the cruise industry, I wanted to explore the kinds of operational challenges involved in managing cruise lines, ships, passengers, bookings, and turnaround operations. My wife and I have been on a few cruises, and I've been fascinated by the systems working behind the scenes ever since.

The goal was to build software that looks, behaves, and is engineered like a real production application, with an emphasis on maintainability, architecture, testing, accessibility, and long-term scalability.
