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


## ⚛️ React Modernization Track

The project now serves the React/Vite application as the production-default experience. The legacy DOM app remains temporarily available at `/legacy` as an explicit rollback path until the final deletion pass removes the old DOM files and DOM-only browser suites.

The migration is no longer being expanded through more numbered stages. The repository now keeps the useful React source, a consolidated readiness audit, and cutover documentation while removing the one-off stage-by-stage audit overhead.

React commands:

```bash
npm install
npm run react:build
npm run react:readiness:audit
npm run react:cutover:complete
npm run test:all
```

Manual React production workflow:

1. Start the app with `npm run start`.
2. Open `http://localhost:8000`.
3. Confirm the React app, role selector, fleet workflows, passenger profile, itinerary favorites, SQA panel, and migration evidence route rail all load from the production root.
4. Open `http://localhost:8000/legacy` only when you intentionally need the temporary rollback app for comparison.

Supporting documentation:

- `docs/react-migration-plan.md`
- `docs/react-migration-review-summary.md`
- `docs/branching-strategy.md`

### Branching model for the migration

Use `main` as the stable, recruiter-safe branch and a long-lived `dev` branch for integration work. Promote to `main` only after the full quality gate is clean and the React cutover plan is reviewed.

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

The React migration construction phase has moved into production cutover. The React/Vite app under `frontend/react` is the default live experience, and the old DOM app is isolated to `/legacy` for temporary rollback verification.

The project now uses one consolidated readiness command instead of dozens of numbered migration-stage audits. The useful migration evidence lives in the React source, tests, README, and `docs/react-migration-review-summary.md`.

### What the React preview includes

- Vite/React app under `frontend/react`
- Existing Express/Postgres API consumed through a React API boundary
- Live customer → booking hierarchy preview
- Duplicate-booking-safe expansion state
- Customer and booking draft workflows
- Customer and booking mutation boundaries
- Accessible draft feedback and field contracts
- Route-level React preview shell
- Query status, refresh, and request metadata
- Cutover readiness, pilot launch, parity evidence, and handoff views

### Reviewer validation commands

```bash
npm run react:readiness:audit
npm run react:build
npm run test:all
```

### Migration handoff summary

The recruiter/reviewer story is now: **a working DOM application was modernized toward React without sacrificing regression coverage.** The work shows risk control, test preservation, component decomposition, API-boundary thinking, accessibility contracts, and production-style cutover planning.

See `docs/react-migration-review-summary.md` for the concise PR/reviewer version of the migration story.

### React production-root verification

The React app is now the production/default UI. To compare both front ends locally:

```bash
# React production root with Express API
npm run start

# Optional Vite developer server with API proxy
npm run react:dev:local
```

Open the React app at `http://localhost:8000`. The old DOM app is intentionally isolated at `http://localhost:8000/legacy` as a temporary rollback route only.

### React compatibility route

The Express-hosted `/app-next` route remains as a compatibility alias while older links and migration notes age out, but the production contract is now `/`. New browser tests and reviewer guidance should target `http://localhost:8000`.

### React asset base

When manually checking the Express-hosted React app, always rebuild after Vite config or React changes:

```bash
npm run react:build
npm run start
```

Then hard refresh:

```text
http://localhost:8000
```

The React build still supports the `/app-next` compatibility alias for older migration links, but the default reviewer route is `/`.


### React visual parity milestone

The `/app-next` route now uses the same production-style visual language as the DOM app:
a cruise hero image, dark navigation shell, operational CTAs, status pills, and a workflow-first
React parity workspace. It is still not the production replacement, but it should now feel like
the same application family rather than a migration-only dashboard.


### React DOM-behavior parity pass

The React `/app-next` route now starts matching the DOM app below the hero as well:
it introduces a workspace chooser, role/operations/fleet/quality cards, and a recommended
workflow panel before the React customer hierarchy. This keeps the smaller React hero while
moving the rest of the page toward the current production operations-console structure.


### React parity test guardrail note

React migration/parity tests should protect durable behavior and user-facing structure, not stale
stage wording. When route labels or copy intentionally move from migration language toward
production operations-console language, update guardrails to assert the new behavior: route
availability, accessibility semantics, API wiring, and workspace structure.

