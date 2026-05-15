# Performance Smoke Testing

This folder contains lightweight k6 performance smoke tests for the Cruise Explorer API.

The goal is not heavy load generation. The goal is CI-safe confidence that core API workflows continue to respond successfully and within reasonable timing thresholds.

## Local usage

Start the app first:

```bash
npm start
```

Then run:

```bash
npm run perf:smoke
```

Or run against another environment:

```bash
BASE_URL=https://cruise-explorer.onrender.com npm run perf:smoke
```

## Current thresholds

```js
http_req_failed: ['rate<0.01']
http_req_duration: ['p(95)<500']
checks: ['rate>0.99']
```

These thresholds are intentionally conservative for a portfolio/demo app and can be tightened as the system matures.
