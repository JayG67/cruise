# Data Architecture Hardening Roadmap

This document tracks the production-scale database architecture path for Cruise Explorer. It belongs in documentation only; development-slice language must not appear in the product UI.

## Completed hardening baseline

### Query Indexing Baseline
The application now carries a query indexing baseline for the main operational and portfolio lookup paths. Indexing is intended to support large production datasets where cruise lines, ships, sailings, bookings, passengers, turnaround operations, tasks, handoffs, staffing, dependencies, signoffs, escalations, and audit records grow far beyond the demo seed file.

### Reference Data and Database Constraints
Reference data and database checks keeps operational dashboards aligned with valid production states. Status values, role types, assignment scope, and operational workflow fields should be constrained at the database boundary so the UI never has to interpret arbitrary values as valid workflow state.

### Typed Date and Time Migration Bridge
The current migration path includes proper `date`, `time`, and `timestamp` columns through typed shadow columns. These fields allow the application to migrate away from string-only temporal values while keeping existing seed and UI compatibility during the transition.

### Normalized User and Role Bridge
The normalized identity bridge introduces `app_users`, `app_roles`, and role assignment rows so demo identities can evolve into production users without rewriting the whole application at once. This bridge is the foundation for production authentication, authorization, and assignment-aware workflows.

### Operational Ownership Attribution Bridge
Operational ownership now has a bridge from display names toward durable identity fields such as `ownerUserId`, `approverUserId`, and related author/assignment IDs. The intent is to stop treating names as primary relationships and make task ownership, signoff approval, escalation ownership, handoff accountability, and task-update authorship auditable.

### Tenant and Assignment Scope Bridge
The tenant and assignment bridge records cruise-line and ship scope on users, roles, and demo users. A turnaround manager should not see every cruise line; each operational person should be constrained by tenant/cruise-line boundaries and assigned ship or sailing responsibility.

### Audit Event Bridge
The audit event bridge introduces the `audit_events` table as the append-only traceability target for production workflows. Turnaround command, task, staffing, handoff, escalation, and signoff mutation endpoints now write scoped audit events with actor, cruise-line, ship, sailing, operation, entity, event type, payload, source, and timestamp metadata. The latest bridge also records platform mutation audit events for cruise-line, ship, sailing, customer, booking, and booking-passenger administration paths.

### Audit History Review Bridge
Turnaround operation responses now include a bounded recent audit trail, and the API exposes `GET /cruise/turnaround-operations/:id/audit-events` behind the same assignment-aware authorization gate as operational writes. The platform now also exposes admin-scoped `GET /cruise/audit-events` filtering by entity, actor, source, cruise line, ship, sailing, or operation so portfolio reviewers can verify fleet/customer/booking traceability without direct database access. This makes production traceability review visible while preserving tenant/ship/sailing scope.

### Request Identity Bridge
Turnaround scoping now flows through a request identity middleware instead of requiring controllers to know about raw query-string demo user parameters. The React client sends the selected demo identity in the `X-Cruise-Demo-User-Id` header, while the server still accepts the legacy `demoUserId` query parameter for compatibility. This keeps the current demo-user experience working while preparing the API boundary for real authenticated user context.


### Production Authorization Seam
The request identity bridge now accepts future production principal headers (`X-Cruise-User-Id`, `X-Cruise-User-Email`, `X-Cruise-User-Name`, `X-Cruise-User-Role`, and `X-Cruise-Tenant-Id`) in addition to the existing demo-user header. A shared `requestAuthorization.service.js` resolves request actors and admin permissions, so platform audit review and audit actor attribution no longer need to know whether the caller came from the demo selector or a future authentication provider. This is still a bridge, not final authentication, but it creates the server-side seam for replacing demo identity with real auth claims without rewriting every controller.

### Turnaround Scope Service
Turnaround authorization, scoped reads, forbidden responses, actor lookup, sailing/ship/cruise-line scope resolution, and audit context construction now live behind a reusable `turnaroundScope.service.js` boundary. Controllers call this service instead of re-implementing selected-user and assignment logic inline, which makes the bridge easier to replace with real authenticated user authorization later.


### Turnaround Release Packet Bridge
Turnaround operation payloads now include a computed release packet that combines tasks, staffing, signoffs, dependencies, handoffs, escalations, and recent audit history into one final embarkation readiness view. This gives operations leaders a production-style release gate instead of forcing them to infer readiness from separate workstream sections.

## Remaining production-scale roadmap

Normalize users, crew members, operational roles, and departments so every assignment, workflow action, and tenant boundary resolves through durable identifiers instead of display strings.

### Tenant/Cruise-Line Boundaries
The platform should continue deepening tenant/cruise-line boundaries across every API read and write path. A production user should only see and mutate data within their cruise line, assigned ships, assigned sailings, and permitted operational roles.

### Audit and Event History
The application now records append-only audit/event history for turnaround operational changes and core fleet/customer/booking administration, with scoped operational and admin-facing audit history APIs. The next audit expansion should cover itinerary administration, passenger self-service preferences, favorites, administrative reset actions, and long-term retention/export rules so every production-impacting change has immutable event rows for compliance and operational traceability.

### Seed-JSON Exit Strategy
The seed JSON should remain a demo/bootstrap source only. Production should move toward migration-owned reference data, database-owned operational data, and live-service integration. The bundled static fallback can remain a read-only portfolio safety net, but it should not become the production source of truth.

### Production Identity and Authorization
Future work should connect normalized users and roles to a real authentication provider. Server-side authorization should enforce admin, passenger, group leader, and operational lead permissions rather than relying only on UI visibility. The request authorization service is now the platform seam for authenticated principal claims, while the turnaround scope service remains the operational assignment seam where those claims can replace demo-user headers without rewriting every turnaround endpoint.

