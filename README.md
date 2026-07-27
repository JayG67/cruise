# 🚢 Cruise Fleet Operations Platform

## Full-Stack Cruise Operations Platform & Quality Engineering Portfolio

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
- **Go-live manual review guide:** [docs/go-live-manual-review.md](docs/go-live-manual-review.md)

---

## 📖 Overview

Cruise Fleet Operations Platform is a full-stack React, Node.js, Express, and PostgreSQL cruise operations portfolio project. It is designed to show more than basic CRUD functionality: the application demonstrates role-aware UI behavior, relational data modeling, accessibility-focused frontend engineering, CI/CD quality gates, layered automated testing, mobile-first operational UX, and AI-enabled quality strategy.

The current production UI is implemented in React. Earlier migration work is complete, and current development is focused on expanding the platform into broader cruise-line operations beyond passenger-facing workflows.

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
- Future operational roadmap covering shipboard logistics, hotel operations, food and beverage, engineering, crew operations, turnaround days, and port operations

This repository is intentionally maintained as a recruiter-facing engineering and testing showcase.

---


## 🚦 Current Production Readiness Status

The current operations experience has completed the major turnaround management UX slices: selected-turnaround workflow, operations navigation, tasks, dependencies, handoffs, escalations, staffing, readiness approvals, role-specific command briefs, audit history, release-packet readiness review, unified operational timeline, product-language hardening, and Playwright stability hardening.

Before a public presentation or production-style deployment, use the in-app Quality Console and the go-live manual review guide to confirm:

- Role-aware workflows behave correctly for admin, passenger, group leader, turnaround manager, and department lead roles.
- Turnaround operations remain focused around one selected sailing and one selected work area.
- Fleet, customer, booking, passenger, and quality workflows are reachable at desktop, tablet, and mobile sizes.
- User-facing language presents a real cruise operations product, not the internal development process.
- Automated and manual checks both support approval.

Current engineering status: The React architecture refactor, CSS architecture refactor, production deployment hardening, repository hygiene, release-source auditing, and production dependency auditing are complete. The active engineering phase is now Data Architecture Hardening with normalized users/roles, operational ownership attribution, and shared audit-history payload contracts underway. Completed hardening now includes production query indexes, shared reference-data contracts, database `CHECK` constraints, typed date/time migration bridge columns, normalized user/role bridge tables, core entity UUID/timestamp bridges, passenger self-service persistence, and passenger before/after audit-history payload consistency. The next data-hardening passes should continue turning display-name and edge workflow relationships into durable IDs, deepen turnaround before/after audit consistency, introduce multi-cruise-line tenancy, and eventually move application writes fully onto typed temporal columns. See [docs/data-architecture-hardening.md](docs/data-architecture-hardening.md).



## 🎨 CSS Architecture

The CSS architecture refactor is complete. The application now uses a layered design system built around shared tokens, themes, layout primitives, utilities, and reusable component styling. The remaining work is limited to incremental cleanup during feature development rather than additional architectural restructuring.

Completed foundation work includes:

- Shared command-center color tokens, spacing tokens, radius tokens, shadows, focus rings, and transition timing
- Reusable command panels, command cards, editor cards, action rows, primary/secondary/danger buttons, status pills, field grids, field labels, and empty states
- Broad React surface mapping for the production shell, workspaces, admin areas, fleet panels, role dashboards, passenger workflows, quality console, and turnaround operations panels
- Operational form and textarea contracts that preserve readable controls across desktop, tablet, and mobile Cypress/Playwright coverage
- Automated CSS foundation auditing through `npm run css:foundation:audit`
- Legacy retirement inventory auditing through `npm run css:legacy:audit`
- Selector actionability hardening so passenger, group leader, and turnaround person cards use visible clickable elements instead of hidden overlay anchors
- Shared `ce-selector-card` contracts for all role/person selection cards, reducing another legacy selector group from `app.css`

### Legacy CSS Status

`app.css` remains as a compatibility layer for a small number of legacy selectors. New development should not add styles to this file. It is now a legacy compatibility layer, but the project still has static tests and historical route selectors that reference it directly. The safe removal path is:

