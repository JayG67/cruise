# React Cutover Checklist

Use this checklist after the migration cleanup is committed on `dev`. It is intentionally focused on production readiness, not historical migration stages.

## 1. Clean repository state

Remove migration-only and generated local artifacts before PR review:

```bash
rm -f scripts/verify-react-stage-*.js
rm -f scripts/verify-react-migration-scaffold.js
rm -f scripts/verify-react-migration-cleanup.js
find . -name .DS_Store -delete
rm -rf .lighthouseci lhci-report playwright-report test-results coverage
rm -f lighthouse-report.report.html lighthouse-report.report.json
```

Then confirm:

```bash
git status
```

Review all deletions before committing.

## 2. Validate current production baseline

```bash
npm run react:readiness:audit
npm run react:build
npm run test:all
```

The DOM app remains production until React parity is proven.

## 3. Manually test React preview

Run both apps locally:

```bash
npm run start
npm run react:dev
```

Open the Vite URL, usually `http://localhost:5173`.

Manual checks:

- React app loads with no browser console errors.
- Route navigation works for hierarchy, readiness, roadmap, cutover, pilot, parity, and handoff views.
- Live API query status shows customer and booking counts.
- Refresh reloads the API-backed hierarchy.
- Search filters customer and booking results.
- Customer rows expand and collapse.
- Booking details expand and collapse independently.
- Customer draft validate/save works and refreshes data.
- Booking draft validate/save works and refreshes data.
- Narrow/mobile viewport remains usable.

## 4. Add React browser parity coverage before cutover

Before making React the production UI, add browser tests for the React preview route. These tests should cover:

- React preview route loads.
- API-backed hierarchy renders.
- Search works.
- Customer expansion works.
- Booking detail expansion works.
- Customer save mutation works.
- Booking save mutation works.
- Error/retry behavior works.
- Mobile/tablet layout is usable.

## 5. Controlled cutover path

1. Serve the React production build from Express under `/app-next`.
2. Point new React browser tests at `/app-next`.
3. Keep `/` on the DOM app until `/app-next` is green.
4. After parity, switch `/` to React and keep the DOM app temporarily under `/legacy` if needed.
5. After one stable validation cycle, remove `public/app.js`, `public/styles.css`, and the legacy DOM-specific tests that are replaced by React parity tests.

## 6. Merge guidance

Use a squash merge or curated merge commit when promoting `dev` to `main` so the public history reads as one coherent modernization effort.

## Local React preview verification

The React preview is intentionally separate from the legacy DOM app during cutover work.

Recommended local command:

```bash
npm run react:dev:local
```

This starts the Express app on `http://localhost:8000`, then starts the Vite React preview on `http://localhost:5173`. The React preview keeps API calls relative, and Vite proxies `/cruise`, `/health`, and `/admin` requests to the Express backend.

Manual verification:
1. Open `http://localhost:8000` and confirm the legacy DOM app still works.
2. Open `http://localhost:5173` and confirm the React preview loads customer and booking data.
3. Click **Refresh API snapshot** in the React preview and confirm the live API query panel reports a loaded snapshot.
4. Exercise the customer hierarchy, draft validation, customer save boundary, and booking save boundary.
5. Run `npm run react:build` before committing any React cutover-related change.

For a production-like local build preview:

```bash
npm run react:preview:local
```


## Express-hosted preview route

The React application must be served by the existing Express application before any DOM retirement work begins.

Local verification:

```bash
npm run react:build
npm run start
```

Then open:

```text
http://localhost:8000/app-next
```

The legacy DOM app remains available at `/` until `/app-next` reaches functional, visual, accessibility, and mobile parity.

## React preview asset base

When manually checking the Express-hosted React preview, always rebuild after Vite config or React changes:

```bash
npm run react:build
npm run start
```

Then hard refresh:

```text
http://localhost:8000/app-next
```

The React build uses `base: '/app-next/'` so generated JavaScript and CSS assets load from `/app-next/assets/...` instead of `/assets/...`.


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
