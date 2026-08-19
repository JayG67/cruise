const DEFAULT_CLOSEOUT_AREAS = Object.freeze([
  {
    key: 'durable-identity',
    label: 'Durable identity and readable ID compatibility',
    status: 'complete',
    evidence: [
      'Passenger Relationship Identity Bridge',
      'Durable API Identity Contract Bridge',
      'Phase 1 User Actor Identity Bridge'
    ]
  },
  {
    key: 'audit-history',
    label: 'Audit and entity history consistency',
    status: 'complete',
    evidence: [
      'Audit Event Bridge',
      'Passenger self-service audit history consistency bridge',
      'Turnaround Operational Audit History Consistency Bridge',
      'Phase 1 Audit Event Query Contract Bridge'
    ]
  },
  {
    key: 'payload-contracts',
    label: 'API payload shaping and backward compatibility',
    status: 'complete',
    evidence: [
      'Phase 1 API Payload Profile Bridge',
      'Customer compact payload profiles'
    ]
  },
  {
    key: 'tenant-boundaries',
    label: 'Tenant boundary foundation',
    status: 'complete',
    evidence: [
      'Phase 1 Tenant Boundary Foundation Bridge'
    ]
  },
  {
    key: 'date-time-normalization',
    label: 'Date and time normalization propagation',
    status: 'carry-forward',
    evidence: [
      'Build 426: Date/Time Architecture Normalization Bridge'
    ],
    nextAction: 'Propagate proper date, time, and timestamp columns through future migrations without changing current readable API payloads.'
  },
  {
    key: 'seed-data-decoupling',
    label: 'Seed data decoupling',
    status: 'complete',
    evidence: [
      'Phase 1 Seed Data Decoupling Bridge'
    ]
  },
  {
    key: 'index-strategy',
    label: 'Production indexing strategy',
    status: 'complete',
    evidence: [
      'Phase 1 Production Index Strategy Bridge'
    ]
  }
])

const CLOSEOUT_STATUSES = Object.freeze(['complete', 'carry-forward', 'blocked'])

function normalizeCloseoutStatus(status) {
  const normalized = String(status || '').trim().toLowerCase().replace(/_/g, '-')
  return CLOSEOUT_STATUSES.includes(normalized) ? normalized : 'blocked'
}

function normalizeCloseoutArea(area = {}) {
  const key = String(area.key || '').trim()
  const label = String(area.label || key).trim()
  const status = normalizeCloseoutStatus(area.status)
  const evidence = Array.isArray(area.evidence)
    ? area.evidence.map((item) => String(item).trim()).filter(Boolean)
    : []

  return {
    key,
    label,
    status,
    evidence,
    ...(area.nextAction ? { nextAction: String(area.nextAction).trim() } : {})
  }
}

function buildPhaseOneCloseoutReadiness(areas = DEFAULT_CLOSEOUT_AREAS) {
  const normalizedAreas = areas.map(normalizeCloseoutArea)
  const completeAreas = normalizedAreas.filter((area) => area.status === 'complete')
  const carryForwardAreas = normalizedAreas.filter((area) => area.status === 'carry-forward')
  const blockedAreas = normalizedAreas.filter((area) => area.status === 'blocked')
  const weightedCompletion = normalizedAreas.reduce((total, area) => {
    if (area.status === 'complete') return total + 1
    if (area.status === 'carry-forward') return total + 0.72
    return total
  }, 0)
  const completionPercentage = normalizedAreas.length === 0
    ? 0
    : Math.round((weightedCompletion / normalizedAreas.length) * 100)

  return {
    phase: 'Phase 1 Data Architecture Hardening',
    closeoutGuardrail: 'phase-one-closeout-readiness',
    status: blockedAreas.length > 0 ? 'needs-attention' : 'ready-for-closeout-review',
    completionPercentage,
    areas: normalizedAreas,
    completeAreaKeys: completeAreas.map((area) => area.key),
    carryForwardAreaKeys: carryForwardAreas.map((area) => area.key),
    blockedAreaKeys: blockedAreas.map((area) => area.key)
  }
}

function assertPhaseOneCloseoutReadiness(readiness = buildPhaseOneCloseoutReadiness()) {
  if (readiness.closeoutGuardrail !== 'phase-one-closeout-readiness') {
    throw new Error('Phase 1 closeout guardrail is required.')
  }

  if (!Array.isArray(readiness.areas) || readiness.areas.length === 0) {
    throw new Error('Phase 1 closeout areas are required.')
  }

  const areaKeys = new Set()

  readiness.areas.forEach((area) => {
    if (!area.key) {
      throw new Error('Phase 1 closeout area key is required.')
    }
    if (areaKeys.has(area.key)) {
      throw new Error(`Duplicate Phase 1 closeout area key: ${area.key}`)
    }
    areaKeys.add(area.key)
    if (!area.label) {
      throw new Error('Phase 1 closeout area label is required.')
    }
    if (!CLOSEOUT_STATUSES.includes(area.status)) {
      throw new Error(`Unsupported Phase 1 closeout status: ${area.status}`)
    }
    if (!Array.isArray(area.evidence) || area.evidence.length === 0) {
      throw new Error(`Phase 1 closeout evidence is required for ${area.key}.`)
    }
  })

  const expected = buildPhaseOneCloseoutReadiness(readiness.areas)
  if (readiness.status && readiness.status !== expected.status) {
    throw new Error('Phase 1 closeout status does not match the area evidence.')
  }
  if (Number.isFinite(readiness.completionPercentage) && readiness.completionPercentage !== expected.completionPercentage) {
    throw new Error('Phase 1 closeout completion percentage does not match the area evidence.')
  }

  return readiness
}

function describePhaseOneCloseoutReadiness(readiness = buildPhaseOneCloseoutReadiness()) {
  const checked = assertPhaseOneCloseoutReadiness(readiness)
  return {
    headline: `${checked.phase} is ${checked.completionPercentage}% complete`,
    status: checked.status,
    closeoutGuardrail: checked.closeoutGuardrail,
    remainingWork: checked.areas
      .filter((area) => area.status !== 'complete')
      .map((area) => ({ key: area.key, label: area.label, nextAction: area.nextAction || 'Resolve before Phase 1 closeout.' }))
  }
}

module.exports = {
  DEFAULT_CLOSEOUT_AREAS,
  CLOSEOUT_STATUSES,
  normalizeCloseoutStatus,
  normalizeCloseoutArea,
  buildPhaseOneCloseoutReadiness,
  assertPhaseOneCloseoutReadiness,
  describePhaseOneCloseoutReadiness
}
