# Engineering Quality Standards

This repository uses explicit release and source-quality gates so a passing build is also reviewable, reproducible, and maintainable.

## Release integrity

`npm run release:integrity` requires a clean Git working tree and rejects generated artifacts tracked in source control. CI runs this check on every pull request and push to `main`.

A release candidate must be created from:

- a committed revision;
- a clean working tree;
- a passing `npm run quality:static` result;
- a passing `npm run test:all` result;
- a documented release tag that matches the deployed revision.

For packaging validation only, `RELEASE_INTEGRITY_ALLOW_DIRTY=true npm run release:integrity` may be used. This override must not be used in CI or as release evidence.

## Source quality baseline

`npm run quality:source` performs dependency-free checks that can run before the full database and browser suites:

- unresolved merge-conflict detection;
- UTF-8 and final-newline enforcement;
- Node.js syntax validation for backend, scripts, tests, and Cypress source;
- frozen line-count budgets for the largest architecture hotspots.

The line-count budgets are temporary ceilings, not targets. They prevent further growth while the controller, API client, large React components, and static-contract suites are decomposed. A budget may only move downward.

## Conventional tooling roadmap

The repository should add ESLint, Prettier, and JavaScript type checking after the first structural decomposition slices. Introducing strict tools before reducing the largest legacy concentration points would either create an unreviewable all-at-once rewrite or require a misleadingly permissive configuration.

The planned order is:

1. Freeze growth and enforce release integrity.
2. Decompose the cruise controller and API client.
3. Add ESLint with meaningful correctness rules.
4. Add Prettier and format the repository in isolated, behavior-neutral changes.
5. Add JSDoc-backed TypeScript `checkJs` coverage by domain.

## Change-review expectations

Every change should include:

- the smallest coherent production change;
- tests at the appropriate layer;
- no generated artifacts;
- no unexplained compatibility aliases;
- no increase to a frozen architecture budget;
- an updated status of the remaining principal-engineer hardening backlog.

## Controller decomposition progress

The first bounded extraction moves cruise-line and ship CRUD into `controllers/fleet.controller.js` and destructive hierarchy cleanup into `services/fleetHierarchy.service.js`.

The legacy `controllers/cruise.controller.js` remains a compatibility facade for existing routes while its implementation budget drops from 4,418 to 3,990 lines. New domain controllers and services receive non-increasing budgets immediately.


## Controller decomposition progress

The sailing and itinerary boundary is now owned by `controllers/sailing.controller.js`. Sailing CRUD, itinerary-day administration, activity scheduling, and itinerary retrieval no longer live in the legacy controller. Shared sailing, itinerary-day, and activity audit-scope resolution is isolated in `services/sailingAuditScope.service.js` so passenger-favorite audit paths and sailing administration use one implementation.

The legacy controller remains a compatibility facade while route contracts are preserved. Its frozen architecture ceiling is now 3,523 lines, down from the original 4,418-line baseline.


### Customer and passenger self-service boundary

Customer CRUD and passenger-owned profile, checklist, booking-preference, and itinerary-favorite mutations are owned by `controllers/customer.controller.js`. The legacy controller exposes the handlers through its compatibility facade, preserving existing route contracts while reducing the legacy implementation from 3,523 to 3,000 lines. Booking CRUD, passenger membership mutations, overlap validation, and booking response assembly are now owned by `controllers/booking.controller.js` and `services/bookingDomain.service.js`. The legacy controller remains a compatibility facade and retains only the shared booking-detail dependency required by demo-user context.

### Booking domain boundary

Booking retrieval, CRUD, passenger membership, overlap validation, payload profiling, and audit behavior are isolated behind `controllers/booking.controller.js`. Query aggregation and reusable booking-domain helpers live in `services/bookingDomain.service.js`, which is shared by the booking controller and demo-user context. The legacy controller budget is reduced from 3,000 to 2,250 lines.


## Platform administration boundary

Release readiness, deployment diagnostics, data-architecture readiness, platform audit history, and turnaround personnel administration are owned by `controllers/platformAdministration.controller.js`. The legacy controller remains a compatibility facade, with its budget reduced from 2,250 to 1,894 lines.

Turnaround command, task, staffing, signoff, escalation, and handoff mutations are owned by `controllers/turnaroundMutation.controller.js`. Shared before/after history payloads, audit context, and operational identity resolution are owned by `services/turnaroundMutationSupport.service.js`. The legacy controller remains the composition root for the operation-detail response dependency, with its budget reduced from 1,894 to 968 lines.
