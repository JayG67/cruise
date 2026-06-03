# Cruise Operations Platform

A React, Express, and PostgreSQL cruise-line operations application built as a production-style software engineering portfolio project.

## Current application architecture

- React/Vite front end served from the production root route `/`.
- Express API for cruise lines, ships, sailings, itineraries, bookings, customers, demo roles, health checks, and admin reset workflows.
- PostgreSQL persistence through Drizzle.
- Cypress, Playwright, Jest, k6, and Lighthouse quality gates.
- GitHub Actions publishes quality, Lighthouse, and coverage reports.

## Local setup

```bash
npm install
npm run test:all
```

Useful focused commands:

```bash
npm run react:build
npm run react:production:complete
npm run test:inventory:audit
npm run jest:coverage:all
npm run browserTests:react
npm run lighthouse:ci:local
```

## Application routes

- `/` serves the React production application.
- `/health` exposes the health endpoint.
- `/cruise/*` exposes the cruise operations API.
- `/admin/*` exposes admin utility APIs.
- `/images/*` serves shared optimized image assets.

## Quality gates

`npm run test:all` runs the full local release gate:

1. test inventory audit
2. React production completion audit
3. Jest coverage and integration coverage
4. React Cypress browser tests
5. React Playwright mobile and responsive tests
6. k6 performance smoke test
7. Lighthouse mobile quality gate

## GitHub CI

The GitHub workflow runs the same production-focused gates in separate jobs:

- Unit Tests
- Jest Coverage Report
- Integration Tests
- Cypress UI Tests
- Playwright Mobile Tests
- k6 Performance Smoke Test
- Mobile Quality & UX Gate
- GitHub Pages quality dashboard publication

## Repository hygiene

Generated artifacts should not be committed:

- `dist/`
- `coverage/`
- `lhci-report/`
- `.lighthouseci/`
- `github-pages/`
- `playwright-report/`
- `test-results/`
- Cypress screenshots and videos

