# Cruise Explorer Code Review

## Review Summary

This review focused on recruiter-facing portfolio quality: correctness, test strategy, maintainability, accessibility, CI signal quality, deployment hygiene, and whether the repository tells a credible senior SQA story.

The project is in strong shape as a testing showcase. It has layered validation across Jest unit tests, PostgreSQL-backed integration tests, Cypress UI tests, Playwright mobile/responsive tests, k6 performance smoke testing, Lighthouse CI, accessibility-oriented checks, and published reports. The major risk is no longer lack of coverage; it is keeping the repository clean, keeping startup/default UI state guarded, and preventing generated reports from looking like source code.

## High-Impact Findings

### 1. Generated report artifacts are present in the repository snapshot

The working tree contains generated Lighthouse, Playwright, coverage, test-results, log, and `.DS_Store` artifacts. These files are useful as CI artifacts or GitHub Pages output, but they should not be committed as source files.

**Why it matters:** Recruiters and engineers reviewing a portfolio may read tracked generated artifacts as poor repository discipline.

**Recommendation:** Keep `.gitignore` strict and remove already-tracked generated files with commands such as:

```bash
git rm --cached lighthouse-report.report.html lighthouse-report.report.json public/.DS_Store
git rm -r --cached coverage lhci-report .lighthouseci playwright-report test-results logs 2>/dev/null || true
git commit -m "Remove generated local artifacts from source control"
```

A new `npm run repo:hygiene` script has been added to make this visible before pushing.

### 2. Security headers were missing

The app is a portfolio demo, but production-style browser hardening still matters. Basic security headers are now set in Express without adding a dependency.

Covered headers include:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy`

A unit test validates these headers on `/health`.

### 3. Test coverage is strong, but should be protected from silent shrinkage

The Playwright suite previously shrank when a spec disappeared. The existing static guard is a strong step. Continue using inventory tests for important test layers when the suite itself is part of the portfolio message.

### 4. Startup/default UI state deserves first-class tests

The update panel visibility issue was a good example of manual testing finding a real regression gap. It now has Cypress and static coverage. This pattern is exactly what a testing portfolio should show: manual observation becomes automated regression coverage.

### 5. README is strong, but should explicitly state evidence and hygiene expectations

The README now better positions the project as a QA/SQA portfolio and points reviewers to quality evidence while avoiding claims of legal ADA certification.

## Additional Recommendations

### Architecture

The project is currently a single Express app with a large `cruise.controller.js`. That is acceptable for a portfolio demo, but the next maintainability step would be splitting controller concerns into service modules:

- `cruiseLine.service.js`
- `ship.service.js`
- `sailing.service.js`
- `booking.service.js`
- `roleContext.service.js`
- `itineraryFavorite.service.js`

This would make business rules easier to test directly without going through route handlers.

### Data integrity

Booking overlap validation is a strong addition. Future booking workflow work should also add capacity/cabin rules, waitlist states, and explicit booking lifecycle transitions.

### Accessibility

The project now has useful automated accessibility checks. The next improvement would be a manual assistive-technology checklist in CI artifacts or documentation covering keyboard-only review, VoiceOver/NVDA smoke checks, contrast review, and mobile screen reader notes.

### CI

CI is comprehensive. Consider adding a lightweight repository hygiene job once generated artifacts are removed from tracking.

## Portfolio Strengths

- Clear test pyramid and multi-layer quality strategy
- PostgreSQL-backed integration coverage
- Real browser regression tests
- Mobile and responsive validation
- Accessibility-oriented behavior and regression tests
- Performance smoke checks
- Lighthouse quality gate
- Published dashboard and reports
- Manual testing findings converted into automated tests

## Overall Assessment

This is a credible SQA engineering portfolio project. The most important polish work is repository cleanliness, concise documentation of test intent, and continued protection against silent coverage loss.
