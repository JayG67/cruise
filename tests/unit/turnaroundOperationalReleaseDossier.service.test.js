const {
  buildTurnaroundOperationalReleaseDossier,
  buildReleaseDossierInputs,
  buildEvidenceSections,
  buildOperationalNarrative,
  buildReleaseChecklist,
  buildNextReleaseSteps
} = require('../../services/turnaroundOperationalReleaseDossier.service')

const baseInput = {
  operation: {
    id: 42,
    shipName: 'Proof of Concept',
    cruiseLineName: 'Gallagher Cruise Labs',
    turnaroundDate: '2026-07-04'
  },
  tasks: [
    { status: 'COMPLETED' },
    { status: 'COMPLETED' },
    { status: 'COMPLETED' }
  ],
  signoffs: [
    { status: 'APPROVED' },
    { status: 'APPROVED' }
  ],
  staffing: [{ requiredCount: 4, assignedCount: 4 }],
  escalations: [{ status: 'RESOLVED' }],
  dependencies: [{ status: 'CLEARED' }],
  handoffs: [{ status: 'COMPLETE' }],
  auditEvents: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }, { id: 11 }],
  releasePacket: { releaseScore: 94, releaseStatus: 'READY' },
  operationalMetrics: { summary: { releaseConfidence: 92 } },
  playbookVariance: { varianceScore: 4 },
  incidentCommand: { incidentScore: 4 },
  afterActionReview: { summary: { reviewScore: 91 } },
  executiveBrief: { summary: { decisionScore: 94 } },
  operationalAssurancePacket: { readiness: { readinessScore: 95 } },
  operationalBriefingBoard: { readiness: { readinessScore: 93 } },
  managementStatus: { maturityScore: 91, maturityStatus: 'READY' },
  launchPlan: { launchScore: 92, launchStatus: 'READY' },
  scenarioPlan: { resilienceScore: 90, scenarioStatus: 'READY' },
  productionReadiness: { productionScore: 93, productionStatus: 'PRODUCTION_READY' }
}

