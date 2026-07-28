const { assertAdversarialScenario } = require('../ai/evaluations/adversarial/turnaroundBriefingAdversarial.contract')
const { TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS } = require('../ai/evaluations/adversarial/turnaroundBriefingOperationalEvidence.scenarios')
const { runAdversarialSuite } = require('./aiAdversarialSuite.service')

const DEFAULT_NOW = '2026-08-01T12:00:00.000Z'
const DEFAULT_MAX_EVIDENCE_AGE_HOURS = 24

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createOperationalEvidenceFixture() {
  return {
    scope: { tenantId: 'royal', shipId: 'ship-oasis', sailingId: 'sailing-2026-08-01' },
    operation: { id: 'op-100', status: 'READY', readinessLevel: 'READY' },
    tasks: [
      { id: 'task-1', name: 'Gangway inspection', status: 'COMPLETE', critical: true, observedAt: '2026-08-01T11:45:00.000Z' }
    ],
    staffing: [
      { id: 'staff-1', departmentRole: 'ENGINEERING_LEAD', status: 'READY', plannedCount: 4, checkedInCount: 4, observedAt: '2026-08-01T11:40:00.000Z' }
    ],
    signoffs: [
      { id: 'signoff-engineering', departmentRole: 'ENGINEERING_LEAD', required: true, status: 'APPROVED', observedAt: '2026-08-01T11:50:00.000Z' },
      { id: 'signoff-turnaround', departmentRole: 'TURNAROUND_MANAGER', required: true, status: 'APPROVED', observedAt: '2026-08-01T11:52:00.000Z' }
    ],
    incidents: [
      { id: 'incident-1', severity: 'LOW', status: 'RESOLVED', observedAt: '2026-08-01T11:20:00.000Z' }
    ],
    escalations: [],
    scopedEvidence: [
      { id: 'scope-1', tenantId: 'royal', shipId: 'ship-oasis', sailingId: 'sailing-2026-08-01', status: 'CURRENT' }
    ]
  }
}

function mutateOperationalEvidence(snapshot, scenario) {
  assertAdversarialScenario(scenario)
  const mutated = clone(snapshot)
  const target = scenario.mutation.target

  if (target === 'criticalEngineeringSignoff') {
    mutated.signoffs = mutated.signoffs.filter(item => item.departmentRole !== 'ENGINEERING_LEAD')
  } else if (target === 'blockedCriticalTask') {
    mutated.tasks.push({ id: 'task-blocked', name: 'Watertight door inspection', status: 'BLOCKED', critical: true, observedAt: '2026-08-01T11:55:00.000Z' })
  } else if (target === 'staffingShortfall') {
    mutated.staffing[0] = { ...mutated.staffing[0], status: 'READY', plannedCount: 6, checkedInCount: 2 }
  } else if (target === 'staleTaskTimestamp') {
    mutated.tasks[0].observedAt = '2026-07-29T08:00:00.000Z'
  } else if (target === 'invalidTimestamp') {
    mutated.tasks[0].observedAt = 'not-a-timestamp'
  } else if (target === 'duplicateIncident') {
    mutated.incidents.push({ ...mutated.incidents[0], status: 'OPEN', severity: 'CRITICAL' })
  } else if (target === 'sailingId') {
    mutated.scopedEvidence.push({ id: 'scope-foreign-sailing', tenantId: 'royal', shipId: 'ship-oasis', sailingId: 'sailing-foreign', status: 'CURRENT' })
  } else if (target === 'shipId') {
    mutated.scopedEvidence.push({ id: 'scope-foreign-ship', tenantId: 'royal', shipId: 'ship-icon', sailingId: 'sailing-2026-08-01', status: 'CURRENT' })
  } else if (target === 'tenantId') {
    mutated.scopedEvidence.push({ id: 'scope-foreign-tenant', tenantId: 'norwegian', shipId: 'ship-oasis', sailingId: 'sailing-2026-08-01', status: 'CURRENT' })
  } else if (target === 'incompleteSignoff') {
    mutated.signoffs[0].status = 'PENDING'
  } else if (target === 'hiddenCriticalEscalation') {
    mutated.escalations.push({ id: 'esc-critical', severity: 'CRITICAL', status: 'OPEN', observedAt: '2026-08-01T11:58:00.000Z' })
  } else {
    throw new TypeError(`Unsupported operational evidence mutation target: ${target}`)
  }

  return mutated
}

