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
