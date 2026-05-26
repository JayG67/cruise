export const reactPilotParityChecks = [
  {
    id: 'desktop-tablet',
    label: 'Desktop and tablet responsive parity',
    source: 'Playwright responsive suite',
    status: 'covered',
    evidence: 'Existing responsive checks keep workspace navigation, admin dashboard, ship, sailing, itinerary, create, and update workflows layout-safe.'
  },
  {
    id: 'mobile',
    label: 'Mobile workflow parity',
    source: 'Playwright mobile suite',
    status: 'covered',
    evidence: 'Mobile checks cover navigation, role dashboards, passenger bookings, admin hierarchy controls, SQA console actions, and itinerary favorites.'
  },
  {
    id: 'legacy-regression',
    label: 'Legacy workflow regression safety',
    source: 'Cypress browser suite',
    status: 'covered',
    evidence: 'The legacy DOM app remains guarded by CRUD, accessibility, search, role, reset, sailing, and SQA console browser coverage while React matures.'
  },
  {
    id: 'react-route-smoke',
    label: 'React route pilot smoke',
    source: 'Next pilot gate',
    status: 'watch',
    evidence: 'The next and final migration step should add a dedicated route smoke check before replacing the legacy customer hierarchy workflow.'
  }
]

export function summarizeReactPilotParity(checks = reactPilotParityChecks) {
  return checks.reduce((summary, check) => ({
    ...summary,
    [check.status]: (summary[check.status] || 0) + 1,
    total: summary.total + 1
  }), { covered: 0, watch: 0, gap: 0, total: 0 })
}

export function getReactPilotParityRecommendation(checks = reactPilotParityChecks) {
  const summary = summarizeReactPilotParity(checks)

  if (summary.gap > 0) {
    return 'Do not cut over yet. Close parity gaps before replacing the legacy workflow.'
  }

  if (summary.watch > 0) {
    return 'React is ready for a dev-branch pilot with one explicit route smoke gate still under watch.'
  }

  return 'React parity evidence supports pilot cutover planning.'
}
