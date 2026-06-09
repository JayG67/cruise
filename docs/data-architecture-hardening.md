# Data Architecture Hardening Plan

Cruise Fleet Operations Platform is moving from portfolio-demo data volume toward production-scale operational patterns. This phase keeps the current schema compatible while adding guardrails that matter when the same workflows are connected to larger cruise-line datasets and live services.

## Phase 1: Query Indexing Baseline

The current hardening slice adds database indexes for the highest-traffic relational access paths:

- Cruise line to ship lookup
- Ship to sailing lookup by departure date
- Sailing route and departure filtering
- Booking lookup by sailing, status, and customer
- Booking passenger lookup by booking and customer
- Turnaround operation lookup by sailing, date, and status
- Turnaround task lookup by operation, role, status, and sort order
- Turnaround dependency, handoff, escalation, staffing, and readiness signoff lookup by operation and operational status
- Task update history lookup by task and creation time

These indexes support the current UI patterns without changing API contracts or seed data structure.


## Phase 2: Reference Data and Database Constraints

The next hardening slice adds a shared reference-data contract for high-impact operational values and mirrors that contract in the database initializer with idempotent `CHECK` constraints. This protects production data from drifting away from the values the UI and API understand.

Constrained values now cover:

- Booking status
- Turnaround operation status
- Turnaround task status
- Dependency gate status
- Handoff status
- Escalation severity and status
- Readiness signoff status
- Operational department roles used by task, staffing, and handoff records
- Staffing count sanity rules
- Dependency self-reference prevention

The application still uses string columns for compatibility with the existing seed and API contracts, but the domain options now live in `domain/cruiseReferenceData.js` instead of being scattered through validation logic. This is an intermediate production-readiness step before moving to fully normalized role/status lookup tables or Postgres enum migrations. The date/time bridge now adds typed shadow columns so reporting and live-service integration work can start without breaking existing API consumers.

## Phase 3: Typed Date and Time Migration Bridge

The current hardening slice adds production-safe typed shadow columns for the highest-impact date, time, and timestamp fields while preserving the existing string API contracts. This continues the roadmap to replace string date/time fields with proper `date`, `time`, and `timestamp` columns by giving the database typed `date`, `time`, and `timestamptz` values for future query planning, sorting, reporting, and live-service integrations without forcing a risky API-breaking migration in the same step.

Typed bridge columns now cover:

- Sailing departure dates with `departureDateValue`
- Activity schedule times with `activityTimeValue`
- Turnaround operation dates with `turnaroundDateValue`
- Turnaround task and handoff due times with `dueTimeValue`
- Task update creation timestamps with `createdAtTimestamp`
- Readiness signoff timestamps with `signedAtTimestamp`
- Escalation creation timestamps with `createdAtTimestamp`
- Handoff completion timestamps with `completedAtTimestamp`

The initializer backfills these columns only when the existing strings match safe ISO-style patterns, which avoids breaking older or unexpected data. New indexes on the typed columns prepare the application for production reporting and timeline views while the UI and API continue to read/write the existing public fields.

This is an intermediate migration bridge. A later production migration should move application writes directly to typed columns, expose typed values through explicit API serializers, and eventually retire redundant string storage after compatibility is proven.

## Phase 4: Normalized User and Role Bridge

The current hardening slice introduces a compatibility bridge from the legacy `demo_users` table toward production-ready identity and authorization tables. The application still serves the existing demo-user API shape, but the database now has normalized foundations for future authentication, role assignment, and audit attribution.

New bridge tables:

- `app_users` stores stable application users with display name, email, user type, customer linkage, and active status.
- `app_roles` stores normalized access roles instead of relying only on repeated role strings.
- `app_user_roles` stores role assignments with scope and status so future permissions can be attached to customers, bookings, sailings, or turnaround operations.

The existing `demo_users` table now has `normalizedUserId` and `normalizedRoleId` bridge columns. Seed loading writes both the legacy row and the normalized user/role rows, and the database initializer backfills those values for existing environments. This keeps the current UI and tests stable while preparing the platform to replace display-name and demo-user assumptions with real user IDs.

Why this matters: production cruise operations cannot depend on display names or demo users as durable identities. Task owners, escalation owners, readiness approvers, passenger users, administrators, and future crew/partner users need stable identifiers that can be audited, scoped, deactivated, and integrated with external identity providers.



## Phase 5: Operational Ownership Attribution Bridge

This hardening slice begins replacing display-name-only operational ownership with stable application user identifiers while preserving the current API and UI compatibility fields.

New bridge columns:

- `turnaround_tasks.ownerUserId` maps task ownership to `app_users` while keeping `ownerName` for existing screens and forms.
- `turnaround_task_updates.authorUserId` maps shift-update authors to `app_users` while keeping `authorName` for readable activity logs.
- `turnaround_signoffs.approverUserId` maps readiness approvers to `app_users` while keeping `approverName` for existing readiness approval displays.
- `turnaround_escalations.ownerUserId` maps escalation owners to `app_users` while keeping `ownerName` for current escalation workflows.
- `turnaround_handoffs.ownerUserId` maps handoff owners to `app_users` while keeping `ownerName` for current department handoff displays.

The initializer backfills these IDs from existing operational names using normalized app users, and the API now resolves user IDs when operational ownership names are changed through the current endpoints. This gives the product a production migration path toward durable audit attribution without forcing a disruptive UI rewrite.

Why this matters: in production, two people can share the same display name, names can change, and deactivated users still need historical records. Stable user IDs are the foundation for audit trails, authorization, crew assignment, and future integrations with identity providers or shipboard workforce systems.


## Why This Matters for Live Services

If Cruise Explorer is connected to real booking, crew, port, or ship systems, unconstrained strings can create expensive cleanup problems: `Complete`, `COMPLETE`, `completed`, and `Done` can become four different operational states. Shared reference data plus database checks keeps operational dashboards, release boards, and role workflows consistent even as data volume grows.

## Why This Matters

The application now presents role-specific operational workflows, portfolio boards, release boards, readiness approvals, handoffs, escalations, staffing, tasks, customers, bookings, and sailings. In a real cruise operations platform, those screens would be backed by much larger tables and frequent filtering by:

- Cruise line
- Ship
- Sailing
- Turnaround operation
- Department role
- Status
- Date
- Passenger/customer relationships

Without indexes on these paths, the database would gradually shift from predictable lookup behavior to full table scans as data grows.

## Future Production Hardening

This indexing baseline is intentionally only the first data architecture hardening step. The remaining production-scale work should include:

1. Complete the date/time migration by moving writes to typed columns and retiring redundant string storage after compatibility is proven.
2. Normalize users, crew members, operational roles, and departments by continuing to replace display-name ownership fields with user IDs and extending roles to crew/department assignments.
3. Move remaining display-name compatibility fields toward read models once API consumers are migrated.
4. Continue evolving constrained status values toward enums or lookup tables once migration compatibility is planned.
5. Add tenant/cruise-line boundaries for multi-cruise-line deployment.
6. Add append-only audit/event history for tasks, handoffs, escalations, staffing, signoffs, and command plan changes.
7. Move seed JSON usage toward migration-backed seed factories for larger environments.
8. Add load-test-backed query review once live services or larger datasets are connected.

## Current Principle

Do not destabilize the working application while hardening it. Each data architecture pass should preserve existing tests, UI workflows, and API contracts unless the slice explicitly includes a migration plan and compatibility strategy.
