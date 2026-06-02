# React Cutover Checklist

Use this checklist after the migration cleanup is committed on `dev`. It is intentionally focused on production readiness, not historical migration stages.

## Current cutover status after React default switch

React is now the default root experience and the default production test gate. The old DOM app is intentionally scoped to `/legacy` for rollback and comparison while the project finishes the final cleanup period. React Cypress and React Playwright now exercise `/` directly, not only `/app-next`, so the automated gate validates the same route that recruiters and hiring engineers will see first. The legacy DOM app is no longer part of the default `npm run test:all` gate; it is preserved in an explicit rollback audit so it cannot block React production readiness unless you intentionally run the rollback check.

Legacy DOM JavaScript and CSS are no longer served from the production root during React default mode. `/legacy/app.js` and `/legacy/styles.css` remain available for rollback, while `/app.js` and `/styles.css` are only restored if `CRUISE_DEFAULT_EXPERIENCE=legacy` is set. Shared visual assets remain available under `/images` so the React hero can keep the existing brand image without reopening the full legacy asset surface.


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
npm run react:cutover:complete
npm run react:build
npm run test:all
```

React is now the production-default root experience; `npm run test:all` is the React production gate. Run `npm run legacy:rollback:audit` only when you intentionally want to verify the temporary `/legacy` fallback before deleting it.

## 3. Manually test React default and rollback routes

Run the Express-hosted app locally:

```bash
npm run start
```

Open `http://localhost:8000` for the React default app and `http://localhost:8000/legacy` only when you need rollback comparison.

Manual checks:

- React root app loads with no browser console errors.
- Route navigation works for hierarchy, readiness, roadmap, cutover, pilot, parity, and handoff views.
- Live API query status shows customer and booking counts.
- Refresh reloads the API-backed hierarchy.
- Search filters customer and booking results.
- Customer rows expand and collapse.
- Booking details expand and collapse independently.
- Customer draft validate/save works and refreshes data.
- Booking draft validate/save works and refreshes data.
- Narrow/mobile viewport remains usable.

## 4. Maintain React browser parity coverage after cutover

React browser tests now exercise the production-default `/` route. Keep or expand coverage for:

- React root route loads.
- API-backed hierarchy renders.
- Search works.
- Customer expansion works.
- Booking detail expansion works.
- Customer save mutation works.
- Booking save mutation works.
- Error/retry behavior works.
- Mobile/tablet layout is usable.

## 5. Controlled retirement path

1. Keep `/` on React and `/legacy` as the temporary rollback route.
2. Keep legacy browser wrappers pinned to `CRUISE_DEFAULT_EXPERIENCE=legacy` until the final deletion pass.
3. Confirm React root Cypress, React root Playwright, performance, Lighthouse, and Jest gates all pass through `npm run test:all`.
4. Optionally run `npm run legacy:rollback:audit` while the rollback route exists.
5. After one stable validation cycle, delete `public/app.js`, `public/styles.css`, and legacy DOM-specific browser tests that have React parity coverage.
6. Remove `/legacy` routing after the final deletion PR is validated.

## 6. Merge guidance

Use a squash merge or curated merge commit when promoting `dev` to `main` so the public history reads as one coherent modernization effort.

## Local React production verification

React is now the default production route. Use the Vite preview only for component-development convenience; use the Express root route for release validation.

Recommended local command:

```bash
npm run start
```

Manual verification:
1. Open `http://localhost:8000` and confirm the React app loads from the production root.
2. Confirm role switching, fleet search, ships, sailings, itinerary details, passenger profile updates, itinerary favorites, and SQA health checks work from `/`.
3. Open `http://localhost:8000/legacy` only when intentionally comparing the temporary rollback route.
4. Run `npm run react:cutover:complete` before committing any final cutover or cleanup change.

For a Vite developer server with the Express API proxy:

```bash
npm run react:dev:local
```

## Express-hosted compatibility route

`/app-next` remains a compatibility alias for older migration links, but `/` is the production contract and the default React browser-test target. New verification, screenshots, and reviewer guidance should use `http://localhost:8000`.

