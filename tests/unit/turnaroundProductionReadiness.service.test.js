const {
  buildTurnaroundProductionReadiness,
  buildReadinessInputs,
  buildProductionGates,
  buildProductionBlockers,
  buildProductionTestingContract
} = require('../../services/turnaroundProductionReadiness.service')

describe('turnaroundProductionReadiness service', () => {
  const operation = {
    id: 'turnaround-1',
    shipName: 'Wonder of the Seas',
    cruiseLineName: 'Royal Caribbean International',
    turnaroundDate: '2026-07-14'
  }

  it('builds a production readiness cockpit from release, launch, scenario, management, and workflow evidence', () => {
    const cockpit = buildTurnaroundProductionReadiness({
      operation,
      tasks: [
        { id: 'task-1', status: 'COMPLETED' },
        { id: 'task-2', status: 'COMPLETED' },
        { id: 'task-3', status: 'IN_PROGRESS' }
      ],
      staffing: [{ id: 'staffing-1', requiredCount: 4, assignedCount: 4 }],
      signoffs: [{ id: 'signoff-1', status: 'APPROVED' }, { id: 'signoff-2', status: 'APPROVED' }],
      escalations: [],
      dependencies: [{ id: 'dependency-1', status: 'CLEARED' }],
      handoffs: [{ id: 'handoff-1', status: 'COMPLETE' }],
      releasePacket: { releaseScore: 92, releaseStatus: 'READY' },
      operationalMetrics: { summary: { releaseConfidence: 91 } },
      playbookVariance: { varianceScore: 8 },
      incidentCommand: { incidentScore: 10, incidentSeverity: 'LOW' },
      afterActionReview: { summary: { reviewScore: 88 } },
      executiveBrief: { summary: { releaseConfidence: 91, incidentScore: 10 } },
      reviewerPacket: { readiness: { readinessScore: 90 } },
      outreachBoard: { readiness: { readinessScore: 86 } },
      managementStatus: { maturityScore: 88, maturityStatus: 'FLAGSHIP_READY' },
      launchPlan: { launchScore: 90, launchStatus: 'READY_FOR_REVIEWER_DEMO' },
      scenarioPlan: { resilienceScore: 86, scenarioStatus: 'DRILL_READY' }
    })

    expect(cockpit.productionScore).toBeGreaterThanOrEqual(80)
    expect(cockpit.productionStatus).toMatch(/PRODUCTION_DEMO_READY|READY_WITH_WATCH_ITEMS/)
    expect(cockpit.gates.map(gate => gate.id)).toEqual(expect.arrayContaining([
      'release-certification',
      'workflow-completion',
      'department-signoff',
      'incident-control',
      'launch-plan',
      'scenario-resilience',
      'management-maturity',
      'reviewer-package'
    ]))
    expect(cockpit.runbook.map(step => step.id)).toEqual(expect.arrayContaining([
      'reset-baseline',
      'prove-admin-crud',
      'prove-passenger-path',
      'prove-command-path',
      'prove-lead-paths',
      'prove-reviewer-path'
    ]))
    expect(cockpit.testingContract.map(item => item.layer)).toEqual(expect.arrayContaining(['Cypress', 'Playwright', 'Jest integration']))
  })

  it('surfaces blockers instead of hiding weak production-demo evidence', () => {
    const inputs = buildReadinessInputs({
      operation,
      tasks: [{ id: 'task-1', status: 'BLOCKED' }],
      staffing: [{ id: 'staffing-1', requiredCount: 5, assignedCount: 3 }],
      signoffs: [{ id: 'signoff-1', status: 'PENDING' }],
      escalations: [{ id: 'escalation-1', status: 'OPEN' }],
      dependencies: [{ id: 'dependency-1', status: 'WAITING' }],
      handoffs: [{ id: 'handoff-1', status: 'PENDING' }],
      releasePacket: { releaseScore: 55, releaseStatus: 'NOT_READY' },
      incidentCommand: { incidentScore: 72, incidentSeverity: 'HIGH' },
      launchPlan: { launchScore: 60, launchStatus: 'NEEDS_REVIEW' },
      scenarioPlan: { resilienceScore: 62, scenarioStatus: 'NEEDS_CONTINGENCY_REVIEW' },
      managementStatus: { maturityScore: 64, maturityStatus: 'HARDENING_IN_PROGRESS' }
    })
    const gates = buildProductionGates(inputs)
    const blockers = buildProductionBlockers(inputs)

    expect(gates.some(gate => gate.status === 'BLOCKED')).toBe(true)
    expect(blockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'blocked-tasks', severity: 'HIGH' }),
      expect.objectContaining({ id: 'open-escalations', severity: 'HIGH' }),
      expect.objectContaining({ id: 'staffing-gaps' }),
      expect.objectContaining({ id: 'launch-plan-watch' }),
      expect.objectContaining({ id: 'scenario-watch' })
    ]))
  })

  it('keeps Playwright responsible for responsive stability instead of deep workflow ownership', () => {
    const contract = buildProductionTestingContract({ cruiseLineName: 'Royal Caribbean International' })

    expect(contract.find(item => item.id === 'cypress-long-workflow')).toMatchObject({
      layer: 'Cypress',
      status: 'PRIMARY'
    })
    expect(contract.filter(item => item.layer === 'Playwright').map(item => item.status)).toEqual(expect.arrayContaining([
      'STABILITY_GUARD',
      'RESPONSIVE_GUARD'
    ]))
  })
})