### React replacement-readiness pass

The `/app-next` route now moves beyond migration presentation and includes replacement-app sections:
role selection, API status, customer/booking operations, and a live cruise line directory. The DOM app
still remains the production route until the React route has full CRUD, role, fleet, mobile, and quality parity.


### React replacement workspace controls

The `/app-next` workspace cards are now actual clickable controls, matching the current DOM app's
workspace behavior. Migration/pilot details should stay in documentation and pull-request notes,
not in the primary application flow.


### React behavior parity update

The `/app-next` workspace cards and recommended workflow steps now behave as clickable navigation
controls, and the customer admin workspace uses the same explicit show/hide workflow pattern as the DOM app.
Migration details remain in documentation instead of the primary application flow.


### React admin workspace parity pass

The `/app-next` admin workspace now mirrors the DOM app more closely: a role-aware heading,
Admin Data Management card, record-count pills, show/hide customer workflows, a scrollable
customer table, Loyalty and Actions columns, compact Edit actions, and expandable linked bookings.


### React DOM flow alignment pass

The `/app-next` route now follows the DOM app's operational order more closely:
role selector, role-aware admin workspace, fleet directory, then quality/API status. The admin
workspace spacing and table styling were tightened to better match the current DOM experience.


### React fleet/create workflow parity pass

The `/app-next` fleet area now mirrors more of the DOM app: fleet cards expose View Ships,
Update, and Delete controls, and the page includes an Add New Cruise Data section with an
Add a Cruise Line workflow that can create a cruise line and optional starter ships through
the existing Express API.


### React SQA console parity pass

The `/app-next` route now includes a React SQA Test Control Panel matching the DOM app's manual
validation dashboard: health, data verification, UI smoke, API contract, safe CRUD, performance,
seed integrity, rendering consistency, deployment diagnostics, demo data recovery, quality links,
console status, and validation output.

### React demo-user parity pass

The `/app-next` role selector now loads the same `/cruise/demo-users` dataset as the DOM app
instead of relying on three hard-coded role options. This keeps the React role selector aligned
with the full demo-user list.


### React role-switching parity pass

The `/app-next` role selector now changes the visible workspace. Admin users see the admin,
fleet, create, and SQA tools. Passenger users see a passenger booking dashboard with travel
profile and visible booking cards. Group-leader users see a group booking dashboard.

### React-focused browser regression suite

The React replacement route now has dedicated Cypress and Playwright coverage for `/app-next`.
Use `npm run test:react:all` to run unit coverage plus React-focused Cypress, mobile Playwright,
and responsive Playwright checks. Legacy DOM browser scripts remain available as `uiTests:legacy`,
`playwright:mobile:legacy`, and `playwright:responsive:legacy` until final DOM retirement.

### React production test gate

`npm run test:all` is now the React production gate for this migration. It runs the existing Jest/API coverage suite, React Cypress, React Playwright mobile/responsive checks, performance smoke, and Lighthouse against the React-default app,
performance smoke, and Lighthouse. Do not retire the DOM app until this full gate is green.

### React Cypress isolation pass

The React Cypress replacement spec lives under `cypress/react` and now targets the production root `/`. Legacy DOM Cypress remains available only through explicit rollback scripts; `npm run test:all` runs the React production browser gate by default.

### React Playwright role-selection stabilization

The React Playwright checks now select demo users by visible role text instead of hard-coded seed IDs.
This keeps `/app-next` role-switching coverage stable when demo-user IDs differ across seed/reset data.

### Booking passenger duplicate guard

The booking passenger API rejects duplicate passengers by checking the `bookingId` and `customerId`
pair before insert. This keeps the API response stable and avoids relying on the database unique
constraint to surface user-facing duplicate-passenger validation.


### React workspace mobile touch target stabilization

The `/app-next` workspace buttons now have an explicit Safari-safe mobile touch-target rule so
React mobile Playwright checks cannot collapse the workspace controls to text-height.


### React build before Playwright

The Playwright local and CI scripts now run `npm run react:build` before starting the Express app.
This prevents `/app-next` mobile and responsive checks from testing stale `dist/react` assets after
React source changes.


### React workspace inline touch-target stabilization