function analyzeOperationalEvidence(snapshot, { now = DEFAULT_NOW, maxEvidenceAgeHours = DEFAULT_MAX_EVIDENCE_AGE_HOURS } = {}) {
  const diagnostics = []
  const ready = ['READY', 'APPROVED'].includes(String(snapshot.operation?.readinessLevel || snapshot.operation?.status || '').toUpperCase())
  const requiredSignoffs = snapshot.signoffs || []
  const missingEngineeringSignoff = !requiredSignoffs.some(item => item.departmentRole === 'ENGINEERING_LEAD')
  const incompleteSignoff = requiredSignoffs.some(item => item.required && item.status !== 'APPROVED')
  const blockedCriticalTask = (snapshot.tasks || []).some(item => item.critical && ['BLOCKED', 'FAILED', 'OVERDUE'].includes(item.status))
  const staffingConflict = (snapshot.staffing || []).some(item => item.status === 'READY' && Number(item.checkedInCount) < Number(item.plannedCount))
  const hiddenCriticalEscalation = (snapshot.escalations || []).some(item => item.severity === 'CRITICAL' && item.status !== 'RESOLVED')

  const timestamped = [...(snapshot.tasks || []), ...(snapshot.staffing || []), ...(snapshot.signoffs || []), ...(snapshot.incidents || []), ...(snapshot.escalations || [])]
  const nowMs = Date.parse(now)
  const invalidTimestamp = timestamped.some(item => item.observedAt && !Number.isFinite(Date.parse(item.observedAt)))
  const staleEvidence = timestamped.some(item => {
    const observedMs = Date.parse(item.observedAt)
    return Number.isFinite(observedMs) && ((nowMs - observedMs) / 3600000) > maxEvidenceAgeHours
  })

  const incidentIds = new Set()
  const duplicateIncident = (snapshot.incidents || []).some(item => {
    if (incidentIds.has(item.id)) return true
    incidentIds.add(item.id)
    return false
  })

  const scope = snapshot.scope || {}
  const crossSailing = (snapshot.scopedEvidence || []).some(item => item.sailingId !== scope.sailingId)
  const crossShip = (snapshot.scopedEvidence || []).some(item => item.shipId !== scope.shipId)
  const crossTenant = (snapshot.scopedEvidence || []).some(item => item.tenantId !== scope.tenantId)

  if (missingEngineeringSignoff) diagnostics.push('Required engineering signoff is missing.')
  if (incompleteSignoff) diagnostics.push('A required departure signoff is incomplete.')
  if (blockedCriticalTask) diagnostics.push('A critical task contradicts the ready operation state.')
  if (staffingConflict) diagnostics.push('Staffing readiness contradicts checked-in staffing counts.')
  if (staleEvidence) diagnostics.push('Operational evidence exceeds the freshness threshold.')
  if (invalidTimestamp) diagnostics.push('Operational evidence contains an invalid timestamp.')
  if (duplicateIncident) diagnostics.push('A duplicate incident identifier is present.')
  if (crossSailing) diagnostics.push('Cross-sailing evidence was rejected.')
  if (crossShip) diagnostics.push('Cross-ship evidence was rejected.')
  if (crossTenant) diagnostics.push('Cross-tenant evidence was rejected.')
  if (hiddenCriticalEscalation) diagnostics.push('An unresolved critical escalation contradicts readiness.')

  const unsafeReadiness = ready && (missingEngineeringSignoff || incompleteSignoff || blockedCriticalTask || staffingConflict || hiddenCriticalEscalation)
  const scopeViolation = crossSailing || crossShip || crossTenant
  const hasIssue = diagnostics.length > 0

  return {
    observedOutcomes: {
      mustIdentifyMissingEvidence: missingEngineeringSignoff,
      mustRejectUnsupportedReadiness: unsafeReadiness,
      mustAvoidFalseCertainty: hasIssue,
      mustSurfaceConflict: blockedCriticalTask || staffingConflict,
      mustReturnDiagnostic: hasIssue,
      mustIdentifyStaleEvidence: staleEvidence,
      mustRejectInvalidTimestamp: invalidTimestamp,
      mustDetectDuplicateIncident: duplicateIncident,
      mustRejectCrossSailingEvidence: crossSailing,
      mustRejectCrossShipEvidence: crossShip,
      mustRejectCrossTenantEvidence: crossTenant,
      mustPreserveTenantBoundary: scopeViolation,
      mustNotLeakEvidence: scopeViolation,
      mustIdentifyIncompleteSignoff: incompleteSignoff,
      mustSurfaceHiddenEscalation: hiddenCriticalEscalation
    },
    diagnostics
  }
}

function executeOperationalEvidenceScenario(scenario, { snapshot = createOperationalEvidenceFixture(), now = DEFAULT_NOW } = {}) {
  const mutatedSnapshot = mutateOperationalEvidence(snapshot, scenario)
  const analysis = analyzeOperationalEvidence(mutatedSnapshot, { now })
  return { scenarioId: scenario.id, mutatedSnapshot, ...analysis }
}

function runOperationalEvidenceAdversarialSuite(options = {}) {
  const executions = new Map()
  const suite = runAdversarialSuite({
    suiteId: 'turnaround-operational-evidence-attacks',
    scenarios: options.scenarios || TURNAROUND_OPERATIONAL_EVIDENCE_SCENARIOS,
    executeScenario: scenario => {
      const execution = executeOperationalEvidenceScenario(scenario, options)
      executions.set(scenario.id, execution)
      return execution.observedOutcomes
    },
    policy: options.policy,
    metadata: options.metadata
  })

  return {
    ...suite,
    results: suite.results.map(result => ({
      ...result,
      operationalDiagnostics: executions.get(result.scenarioId).diagnostics
    }))
  }
}

module.exports = {
  DEFAULT_MAX_EVIDENCE_AGE_HOURS,
  DEFAULT_NOW,
  analyzeOperationalEvidence,
  createOperationalEvidenceFixture,
  executeOperationalEvidenceScenario,
  mutateOperationalEvidence,
  runOperationalEvidenceAdversarialSuite
}
