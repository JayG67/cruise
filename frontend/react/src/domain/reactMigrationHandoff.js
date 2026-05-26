export const reactMigrationHandoffItems = [
  {
    id: 'stable-baseline',
    label: 'Stable legacy baseline preserved',
    evidence: 'The production DOM app remains the working release baseline while the React shell matures independently.',
    status: 'complete'
  },
  {
    id: 'react-pilot-shell',
    label: 'React pilot shell is reviewer-ready',
    evidence: 'The React preview now has route navigation, live API query status, hierarchy workflows, readiness, roadmap, cutover, pilot, parity, and handoff panels.',
    status: 'complete'
  },
  {
    id: 'regression-suite',
    label: 'Regression suite remains the release gate',
    evidence: 'The full test:all flow continues to cover unit, full Jest coverage, Cypress, Playwright mobile/responsive, k6, and Lighthouse checks.',
    status: 'complete'
  },
  {
    id: 'remaining-cutover',
    label: 'Final cutover work is intentionally explicit',
    evidence: 'The next production step is not another migration stage; it is a focused PR review and route smoke test before replacing any legacy workflow.',
    status: 'watch'
  }
]

export function summarizeReactMigrationHandoff(items = reactMigrationHandoffItems) {
  return items.reduce((summary, item) => ({
    ...summary,
    [item.status]: (summary[item.status] || 0) + 1
  }), { complete: 0, watch: 0, blocked: 0 })
}

export function getReactMigrationHandoffRecommendation(items = reactMigrationHandoffItems) {
  const summary = summarizeReactMigrationHandoff(items)

  if (summary.blocked > 0) {
    return 'Do not cut over yet. Resolve blocked handoff items before replacing the legacy DOM workflow.'
  }

  if (summary.watch > 0) {
    return 'Migration staging is complete. Move to PR review, smoke-test the React route, and keep the legacy DOM workflow as fallback until cutover approval.'
  }

  return 'Migration staging is complete and ready for final React pilot cutover review.'
}
