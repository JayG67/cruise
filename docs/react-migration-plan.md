# React Cutover Plan

## Current position

The staged React migration has reached the point where the proof-of-concept work should stop expanding into more numbered stages. The project now has a working React/Vite application under `frontend/react` that consumes the existing Express/Postgres API, models the customer → booking hierarchy, supports customer and booking draft workflows, and includes route-level readiness, pilot, parity, and handoff views.

The old DOM application in `public/` is still the production UI. That is intentional for now. The React application is not ready to replace it until browser-level parity coverage and manual testing prove the replacement workflow.

## What belongs in production now

Keep:

- `frontend/react/` React application source.
- `react:dev`, `react:build`, and `react:preview` scripts.
- One consolidated `react:readiness:audit` script.
- Existing API, integration, Cypress, Playwright, k6, Lighthouse, accessibility, and security gates.
- `docs/react-migration-review-summary.md` as the reviewer-facing explanation.

Remove from the permanent workflow:

- Numbered `react:stageX:audit` package scripts.
- One-off `scripts/verify-react-stage-X.js` migration scaffolding files.
- Repetitive stage-by-stage documentation that no longer helps a production reviewer.
- Generated local artifacts such as coverage, screenshots, videos, Lighthouse reports, Playwright reports, `.DS_Store`, and local test-result folders.

## Manual test plan before any cutover

Run these from the dev branch before proposing a React cutover:

```bash
npm run react:readiness:audit
npm run react:build
npm run test:all
```

Then manually test the React preview:

```bash
npm run start
npm run react:dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

Manual checklist:

1. Confirm the React preview loads without console errors.
2. Use the route navigation and visit Readiness, Roadmap, Cutover, Pilot, Parity, Handoff, and Hierarchy.
3. Refresh the live API snapshot and verify customer and booking counts update.
4. Search the customer hierarchy.
5. Expand and collapse customer rows.
6. Expand and collapse booking detail panels.
7. Edit a customer draft, validate it, save it, and verify the snapshot reloads.
8. Edit a booking draft, validate it, save it, and verify the snapshot reloads.
9. Check narrow/mobile viewport behavior in the browser dev tools.
10. Confirm the production DOM app at `http://localhost:8000` still passes its normal workflow checks.

## Browser parity required before replacing the DOM workflow

Before the React hierarchy replaces the matching legacy workflow, add automated browser coverage for the React preview. At minimum:

- React preview loads.
- Live API status panel reports customer and booking counts.
- Hierarchy route renders API-backed customer rows.
- Search filters customer/booking rows.
- Customer expansion uses accessible controls and reveals booking rows.
- Booking details expand independently for duplicate-safe customer/booking keys.
- Customer draft validation and save path works.
- Booking draft validation and save path works.
- Error/retry path works when the API returns an error.
- Mobile/tablet viewport behavior remains usable.

## Feature-flagged cutover approach

Do not delete the DOM app first. Replace one workflow behind a small controlled switch:

1. Build the React app with `npm run react:build`.
2. Serve the React build from Express under a preview route such as `/react-preview` or `/app-next`.
3. Add Playwright/Cypress coverage against that route.
4. Keep `/` pointing to the current DOM app until React parity is proven.
5. Once green, switch `/` to the React build and keep the old DOM app available temporarily under `/legacy` if needed.
6. After one stable validation cycle, remove the old DOM files and old DOM-specific tests that are replaced by equivalent React tests.

## Legacy DOM retirement

Retire `public/app.js`, `public/styles.css`, and `public/index.html` only after:

- React build is served by Express.
- React browser tests cover the replaced workflows.
- Existing integration/API tests remain green.
- Accessibility and responsive tests pass against the React UI.
- Manual test checklist passes.
- The README clearly explains the new React frontend.

At this point, React is the production default. The DOM app is now a temporary rollback fallback only and should not be part of the default production test gate.

## GitHub/portfolio guidance

The dev branch can show the migration history, but the final merge to `main` should read cleanly. Prefer a squash merge or curated merge commit with a title such as:

```text
Modernize cruise portfolio with React preview and cutover readiness path
```

The portfolio story should be: **working legacy application modernized through React using regression safety, API parity, accessibility contracts, and controlled cutover planning**.


## Step 2: Express-hosted React preview

The React build is now intended to be served by Express at `/app-next` after `npm run react:build`.

This is still not a cutover. The legacy DOM app remains the production-quality experience at `/`, while `/app-next` becomes the realistic parity workspace for the React replacement path.

### React default-route cutover switch

A reversible Express-hosted cutover switch is now available. The application can serve React at `/` with `CRUISE_DEFAULT_EXPERIENCE=react`, while `/legacy` keeps the DOM app reachable for a short rollback window. This separates the production traffic switch from the later DOM file removal, reducing risk as the migration reaches full parity.
### React default cutover slice

The live Express host now treats React as the default experience. `/` serves the built React shell unless `CRUISE_DEFAULT_EXPERIENCE=legacy`, `dom`, `false`, or `0` is set. The legacy DOM app remains available at `/legacy` and the legacy browser test wrappers now start the server in explicit legacy mode so existing DOM coverage remains useful during the rollback window. Render also builds the React bundle during deployment so the default root route has production assets available.


## React production test gate alignment

The project has moved past preview-mode testing.  The default UI test path now targets the React production experience at `/`, while the old DOM browser suites are preserved under an explicit rollback audit.

- `npm run uiTests` runs React Cypress coverage.
- `npm run browserTests:react` runs React Cypress plus React Playwright mobile/responsive checks.
- `npm run legacy:rollback:audit` runs the old DOM Cypress and Playwright checks only as rollback validation.
- `npm run test:all` runs the React production coverage and final quality gates. Run `npm run legacy:rollback:audit` separately when intentionally validating rollback.

This is the bridge step before removing `public/app.js` and the DOM-only browser specs after the remaining rollback window is no longer needed.


## React production gate cutover

`npm run test:all` now represents the React production gate: Jest/API coverage, React Cypress, React mobile/responsive Playwright, performance smoke, and Lighthouse. Legacy DOM browser tests remain available through `npm run legacy:rollback:audit` while `/legacy` exists, but they are no longer part of the default production readiness gate. This keeps the repository focused on the live React application while preserving a deliberate rollback verification path until final DOM deletion.

## React Cypress Phase 1 parity expansion

Phase 1 of React test parity expanded Cypress coverage from one broad replacement spec into focused production-route suites for home/workspace navigation, fleet search, ship workflows, sailings/itinerary workflows, and role dashboards. The new shared helper module in `cypress/react/support/reactTestHelpers.js` centralizes deterministic API fixtures and common navigation flows so React tests can grow with the production app without depending on legacy DOM selectors.

### React Cypress and Playwright Phase 2 parity expansion

React production-route coverage now moves beyond the first parity slice. The Cypress suite under `cypress/react/` adds focused tests for admin mutation validation, deeper fleet directory state, accessibility/keyboard behavior, lifecycle isolation, and SQA console failure modes. The React Playwright mobile and responsive specs were also expanded so Phase 2 covers passenger workflows, admin workflows, confirmation panels, route evidence panels, and layout safety from phone, tablet, and desktop viewports.

