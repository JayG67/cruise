# React Migration Plan

## Why migrate?

The current DOM-based frontend is now mature enough to justify a staged React migration. The application has role-aware screens, nested customer and booking hierarchy state, inline edit workflows, duplicate booking rows across customers, and mobile/responsive behavior that must stay stable. Those are exactly the areas where component ownership and explicit state management provide value.

This migration is not justified by popularity alone. It is justified by maintainability, testability, state isolation, and the portfolio value of modernizing a working application without losing regression coverage.

## Migration principles

1. **Do not rewrite the production UI all at once.** The existing app remains the production baseline until React workflows pass equivalent coverage.
2. **Keep the Express/Postgres API stable.** React consumes the same endpoints that Cypress, Playwright, and integration tests already validate.
3. **Migrate by workflow.** Start with the highest-complexity workflow: Admin Customer → Bookings → Booking Details.
4. **Preserve regression coverage.** Existing Cypress, Playwright, integration, Lighthouse, and k6 checks remain active.
5. **Add component-level coverage before replacement.** React components should gain focused unit/component tests before the legacy DOM workflow is retired.

## Stage plan

### Stage 0: Safe scaffold

- Add Vite React shell under `frontend/react`.
- Add scripts for local React development and production build.
- Keep the existing `public/` DOM app as the production UI.
- Add static guardrails that verify the migration scaffold remains present.

### Stage 1: Admin hierarchy proof of concept

- Build React components for customer search, expandable customer rows, booking rows, and booking details.
- Consume existing `/cruise/customers` and `/cruise/bookings` endpoints.
- Extract hierarchy mapping, duplicate-booking matching, filtering, route formatting, and summary counts into `frontend/react/src/domain/adminHierarchy.js`.
- Keep React state scoped to customer and booking row ownership so duplicate booking IDs under different customers do not recreate the hidden-row problems found during the legacy UX work.
- Keep the React shell as a development-only workspace until test parity is reached.

### Stage 2: Component tests and workflow parity

- Add React component tests for hierarchy state, duplicate booking behavior, and edit form reachability.
- Mirror the critical Cypress/Playwright admin hierarchy coverage against the React implementation.

### Stage 3: Route-level cutover

- Serve the React build for the main UI only after the React workflow has equivalent or better coverage.
- Keep API, integration, accessibility, mobile, performance, and Lighthouse gates active.

### Stage 4: Legacy DOM retirement

- Remove legacy DOM code only after React coverage proves parity.
- Document migration decisions, defects found, and test improvements as portfolio evidence.

## Portfolio story

This becomes a strong Principal SQA / AI-enabled engineering story because it shows:

- Legacy UI modernization without breaking production behavior.
- Risk-based workflow selection.
- Regression-first migration strategy.
- Test architecture that catches duplicate hidden-row failures across Cypress and Playwright.
- AI-assisted development used with human review and durable guardrails.


### Stage 2: API boundary and retryable loading

- Extract React API calls into `frontend/react/src/api/client.js`.
- Add a React loading hook that owns loading, error, cancellation, and retry behavior.
- Keep the existing Express/Postgres API as the source of truth.
- Add stable React migration `data-testid` attributes for future component and Playwright coverage.
- Continue to keep the production DOM app untouched until the React workflow has equivalent coverage.

This stage is intentionally small but important: it turns the React preview from static component work into a production-shaped client boundary.


### Stage 3: Extracted state transition model

- Extract customer and booking expansion transitions out of the React component.
- Keep duplicate-booking-safe expansion keys in one domain module.
- Preserve visible-row collapse behavior without clearing unrelated hidden customer state.
- Add audit guardrails so future React migration work does not reintroduce inline selector-style state handling.

This stage is intentionally small. It demonstrates that the migration is moving toward testable state ownership before the legacy DOM workflow is replaced.


### Stage 4: Customer edit draft state

