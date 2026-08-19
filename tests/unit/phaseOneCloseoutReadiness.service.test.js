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


  it('rejects duplicate closeout keys so completed work cannot be counted twice', () => {
    const readiness = buildPhaseOneCloseoutReadiness([
      { key: 'audit-history', label: 'Audit', status: 'complete', evidence: ['one'] },
      { key: 'audit-history', label: 'Audit duplicate', status: 'complete', evidence: ['two'] }
    ])

    expect(() => assertPhaseOneCloseoutReadiness(readiness)).toThrow('Duplicate Phase 1 closeout area key')
  })

  it('rejects summary status or percentage claims that contradict the area evidence', () => {
    const areas = [
      { key: 'blocked-area', label: 'Blocked Area', status: 'blocked', evidence: ['evidence'] }
    ]
    const readiness = buildPhaseOneCloseoutReadiness(areas)

    expect(() => assertPhaseOneCloseoutReadiness({ ...readiness, status: 'ready-for-closeout-review' }))
      .toThrow('Phase 1 closeout status does not match')
    expect(() => assertPhaseOneCloseoutReadiness({ ...readiness, completionPercentage: 100 }))
      .toThrow('Phase 1 closeout completion percentage does not match')
  })

  it('covers blocked, empty, malformed, and next-action normalization branches', () => {
    expect(normalizeCloseoutStatus()).toBe('blocked')
    expect(normalizeCloseoutArea({ key: ' carry ', status: 'carry_forward', evidence: 'not-an-array', nextAction: ' Fix it ' }))
      .toEqual({ key: 'carry', label: 'carry', status: 'carry-forward', evidence: [], nextAction: 'Fix it' })
    expect(buildPhaseOneCloseoutReadiness([])).toMatchObject({
      status: 'ready-for-closeout-review',
      completionPercentage: 0,
      areas: []
    })
    expect(buildPhaseOneCloseoutReadiness([
      { key: 'blocked', label: 'Blocked', status: 'blocked', evidence: ['evidence'] },
      { key: 'carry', label: 'Carry', status: 'carry-forward', evidence: ['evidence'] }
    ])).toMatchObject({ status: 'needs-attention', completionPercentage: 36 })

    expect(() => assertPhaseOneCloseoutReadiness({ closeoutGuardrail: 'wrong', areas: [{}] }))
      .toThrow('Phase 1 closeout guardrail is required')
    expect(() => assertPhaseOneCloseoutReadiness({ closeoutGuardrail: 'phase-one-closeout-readiness', areas: [] }))
      .toThrow('Phase 1 closeout areas are required')
    expect(() => assertPhaseOneCloseoutReadiness({
      closeoutGuardrail: 'phase-one-closeout-readiness',
      areas: [{ key: '', label: 'Missing key', status: 'complete', evidence: ['evidence'] }]
    })).toThrow('Phase 1 closeout area key is required')
    expect(() => assertPhaseOneCloseoutReadiness({
      closeoutGuardrail: 'phase-one-closeout-readiness',
      areas: [{ key: 'x', label: '', status: 'complete', evidence: ['evidence'] }]
    })).toThrow('Phase 1 closeout area label is required')
    expect(() => assertPhaseOneCloseoutReadiness({
      closeoutGuardrail: 'phase-one-closeout-readiness',
      areas: [{ key: 'x', label: 'X', status: 'unsupported', evidence: ['evidence'] }]
    })).toThrow('Unsupported Phase 1 closeout status')
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
