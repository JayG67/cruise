# Testing Architecture Direction

## Goal

The project is moving from isolated UI checks toward long-form, soup-to-nuts Cypress workflow coverage. Cypress should own the complete browser workflow experience: create the data as an administrator, assume each role, drive the turnaround from empty setup through execution, and verify every visible CRUD result in the UI.

## Target Cypress Layers

1. **Full lifecycle workflows**
   - Start from an admin baseline.
   - Create cruise lines, ships, sailings, itinerary days, activities, customers, bookings, demo users, operational roles, and turnaround records through visible UI flows.
   - Assume every role from the role selector.
   - Drive turnaround operations through command planning, tasks, dependencies, handoffs, staffing, escalations, readiness signoff, release, after-action review, executive/reviewer output, and launch/scenario planning.
   - Verify each mutation through the UI after a refresh or role switch, not only through intercepted API responses.

2. **Branch workflows**
   - Cover happy path, validation failure, API failure, cancellation, destructive confirmation, and partial/blocked operational states.
   - Cover the same lifecycle from administrator, turnaround manager, specialized lead, passenger, and group-leader perspectives.

3. **Mobile and responsive Playwright**
   - Keep Playwright focused on production responsive reachability, overflow, touch safety, and cross-device visibility.
   - Do not use mobile Playwright as the primary owner of long CRUD lifecycle coverage. The long CRUD workflow belongs in Cypress, where selectors, fixtures, retries, and data verification are more deterministic.

## Current Constraint

The full start-from-nothing administrator capability does not yet exist for every entity. In particular, role/user creation and full turnaround creation from a blank slate are still roadmap items. Until those are implemented, the Cypress lifecycle architecture spec must protect the intended workflow shape and exercise the deepest currently available admin-to-operational flow.

## Required Direction for Future Slices

Every future turnaround-management feature should add or extend Cypress lifecycle coverage. A feature is not considered production-demo complete until there is Cypress coverage that proves the role can use it through the UI, mutate it, and verify the result from another relevant view when applicable.

## Portfolio Soup-to-Nuts Workflow Contract

The current Cypress contract now includes a portfolio-level journey suite in addition to feature-specific specs. That suite must remain broad enough to prove the application can be demonstrated to an employer from start to finish:

1. Start from the employer demo command center and confirm every primary workspace is reachable.
2. Create or verify core administrative data: cruise line, ship, sailing, itinerary day, and itinerary activity.
3. Drive passenger self-service from cruise search through a verified booking request.
4. Switch to group leader and prove scoped visibility rules after passenger booking activity.
5. Create/assign turnaround personnel from admin setup, then assume operational roles and mutate command, task, staffing, signoff, lifecycle, and presentation evidence.
6. Finish in the quality console by proving health, contract validation, reset safety, and presentation proof remain accessible.

This portfolio workflow is not a replacement for detailed feature specs. It is a high-level acceptance journey that protects the product story. Detailed Cypress specs should continue to cover validation, cancellation, API failure, and edge cases.