- Add `frontend/react/src/domain/customerDrafts.js` for customer edit draft creation, field updates, validation, and changed-field summaries.
- Add a React-only customer draft editor inside the hierarchy proof of concept.
- Keep draft validation local and intentionally defer live API mutation wiring until a later stage.
- Expose stable `data-testid` hooks for future React component and browser coverage.
- Preserve the production DOM app and existing API behavior while the React workflow matures.

This stage moves the React slice from read-only hierarchy exploration toward realistic admin edit workflows without risking persisted data changes.


### Stage 5: Customer mutation boundary

- Add a React API mutation boundary for customer profile updates.
- Keep validation in the React draft state layer before sending API requests.
- Wire successful saves to reload the hierarchy snapshot through the existing Stage 2 loading hook.
- Preserve the production DOM app as the stable UI while React gains mutation parity one workflow at a time.

This stage matters because the React proof of concept now exercises a real end-to-end admin edit path without cutting over the production UI.


## Stage 6: Booking draft state before live booking mutations

Stage 6 adds booking-level draft state inside the isolated React hierarchy. The goal is to prove the booking edit workflow can be modeled as local, duplicate-safe React state before wiring a live booking PATCH mutation.

This stage intentionally does **not** save booking changes to the API. That separation keeps the migration safe and demonstrates a professional sequencing pattern:

1. Model draft state.
2. Validate draft behavior.
3. Preserve current production behavior.
4. Add mutation only after the state model is covered.

Stage 7 can add the booking mutation boundary once the React draft behavior is stable.


### Stage 8: Draft editor component extraction

- Extract customer and booking draft forms into dedicated React components.
- Keep the hierarchy component focused on orchestration, expansion state, and mutation handoff.
- Preserve all existing `data-testid` hooks so Cypress, Playwright, and future React component tests can continue to target stable controls.
- Keep the production DOM UI untouched while the React shell becomes more componentized and easier to test.

This stage is an architectural cleanup stage. It makes the React migration easier to extend without changing runtime behavior or API contracts.


## Stage 9: Draft editor field contracts

Stage 9 extracts customer and booking draft editor field metadata into React domain modules. This keeps the form structure centralized, makes future validation/component coverage easier, and reduces the chance that customer and booking editor fields drift away from the API mutation payloads.

The production DOM application remains untouched. The React shell continues to prove the migration path through isolated, auditable increments before any cutover decision.


## Stage 10: accessible draft feedback contract

Stage 10 centralizes React draft feedback into a small domain module and reusable feedback component. Customer and booking draft editors now share the same pattern for validation success, validation errors, no-change messages, unavailable save boundaries, mutation success, and mutation failure.

This stage matters because draft save behavior is now moving closer to production quality. The React shell needs consistent assistive-technology behavior before any future cutover. Error feedback is exposed as `role="alert"` while informational and success feedback are exposed as `role="status"`.

The production DOM application remains untouched. Stage 10 is still an isolated migration increment that makes the React shell easier to validate with future component and browser tests.


### Stage 11: Draft field accessibility contracts

Stage 11 centralizes required-field and input-type metadata for the React customer and booking draft editors. The forms now render `required`, `aria-required`, field types, and autocomplete behavior from the same field contracts used by validation guardrails, keeping accessibility expectations aligned with the staged migration.


### Stage 12: Presentation component decomposition

- Extract `CustomerHierarchyRow` from the larger React hierarchy container.
- Extract `BookingCard` so booking details, passenger summaries, and booking draft editing have a focused owner.
- Keep state orchestration in `CustomerBookingHierarchy` while moving row/card rendering into smaller reviewable components.
- Add stable React test IDs for customer row toggles, child booking rows, booking detail toggles, and visible booking details.
- Preserve the production DOM app until the React workflow has equivalent browser coverage.

This stage improves maintainability before cutover: the React hierarchy now has clearer component seams for future component tests, Playwright coverage, and AI-assisted refactoring reviews.


### Stage 13: Presentation accessibility contracts

