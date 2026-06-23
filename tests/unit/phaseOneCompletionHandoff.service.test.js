const {
  PHASE_ONE_COMPLETION_GUARDRAIL,
  PHASE_ONE_COMPLETION_AREAS,
  PHASE_ONE_PRODUCTIONIZATION_HANDOFF,
  normalizeCompletionStatus,
  normalizeCompletionArea,
  buildPhaseOneCompletionHandoff,
  assertPhaseOneCompletionHandoff,
  describePhaseOneCompletionHandoff
} = require('../../services/phaseOneCompletionHandoff.service')

describe('phaseOneCompletionHandoff service', () => {
  it('builds the final Phase 1 completion handoff from completed bridge evidence', () => {
    const handoff = buildPhaseOneCompletionHandoff()

    expect(handoff).toEqual(expect.objectContaining({
      phase: 'Phase 1 Data Architecture Hardening',
      guardrail: PHASE_ONE_COMPLETION_GUARDRAIL,
      status: 'complete',
      completionPercentage: 100
    }))
    expect(handoff.completeAreaKeys).toEqual(expect.arrayContaining([
      'durable-identity',
      'audit-history',
      'payload-contracts',
      'tenant-boundaries',
      'seed-data-decoupling',
      'date-time-normalization',
      'production-indexing',
      'closeout-readiness'
    ]))
    expect(handoff.needsAttentionAreaKeys).toEqual([])
  })

  it('keeps completion status normalization conservative', () => {
    expect(normalizeCompletionStatus(' COMPLETE ')).toBe('complete')
    expect(normalizeCompletionStatus('carry-forward')).toBe('needs-attention')
    expect(normalizeCompletionStatus()).toBe('needs-attention')
  })

  it('normalizes completion areas without losing closeout evidence', () => {
    expect(normalizeCompletionArea({
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

  it('asserts the final completion contract before Phase 1 is called closed', () => {
    const handoff = buildPhaseOneCompletionHandoff(PHASE_ONE_COMPLETION_AREAS, PHASE_ONE_PRODUCTIONIZATION_HANDOFF)
    expect(assertPhaseOneCompletionHandoff(handoff)).toBe(handoff)

    expect(() => assertPhaseOneCompletionHandoff({
      guardrail: PHASE_ONE_COMPLETION_GUARDRAIL,
      status: 'complete',
      completionPercentage: 99,
      areas: [{ key: 'date-time', label: 'Date Time', status: 'complete', evidence: ['bridge'] }],
      productionizationHandoff: [{ key: 'phase-2', label: 'Phase 2', phase: 'Phase 2', reason: 'Required' }]
    })).toThrow('100% complete')
  })

  it('describes the Phase 2 productionization handoff without reopening Phase 1 bridge slices', () => {
    expect(describePhaseOneCompletionHandoff()).toEqual({
      headline: 'Phase 1 Data Architecture Hardening is complete',
      completionPercentage: 100,
      status: 'complete',
      guardrail: PHASE_ONE_COMPLETION_GUARDRAIL,
      productionizationHandoffKeys: [
        'database-migrations',
        'production-authentication',
        'tenant-enforcement'
      ]
    })
  })
})