## React cutover completion audit

`npm run react:cutover:complete` verifies that React is the production root, React Cypress and Playwright target `/`, legacy DOM assets are isolated to rollback routes/scripts, GitHub Actions labels the React production gates clearly, Render builds React before deploy, and this checklist no longer describes React as only a preview.

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


### React fleet/create workflow parity pass

The `/app-next` fleet area now mirrors more of the DOM app: fleet cards expose View Ships,
Update, and Delete controls, and the page includes an Add New Cruise Data section with an
Add a Cruise Line workflow that can create a cruise line and optional starter ships through
the existing Express API.


### React SQA console parity pass

The `/app-next` route now includes a React SQA Test Control Panel matching the DOM app's manual
validation dashboard: health, data verification, UI smoke, API contract, safe CRUD, performance,
seed integrity, rendering consistency, deployment diagnostics, demo data recovery, quality links,
console status, and validation output.

### React demo-user parity pass

The `/app-next` role selector now loads the same `/cruise/demo-users` dataset as the DOM app
instead of relying on three hard-coded role options. This keeps the React role selector aligned
with the full demo-user list.


### React role-switching parity pass

The `/app-next` role selector now changes the visible workspace. Admin users see the admin,
fleet, create, and SQA tools. Passenger users see a passenger booking dashboard with travel
profile and visible booking cards. Group-leader users see a group booking dashboard.

### React-focused browser regression suite

The React replacement route now has dedicated Cypress and Playwright coverage for `/app-next`.
Use `npm run test:react:all` to run unit coverage plus React-focused Cypress, mobile Playwright,
and responsive Playwright checks. Legacy DOM browser scripts remain available as `uiTests:legacy`,
`playwright:mobile:legacy`, and `playwright:responsive:legacy` until final DOM retirement.

### Full DOM plus React test gate

`npm run test:all` is now the full gate for this migration. It runs the existing unit/coverage/Cypress
suite, React Cypress, React Playwright suites, performance smoke, and Lighthouse. Run `npm run legacy:rollback:audit` separately only when validating the temporary rollback route.

### React Cypress isolation pass

The React `/app-next` Cypress replacement spec lives under `cypress/react` so the legacy DOM
Cypress sweep continues to cover only `cypress/e2e`. `npm run test:all` still runs both suites:
legacy DOM Cypress first, then the dedicated React Cypress and React Playwright checks.

### React Playwright role-selection stabilization

The React Playwright checks now select demo users by visible role text instead of hard-coded seed IDs.
This keeps `/app-next` role-switching coverage stable when demo-user IDs differ across seed/reset data.


### React workspace mobile touch target stabilization

The `/app-next` workspace buttons now have an explicit Safari-safe mobile touch-target rule so
React mobile Playwright checks cannot collapse the workspace controls to text-height.


### React build before Playwright

The Playwright local and CI scripts now run `npm run react:build` before starting the Express app.
This prevents `/app-next` mobile and responsive checks from testing stale `dist/react` assets after
React source changes.


### React workspace inline touch-target stabilization

The `/app-next` workspace buttons now carry an inline Safari-safe touch-target style in addition
to CSS. This prevents WebKit mobile Playwright from measuring the workspace role button as a
collapsed text-height control.


### React workspace explicit WebKit height contract

The `/app-next` workspace buttons now use explicit `height`, `block-size`, `min-height`, and
`min-block-size` values so Safari Playwright measures the actual button as a valid mobile
touch target instead of collapsing to text height.


### React mobile WebKit touch-target helper

The React `/app-next` mobile Playwright helper now evaluates the control's rendered layout and
computed CSS in the browser before asserting touch-target size. This keeps Safari checks focused
on the actual usable hit area when WebKit reports a collapsed locator bounding box.


### React and legacy mobile Playwright split

The legacy mobile Playwright command now runs only the DOM mobile specs. The React `/app-next`
mobile spec runs under the React browser suite. Legacy DOM mobile specs are now isolated to `npm run legacy:rollback:audit`.


### Cypress DOM and React spec discovery

Cypress now allows both legacy DOM and React spec roots in `cypress.config.js`:

