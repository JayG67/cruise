# React Migration Review Summary

## Current status

The React migration has completed its construction phase. No Stage 23 is planned by default.

The project now has an isolated React/Vite frontend in `frontend/react` and the original DOM frontend in `public`. The DOM frontend remains the production baseline. The React frontend is a preview and cutover candidate that needs browser-level parity coverage before it replaces the DOM UI.

## Why the migration matters

This is not a rewrite for popularity. The app now has enough state complexity to justify React:

- Role-aware admin/passenger/group views.
- Customer → booking hierarchy state.
- Duplicate booking rows across customers.
- Inline customer and booking edit workflows.
- API mutation boundaries.
- Accessibility, mobile, performance, and Lighthouse expectations.

React gives the project clearer component ownership, explicit state hooks, reusable draft workflows, and a safer path to replace complex DOM scripting.

## What is ready

- React/Vite application scaffold.
- Live API snapshot loading and refresh behavior.
- React route navigation.
- Customer/booking hierarchy preview.
- Customer and booking draft validation.
- Customer and booking save boundaries.
- Accessibility contracts for expandable panels.
- Cutover, pilot, parity, and handoff views.
- Consolidated React readiness audit.

## What is not production-ready yet

- The React app is not yet served by Express as the main application.
- The React app does not yet have full Cypress/Playwright parity coverage.
- The old DOM app has not been retired.
- Manual React preview testing is still required before cutover.

## Required validation before merge or cutover

```bash
npm run react:readiness:audit
npm run react:build
npm run test:all
```

Then manually test the React preview with:

```bash
npm run start
npm run react:dev
```

## Recommended next work

1. Add browser tests for the React preview route.
2. Serve the React build through Express under a preview route.
3. Validate the React hierarchy against the legacy workflow behavior.
4. Add a controlled cutover route or feature flag.
5. Only then replace the root DOM UI.
6. Remove legacy DOM assets after one stable parity cycle.

## PR strategy

Use the dev branch for review and validation. Before merging to `main`, consider a squash merge so the public GitHub history presents one coherent modernization effort instead of many construction-stage commits.