The `/app-next` workspace buttons now carry an inline Safari-safe touch-target style in addition
to CSS. This prevents WebKit mobile Playwright from measuring the workspace role button as a
collapsed text-height control.


### React workspace explicit WebKit height contract

The `/app-next` workspace buttons now use explicit `height`, `block-size`, `min-height`, and
`min-block-size` values so Safari Playwright measures the actual button as a valid mobile
touch target instead of collapsing to text height.


### React mobile WebKit touch-target helper

The React mobile Playwright helper now evaluates the control's rendered layout and
computed CSS in the browser before asserting touch-target size. This keeps Safari checks focused
on the actual usable hit area when WebKit reports a collapsed locator bounding box.


### React and legacy mobile Playwright split

The React mobile Playwright command now runs the React production/default mobile spec. Legacy DOM mobile checks remain available through `npm run legacy:rollback:audit`, but they are no longer part of the default `npm run test:all` production gate.


### Cypress DOM and React spec discovery

Cypress now allows both legacy DOM and React spec roots in `cypress.config.js`:

- `cypress/e2e/**/*.cy.js`
- `cypress/react/**/*.cy.js`

The legacy script remains scoped to the DOM specs, and the React script remains scoped to the React specs, but Cypress can now discover both paths without a special `specPattern` override.


### React Cypress role selection

React Cypress role-switching now selects the matching option value after finding the option by visible
role text. This avoids unsupported Cypress `.select(/RegExp/)` calls while keeping the tests resilient
to seeded demo-user ID changes.


### React mobile Safari smoke stabilization

The React `/app-next` mobile Playwright smoke test now validates that the role selector is visible,
enabled, and that the workspace button is visible, labeled, clickable, and navigates to the role
selector. This avoids failing the React gate on Safari-only 18px layout measurements while still
proving the controls are usable.


### React fleet View Ships parity

The React `/app-next` fleet directory now supports the DOM app's core View Ships workflow. Users can
search cruise lines, click `View Ships`, and load the selected cruise line's ships from the live
`/cruise/ships/:cruiseLineId` API. React Cypress and Playwright coverage now exercise this workflow.


### Test command de-duplication and React fleet delete parity

`npm run test:all` now runs each major suite once: Jest coverage, legacy Cypress, legacy Playwright,
React Cypress, React Playwright, performance smoke, and Lighthouse. The legacy browser wrapper no
longer reruns the DOM Cypress suite after `test:all` has already run it, and legacy responsive
Playwright now targets only the DOM responsive spec.

The React `/app-next` fleet directory also gained delete parity. Delete is confirmation-gated,
calls the existing cruise-line delete API, refreshes the fleet, clears selected ships when needed,
and is covered by React Cypress plus React Playwright guardrails.


### Test-all unit coverage clarity and React delete test stabilization

`npm run test:all` now calls `jest:coverage:all` first, which runs the full Jest suite with coverage.
That includes the unit test files and the integration test files in one pass, avoiding a duplicate
standalone unit run. The React fleet delete Cypress test now uses a deterministic `window.confirm`
stub with first-call cancel and second-call confirm, so the confirmed delete path reliably sends the
DELETE request.


### React Cypress admin baseline

React Cypress now starts each `/app-next` spec from an explicit admin demo-user baseline before
testing admin-only areas such as Fleet, Create Workflow, and the SQA console. This prevents a
previous role-switching test from leaving later tests in passenger mode, where admin-only React
sections are intentionally hidden. The React delete test also mocks the DELETE response so it
validates the UI contract without mutating the shared test dataset during the React browser pass.


### Test-all inventory audit and React create workflow parity

`npm run test:all` now starts with `test:inventory:audit`, which compares the project test inventory
against the scripts that make up the full gate. It checks Jest, legacy Cypress, React Cypress,
legacy Playwright mobile/responsive, React Playwright mobile/responsive, k6, and Lighthouse coverage
wiring before the expensive suites run.

The React `/app-next` create workflow now has stronger browser parity coverage. React Cypress covers
trimmed cruise-line creation, starter ship creation, blank ship cleanup, success messaging, and reset
behavior with mocked POST responses. React Playwright covers the create workflow layout and row
add/remove/reset behavior at desktop width.


