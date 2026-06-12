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

The current operations experience has completed the major turnaround management UX slices: selected-turnaround workflow, operations navigation, tasks, dependencies, handoffs, escalations, staffing, readiness approvals, role-specific command briefs, audit history, release-packet readiness review, unified operational timeline, playbook variance rehearsal, product-language hardening, and Playwright stability hardening.

Before a public presentation or production-style deployment, use the in-app Quality Console and the go-live manual review guide to confirm:

- Role-aware workflows behave correctly for admin, passenger, group leader, turnaround manager, and department lead roles.
- Turnaround operations remain focused around one selected sailing and one selected work area.
- Fleet, customer, booking, passenger, and quality workflows are reachable at desktop, tablet, and mobile sizes.
- User-facing language presents a real cruise operations product, not the internal development process.
- Automated and manual checks both support approval.

Current engineering phase: Data Architecture Hardening with normalized users/roles and an Operational ownership attribution bridge is underway. Completed hardening now includes production query indexes, shared reference-data contracts, database `CHECK` constraints, typed date/time migration bridge columns, and normalized user/role bridge tables for production identity compatibility. The next data-hardening passes should deepen user/role normalization into owner and approver foreign keys, add audit history, introduce multi-cruise-line tenancy, and eventually move application writes fully onto typed temporal columns. See [docs/data-architecture-hardening.md](docs/data-architecture-hardening.md).

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
- Production deployment awareness
- Recruiter-friendly documentation

---

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


### Turnaround incident command bridge
The turnaround operations module now includes a derived incident-command view that rolls blockers, escalations, staffing gaps, handoff risk, signoff gaps, dependencies, timeline criticality, release readiness, and playbook variance into one release-day exception management panel for demo reviewers and future production operators.

### Latest turnaround personnel selector slice

The turnaround role selector now includes an assignment roster review for the selected cruise-line scope. In addition to the cruise-line-first and ship-second filters, reviewers can see which ships and role groups are represented in the active operational personnel pool, how many scoped people are visible, and whether the current cards remain cross-line clean. This keeps the demo role-assumption flow intact while making the original personnel-assignment integrity problem visible and testable before continuing deeper turnaround management feature work.


## Current development status - Turnaround operations executive-readiness slice

The turnaround operations module now has the major production-demo layers in place: scoped operational role views, selected-user scoping, command planning, task/staffing/dependency/handoff/escalation/signoff workflows, release readiness, operational timeline, performance metrics, playbook template readiness, playbook variance, incident command, after-action review, and an executive turnaround brief. The demo remains intentionally role-assumable so reviewers can switch into Admin, Passenger, Group Leader, Turnaround Manager, Housekeeping Lead, Guest Services Lead, Food & Beverage Lead, and Engineering Lead without login friction, while the backend continues to route the selected demo user through request identity and scope services.

The latest slice adds the executive brief layer. It is generated server-side from release packet, operational metrics, operational timeline, playbook template, playbook variance, incident command, and after-action review data. The React dashboard now shows a reviewer-ready summary with decision score, release confidence, incident score, debrief score, rehearsal score, executive highlights, department focus, and action plan. This is intended to make a cruise-line reviewer see the state of a turnaround operation quickly without reading every operational panel.

Turnaround personnel selector status: the selector is now hardened around one cruise-line scope at a time for operational users. It supports cruise-line-first filtering, ship narrowing only after cruise-line selection, 16 visible assignment cards, assignment roster, manifest, governance, integrity review, and deployment matrix. The data model still supports demo role assumption, but operational visibility is constrained so turnaround personnel are not shown as broadly assigned across multiple cruise lines in the active scope.

Testing status: the current baseline passed before this slice. This slice was validated with react production completion and targeted Jest coverage for the new executive brief service and existing architecture guardrails. Full React build could not be run in this sandbox because the uploaded zip does not include node_modules/vite.

Recommended next work: continue with turnaround operations hardening rather than adding unrelated features. Best next candidates are executive/export polish, final selector/data normalization audit, controller/service decomposition for the large cruise controller, and more unit coverage for the lower-branch-coverage turnaround services.

### Current production-demo slice: Turnaround reviewer packet

The latest slice adds a cruise-line reviewer packet to the turnaround dashboard. It is generated server-side from the executive brief, release packet, operational timeline, metrics, playbook template, playbook variance, incident command, after-action review, audit events, and live operation data. The packet gives reviewers a presentation-ready summary with readiness score, reviewer narrative, proof points, data-quality snapshot, and next steps.

This moves the turnaround module beyond internal workflow panels into an outreach-ready story: a cruise-line reviewer can see why the selected operation is ready, what evidence supports it, which risks remain, and how the system protects scoped operational data. The feature remains demo-safe and role-assumable, but it is structured as a future export/approval seam.

### Current continuation slice: turnaround outreach board

The latest turnaround slice adds a cruise-line outreach board to the operational dashboard. It builds on the reviewer packet, executive brief, incident command, and after-action review to produce outreach readiness, a send/review/hold status, checklist items, reviewer assets, target recommendations, and an application action plan. This keeps the app focused on demo-mode role assumption while giving cruise-line reviewers a structured path through the operational evidence.

## Turnaround Management Status Slice

This slice adds a continuation-ready turnaround management status map. The selected operation now exposes a `managementStatus` payload built from the existing turnaround evidence stack: role-scoped command, workflow CRUD, release metrics, audit/timeline evidence, playbooks, variance, incident command, after-action review, executive brief, reviewer packet, and outreach board.

The dashboard now shows a production-demo completion score, capability-by-capability readiness, remaining hardening work, and recommended next slices. This keeps demo role assumption intact while making it easier to explain where turnaround management stands and where the next development conversation should resume.

Current direction: turnaround management is no longer missing core workflow functionality. Remaining work is mostly flagship-demo polish, portfolio-level comparison, guided reviewer scripting, and deeper data architecture hardening before broader cruise-line outreach.