1. Keep `app.css` imported before `design-system.css` while compatibility selectors remain.
2. Move remaining app-specific contracts and tests from `app.css` expectations to `design-system.css` or component-level `ce-*` class expectations.
3. Reduce `app.css` to only selectors that are proven to still affect runtime UI.
4. Delete verified-dead legacy selector groups in small tested batches.
5. Remove the `app.css` import only after `npm run css:legacy:audit`, `npm run react:production:complete`, and `npm run test:all` no longer report direct dependencies on the legacy file.

For now, `design-system.css` is the source of truth for new styling, and `app.css` should be treated as read-only compatibility code.

## ✨ Current Application Features

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
- Production deployment audit
- Production dependency audit
- Release source audit
- Repository hygiene audit

- Lighthouse CI
- k6 performance smoke checks
- Jest coverage reports
- GitHub Pages quality dashboard publication
- CI pipeline validation

---

## 🧰 Tech Stack

### Frontend

- React
- Vite
- HTML5
- CSS3
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

## 🧭 Current UX Direction

The current UX direction is mobile-first and workflow-first. The application is intentionally shaped as an operations console that helps a reviewer understand the intended path through the system:

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
- Production deployment readiness
- Enterprise architecture
- Release governance
- Recruiter-friendly documentation

---


---

## 🏗️ Current Architecture Status

Major architectural initiatives completed:

- ✅ React domain decomposition
- ✅ Fleet domain decomposition
- ✅ Operations domain decomposition
- ✅ Passenger domain decomposition
- ✅ Customer & Booking administration decomposition
- ✅ CSS architecture refactor
- ✅ Production deployment hardening
- ✅ Production dependency auditing
- ✅ Release source auditing
- ✅ Repository hygiene enforcement

The next major engineering initiative is focused on data architecture hardening, durable identifiers, multi-tenant preparation, and continued audit-history expansion rather than UI restructuring.

## 🧭 Future Roadmap

The next phase of this platform expands beyond customer-facing cruise management into the broader logistics and operational domains required to run a modern cruise ship and fleet.

### Fleet Operations

Planned enhancements include:

- Fleet-wide vessel dashboards
- Fleet health and readiness monitoring
- Fleet deployment planning
- Dry dock planning
- Vessel maintenance visibility
- Ship certification and compliance tracking

### Port Operations

Planned enhancements include:

- Port schedules
- Berth assignments
- Arrival and departure coordination
- Port services coordination
- Local logistics tracking
- Shore-side vendor coordination

### Turnaround-Day Operations

Turnaround days are one of the most operationally complex parts of cruise execution. Planned enhancements include:

- Guest disembarkation workflows
- Guest embarkation workflows
- Cabin readiness tracking
- Baggage logistics
- Port staffing coordination
- Vendor scheduling
- Ship readiness checklists

### Hotel Operations

Planned enhancements include:

- Housekeeping management
- Cabin inspection workflows
- Laundry operations
- Public-area inspection tracking
- Room readiness status
- Hotel maintenance requests

### Food and Beverage Operations

Planned enhancements include:

- Restaurant operations
- Specialty dining management
- Provision ordering
- Inventory tracking
- Consumption forecasting
- Beverage logistics
- Waste and spoilage monitoring

### Guest Services Operations

Planned enhancements include:

- Guest service requests
- Complaint tracking
- Accessibility accommodation workflows
- Loyalty support workflows
- Shore excursion support
- Onboard issue resolution

### Marine and Engineering Operations

Planned enhancements include:

- Engineering work orders
- Planned maintenance schedules
- Equipment inspection workflows
- Safety compliance tracking
- Fuel consumption analytics
- Technical incident tracking

### Crew Operations

Future role expansion will include shipboard crew perspectives beyond the current admin, passenger, and group-leader roles.

Planned crew domains include:

- Hotel crew
- Housekeeping staff
- Dining and beverage teams
- Guest services
- Marine crew
- Deck operations
- Engineering crew
- Medical staff
- Department managers
- Shipboard leadership

Planned features include:

- Crew manifests
- Department assignments
- Certifications
- Training records
- Crew scheduling
- Operational handoff notes

### Supply Chain and Logistics

Planned enhancements include:

- Procurement workflows
- Ship provisioning
- Warehouse and staging coordination
- Vendor management
- Inventory movement tracking
- Delivery readiness reporting

