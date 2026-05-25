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