- Add explicit `aria-controls` relationships between customer expansion buttons and their controlled booking panels.
- Add explicit `aria-controls` relationships between booking detail toggles and their controlled detail panels.
- Keep detail panel IDs based on duplicate-safe customer/booking keys so repeated bookings remain independently addressable.
- Add accessible labels to extracted booking cards so the standalone component remains understandable outside the larger hierarchy table.
- Add static guardrails for the React presentation contracts before introducing broader React browser coverage.

This stage improves migration safety by making the extracted components easier to test and less dependent on surrounding table context.


### Stage 14: Draft workflow hook extraction

- Extract customer draft workflow state and actions into `useCustomerDraftWorkflow`.
- Extract booking draft workflow state and actions into `useBookingDraftWorkflow`.
- Keep duplicate-booking-safe keys inside the booking draft workflow hook so repeated booking IDs remain independently editable by customer context.
- Keep the hierarchy component focused on orchestration and composition instead of owning every draft transition inline.
- Preserve the production DOM UI and existing regression suite while the React migration shell gains clearer state-management seams.

This stage improves maintainability and creates a cleaner future boundary for component tests or route-level React cutover work.


### React Migration Stage 15 — Hierarchy View-State Hook

Stage 15 extracts the React hierarchy search, summary, customer expansion, booking expansion, and collapse orchestration into `useAdminHierarchyViewState`. This keeps `CustomerBookingHierarchy` focused on composition while preserving duplicate-booking-safe expansion behavior and existing regression guardrails.



### Stage 16: Migration roadmap metadata

Stage 16 centralizes the React migration status and readiness messaging into `frontend/react/src/domain/reactMigrationRoadmap.js`. The React preview and readiness panel now consume the same stage metadata instead of carrying stale hard-coded migration copy.

This keeps reviewer-facing text aligned with the actual migration architecture as the work continues through additional stages. The production DOM application remains untouched.


### Stage 17: Route-level preview shell

- Add route-level navigation inside the isolated React preview shell.
- Separate the high-risk hierarchy workflow from readiness and roadmap review panels.
- Keep the production DOM app untouched while React begins to look like a complete application shell.
- Preserve the same API-backed hierarchy workflow and mutation hooks behind the hierarchy route.
- Add audit and static guardrails so future migration work can grow route-by-route instead of through one oversized component.


### Stage 18: Live API query shell

- Add a route-level React query status panel that makes live API loading, refresh, error, and request metadata visible in the isolated React preview.
- Expose a refresh control that reuses the existing cancellable Stage 2 snapshot hook instead of adding a second fetch path.
- Track last-loaded time, request sequence, customer count, and booking count so the React shell starts behaving like a production-ready API-driven interface.
- Keep the production DOM app untouched while React gains the operational feedback needed before any future cutover.


### Stage 19: Cutover readiness gates

Stage 19 intentionally consolidates the migration roadmap. Instead of continuing indefinitely through very small stages, the React preview now includes an explicit cutover readiness route with release-style gates.

- Add a React cutover readiness route to the isolated preview shell.
- Track API parity, mutation parity, accessibility contracts, browser coverage, and production cutover toggle readiness.
- Keep the legacy DOM app untouched while making the remaining migration work visible as release criteria.
- Use this stage as the pivot from micro-stage construction to larger cutover-oriented slices.

The practical remaining roadmap should be short: add React browser coverage, introduce a controlled cutover/feature flag, then remove duplicated legacy UI only after the React route proves stable.


## Stage 20: Pilot launch checklist

Stage 20 intentionally compresses the remaining React migration into a practical pilot-launch path instead of continuing with many tiny technical stages.

- Keep the legacy DOM application as the production fallback.
- Treat the React shell as a dev-branch pilot route.
- Validate Vite build/audit readiness before any cutover proposal.
- Add React browser parity checks before retiring the matching legacy workflow.
- Use the pilot checklist and cutover readiness gates as the final decision framework.

This is the point where the portfolio story shifts from “migration scaffolding” to “release-managed modernization.”
