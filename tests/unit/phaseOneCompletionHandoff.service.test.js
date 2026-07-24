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

  it('normalizes fallback labels, evidence, and productionization handoff fields', () => {
    const handoff = buildPhaseOneCompletionHandoff([
      { key: 'fallback-label', status: 'complete', evidence: 'not-an-array' },
      { key: 'needs-work', label: '', status: 'blocked', evidence: [' proof ', null, ''] }
    ], [
      { key: ' migration ', label: ' Migration ', phase: ' Phase 2 ', reason: ' Later ' },
      {}
    ])

    expect(handoff).toMatchObject({
      status: 'needs-attention',
      completionPercentage: 50,
      completeAreaKeys: ['fallback-label'],
      needsAttentionAreaKeys: ['needs-work']
    })
    expect(handoff.areas).toEqual([
      { key: 'fallback-label', label: 'fallback-label', status: 'complete', evidence: [] },
      { key: 'needs-work', label: 'needs-work', status: 'needs-attention', evidence: ['proof', 'null'] }
    ])
    expect(handoff.productionizationHandoff).toEqual([
      { key: 'migration', label: 'Migration', phase: 'Phase 2', reason: 'Later' },
      { key: '', label: '', phase: '', reason: '' }
    ])
    expect(buildPhaseOneCompletionHandoff([], []).completionPercentage).toBe(0)
  })

  it.each([
    [
      { guardrail: 'wrong', status: 'complete', completionPercentage: 100, areas: [{}], productionizationHandoff: [{}] },
      'guardrail is required'
    ],
    [
      { guardrail: PHASE_ONE_COMPLETION_GUARDRAIL, status: 'needs-attention', completionPercentage: 100, areas: [{}], productionizationHandoff: [{}] },
      'still has areas needing attention'
    ],
    [
      { guardrail: PHASE_ONE_COMPLETION_GUARDRAIL, status: 'complete', completionPercentage: 100, areas: [], productionizationHandoff: [{}] },
      'completion areas are required'
    ],
    [
      { guardrail: PHASE_ONE_COMPLETION_GUARDRAIL, status: 'complete', completionPercentage: 100, areas: [{ key: '', label: 'Missing key', status: 'complete', evidence: ['proof'] }], productionizationHandoff: [{}] },
      'area key is required'
    ],
    [
      { guardrail: PHASE_ONE_COMPLETION_GUARDRAIL, status: 'complete', completionPercentage: 100, areas: [{ key: 'area', label: '', status: 'complete', evidence: ['proof'] }], productionizationHandoff: [{}] },
      'area label is required for area'
    ],
    [
      { guardrail: PHASE_ONE_COMPLETION_GUARDRAIL, status: 'complete', completionPercentage: 100, areas: [{ key: 'area', label: 'Area', status: 'needs-attention', evidence: ['proof'] }], productionizationHandoff: [{}] },
      'area is not complete: area'
    ],
    [
      { guardrail: PHASE_ONE_COMPLETION_GUARDRAIL, status: 'complete', completionPercentage: 100, areas: [{ key: 'area', label: 'Area', status: 'complete', evidence: [] }], productionizationHandoff: [{}] },
      'completion evidence is required for area'
    ],
    [
      { guardrail: PHASE_ONE_COMPLETION_GUARDRAIL, status: 'complete', completionPercentage: 100, areas: [{ key: 'area', label: 'Area', status: 'complete', evidence: ['proof'] }], productionizationHandoff: [] },
      'productionization handoff items are required'
    ]
  ])('rejects incomplete Phase 1 handoff contracts', (handoff, message) => {
    expect(() => assertPhaseOneCompletionHandoff(handoff)).toThrow(message)
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