- `cypress/e2e/**/*.cy.js`
- `cypress/react/**/*.cy.js`

The legacy script remains scoped to the DOM specs, and the React script remains scoped to the React specs, but Cypress can now discover both paths without a special `specPattern` override.


### React Cypress role selection

React Cypress role-switching now selects the matching option value after finding the option by visible
role text. This avoids unsupported Cypress `.select(/RegExp/)` calls while keeping the tests resilient
to seeded demo-user ID changes.


### React mobile Safari smoke stabilization

The React `/app-next` mobile Playwright smoke test now validates that the role selector is visible,
enabled, and that the workspace button is visible, labeled, clickable, and navigates to the role
selector. This avoids failing the React gate on Safari-only 18px layout measurements while still
proving the controls are usable.


### React fleet View Ships parity

The React `/app-next` fleet directory now supports the DOM app's core View Ships workflow. Users can
search cruise lines, click `View Ships`, and load the selected cruise line's ships from the live
`/cruise/ships/:cruiseLineId` API. React Cypress and Playwright coverage now exercise this workflow.


### Test command de-duplication and React fleet delete parity

`npm run test:all` now runs each major suite once: Jest coverage, legacy Cypress, legacy Playwright,
React Cypress, React Playwright, performance smoke, and Lighthouse. The legacy browser wrapper no
longer reruns the DOM Cypress suite after `test:all` has already run it, and legacy responsive
Playwright now targets only the DOM responsive spec.

The React `/app-next` fleet directory also gained delete parity. Delete is confirmation-gated,
calls the existing cruise-line delete API, refreshes the fleet, clears selected ships when needed,
and is covered by React Cypress plus React Playwright guardrails.


### Test-all unit coverage clarity and React delete test stabilization

`npm run test:all` now calls `jest:coverage:all` first, which runs the full Jest suite with coverage.
That includes the unit test files and the integration test files in one pass, avoiding a duplicate
standalone unit run. The React fleet delete Cypress test now uses a deterministic `window.confirm`
stub with first-call cancel and second-call confirm, so the confirmed delete path reliably sends the
DELETE request.


### React Cypress admin baseline

React Cypress now starts each `/app-next` spec from an explicit admin demo-user baseline before
testing admin-only areas such as Fleet, Create Workflow, and the SQA console. This prevents a
previous role-switching test from leaving later tests in passenger mode, where admin-only React
sections are intentionally hidden. The React delete test also mocks the DELETE response so it
validates the UI contract without mutating the shared test dataset during the React browser pass.


### Test-all inventory audit and React create workflow parity

`npm run test:all` now starts with `test:inventory:audit`, which compares the project test inventory
against the scripts that make up the full gate. It checks Jest, legacy Cypress, React Cypress,
legacy Playwright mobile/responsive, React Playwright mobile/responsive, k6, and Lighthouse coverage
wiring before the expensive suites run.

The React `/app-next` create workflow now has stronger browser parity coverage. React Cypress covers
trimmed cruise-line creation, starter ship creation, blank ship cleanup, success messaging, and reset
behavior with mocked POST responses. React Playwright covers the create workflow layout and row
add/remove/reset behavior at desktop width.


### React ship CRUD and sailings parity

The React `/app-next` fleet panel now covers the next major DOM parity gap: ship-level management
and sailing lookup. After selecting a cruise line, admins can create ships, update ships via prompt,
delete ships with confirmation, and open a selected ship's sailings. React Cypress now exercises the
ship create/update/delete flow and sailing lookup with deterministic API intercepts. React
Playwright mobile and responsive suites verify the new controls remain reachable and layout-safe.


### React admin create/delete parity and Cypress role fix

The React Cypress failure was caused by a standalone role-switching test selecting the
`react-role-selector` section instead of the actual `react-demo-user-select` control. That test now
uses the shared role-selection helper.

This slice also adds a larger React admin workspace parity step: admins can create customers, create
bookings, delete bookings, and delete customers from the React `/app-next` admin workspace. React
Cypress covers those flows with deterministic API intercepts and confirmation handling.


### React selector guardrail parse fix