### Executive Operations

Planned enhancements include:

- Fleet KPI dashboards
- Occupancy forecasting
- Revenue analytics
- Customer satisfaction metrics
- Operational risk reporting
- Quality and readiness scorecards

### Platform Engineering Roadmap

Planned technical enhancements include:

- Real authentication after the demo experience remains easy to review
- More granular permissions
- Role-specific audit history
- Workspace tabs for admin and operations domains
- Slide-out detail drawers for complex records
- Advanced filters and sorting
- Pagination for larger operational datasets
- Larger simulated cruise-line datasets
- Expanded journey testing for new operational roles
- Additional accessibility and mobile quality gates

---

## 👤 Author

**Jay Gallagher**

Full-Stack Cruise Operations Platform demonstrating enterprise software engineering, quality engineering, operational workflow design, accessibility, automation architecture, and AI-assisted quality strategy.

### Current Data Architecture Hardening Status

Completed hardening slices now include indexing, constraints, typed date/time bridge columns, normalized users/roles, operational ownership attribution, audit/event history, and operational assignment scoping. Operational users are now treated as assigned ship/workspace users instead of global role personas, which prevents a turnaround manager from viewing unrelated cruise-line operations.

### Current Production-Hardening Slice: Platform Audit History Review

The latest production-hardening slice extends audit/event traceability beyond turnaround operations into the core platform management workflows recruiters and cruise-line reviewers are likely to exercise:

- Cruise line create/update/delete
- Ship create/update/delete
- Sailing create/update/delete
- Customer create/update/delete
- Booking create/update/delete
- Booking passenger add/remove

These events use the shared `audit_events` table and a platform audit boundary so mutation traceability is no longer limited to operational turnaround workflows. Fleet and booking audit rows carry the strongest available tenant scope, including cruise line, ship, and sailing identifiers when the affected entity can be resolved to that hierarchy. Admin users can now review recent platform audit history through `GET /cruise/audit-events`, and the React quality console includes an Audit History Review check for production traceability validation.


### Current Production-Hardening Slice: Production Authorization Seam

The latest production-hardening slice adds a real-auth-ready request principal bridge without removing the demo selector experience that makes the portfolio easy to review:

- `X-Cruise-User-Id`, `X-Cruise-User-Email`, `X-Cruise-User-Name`, `X-Cruise-User-Role`, and `X-Cruise-Tenant-Id` are accepted as future production principal headers.
- `requestAuthorization.service.js` centralizes actor resolution and admin authorization decisions.
- Platform audit history now uses the shared authorization service instead of controller-local demo-user checks.
- Platform and turnaround audit actor attribution resolves through the same request-actor seam, so future auth claims can replace demo users cleanly.
- Existing `X-Cruise-Demo-User-Id` and legacy `demoUserId` query compatibility remain intact for the current demo workflow.

This does not add a full login provider yet. It creates the clean backend seam needed to connect one later without reworking the turnaround, platform audit, and admin authorization paths.


### Latest turnaround operations slice

- **Unified operational timeline:** turnaround operation payloads now include a production-style event feed across command status, tasks, task updates, staffing, dependencies, handoffs, escalations, signoffs, release readiness context, and audit history.
- **Demo-safe production architecture:** reviewers can still assume any role from the role selector, while the backend returns scoped operational history through the same request identity and turnaround scope boundaries.


### Turnaround playbook template bridge

The turnaround dashboard now derives a reusable operations playbook from each scoped operation. The playbook summarizes template readiness, reusable task order, department baselines, staffing expectations, exception rules, and next best actions so reviewers can see how live turnaround work could become repeatable ship/port operating templates while preserving the demo role-assumption flow.
### Current Phase 1 Data Architecture Hardening Slice: Passenger Relationship Identity Bridge

The current passing baseline now has the next Phase 1 hardening slice applied: passenger relationship records keep their existing readable portfolio IDs while gaining durable UUID bridge identifiers for production-scale history, API evolution, and integration readiness.

This slice adds:

- `bookingPassengerUuid` on booking-passenger rows;
- `favoriteUuid` on customer itinerary favorite rows;
- `checklistUuid` on pre-cruise checklist rows;
- backfill and unique-index safeguards for existing demo data;
- update behavior that preserves the booking-passenger UUID when the same passenger remains attached to a booking.