### Operational Analytics
Once ownership, timestamps, and events are fully normalized, the platform can produce historical readiness analytics, blocker trends, staffing gap analysis, handoff throughput, escalation resolution time, and fleet-level turnaround performance reporting.

### Turnaround Operational Timeline Bridge
Turnaround operation payloads now include a unified `operationalTimeline` generated from command status, tasks, task updates, staffing, signoffs, dependencies, handoffs, escalations, and audit events. This keeps the demo-mode role switching intact while giving reviewers a production-style incident/event feed for release-day operations review. The timeline is intentionally derived from existing normalized and bridge-owned records so it can later become a persisted event stream without changing the React dashboard contract.


### Turnaround Playbook Template Bridge
Turnaround operation payloads now include a derived `playbookTemplate` that evaluates whether a live operation is safe to reuse as a repeatable operating playbook. The bridge extracts department baselines, template task order, staffing expectations, exception rules, template readiness checks, and next best actions from the same scoped operation data that powers the release packet, timeline, analytics, and audit views. This keeps the demo app role-assumable while showing cruise-line reviewers how current operations can become future ship/port templates without adding a premature template database workflow.

### Turnaround Playbook Variance Rehearsal Bridge
Turnaround operation payloads now include a derived `playbookVariance` view that compares live execution against the reusable playbook baseline. The bridge scores department-level task completion, staffing variance, signoff state, and open exceptions, then summarizes rehearsal status and next actions. This keeps the app role-assumable for demo reviewers while showing how a cruise-line operations team could validate whether today’s turnaround is tracking closely enough to become a repeatable ship/port operating pattern.



### Turnaround Incident Command Bridge
Turnaround operation payloads now include a derived `incidentCommand` view that converts blocked tasks, unresolved escalations, active dependencies, open handoffs, staffing gaps, incomplete signoffs, release readiness, timeline criticality, and variance risk into one release-day exception bridge. This keeps the application role-assumable for demo reviewers while showing how a production operations center could isolate incident signals, rank affected departments, and drive command actions before final embarkation release.

## Turnaround After-Action Review Bridge

The turnaround module now derives an after-action review object for each scoped operation after release packet, timeline, metrics, playbook, variance, and incident command data are assembled. This keeps the demo experience role-assumable while presenting a production-style debrief layer that cruise operations teams would expect after a turnaround.

The bridge intentionally remains derived from normalized operation, task, staffing, signoff, dependency, handoff, escalation, audit, playbook, and incident sources. It does not create a new persistence model yet. Future production hardening can promote after-action findings, department lessons, and follow-up actions into append-only review tables once the data model leaves seed/demo mode.

Current guarantees:

- after-action review is scoped to the selected turnaround operation;
- department lessons are based on user-id-backed task, signoff, escalation, and handoff ownership data;
- findings are derived from release confidence, rehearsal variance, incident score, open blockers, staffing gaps, and release gates;
- follow-up actions can be displayed without granting real authorization or removing demo role assumption.

## Turnaround Reviewer Packet Bridge

Turnaround operation payloads now include a derived `reviewerPacket` designed for cruise-line outreach and portfolio review. The packet consolidates executive brief scoring, release readiness, incident command, after-action review, playbook variance, operational timeline depth, and data-quality watch items into a single presentation-ready layer.

The bridge is intentionally derived rather than persisted. It preserves the current demo role-assumption model while proving that the backend can assemble scoped, reviewer-facing evidence from normalized operational records. A future production slice can promote this packet into an exportable document, approval workflow, or signed operational handoff without changing the source operational contracts.

### Cruise-Line Outreach Board

Turnaround operation payloads now include a derived `outreachBoard` that sits above the reviewer packet and executive brief. The board converts reviewer readiness, executive decision signals, after-action review quality, incident command risk, and data-quality watch items into an application-ready outreach strategy. It intentionally preserves demo-mode role assumption while showing which evidence assets, target reviewer groups, and next actions are ready before sending the platform to cruise-line reviewers.

### Turnaround Management Status Map

The turnaround management status map is an application-level synthesis layer. It does not replace the underlying operational records. It reads from tasks, staffing, dependencies, handoffs, signoffs, audit events, timeline events, release packet, metrics, playbook variance, incident command, after-action review, executive brief, reviewer packet, and outreach board.

Purpose:
- Give reviewers and future development conversations a single status view for turnaround management completeness.
- Keep the demo role selector intact while showing production-oriented capability maturity.
- Identify remaining hardening work without scattering roadmap logic across the UI.
- Preserve the path toward normalized users, IDs, status constraints, indexed lookup fields, and tenant-aware cruise-line/ship scoping.

This is a presentation and planning bridge, not an authorization boundary or persistence model.

### Turnaround launch plan bridge

The turnaround launch plan is intentionally derived from existing operational evidence instead of introducing a separate source of truth. It consumes the release packet, metrics, incident command, after-action review, executive brief, reviewer packet, outreach board, and management status. This keeps reviewer readiness, risk mitigation, and demo runbook status tied to the same scoped operation data that powers the dashboards.

## Turnaround scenario plan slice

The turnaround management module now includes a scenario-planning layer. This layer intentionally derives from existing operational evidence rather than introducing a separate scenario seed file. It uses release readiness, operational metrics, incident command, playbook variance, after-action review, launch plan, and management status to produce:

- disruption stress cases,
- trigger matrix rows,
- contingency actions,
- and a reviewer-safe drill runbook.

This keeps the demonstration role-switchable while still showing production-style operational resilience and clear decision support.
