# Cruise Line Presentation Deployment Notes

This note is for deploying the application for a cruise-line presentation without adding any product-facing development or readiness panels.

## Product demo path

1. Open the home page.
2. Select **Present to a Cruise Line**.
3. Pick a cruise line in the presentation suite.
4. Walk through brand footprint, fleet, sailings, itinerary, manifest, guest experience, and turnaround operations.
5. Use **Open fleet details**, **Show passenger views**, and **Show turnaround setup** only when the audience wants to inspect the working application behind the presentation view.
6. Use the SQA console only as an isolated quality add-on when asked about testing background.

## Render deployment path

The repository already includes `render.yaml` for the hosted Node service and PostgreSQL database. A clean presentation deployment should use:

```bash
npm ci
npm run test:all
npm run react:build
npm run start:prod
```

For Render, connect the repository, use the existing blueprint, and confirm the service has a `DATABASE_URL` from the Render PostgreSQL database. The React app is built into `dist/react` and served by Express.

## Presentation smoke check

Before sharing the URL, verify:

- `/health` returns `{"status":"ok"}`.
- The home page loads the React shell.
- **Present to a Cruise Line** opens the cruise-line presentation suite.
- A selected line shows metrics, sailing board, guest handoff, and action buttons.
- Admin, passenger, group leader, turnaround operations, fleet, booking, and SQA flows remain reachable.