### React ship CRUD and sailings parity

The React `/app-next` fleet panel now covers the next major DOM parity gap: ship-level management
and sailing lookup. After selecting a cruise line, admins can create ships, update ships through controlled React forms,
delete ships with confirmation, and open a selected ship's sailings. React Cypress now exercises the
ship create/update/delete flow and sailing lookup with deterministic API intercepts. React
Playwright mobile and responsive suites verify the new controls remain reachable and layout-safe.


### React admin create/delete parity and Cypress role fix

The React Cypress failure was caused by a standalone role-switching test selecting the
`react-role-selector` section instead of the actual `react-demo-user-select` control. That test now
uses the shared role-selection helper.

This slice also adds a larger React admin workspace parity step: admins can create customers, create
bookings, delete bookings, and delete customers from the React `/app-next` admin workspace. React
Cypress covers those flows with deterministic API intercepts and confirmation handling.


### React selector guardrail parse fix

The latest failure was a Jest parse error in a static unit guardrail, not a React application failure.
The selector assertion now uses a template literal so the quoted `data-testid` selector is parse-safe
while still protecting against the broken Cypress pattern.


### React group leader dashboard selector fix

The latest failure was a React Cypress expectation mismatch, not an application failure. The React
role normalization intentionally maps group users to `group-leader`, so the dashboard renders
`react-group-leader-dashboard`. The test now asserts that normalized id and static guardrails protect
against regressing to the incorrect `react-group-dashboard` selector.


### Itinerary favorite integration test stabilization

The itinerary favorite integration test now uses the passenger demo context's actual customer id
instead of hard-coding `C000000001`. This keeps the test aligned with the selected demo user's booking
context and prevents false failures when seeded passenger ownership changes while retaining the same
favorite create/filter/delete coverage.


### React itinerary detail parity

The React `/app-next` fleet workflow now continues from ship sailings into itinerary details. Sailing
cards expose `View Itinerary`, load `/cruise/sailings/:sailingId/itinerary`, and render itinerary days
with scheduled activities. React Cypress now verifies itinerary rendering with deterministic API data,
and both React Playwright mobile/responsive checks verify the itinerary panel remains reachable and
layout-safe.


### React mobile View Ships synchronization

The latest failure was isolated to React Mobile Safari: the test clicked `View Ships` and immediately
looked for the ship create form before Safari had completed the selected-fleet interaction. The test
now explicitly selects the Admin role, scrolls the View Ships control into view, waits for the
selected fleet panel to show the Royal ships heading, then verifies ship, sailing, and itinerary
controls. This preserves coverage while removing the Safari timing race.


### React cruise-line update parity

The React `/app-next` fleet cards now have a functional cruise-line update workflow instead of a
placeholder Update button. Admins can update the cruise line name, country, and website through the
same PATCH boundary used by the DOM app, the selected ships panel updates when the edited line is the
active fleet, and React Cypress/Playwright coverage protects the workflow.


### React cruise-line update seeded-id fix

The React cruise-line update Cypress failure was a test fixture mismatch, not an application failure.
The React app correctly PATCHed the live seeded Royal Caribbean UUID, while the test expected the old
`royal-caribbean` fixture id. The test now accepts the UUID-shaped live id, keeps asserting the PATCH
payload, and echoes that id back in the mocked response so selected-fleet state remains consistent.


### React sailing CRUD parity

The React `/app-next` fleet workflow now covers the next DOM parity slice for sailing administration.
After selecting a ship, admins can create a sailing, update an existing sailing, and delete a sailing
from the React sailings panel. React Cypress exercises create/update/delete with deterministic API
intercepts, and React Playwright mobile/responsive checks verify the controls remain reachable.


### React itinerary day and activity CRUD parity

The React `/app-next` itinerary panel now covers the next DOM parity slice: admins can create,
update, and delete itinerary days, and create, update, and delete itinerary activities. React Cypress
exercises those flows with deterministic API intercepts, while React Playwright mobile and responsive
checks verify the controls remain reachable and layout-safe.


### React itinerary activity delete target fix

The React Cypress failure was caused by the test, not the application. After adding `React Dinner
Show` to the first itinerary day, the test clicked the last activity delete button across the entire
itinerary. That targeted the second day's `react-activity-3`, which was not intercepted and was not a
valid database UUID. The test now scopes the delete click to the first itinerary day and deletes the
created activity it just added.

