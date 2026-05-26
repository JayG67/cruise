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