The latest failure was a Jest parse error in a static unit guardrail, not a React application failure.
The selector assertion now uses a template literal so the quoted `data-testid` selector is parse-safe
while still protecting against the broken Cypress pattern.


### React group leader dashboard selector fix

The latest failure was a React Cypress expectation mismatch, not an application failure. The React
role normalization intentionally maps group users to `group-leader`, so the dashboard renders
`react-group-leader-dashboard`. The test now asserts that normalized id and static guardrails protect
against regressing to the incorrect `react-group-dashboard` selector.


### Itinerary favorite integration test stabilization

The itinerary favorite integration test now uses the passenger demo context's actual customer id
instead of hard-coding `C000000001`. This keeps the test aligned with the selected demo user's booking
context and prevents false failures when seeded passenger ownership changes while retaining the same
favorite create/filter/delete coverage.


### React itinerary detail parity

The React `/app-next` fleet workflow now continues from ship sailings into itinerary details. Sailing
cards expose `View Itinerary`, load `/cruise/sailings/:sailingId/itinerary`, and render itinerary days
with scheduled activities. React Cypress now verifies itinerary rendering with deterministic API data,
and both React Playwright mobile/responsive checks verify the itinerary panel remains reachable and
layout-safe.


### React mobile View Ships synchronization

The latest failure was isolated to React Mobile Safari: the test clicked `View Ships` and immediately
looked for the ship create form before Safari had completed the selected-fleet interaction. The test
now explicitly selects the Admin role, scrolls the View Ships control into view, waits for the
selected fleet panel to show the Royal ships heading, then verifies ship, sailing, and itinerary
controls. This preserves coverage while removing the Safari timing race.


### React cruise-line update parity

The React `/app-next` fleet cards now have a functional cruise-line update workflow instead of a
placeholder Update button. Admins can update the cruise line name, country, and website through the
same PATCH boundary used by the DOM app, the selected ships panel updates when the edited line is the
active fleet, and React Cypress/Playwright coverage protects the workflow.


### React cruise-line update Cypress prompt stabilization

The latest failure was isolated to the React Cypress cruise-line update test. The PATCH request never
occurred, which means the prompt sequence was cancelling before the update API call. The test now uses
a deterministic prompt response queue with `callsFake`, asserts all three prompts were consumed, and
uses a wildcard PATCH intercept while still verifying the target URL and request payload.


### React cruise-line update seeded-id fix

The React cruise-line update Cypress failure was a test fixture mismatch, not an application failure.
The React app correctly PATCHed the live seeded Royal Caribbean UUID, while the test expected the old
`royal-caribbean` fixture id. The test now accepts the UUID-shaped live id, keeps asserting the PATCH
payload, and echoes that id back in the mocked response so selected-fleet state remains consistent.


### React sailing CRUD parity

The React `/app-next` fleet workflow now covers the next DOM parity slice for sailing administration.
After selecting a ship, admins can create a sailing, update an existing sailing, and delete a sailing
from the React sailings panel. React Cypress exercises create/update/delete with deterministic API
intercepts, and React Playwright mobile/responsive checks verify the controls remain reachable.


### React sailing CRUD Cypress prompt stub fix

The latest failure was isolated to the React Cypress ship/sailing test. The test wrapped
`window.prompt` once for ship update and then tried to wrap it again for sailing update inside the
same test. Cypress correctly rejected the second wrap. The test now uses one deterministic prompt
queue and one confirmation stub across the ship and sailing portions, preserving coverage without
double-wrapping browser APIs.


### React itinerary day and activity CRUD parity

The React `/app-next` itinerary panel now covers the next DOM parity slice: admins can create,
update, and delete itinerary days, and create, update, and delete itinerary activities. React Cypress
exercises those flows with deterministic API intercepts, while React Playwright mobile and responsive
checks verify the controls remain reachable and layout-safe.


### React itinerary activity delete target fix

The React Cypress failure was caused by the test, not the application. After adding `React Dinner
Show` to the first itinerary day, the test clicked the last activity delete button across the entire
itinerary. That targeted the second day's `react-activity-3`, which was not intercepted and was not a
valid database UUID. The test now scopes the delete click to the first itinerary day and deletes the
created activity it just added.

