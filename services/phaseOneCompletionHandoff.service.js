const PHASE_ONE_COMPLETION_GUARDRAIL = 'phase-one-completion-handoff'

const PHASE_ONE_COMPLETION_AREAS = Object.freeze([
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
    label: 'API payload profiles and backward compatibility',
    status: 'complete',
    evidence: [
      'Phase 1 API Payload Profile Bridge',
      'Customer compact payload profiles'
    ]
  },
  {
    key: 'tenant-boundaries',
    label: 'Tenant and cruise-line boundary foundation',
    status: 'complete',
    evidence: [
      'Phase 1 Tenant Boundary Foundation Bridge'
    ]
  },
  {
    key: 'seed-data-decoupling',
    label: 'Seed data decoupling and migration planning',
    status: 'complete',
    evidence: [
      'Phase 1 Seed Data Decoupling Bridge'
    ]
  },
  {
    key: 'date-time-normalization',
    label: 'Date and time normalization bridge',
    status: 'complete',
    evidence: [
      'Build 426: Date/Time Architecture Normalization Bridge'
    ]
  },
  {
    key: 'production-indexing',
    label: 'Production indexing strategy finalization',
    status: 'complete',
    evidence: [
      'Phase 1 Production Index Strategy Bridge'
    ]
  },
  {
    key: 'closeout-readiness',
    label: 'Phase 1 closeout readiness contract',
    status: 'complete',
    evidence: [
      'Phase 1 Closeout Readiness Bridge'
    ]
  }
])

const PHASE_ONE_PRODUCTIONIZATION_HANDOFF = Object.freeze([
  {
    key: 'database-migrations',
    label: 'Convert bridge contracts into database migrations',
    phase: 'Phase 2 Productionization',
    reason: 'Phase 1 established the compatibility contracts; destructive schema cutover belongs in productionization.'
  },
  {
    key: 'production-authentication',
    label: 'Replace demo identity selection with production authentication',
    phase: 'Phase 2 Productionization',
    reason: 'The request actor seam now supports production principals without breaking demo workflows.'
  },
  {
    key: 'tenant-enforcement',
    label: 'Enforce tenant boundaries at every production query boundary',
    phase: 'Phase 2 Productionization',
    reason: 'The tenant boundary foundation centralizes scope checks while preserving legacy demo rows.'
  }
])

function normalizeCompletionStatus(status) {
  const normalized = String(status || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return normalized === 'complete' ? 'complete' : 'needs-attention'
}

function normalizeCompletionArea(area = {}) {
  const evidence = Array.isArray(area.evidence)
    ? area.evidence.map((item) => String(item).trim()).filter(Boolean)
    : []

  return {
    key: String(area.key || '').trim(),
    label: String(area.label || area.key || '').trim(),
    status: normalizeCompletionStatus(area.status),
    evidence
  }
}

function buildPhaseOneCompletionHandoff(areas = PHASE_ONE_COMPLETION_AREAS, productionizationHandoff = PHASE_ONE_PRODUCTIONIZATION_HANDOFF) {
  const normalizedAreas = areas.map(normalizeCompletionArea)
  const completeAreas = normalizedAreas.filter((area) => area.status === 'complete')
  const needsAttentionAreas = normalizedAreas.filter((area) => area.status !== 'complete')
  const completionPercentage = normalizedAreas.length === 0
    ? 0
    : Math.round((completeAreas.length / normalizedAreas.length) * 100)

  return {
    phase: 'Phase 1 Data Architecture Hardening',
    guardrail: PHASE_ONE_COMPLETION_GUARDRAIL,
    status: needsAttentionAreas.length === 0 ? 'complete' : 'needs-attention',
    completionPercentage,
    areas: normalizedAreas,
    completeAreaKeys: completeAreas.map((area) => area.key),
    needsAttentionAreaKeys: needsAttentionAreas.map((area) => area.key),
    productionizationHandoff: productionizationHandoff.map((item) => ({
      key: String(item.key || '').trim(),
      label: String(item.label || '').trim(),
      phase: String(item.phase || '').trim(),
      reason: String(item.reason || '').trim()
    }))
  }
}

function assertPhaseOneCompletionHandoff(handoff = buildPhaseOneCompletionHandoff()) {
  if (handoff.guardrail !== PHASE_ONE_COMPLETION_GUARDRAIL) {
    throw new Error('Phase 1 completion handoff guardrail is required.')
  }

  if (handoff.status !== 'complete') {
    throw new Error('Phase 1 completion handoff still has areas needing attention.')
  }

  if (handoff.completionPercentage !== 100) {
    throw new Error('Phase 1 completion handoff must be 100% complete before closeout.')
  }

  if (!Array.isArray(handoff.areas) || handoff.areas.length === 0) {
    throw new Error('Phase 1 completion areas are required.')
  }

  handoff.areas.forEach((area) => {
    if (!area.key) {
      throw new Error('Phase 1 completion area key is required.')
    }
    if (!area.label) {
      throw new Error(`Phase 1 completion area label is required for ${area.key}.`)
    }
    if (area.status !== 'complete') {
      throw new Error(`Phase 1 completion area is not complete: ${area.key}`)
    }
    if (!Array.isArray(area.evidence) || area.evidence.length === 0) {
      throw new Error(`Phase 1 completion evidence is required for ${area.key}.`)
    }
  })

  if (!Array.isArray(handoff.productionizationHandoff) || handoff.productionizationHandoff.length === 0) {
    throw new Error('Phase 2 productionization handoff items are required.')
  }

  return handoff
}

function describePhaseOneCompletionHandoff(handoff = buildPhaseOneCompletionHandoff()) {
  const checked = assertPhaseOneCompletionHandoff(handoff)
  return {
    headline: `${checked.phase} is complete`,
    completionPercentage: checked.completionPercentage,
    status: checked.status,
    guardrail: checked.guardrail,
    productionizationHandoffKeys: checked.productionizationHandoff.map((item) => item.key)
  }
}

module.exports = {
  PHASE_ONE_COMPLETION_GUARDRAIL,
  PHASE_ONE_COMPLETION_AREAS,
  PHASE_ONE_PRODUCTIONIZATION_HANDOFF,
  normalizeCompletionStatus,
  normalizeCompletionArea,
  buildPhaseOneCompletionHandoff,
  assertPhaseOneCompletionHandoff,
  describePhaseOneCompletionHandoff
}