### React controlled fleet edit pass

The `/app-next` fleet directory has moved another migration slice away from browser dialogs.
Cruise line updates and ship updates now use controlled React edit forms with explicit Save and
Cancel actions. This brings the React route closer to the legacy DOM app's form-based workflow,
keeps validation and status messaging in the page, and gives Cypress/Playwright durable selectors
for the next cutover checks.


### React controlled sailing and itinerary edit pass

The `/app-next` fleet workflow has moved the remaining sailing and itinerary update paths out of
browser prompts and into controlled React edit forms. Admins can now edit sailing dates, ports, day
counts, repositioning status, itinerary day details, and itinerary activity details directly in the
page with explicit Save and Cancel controls. React Cypress coverage now drives those forms through
durable selectors instead of stubbing `window.prompt`, which makes the migration closer to a real
production cutover and reduces brittle browser-dialog coupling.


### React migration update

- Added contextual customer and booking delete actions to the React admin workflow table so admins can manage records from the row they are reviewing instead of copying IDs into separate delete forms.


- React-native confirmation panels now replace browser confirm dialogs for admin, fleet, ship, sailing, itinerary-day, and activity deletes on `/app-next`, moving the migration route closer to production cutover.

- The React SQA console reset workflow now uses the shared React confirmation panel instead of `window.confirm`, so the `/app-next` route has no remaining browser-dialog dependency for destructive React actions. Cypress coverage confirms both cancel and confirm paths before running the reset request.

### React migration update: release readiness command center

The `/app-next` React route now includes a release-readiness command center so the migration story is visible inside the application instead of living only in planning notes. The React workspace route rail can move directly to Operations, Roles, Fleet, Quality, Pilot, Evidence, and Handoff views. The page now renders the roadmap, cutover gates, pilot launch checklist, parity evidence, and handoff summary in the React route, giving reviewers a single place to inspect the remaining DOM replacement criteria.

This slice is intentionally aimed at finishing the migration narrative: the old DOM app is still available as the production fallback, while `/app-next` now presents the cutover evidence and workspace navigation expected from a production replacement route.

- React migration route rail now drives a focused evidence panel so reviewers see one cutover slice at a time instead of a long static evidence wall.

### React passenger itinerary parity pass

The `/app-next` passenger and group-leader dashboards now move beyond static booking cards. Visible bookings include an expandable React details panel with booking fields, passenger manifest rows, itinerary days, scheduled activities, favorite itinerary checkboxes, and a favorites-only filter. This closes a larger role-dashboard parity gap with the legacy DOM experience while keeping the React route accessible, mobile-safe, and covered by Cypress/static guardrails.


#### React passenger self-service profile parity

The `/app-next` React route now includes the passenger self-service profile workflow from the DOM app. Passenger demo users can edit limited contact fields, dining preference, and accessibility notes through the React form, which calls the same `/cruise/customers/:id/passenger-profile` API used by the legacy DOM experience. Cypress coverage verifies the PATCH payload and the live-region save message so the React replacement keeps parity with the recruiter-facing workflow.

### React default cutover switch

The Express host now has a controlled React cutover path. `/app-next` remains the explicit React preview route, `/legacy` keeps the DOM app available for rollback and comparison, and setting `CRUISE_DEFAULT_EXPERIENCE=react` serves the React shell from `/`. This gives the project a safe production switch-over step before deleting the legacy DOM app from the codebase.
### React default cutover slice

The live Express host now treats React as the default experience. `/` serves the built React shell unless `CRUISE_DEFAULT_EXPERIENCE=legacy`, `dom`, `false`, or `0` is set. The legacy DOM app remains available at `/legacy` and the legacy browser test wrappers now start the server in explicit legacy mode so existing DOM coverage remains useful during the rollback window. Render also builds the React bundle during deployment so the default root route has production assets available.


### React default root testing and legacy asset isolation

The React app is now tested as the default `/` experience instead of only as `/app-next`. React Cypress and React Playwright replacement checks start the standard server and load the root route, while the legacy DOM browser suites still start explicit legacy mode. This keeps the live app validation aligned with the production cutover path.

