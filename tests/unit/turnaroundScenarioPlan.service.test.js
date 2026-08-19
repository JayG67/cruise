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

  it('builds stress cases, triggers, contingencies, and an operational resilience runbook', () => {
    const plan = buildTurnaroundScenarioPlan({
      operation,
      releasePacket: { releaseScore: 92, status: 'READY', blockers: [] },
      operationalMetrics: { summary: { releaseConfidence: 91, staffingCoverage: 88, taskCompletion: 90, blockerCount: 0 } },
      playbookVariance: { summary: { rehearsalScore: 86 } },
      incidentCommand: { incidentScore: 18, incidentSeverity: 'LOW' },
      afterActionReview: { summary: { reviewScore: 89 } },
      launchPlan: {
        launchScore: 90,
        launchStatus: 'OPERATIONALLY_READY',
        demoRunbook: [{ id: 'admin-data-proof', label: 'Admin data proof' }],
        launchRisks: []
      },
      managementStatus: { maturityStatus: 'OPERATIONALLY_MATURE', remainingWork: [] }
    })

    expect(plan.resilienceScore).toBeGreaterThanOrEqual(80)
    expect(plan.scenarioStatus).toMatch(/DRILL_READY|WATCH_ITEMS_PRESENT/)
    expect(plan.stressCases.map(stressCase => stressCase.id)).toEqual(expect.arrayContaining([
      'late-cabin-release',
      'staffing-shortfall',
      'technical-blocker',
      'playbook-drift',
      'unplanned-evidence-request'
    ]))
    expect(plan.triggerMatrix).toHaveLength(plan.stressCases.length)
    expect(plan.contingencyActions.length).toBeGreaterThanOrEqual(1)
    expect(plan.headline).not.toMatch(/reviewer|demo/i)
    expect(plan.summary).not.toMatch(/reviewer|demo/i)
    expect(plan.drillRunbook.map(step => step.id)).toEqual(expect.arrayContaining([
      'drill-open-command-center',
      'drill-apply-scenario',
      'drill-close-loop',
      'drill-return-to-release-runbook'
    ]))
    expect(plan.evidence).toMatchObject({
      releaseStatus: 'READY',
      incidentSeverity: 'LOW',
      launchStatus: 'OPERATIONALLY READY',
      managementStatus: 'OPERATIONALLY MATURE'
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
      launchPlan: { launchRisks: [{ mitigation: 'Brief operational leaders on active watch items.' }] },
      managementStatus: { remainingWork: [{ label: 'Normalize assignments', detail: 'Remove remaining display-name ownership bridges.' }] }
    })

    expect(stressCases.some(stressCase => stressCase.status === 'ACTION_REQUIRED')).toBe(true)
    expect(actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ priority: 'P1', label: expect.stringContaining('contingency') }),
      expect.objectContaining({ id: 'action-launch-risk-briefing' }),
      expect.objectContaining({ id: 'action-management-follow-through' })
    ]))
  })


  it('preserves authoritative zero evidence instead of substituting healthier fallbacks', () => {
    const stressCases = buildStressCases({
      operation,
      releasePacket: { releaseScore: 0, blockers: [] },
      operationalMetrics: { summary: { releaseConfidence: 92, staffingCoverage: 90, taskCompletion: 88, blockerCount: 4 } },
      launchPlan: { launchScore: 0 },
      afterActionReview: { summary: { reviewScore: 0 } },
      playbookVariance: { summary: { rehearsalScore: 90 } }
    })

    expect(stressCases.find(item => item.id === 'late-cabin-release')).toEqual(expect.objectContaining({
      resilienceScore: 0,
      severity: 'MEDIUM',
      status: 'ACTION_REQUIRED'
    }))
    expect(stressCases.find(item => item.id === 'unplanned-evidence-request')).toEqual(expect.objectContaining({
      resilienceScore: 0,
      status: 'ACTION_REQUIRED'
    }))
  })

  it('uses fallback evidence only when authoritative scenario values are absent', () => {
    const stressCases = buildStressCases({
      operation,
      releasePacket: {},
      operationalMetrics: { summary: { releaseConfidence: 91, staffingCoverage: 88, taskCompletion: 90, blockerCount: 2 } },
      launchPlan: {},
      afterActionReview: { summary: {} },
      playbookVariance: { summary: { rehearsalScore: 86 } }
    })

    expect(stressCases.find(item => item.id === 'late-cabin-release')).toEqual(expect.objectContaining({
      severity: 'HIGH',
      resilienceScore: 82
    }))
    expect(stressCases.find(item => item.id === 'unplanned-evidence-request')).toEqual(expect.objectContaining({
      resilienceScore: 75
    }))
  })

  it('degrades safely when scenario operation input is explicitly null', () => {
    const plan = buildTurnaroundScenarioPlan({ operation: null })
    const runbook = buildDrillRunbook({ operation: null, stressCases: [] })

    expect(plan.summary).toContain('the selected ship')
    expect(plan.stressCases).toHaveLength(5)
    expect(runbook[0].detail).toContain('selected ship')
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

describe('turnaroundScenarioPlan numeric evidence hardening', () => {
  it('fails non-finite scores and counts safe instead of promoting them to perfect resilience', () => {
    const stressCases = buildStressCases({
      operation: { shipName: 'Test ship' },
      releasePacket: { releaseScore: Infinity, blockers: { length: Infinity } },
      operationalMetrics: { summary: { staffingCoverage: Infinity, taskCompletion: 'bad', blockerCount: Infinity } },
      incidentCommand: { incidentScore: Infinity },
      playbookVariance: { summary: { rehearsalScore: Infinity } },
      afterActionReview: { summary: { reviewScore: Infinity } },
      launchPlan: { launchScore: Infinity }
    })

    expect(stressCases.map(item => item.resilienceScore).every(Number.isFinite)).toBe(true)
    expect(stressCases.find(item => item.id === 'technical-blocker')).toEqual(expect.objectContaining({ resilienceScore: 100 }))
    expect(stressCases.find(item => item.id === 'staffing-shortfall')).toEqual(expect.objectContaining({ resilienceScore: 0, status: 'ACTION_REQUIRED' }))
    expect(stressCases.find(item => item.id === 'playbook-drift')).toEqual(expect.objectContaining({ resilienceScore: 0, status: 'ACTION_REQUIRED' }))
  })

  it('uses the governance fallback contingency when every stress case is ready and no external actions exist', () => {
    const actions = buildContingencyActions({ stressCases: [
      { id: 'ready-1', status: 'READY', severity: 'LOW', label: 'Ready one', response: 'None', owner: 'Lead' },
      { id: 'ready-2', status: 'READY', severity: 'LOW', label: 'Ready two', response: 'None', owner: 'Lead' }
    ] })

    expect(actions).toEqual([
      expect.objectContaining({ id: 'action-keep-governance-evidence-current', priority: 'P3' })
    ])
  })
})

describe('turnaroundScenarioPlan malformed collection evidence', () => {
  it('ignores non-array launch risks, remaining work, and demo runbook collections', () => {
    const actions = buildContingencyActions({
      stressCases: [{ id: 'ready', status: 'READY', severity: 'LOW', label: 'Ready', response: 'None', owner: 'Lead' }],
      launchPlan: { launchRisks: 'not-an-array' },
      managementStatus: { remainingWork: { detail: 'not-an-array' } }
    })
    const runbook = buildDrillRunbook({
      operation: { shipName: 'Explorer' },
      stressCases: [{ id: 'ready', label: 'Ready', status: 'READY' }],
      launchPlan: { demoRunbook: 'not-an-array' }
    })

    expect(actions).toEqual([expect.objectContaining({ id: 'action-keep-governance-evidence-current' })])
    expect(runbook.some(step => step.id === 'drill-return-to-release-runbook')).toBe(false)
    expect(JSON.stringify({ actions, runbook })).not.toContain('undefined')
  })

  it('uses deterministic fallback copy for malformed first collection entries', () => {
    const actions = buildContingencyActions({
      stressCases: [{ id: 'ready', status: 'READY', severity: 'LOW', label: 'Ready', response: 'None', owner: 'Lead' }],
      launchPlan: { launchRisks: [null] },
      managementStatus: { remainingWork: [null] }
    })
    const runbook = buildDrillRunbook({
      operation: { shipName: 'Explorer' },
      stressCases: [{ id: 'ready', label: 'Ready', status: 'READY' }],
      launchPlan: { demoRunbook: [null] }
    })

    expect(actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'action-launch-risk-briefing', detail: 'Review the highest-priority launch risk.' }),
      expect.objectContaining({ id: 'action-management-follow-through', detail: 'Complete the highest-priority management assurance item.' })
    ]))
    expect(runbook.find(step => step.id === 'drill-return-to-release-runbook').detail).toContain('the next release step')
  })
})
