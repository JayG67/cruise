const {
  DEFAULT_CLOSEOUT_AREAS,
  CLOSEOUT_STATUSES,
  normalizeCloseoutStatus,
  normalizeCloseoutArea,
  buildPhaseOneCloseoutReadiness,
  assertPhaseOneCloseoutReadiness,
  describePhaseOneCloseoutReadiness
} = require('../../services/phaseOneCloseoutReadiness.service')

describe('phaseOneCloseoutReadiness service', () => {
  it('builds the Phase 1 closeout readiness contract from the completed hardening bridges', () => {
    const readiness = buildPhaseOneCloseoutReadiness()

    expect(readiness).toEqual(expect.objectContaining({
      phase: 'Phase 1 Data Architecture Hardening',
      closeoutGuardrail: 'phase-one-closeout-readiness',
      status: 'ready-for-closeout-review',
      completionPercentage: 96
    }))
    expect(readiness.completeAreaKeys).toEqual(expect.arrayContaining([
      'durable-identity',
      'audit-history',
      'payload-contracts',
      'tenant-boundaries',
      'seed-data-decoupling',
      'index-strategy'
    ]))
    expect(readiness.carryForwardAreaKeys).toEqual(['date-time-normalization'])
  })

  it('keeps closeout status normalization explicit and conservative', () => {
    expect(CLOSEOUT_STATUSES).toContain('complete')
    expect(normalizeCloseoutStatus(' CARRY_FORWARD ')).toBe('carry-forward')
    expect(normalizeCloseoutStatus('unknown')).toBe('blocked')
  })

  it('normalizes closeout areas without losing evidence needed for the handoff', () => {
    expect(normalizeCloseoutArea({
      key: 'audit-history',
      label: 'Audit History',
      status: 'complete',
      evidence: [' Audit Event Bridge ', '', 'Phase 1 Audit Event Query Contract Bridge']
    })).toEqual({
      key: 'audit-history',
      label: 'Audit History',
      status: 'complete',
      evidence: ['Audit Event Bridge', 'Phase 1 Audit Event Query Contract Bridge']
    })
  })

  it('validates closeout readiness before Phase 1 can be called done', () => {
    const readiness = buildPhaseOneCloseoutReadiness(DEFAULT_CLOSEOUT_AREAS)
    expect(assertPhaseOneCloseoutReadiness(readiness)).toBe(readiness)

    expect(() => assertPhaseOneCloseoutReadiness({
      closeoutGuardrail: 'phase-one-closeout-readiness',
      areas: [{ key: 'missing-evidence', label: 'Missing Evidence', status: 'complete', evidence: [] }]
    })).toThrow('Phase 1 closeout evidence is required')
  })

  it('describes remaining carry-forward work without reopening completed bridge slices', () => {
    expect(describePhaseOneCloseoutReadiness()).toEqual(expect.objectContaining({
      headline: 'Phase 1 Data Architecture Hardening is 96% complete',
      status: 'ready-for-closeout-review',
      closeoutGuardrail: 'phase-one-closeout-readiness',
      remainingWork: [{
        key: 'date-time-normalization',
        label: 'Date and time normalization propagation',
        nextAction: expect.stringContaining('proper date, time, and timestamp columns')
      }]
    }))
  })
})
