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

Until then, the DOM app is the production fallback and should remain in place.

## GitHub/portfolio guidance

The dev branch can show the migration history, but the final merge to `main` should read cleanly. Prefer a squash merge or curated merge commit with a title such as:

```text
Modernize cruise portfolio with React preview and cutover readiness path
```

The portfolio story should be: **working legacy application modernized through React using regression safety, API parity, accessibility contracts, and controlled cutover planning**.


## Step 2: Express-hosted React preview

The React build is now intended to be served by Express at `/app-next` after `npm run react:build`.

This is still not a cutover. The legacy DOM app remains the production-quality experience at `/`, while `/app-next` becomes the realistic parity workspace for the React replacement path.