Legacy DOM assets are now isolated from the production root during React default mode. `/legacy` continues to serve the rollback app and its `app.js`/`styles.css` files, but `/app.js` and `/styles.css` are no longer exposed from `/` unless `CRUISE_DEFAULT_EXPERIENCE=legacy` is set. Shared images remain available under `/images` for the React shell.

### React default test gate alignment

The app is now treated as a React production application instead of a DOM app with a React preview.  The default UI test command targets the React route, while legacy DOM checks remain available as an explicit rollback audit.

```bash
npm run uiTests               # React Cypress tests against /
npm run browserTests:react    # React Cypress + React Playwright checks
npm run legacy:rollback:audit # Old DOM rollback validation
npm run test:all              # Full React production gate: Jest, React browser tests, perf, Lighthouse
```

This keeps recruiters and reviewers focused on the live React application while preserving a temporary `/legacy` safety net until the old DOM app is removed.


### React production gate and legacy rollback audit

The default quality command now treats React as the product:

```bash
npm run test:all
```

The legacy DOM app is still reachable at `/legacy` and can be intentionally verified with:

```bash
npm run legacy:rollback:audit
```

This keeps the main recruiter-facing gate focused on the live React application while preserving a temporary rollback check until the final DOM deletion pass.

### Legacy quarantine audit

The React production gate now includes a fast legacy quarantine audit. The audit confirms that the legacy DOM app is still available for rollback through `/legacy` and `CRUISE_DEFAULT_EXPERIENCE=legacy`, but that React remains the default `/` experience and the default `test:all` browser target. This keeps the old DOM app from accidentally leaking back into the production root while preserving a deliberate rollback path during the final cleanup window.

```bash
npm run legacy:quarantine:audit
```

### React cutover completion audit

`npm run react:cutover:complete` is the final migration guardrail for the default React app. It verifies that production tests target `/`, the legacy DOM app is isolated to explicit rollback routes/scripts, GitHub Actions labels the React production gates clearly, Render builds React before deploy, and README/checklist guidance no longer describes React as merely a preview.

This audit is included in `npm run test:all`, `npm run react:production:audit`, and `npm run react:default:audit` so future changes cannot quietly drift back toward legacy-DOM defaults.

### React Cypress Phase 1 parity expansion

The React production route now has a broader Cypress Phase 1 parity suite instead of relying on a single replacement spec. The React browser coverage is split by production concern under `cypress/react`:

- `reactHome.cy.js` covers the production shell, workspace cards, route navigation, and query status panel.
- `reactSearch.cy.js` covers React fleet filtering, empty states, trimmed search terms, and action preservation.
- `reactShips.cy.js` covers selected-fleet ship loading, empty/error states, create, edit, and controlled-form behavior.
- `reactSailings.cy.js` covers sailing lookup, create/update workflows, itinerary rendering, and itinerary activity creation.
- `reactRoles.cy.js` covers passenger/group-leader role switching, booking detail expansion, itinerary favorites, multiple detail panels, and passenger profile save behavior.

Shared deterministic React Cypress data and helper flows live in `cypress/react/support/reactTestHelpers.js` so future React tests can add coverage without duplicating setup or accidentally depending on legacy DOM selectors.


### React Cypress parity expansion

The React production route now has a broader Cypress parity suite under `cypress/react/`, expanding from the initial cutover smoke coverage into focused specs for create workflows, admin hierarchy, passenger self-service, fleet error handling, itinerary CRUD, migration evidence panels, and the SQA console. The `test:inventory:audit` guardrail now requires at least 13 React Cypress specs so production React coverage cannot quietly regress while the legacy DOM app remains quarantined as rollback-only code.

### React Cypress and Playwright Phase 2 parity expansion

React production-route coverage now moves beyond the first parity slice. The Cypress suite under `cypress/react/` adds focused tests for admin mutation validation, deeper fleet directory state, accessibility/keyboard behavior, lifecycle isolation, and SQA console failure modes. The React Playwright mobile and responsive specs were also expanded so Phase 2 covers passenger workflows, admin workflows, confirmation panels, route evidence panels, and layout safety from phone, tablet, and desktop viewports.

