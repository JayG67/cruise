export const reactCutoverReadinessGates = [
  {
    id: 'api-contract',
    label: 'API contract parity',
    status: 'ready',
    evidence: 'React consumes the same customer and booking API snapshot validated by integration and browser tests.'
  },
  {
    id: 'mutation-boundaries',
    label: 'Mutation boundary parity',
    status: 'ready',
    evidence: 'Customer and booking draft saves flow through React hooks while preserving existing API payload contracts.'
  },
  {
    id: 'accessibility',
    label: 'Accessibility contracts',
    status: 'ready',
    evidence: 'Expandable hierarchy controls expose aria-expanded, aria-controls, status, and alert feedback contracts.'
  },
  {
    id: 'browser-coverage',
    label: 'Browser regression coverage',
    status: 'watch',
    evidence: 'Legacy Cypress and Playwright suites remain the production safety net until React receives route-level browser coverage.'
  },
  {
    id: 'cutover-toggle',
    label: 'Production cutover toggle',
    status: 'blocked',
    evidence: 'React remains isolated behind the Vite preview shell until an explicit routing or feature-flag cutover is introduced.'
  }
]

export function summarizeReactCutoverReadiness(gates = reactCutoverReadinessGates) {
  return gates.reduce((summary, gate) => ({
    ...summary,
    [gate.status]: (summary[gate.status] || 0) + 1,
    total: summary.total + 1
  }), { ready: 0, watch: 0, blocked: 0, total: 0 })
}

export function getReactCutoverRecommendation(gates = reactCutoverReadinessGates) {
  const summary = summarizeReactCutoverReadiness(gates)

  if (summary.blocked > 0) {
    return 'Not ready for production cutover yet. Keep React on the dev branch until blocked gates are resolved.'
  }

  if (summary.watch > 0) {
    return 'Ready for controlled pilot review, but keep the legacy DOM app available as the fallback path.'
  }

  return 'Ready for a production cutover proposal.'
}
