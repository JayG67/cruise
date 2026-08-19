const {
  buildTurnaroundProductionReadiness,
  buildReadinessInputs,
  buildProductionGates,
  buildProductionBlockers,
  buildProductionRunbook,
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
    expect(cockpit.productionStatus).toMatch(/OPERATIONALLY_READY|READY_WITH_WATCH_ITEMS/)
    expect(cockpit.gates.map(gate => gate.id)).toEqual(expect.arrayContaining([
      'release-certification',
      'workflow-completion',
      'department-signoff',
      'incident-control',
      'launch-plan',
      'scenario-resilience',
      'management-maturity',
      'governance-evidence'
    ]))
    expect(cockpit.runbook.map(step => step.id)).toEqual(expect.arrayContaining([
      'reset-baseline',
      'prove-admin-crud',
      'prove-passenger-path',
      'prove-command-path',
      'prove-lead-paths',
      'confirm-governance-path'
    ]))
    expect(cockpit.testingContract.map(item => item.layer)).toEqual(expect.arrayContaining(['Cypress', 'Playwright', 'Jest integration']))
  })

  it('surfaces blockers instead of hiding weak operational-release evidence', () => {
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

  it('preserves authoritative zero readiness evidence instead of replacing it with healthier fallbacks', () => {
    const inputs = buildReadinessInputs({
      operation,
      releasePacket: { releaseScore: 0 },
      operationalMetrics: { summary: { releaseConfidence: 94 } },
      executiveBrief: { summary: { releaseConfidence: 91, incidentScore: 65 } },
      incidentCommand: { incidentScore: 0 },
      launchPlan: { launchScore: 0 },
      scenarioPlan: { resilienceScore: 0 },
      managementStatus: { maturityScore: 0 },
      reviewerPacket: { readiness: { readinessScore: 0 } },
      outreachBoard: { readiness: { readinessScore: 0 } },
      afterActionReview: { summary: { reviewScore: 0 } },
      playbookVariance: { varianceScore: 100 }
    })

    expect(inputs).toMatchObject({
      releaseScore: 0,
      incidentScore: 0,
      launchScore: 0,
      scenarioScore: 0,
      managementScore: 0,
      reviewerScore: 0,
      outreachScore: 0,
      afterActionScore: 0,
      varianceScore: 0
    })
    expect(buildTurnaroundProductionReadiness({
      operation,
      releasePacket: { releaseScore: 0 },
      operationalMetrics: { summary: { releaseConfidence: 94 } },
      incidentCommand: { incidentScore: 0 },
      launchPlan: { launchScore: 0 },
      scenarioPlan: { resilienceScore: 0 }
    }).productionStatus).toBe('ACTION_REQUIRED')
  })

  it('falls back only when readiness evidence is absent and tolerates null operation context', () => {
    const inputs = buildReadinessInputs({
      operation: null,
      operationalMetrics: { summary: { releaseConfidence: 83 } },
      executiveBrief: { summary: { releaseConfidence: 91, incidentScore: 23 } },
      incidentCommand: {},
      tasks: null,
      staffing: null,
      signoffs: null,
      escalations: null,
      dependencies: null,
      handoffs: null
    })

    expect(inputs).toMatchObject({
      operationId: undefined,
      shipName: 'Selected ship',
      cruiseLineName: 'Selected cruise line',
      turnaroundDate: 'Selected turnaround',
      releaseScore: 83,
      incidentScore: 23,
      taskCompletion: 0,
      signoffCompletion: 0
    })
    expect(() => buildTurnaroundProductionReadiness({ operation: null })).not.toThrow()
  })

  it('covers production gate boundaries and the no-blocker operationally-ready path', () => {
    const watchGates = buildProductionGates({
      releaseScore: 78,
      releaseStatus: 'WATCH',
      blockedTasks: 0,
      taskCompletion: 90,
      completedTasks: 9,
      totalTasks: 10,
      signoffCompletion: 77,
      incidentScore: 10,
      incidentSeverity: 'LOW',
      launchScore: 100,
      launchStatus: 'READY',
      scenarioScore: 100,
      scenarioStatus: 'READY',
      managementScore: 100,
      managementStatus: 'READY',
      reviewerScore: 100,
      outreachScore: 100
    })

    expect(watchGates.find(gate => gate.id === 'release-certification').status).toBe('WATCH')
    expect(watchGates.find(gate => gate.id === 'workflow-completion').status).toBe('READY')
    expect(watchGates.find(gate => gate.id === 'department-signoff').status).toBe('BLOCKED')

    const cockpit = buildTurnaroundProductionReadiness({
      operation,
      tasks: [{ status: 'COMPLETED' }],
      signoffs: [{ status: 'APPROVED' }],
      releasePacket: { releaseScore: 100, releaseStatus: 'READY' },
      incidentCommand: { incidentScore: 0, incidentSeverity: 'STABLE' },
      reviewerPacket: { readiness: { readinessScore: 100 } },
      outreachBoard: { readiness: { readinessScore: 100 } },
      managementStatus: { maturityScore: 100, maturityStatus: 'READY' },
      launchPlan: { launchScore: 100, launchStatus: 'READY' },
      scenarioPlan: { resilienceScore: 100, scenarioStatus: 'READY' }
    })

    expect(cockpit.productionStatus).toBe('OPERATIONALLY_READY')
    expect(cockpit.blockers).toEqual([expect.objectContaining({ id: 'no-critical-blockers', severity: 'INFO' })])
    expect(cockpit.nextAction).toContain('operational governance review')
  })

  it('keeps a high-scoring cockpit in watch state when a high-severity blocker remains', () => {
    const tasks = Array.from({ length: 20 }, (_, index) => ({
      status: index === 0 ? 'AT_RISK' : 'COMPLETED'
    }))
    const cockpit = buildTurnaroundProductionReadiness({
      operation,
      tasks,
      signoffs: [{ status: 'APPROVED' }],
      releasePacket: { releaseScore: 100, releaseStatus: 'READY' },
      incidentCommand: { incidentScore: 0 },
      reviewerPacket: { readiness: { readinessScore: 100 } },
      outreachBoard: { readiness: { readinessScore: 100 } },
      managementStatus: { maturityScore: 100 },
      launchPlan: { launchScore: 100 },
      scenarioPlan: { resilienceScore: 100 }
    })

    expect(cockpit.productionScore).toBeGreaterThanOrEqual(90)
    expect(cockpit.blockers).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'blocked-tasks', severity: 'HIGH' })]))
    expect(cockpit.productionStatus).toBe('READY_WITH_WATCH_ITEMS')
  })

  it('keeps runbook fallbacks deterministic when gate and blocker evidence is empty', () => {
    const runbook = buildProductionRunbook({ shipName: 'Selected ship' }, [], [])

    expect(runbook.find(step => step.id === 'handle-weakest-gate')).toMatchObject({
      owner: 'Turnaround Manager',
      detail: 'Confirm no weak gate is hidden.'
    })
    expect(runbook.find(step => step.id === 'handle-first-blocker')).toMatchObject({
      owner: 'Turnaround Manager',
      detail: 'Confirm no critical blocker is omitted from the release decision.'
    })
  })

})
