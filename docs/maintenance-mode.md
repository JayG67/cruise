# Maintenance Mode

The Cruise Fleet Operations Platform has completed its primary architecture, workflow, quality, accessibility, and production-hardening milestones. Maintenance mode keeps the application stable while allowing focused corrections and operational improvements.

## Release Gate

Run the deterministic maintenance gate before pushing a routine change:

```bash
npm run maintenance:readiness
```

This command verifies repository hygiene, test inventory, release-source safety, deployment and dependency contracts, the React/CSS production architecture, and completion contracts for all six AI quality phases.

Run the full browser, integration, performance, and Lighthouse pipeline before a public release, after dependency upgrades, or when a change affects shared workflows:

```bash
npm run test:all
```

## Change Policy

Accept maintenance work when it fixes a defect, improves accessibility, removes a production warning, reduces operational risk, updates dependencies, improves documentation accuracy, or strengthens an existing workflow.

Avoid duplicate capabilities, speculative rewrites, documentation-only application panels, and feature expansion that lacks a clear user or operational need. New functionality requires an enterprise-quality acceptance criterion and proportional automated coverage.

## Defect Triage

Use this order:

1. Production outage, broken deployment, data loss, or security issue.
2. Failed release gate or broken critical workflow.
3. Accessibility blocker, unusable responsive layout, or serious contrast defect.
4. Functional defect in an existing workflow.
5. Documentation drift, minor visual inconsistency, or non-blocking cleanup.

Keep fixes contained. Modify the smallest responsible area, preserve the current architecture, add regression coverage when practical, and avoid unrelated refactoring.

## Release Review

Before publishing a release:

- Confirm the landing experience loads without visible errors.
- Exercise role switching and representative passenger, administration, turnaround, quality, and AI workflows.
- Confirm the GitHub Actions workflow is green.
- Confirm production, quality dashboard, coverage, and Lighthouse links remain valid.
- Run `npm run maintenance:readiness`.
- Use the go-live manual review guide when a change affects shared or high-risk workflows.

## Maintenance Rhythm

Review the project when a defect is reported, a dependency or platform change requires attention, or a planned release is approaching. Otherwise, keep the application stable and avoid unnecessary feature expansion.
