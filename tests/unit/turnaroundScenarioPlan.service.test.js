const {
  buildTurnaroundScenarioPlan,
  buildStressCases,
  buildContingencyActions,
  buildDrillRunbook
} = require('../../services/turnaroundScenarioPlan.service')

describe('turnaroundScenarioPlan service', () => {
  const operation = {
    id: 'turnaround-1',
    shipName: 'Wonder of the Seas',
    cruiseLineName: 'Royal Caribbean International',
    portName: 'Port Canaveral'
  }

  it('builds stress cases, triggers, contingencies, and a reviewer-safe drill runbook', () => {
    const plan = buildTurnaroundScenarioPlan({
      operation,
      releasePacket: { releaseScore: 92, status: 'READY', blockers: [] },
      operationalMetrics: { summary: { releaseConfidence: 91, staffingCoverage: 88, taskCompletion: 90, blockerCount: 0 } },
      playbookVariance: { summary: { rehearsalScore: 86 } },
      incidentCommand: { incidentScore: 18, incidentSeverity: 'LOW' },
      afterActionReview: { summary: { reviewScore: 89 } },
      launchPlan: {
        launchScore: 90,
        launchStatus: 'READY_FOR_REVIEWER_DEMO',
        demoRunbook: [{ id: 'admin-data-proof', label: 'Admin data proof' }],
        launchRisks: []
      },
      managementStatus: { maturityStatus: 'FLAGSHIP_READY', remainingWork: [] }
    })

    expect(plan.resilienceScore).toBeGreaterThanOrEqual(80)
    expect(plan.scenarioStatus).toMatch(/DRILL_READY|WATCH_ITEMS_PRESENT/)
    expect(plan.stressCases.map(stressCase => stressCase.id)).toEqual(expect.arrayContaining([
      'late-cabin-release',
      'staffing-shortfall',
      'technical-blocker',
      'playbook-drift',
      'reviewer-demo-disruption'
    ]))
    expect(plan.triggerMatrix).toHaveLength(plan.stressCases.length)
    expect(plan.contingencyActions.length).toBeGreaterThanOrEqual(1)
    expect(plan.drillRunbook.map(step => step.id)).toEqual(expect.arrayContaining([
      'drill-open-command-center',
      'drill-apply-scenario',
      'drill-close-loop',
      'drill-return-to-demo-runbook'
    ]))
    expect(plan.evidence).toMatchObject({
      releaseStatus: 'READY',
      incidentSeverity: 'LOW',
      launchStatus: 'READY FOR REVIEWER DEMO',
      managementStatus: 'FLAGSHIP READY'
    })
  })

  it('raises contingency review when staffing, incident, and playbook evidence are weak', () => {
    const stressCases = buildStressCases({
      operation,
      releasePacket: { releaseScore: 58, blockers: [{ id: 'blocker-1' }, { id: 'blocker-2' }] },
      operationalMetrics: { summary: { staffingCoverage: 61, taskCompletion: 62 } },
      incidentCommand: { incidentScore: 72, incidentSeverity: 'HIGH' },
      playbookVariance: { summary: { rehearsalScore: 55 } },
      launchPlan: { launchScore: 60 },
      afterActionReview: { summary: { reviewScore: 62 } }
    })
    const actions = buildContingencyActions({
      stressCases,
      launchPlan: { launchRisks: [{ mitigation: 'Brief reviewer on active watch items.' }] },
      managementStatus: { remainingWork: [{ label: 'Normalize assignments', detail: 'Remove remaining display-name ownership bridges.' }] }
    })

    expect(stressCases.some(stressCase => stressCase.status === 'ACTION_REQUIRED')).toBe(true)
    expect(actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ priority: 'P1', label: expect.stringContaining('contingency') }),
      expect.objectContaining({ id: 'action-launch-risk-briefing' }),
      expect.objectContaining({ id: 'action-management-follow-through' })
    ]))
  })

  it('keeps the drill runbook focused even when launch-plan data is unavailable', () => {
    const runbook = buildDrillRunbook({
      operation,
      stressCases: [{ id: 'technical-blocker', label: 'Technical blocker before release', status: 'WATCH', owner: 'Engineering Lead' }]
    })

    expect(runbook.map(step => step.id)).toEqual(expect.arrayContaining([
      'drill-open-command-center',
      'drill-apply-scenario',
      'drill-check-role-leads',
      'drill-close-loop'
    ]))
    expect(runbook).toHaveLength(4)
  })
})
