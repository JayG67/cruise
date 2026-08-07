export function formatResult(title, payload) {
  return `${title}\n\n${JSON.stringify(payload, null, 2)}`
}

export function createFailure(error = {}) {
  return {
    passed: false,
    error: error.message || 'Validation failed'
  }
}

export function buildPendingReadinessChecklist() {
  return [
    ['API availability', 'pending', 'Not checked yet. Run Go-Live Review to validate API availability.'],
    ['Fleet data', 'pending', 'Not checked yet. Run Go-Live Review to validate cruise-line data.'],
    ['Customer operations', 'pending', 'Not checked yet. Run Go-Live Review to validate customers and bookings.'],
    ['Turnaround operations', 'pending', 'Not checked yet. Run Go-Live Review to validate turnaround operations.'],
    ['Manual approval path', 'ready', 'Review role-specific workflows, fleet management, passenger self-service, and quality reports before publishing.']
  ].map(([label, status, detail]) => ({ label, status, detail }))
}

export function buildReadinessChecklist(result = {}) {
  return [
    { label: 'API availability', status: result.healthStatus === 'ok' ? 'ready' : 'attention', detail: result.healthStatus === 'ok' ? 'Application API is responding.' : 'Application API needs review.' },
    { label: 'Fleet data', status: result.cruiseLineCount > 0 ? 'ready' : 'attention', detail: `${result.cruiseLineCount || 0} cruise lines available.` },
    { label: 'Customer operations', status: result.customerCount > 0 && result.bookingCount > 0 ? 'ready' : 'attention', detail: `${result.customerCount || 0} customers and ${result.bookingCount || 0} bookings available.` },
    { label: 'Turnaround operations', status: result.turnaroundOperationCount > 0 ? 'ready' : 'attention', detail: `${result.turnaroundOperationCount || 0} turnaround operations available.` },
    { label: 'Manual approval path', status: 'ready', detail: 'Review role-specific workflows, fleet management, passenger self-service, and quality reports before publishing.' }
  ]
}

export function getReadinessItemSymbol(status) {
  if (status === 'ready') return '✓'
  if (status === 'attention') return '!'
  return '•'
}

export function getAiHistoryProviders(runs = []) {
  return Array.from(new Set(runs.map(run => run.provider).filter(Boolean))).sort()
}

export function filterAndSortAiRuns(runs = [], filters = {}) {
  const decision = filters.decision || 'ALL'
  const provider = filters.provider || 'ALL'
  const search = String(filters.search || '').trim().toLowerCase()
  const sort = filters.sort || 'completed-desc'
  const filtered = runs.filter(run => {
    if (decision === 'READY' && !run.passed) return false
    if (decision === 'BLOCKED' && run.passed) return false
    if (provider !== 'ALL' && run.provider !== provider) return false
    if (!search) return true
    return [run.runId, run.variantId, run.provider, run.model, run.promptVersion]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(search))
  })

  return [...filtered].sort((left, right) => {
    if (sort === 'completed-asc') return new Date(left.completedAt || 0) - new Date(right.completedAt || 0)
    if (sort === 'pass-rate-desc') return Number(right.passRate || 0) - Number(left.passRate || 0)
    if (sort === 'pass-rate-asc') return Number(left.passRate || 0) - Number(right.passRate || 0)
    if (sort === 'score-desc') return Number(right.averageScore || 0) - Number(left.averageScore || 0)
    if (sort === 'score-asc') return Number(left.averageScore || 0) - Number(right.averageScore || 0)
    return new Date(right.completedAt || 0) - new Date(left.completedAt || 0)
  })
}