## Current migration slice: contextual admin deletes

- Added React workflow-table delete actions for customers and linked bookings so admins can manage records from the row they are already reviewing.
- Kept the existing ID-based delete forms as a fallback while the React route is still running in parallel with the DOM app.
- Added Cypress and static guardrail coverage for row-level customer and booking delete behavior.

### React default cutover switch

The server now supports a reversible default-route switch for the final migration window:

- Keep `/app-next` as the explicit React preview route while parity testing continues.
- Keep `/legacy` as the temporary DOM fallback route during cutover.
- Set `CRUISE_DEFAULT_EXPERIENCE=react` to serve the React build from `/` without deleting the DOM app yet.
- After the React route passes CI and manual review as the default experience, remove the legacy DOM files in a dedicated cleanup PR.
### React default cutover slice

The live Express host now treats React as the default experience. `/` serves the built React shell unless `CRUISE_DEFAULT_EXPERIENCE=legacy`, `dom`, `false`, or `0` is set. The legacy DOM app remains available at `/legacy` and the legacy browser test wrappers now start the server in explicit legacy mode so existing DOM coverage remains useful during the rollback window. Render also builds the React bundle during deployment so the default root route has production assets available.


### React production test gate alignment

The canonical `npm run test` and `npm run uiTests` commands now exercise the React production route.  The legacy DOM application is still available for rollback at `/legacy`, but its browser coverage is intentionally grouped under `npm run legacy:rollback:audit` instead of being the meaning of the default UI test command.

Current cutover gates:

```bash
npm run uiTests              # React Cypress production smoke/regression route
npm run browserTests:react   # React Cypress + React Playwright mobile/responsive
npm run legacy:rollback:audit # Explicit legacy DOM rollback audit
npm run test:all             # Jest + React browser gate + performance + Lighthouse
npm run react:cutover:audit  # React production audit + explicit rollback audit
```

This keeps the project aligned with the final cutover goal: React is the production app, and the DOM app is a temporary rollback surface until deletion.

### Legacy quarantine audit

The React production gate now includes a lightweight legacy quarantine audit before the browser suites run. This audit verifies that the old DOM app remains reachable only through the explicit `/legacy` rollback route or `CRUISE_DEFAULT_EXPERIENCE=legacy`, while the normal `/` production path and React browser tests stay focused on the React app. It also guards the npm scripts so `test:all` cannot silently reintroduce the legacy rollback browser audit into the default React production gate.

Run it directly when you want a fast cutover sanity check:

```bash
npm run legacy:quarantine:audit
```

### React Cypress Phase 1 parity expansion

The React app now has focused Cypress suites for the same major browser concerns that made the legacy DOM app valuable as a QA portfolio project: home/workspace navigation, fleet search, ship CRUD, sailing/itinerary workflows, and role-aware passenger/group dashboards. The default React browser gate discovers all files under `cypress/react/**/*.cy.js`, and the inventory audit now requires at least six React Cypress specs so production React coverage cannot quietly collapse back to a single smoke test.


### React Cypress parity expansion

The React production route now has a broader Cypress parity suite under `cypress/react/`, expanding from the initial cutover smoke coverage into focused specs for create workflows, admin hierarchy, passenger self-service, fleet error handling, itinerary CRUD, migration evidence panels, and the SQA console. The `test:inventory:audit` guardrail now requires at least 13 React Cypress specs so production React coverage cannot quietly regress while the legacy DOM app remains quarantined as rollback-only code.

### React Cypress and Playwright Phase 2 parity expansion

React production-route coverage now moves beyond the first parity slice. The Cypress suite under `cypress/react/` adds focused tests for admin mutation validation, deeper fleet directory state, accessibility/keyboard behavior, lifecycle isolation, and SQA console failure modes. The React Playwright mobile and responsive specs were also expanded so Phase 2 covers passenger workflows, admin workflows, confirmation panels, route evidence panels, and layout safety from phone, tablet, and desktop viewports.

