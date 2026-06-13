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
