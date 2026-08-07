const {
  buildTurnaroundOperationalReleaseDossier,
  buildReleaseDossierInputs,
  buildEvidenceSections,
  buildReleaseChecklist
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
})