describe('turnaround operational release dossier service', () => {
  it('builds operational release dossier evidence from production readiness inputs', () => {
    const dossier = buildTurnaroundOperationalReleaseDossier(baseInput)

    expect(dossier.dossierScore).toBeGreaterThanOrEqual(90)
    expect(dossier.dossierStatus).toBe('RELEASE_READY')
    expect(dossier.summary).toContain('Gallagher Cruise Labs')
    expect(dossier.operationalNarrative.headline).toContain('operational release dossier')
    expect(dossier.evidenceSections.map(section => section.id)).toEqual([
      'production-readiness-proof',
      'workflow-proof',
      'leadership-assurance-proof',
      'resilience-proof',
      'audit-proof'
    ])
    expect(dossier.checklist.every(item => item.complete)).toBe(true)
    expect(dossier.nextReleaseSteps.map(step => step.id)).toContain('expand-cypress-lifecycle')
  })

  it('surfaces watch items when operational proof is not complete', () => {
    const dossier = buildTurnaroundOperationalReleaseDossier({
      ...baseInput,
      tasks: [{ status: 'BLOCKED' }],
      signoffs: [{ status: 'PENDING' }],
      escalations: [{ status: 'OPEN' }],
      dependencies: [{ status: 'BLOCKED' }],
      handoffs: [{ status: 'PENDING' }],
      staffing: [{ requiredCount: 6, assignedCount: 3 }],
      productionReadiness: { productionScore: 72, productionStatus: 'NEEDS_HARDENING' }
    })

    expect(dossier.dossierStatus).toBe('NEEDS_RELEASE_HARDENING')
    expect(dossier.checklist.filter(item => !item.complete).length).toBeGreaterThan(0)
    expect(dossier.nextAction).toContain('Close release watch items')
    expect(dossier.nextReleaseSteps.find(step => step.id === 'close-release-watch-items').priority).toBe('HIGH')
  })

  it('normalizes raw inputs into dossier proof metrics', () => {
    const inputs = buildReleaseDossierInputs(baseInput)
    const sections = buildEvidenceSections(inputs)
    const checklist = buildReleaseChecklist(inputs)

    expect(inputs.taskCompletion).toBe(100)
    expect(inputs.signoffCompletion).toBe(100)
    expect(sections.find(section => section.id === 'workflow-proof').readiness).toBe('READY')
    expect(checklist.find(item => item.id === 'testing-proof').status).toBe('READY')
  })

  it('does not discard legitimate zero evidence when averaging readiness scores', () => {
    const sections = buildEvidenceSections({
      productionScore: 0,
      productionStatus: 'NEEDS HARDENING',
      taskCompletion: 0,
      signoffCompletion: 0,
      releaseScore: 90,
      completedTasks: 0,
      totalTasks: 2,
      executiveScore: 0,
      assuranceScore: 90,
      briefingScore: 90,
      launchScore: 0,
      scenarioScore: 0,
      managementScore: 100,
      varianceScore: 100,
      auditEventCount: 0,
      openEscalations: 0,
      shipName: 'Zero Evidence',
      cruiseLineName: 'Coverage Line',
      launchStatus: 'REVIEW',
      scenarioStatus: 'REVIEW'
    })

    expect(sections.find(section => section.id === 'workflow-proof').score).toBe(30)
    expect(sections.find(section => section.id === 'leadership-assurance-proof').score).toBe(60)
    expect(sections.find(section => section.id === 'resilience-proof').score).toBe(50)
  })

  it('preserves an authoritative zero release score instead of falling back to metrics confidence', () => {
    const inputs = buildReleaseDossierInputs({
      releasePacket: { releaseScore: 0 },
      operationalMetrics: { summary: { releaseConfidence: 96 } }
    })

    expect(inputs.releaseScore).toBe(0)
  })

  it('falls back to metrics confidence only when the release packet score is absent', () => {
    const inputs = buildReleaseDossierInputs({
      releasePacket: {},
      operationalMetrics: { summary: { releaseConfidence: 87 } }
    })

    expect(inputs.releaseScore).toBe(87)
  })

  it('normalizes null operation and collection inputs without inflating readiness', () => {
    const dossier = buildTurnaroundOperationalReleaseDossier({
      operation: null,
      tasks: null,
      staffing: null,
      signoffs: null,
      escalations: null,
      dependencies: null,
      handoffs: null,
      auditEvents: null
    })

    expect(dossier.evidence).toEqual(expect.objectContaining({
      operationId: undefined,
      shipName: 'Selected ship',
      cruiseLineName: 'Selected cruise line',
      taskCompletion: 0,
      signoffCompletion: 0,
      auditEventCount: 0
    }))
    expect(dossier.dossierScore).toBeLessThan(50)
    expect(dossier.dossierStatus).toBe('NEEDS_RELEASE_HARDENING')
  })

  it('clamps out-of-range scores while retaining zeros as evidence', () => {
    const inputs = buildReleaseDossierInputs({
      productionReadiness: { productionScore: 140 },
      releasePacket: { releaseScore: -25 },
      executiveBrief: { summary: { decisionScore: 101 } },
      playbookVariance: { varianceScore: 130 }
    })

    expect(inputs.productionScore).toBe(100)
    expect(inputs.releaseScore).toBe(0)
    expect(inputs.executiveScore).toBe(100)
    expect(inputs.varianceScore).toBe(0)
  })


  it('uses the intermediate dossier status when evidence is watch-level but checklist gates are complete', () => {
    const dossier = buildTurnaroundOperationalReleaseDossier({
      ...baseInput,
      releasePacket: { releaseScore: 80, releaseStatus: 'WATCH' },
      executiveBrief: { summary: { decisionScore: 80 } },
      operationalAssurancePacket: { readiness: { readinessScore: 80 } },
      operationalBriefingBoard: { readiness: { readinessScore: 80 } },
      managementStatus: { maturityScore: 80, maturityStatus: 'WATCH' },
      launchPlan: { launchScore: 80, launchStatus: 'WATCH' },
      scenarioPlan: { resilienceScore: 80, scenarioStatus: 'WATCH' },
      productionReadiness: { productionScore: 80, productionStatus: 'WATCH' },
      afterActionReview: { summary: { reviewScore: 80 } }
    })

    expect(dossier.dossierScore).toBeGreaterThanOrEqual(78)
    expect(dossier.dossierScore).toBeLessThan(90)
    expect(dossier.checklist.every(item => item.complete)).toBe(true)
    expect(dossier.dossierStatus).toBe('READY_WITH_WATCH_ITEMS')
  })

  it('provides stable narrative and next-step fallbacks when evidence sections are absent', () => {
    const narrative = buildOperationalNarrative({
      cruiseLineName: 'Fallback Line',
      shipName: 'Fallback Ship',
      turnaroundDate: '2026-08-14'
    }, [])
    const nextSteps = buildNextReleaseSteps({ shipName: 'Fallback Ship' }, [], [])

    expect(narrative.strongestProof).toContain('No strongest proof')
    expect(narrative.weakestProof).toContain('No weak proof')
    expect(nextSteps.find(step => step.id === 'close-release-watch-items')).toEqual(expect.objectContaining({
      priority: 'LOW'
    }))
    expect(nextSteps.find(step => step.id === 'strengthen-weakest-evidence').detail).toContain('No weak evidence')
  })
})