Phase 1 remains active. The strongest remaining targets are durable-ID API contract promotion, remaining turnaround edge-mutation audit consistency, seed-JSON exit work, and shared enum/domain hardening for remaining status-like fields.

## AI foundation configuration

The AI integration is server-side and disabled by default. Phase 1 provides provider abstraction, strict structured output, evidence grounding, role authorization, bounded retries and timeouts, persistent audit evidence, privacy-conscious telemetry, configurable token-cost estimates, and production configuration validation. Phase 2 now includes the first operation-scoped briefing API slice; the user-facing briefing workspace is not yet implemented.

For a deterministic local demonstration:

```bash
AI_PROVIDER=deterministic npm start
```

For the production OpenAI provider, configure the server environment only:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=<secret>
OPENAI_MODEL=gpt-5-mini
AI_TIMEOUT_MS=5000
AI_MAX_ATTEMPTS=2
AI_RETRY_DELAY_MS=100
AI_MAX_CONTEXT_CHARS=120000
OPENAI_INPUT_USD_PER_MILLION_TOKENS=<current input price>
OPENAI_OUTPUT_USD_PER_MILLION_TOKENS=<current output price>
```

Pricing is intentionally not hard-coded because provider prices change. When both pricing values are zero, usage is still recorded but cost estimation is disabled. Never expose `OPENAI_API_KEY` to Vite or any browser-prefixed environment variable.

Validate the foundation independently with:

```bash
npm run ai:foundation:audit
npm run ai:foundation:test
```

### Phase 1 deployment readiness check

Before deploying or enabling an AI provider, run:

```bash
npm run ai:foundation:audit
npm run ai:foundation:readiness
npm run ai:foundation:test
```

The readiness command distinguishes **deployment safety** from **generation readiness**. The application is safe to deploy with `AI_PROVIDER=disabled`; AI generation remains unavailable until a supported provider is selected and its required server-side credentials are configured. The `/ai/program-status` response exposes the same sanitized readiness result without exposing credentials, prompts, evidence, or operational notes.

### Phase 2 operation-scoped briefing workflow

Phase 2 generates briefings directly from trusted turnaround records instead of accepting browser-supplied evidence:

```http
POST /ai/turnaround-operations/:operationId/briefing
Content-Type: application/json
X-Demo-User-Id: <assigned operational user>

{
  "question": "What could delay departure?"
}
```

The server loads and normalizes operation, task, dependency, handoff, staffing, signoff, and escalation evidence; prioritizes active risks within the context limit; enforces the existing turnaround tenant boundary; and returns the briefing with an evidence summary and sanitized operation metadata. Raw operational evidence remains server-side.

The second Phase 2 slice adds persistent briefing history and human review through the existing audit-event store:

```http
GET /ai/turnaround-operations/:operationId/briefings?limit=20
POST /ai/turnaround-operations/:operationId/briefings/:briefingId/review
Content-Type: application/json

{
  "disposition": "NEEDS_REVISION",
  "notes": "Clarify the staffing risk and owner."
}
```

Generated briefings now receive a stable `briefingId`, retain their grounded response snapshot and question in the server-side audit trail, and return the latest reviewer disposition in history results. Supported dispositions are `ACCEPTED`, `NEEDS_REVISION`, and `REJECTED`. Tenant and operational-role authorization are enforced before history or review access.

Run the focused Phase 2 tests with:

```bash
npm run ai:phase2:test
```

### AI Quality Program status

- Phase 1 — AI Foundation: **COMPLETE (100%)**
- Phase 2 — Turnaround Briefing: **IN_PROGRESS (60%)**
- Phase 3 — Evaluation Harness: **NOT_STARTED**
- Phase 4 — AI Quality Console: **NOT_STARTED**
- Phase 5 — Adversarial and Resilience Testing: **NOT_STARTED**
- Phase 6 — CI Integration: **NOT_STARTED**

Phase 1 completion remains enforced by `npm run ai:foundation:complete`. The gate verifies deployment-safe runtime configuration and the completed foundation contract while allowing Phase 2 development to proceed independently.
