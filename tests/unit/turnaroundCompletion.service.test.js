const {
  buildTurnaroundManagementStatus,
  buildTurnaroundCapabilityMap,
  buildTurnaroundRemainingWork,
  buildTurnaroundNextSlices
} = require('../../services/turnaroundCompletion.service')

describe('turnaroundCompletion service', () => {
  const operation = {
    id: 'turnaround-1',
    shipName: 'Wonder of the Seas',
    cruiseLineName: 'Royal Caribbean International'
  }

  const tasks = [
    { status: 'COMPLETE' },
    { status: 'DONE' },
    { status: 'BLOCKED', blocker: 'Awaiting gangway clearance' }
  ]
  const staffing = [{ assignedCount: 8, requiredCount: 8 }]
  const signoffs = [{ status: 'APPROVED' }, { status: 'PENDING' }]
  const dependencies = [{ status: 'COMPLETE' }, { status: 'OPEN' }]
  const handoffs = [{ status: 'COMPLETE' }]
  const auditEvents = [{ id: 'audit-1' }, { id: 'audit-2' }]

  it('builds a continuation-ready management status summary from turnaround evidence', () => {
    const status = buildTurnaroundManagementStatus({
      operation,
      tasks,
      staffing,
      signoffs,
      dependencies,
      handoffs,
      auditEvents,
      releasePacket: { releaseScore: 86 },
      operationalTimeline: { summary: { totalEvents: 14 } },
      operationalMetrics: { summary: { releaseConfidence: 88, staffingCoverage: 100 } },
      playbookTemplate: { readinessScore: 82 },
      playbookVariance: { summary: { rehearsalScore: 84 } },
      incidentCommand: { incidentScore: 28, incidentSeverity: 'LOW' },
      afterActionReview: { summary: { reviewScore: 80 } },
      executiveBrief: { summary: { decisionScore: 87, releaseConfidence: 88, incidentScore: 28, reviewScore: 80 } },
      reviewerPacket: { readiness: { readinessScore: 86 }, dataQuality: { blockerCount: 1 } },
      outreachBoard: { readiness: { readinessScore: 84, dataQualityRisk: 1 } }
    })

    expect(status.maturityScore).toBeGreaterThanOrEqual(70)
    expect(status.completionLabel).toContain('turnaround management completion')
    expect(status.capabilities.map(capability => capability.id)).toEqual(expect.arrayContaining([
      'role-scoped-command',
      'workflow-crud',
      'release-readiness',
      'audit-timeline',
      'playbook-rehearsal',
      'incident-after-action',
      'governance-communications'
    ]))
    expect(status.continuationSummary.currentState).toContain('role-scoped operations')
    expect(status.nextSlices).toEqual(expect.arrayContaining([
      expect.stringContaining('operational review route')
    ]))

    const serializedStatus = JSON.stringify(status).toLowerCase()
    expect(serializedStatus).not.toContain('demo')
    expect(serializedStatus).not.toContain('reviewer')
    expect(serializedStatus).not.toContain('flagship')
    expect(serializedStatus).not.toContain('outreach')
  })

  it('flags high-priority remaining work when evidence scores are weak', () => {
    const weakCapabilities = buildTurnaroundCapabilityMap({
      operation,
      tasks: [{ status: 'BLOCKED', blocker: 'Open' }],
      staffing: [],
      signoffs: [{ status: 'PENDING' }],
      dependencies: [{ status: 'OPEN' }],
      handoffs: [{ status: 'OPEN' }],
      incidentCommand: { incidentScore: 80 },
      reviewerPacket: { readiness: { readinessScore: 45 }, dataQuality: { blockerCount: 2 } },
      outreachBoard: { readiness: { readinessScore: 48, dataQualityRisk: 7 } }
    })

    const work = buildTurnaroundRemainingWork({
      capabilities: weakCapabilities,
      incidentCommand: { incidentScore: 80 },
      outreachBoard: { readiness: { dataQualityRisk: 7 } }
    })

    expect(work).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'reduce-incident-risk', priority: 'HIGH' }),
      expect.objectContaining({ id: 'clean-data-quality-watch-items', priority: 'HIGH' })
    ]))
  })

  it('preserves authoritative zero evidence instead of substituting healthier fallback scores', () => {
    const capabilities = buildTurnaroundCapabilityMap({
      operation,
      releasePacket: { releaseScore: 0 },
      operationalMetrics: { summary: { releaseConfidence: 92, staffingCoverage: 0 }, staffingCoverage: 88 },
      incidentCommand: { incidentScore: 0 },
      executiveBrief: { summary: { releaseConfidence: 94, incidentScore: 70, reviewScore: 91, decisionScore: 93 } },
      playbookVariance: { summary: { rehearsalScore: 0 } },
      playbookTemplate: { readinessScore: 90 },
      afterActionReview: { summary: { reviewScore: 0 } },
      operationalTimeline: { summary: { totalEvents: 0 }, items: new Array(12).fill({}) },
      auditEvents: []
    })

    const byId = Object.fromEntries(capabilities.map(capability => [capability.id, capability]))
    expect(byId['release-readiness'].score).toBe(0)
    expect(byId['playbook-rehearsal'].score).toBe(0)
    expect(byId['incident-after-action'].score).toBe(55)
    expect(byId['audit-timeline'].score).toBe(0)
    expect(byId['workflow-crud'].score).toBe(0)
  })

  it('falls back only when authoritative completion evidence is absent', () => {
    const capabilities = buildTurnaroundCapabilityMap({
      operation,
      operationalMetrics: { summary: { releaseConfidence: 82 }, staffingCoverage: 75 },
      executiveBrief: { summary: { incidentScore: 20, reviewScore: 80 } },
      playbookTemplate: { readinessScore: 77 },
      operationalTimeline: { items: new Array(6).fill({}) }
    })

    const byId = Object.fromEntries(capabilities.map(capability => [capability.id, capability]))
    expect(byId['release-readiness'].score).toBe(82)
    expect(byId['playbook-rehearsal'].score).toBe(77)
    expect(byId['incident-after-action'].score).toBe(80)
    expect(byId['audit-timeline'].evidence[0]).toBe('6 timeline events')
  })

  it('degrades explicit null operational collections to empty evidence instead of throwing', () => {
    expect(() => buildTurnaroundCapabilityMap({
      operation: null,
      tasks: null,
      staffing: null,
      signoffs: null,
      dependencies: null,
      handoffs: null,
      auditEvents: null
    })).not.toThrow()

    const capabilities = buildTurnaroundCapabilityMap({
      operation: null,
      tasks: null,
      staffing: null,
      signoffs: null,
      dependencies: null,
      handoffs: null,
      auditEvents: null
    })
    expect(capabilities.find(capability => capability.id === 'audit-timeline').score).toBe(0)
    expect(capabilities.find(capability => capability.id === 'workflow-crud').evidence).toEqual([
      '0 tasks',
      '0 staffing rows',
      '0 dependencies',
      '0 handoffs',
      '0 signoffs'
    ])
  })

  it('keeps next actions focused on operational review, architecture assurance, and fleet scale', () => {
    const nextSlices = buildTurnaroundNextSlices({
      maturityScore: 91,
      remainingWork: [{ priority: 'MEDIUM' }]
    })

    expect(nextSlices).toEqual(expect.arrayContaining([
      expect.stringContaining('operational review route'),
      expect.stringContaining('data architecture assurance'),
      expect.stringContaining('cross-fleet turnaround comparison')
    ]))
  })
})

it('covers maturity thresholds, high-priority next slices, and the no-work fallback', () => {
  const noWork = buildTurnaroundRemainingWork({
    capabilities: [{ id: 'strong', label: 'Strong capability', score: 100, detail: 'ready' }],
    incidentCommand: { incidentScore: 0 },
    reviewerPacket: { dataQuality: { blockerCount: 0 } }
  })
  expect(noWork).toEqual([expect.objectContaining({ id: 'prepare-operational-review-route' })])

  const next = buildTurnaroundNextSlices({
    maturityScore: 95,
    remainingWork: [{ priority: 'HIGH' }]
  })
  expect(next[0]).toContain('high-priority')
  expect(next).toEqual(expect.arrayContaining([expect.stringContaining('Approve the core turnaround release baseline')]))

  const required = buildTurnaroundManagementStatus({ operation: {}, incidentCommand: { incidentScore: 100 } })
  expect(required.maturityStatus).toBe('ACTION_REQUIRED')
})

it('covers singular data-quality wording and medium incident-risk prioritization', () => {
  const work = buildTurnaroundRemainingWork({
    capabilities: [],
    incidentCommand: { incidentScore: 50 },
    outreachBoard: { readiness: { dataQualityRisk: 1 } }
  })

  expect(work).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'reduce-incident-risk', priority: 'MEDIUM' }),
    expect.objectContaining({ id: 'clean-data-quality-watch-items', priority: 'MEDIUM', detail: expect.stringContaining('1 data-quality watch item remain') })
  ]))
})

it('fails malformed incident and data-quality evidence safe without NaN or false remediation', () => {
  const capabilities = buildTurnaroundCapabilityMap({
    operation: { id: 'turnaround-malformed' },
    incidentCommand: { incidentScore: 'not-a-number' },
    operationalTimeline: { summary: { totalEvents: Infinity } }
  })
  const work = buildTurnaroundRemainingWork({
    capabilities: [],
    incidentCommand: { incidentScore: 'not-a-number' },
    outreachBoard: { readiness: { dataQualityRisk: 'bad-count' } },
    reviewerPacket: { dataQuality: { blockerCount: 6 } }
  })

  expect(capabilities.find(item => item.id === 'audit-timeline').evidence[0]).toBe('0 timeline events')
  expect(capabilities.find(item => item.id === 'incident-after-action').score).toBeGreaterThanOrEqual(0)
  expect(JSON.stringify(capabilities)).not.toContain('NaN')
  expect(work).toEqual([expect.objectContaining({ id: 'prepare-operational-review-route' })])
})

it('preserves authoritative zero data-quality risk instead of substituting fallback blockers', () => {
  const work = buildTurnaroundRemainingWork({
    capabilities: [],
    outreachBoard: { readiness: { dataQualityRisk: 0 } },
    reviewerPacket: { dataQuality: { blockerCount: 7 } }
  })

  expect(work).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'clean-data-quality-watch-items' })]))
})

it('fails non-finite completion scores safe instead of treating Infinity as complete', () => {
  const capabilities = buildTurnaroundCapabilityMap({
    operation: { id: 'turnaround-nonfinite' },
    releasePacket: { releaseScore: Infinity },
    incidentCommand: { incidentScore: Infinity },
    playbookVariance: { summary: { rehearsalScore: Infinity } },
    afterActionReview: { summary: { reviewScore: Infinity } }
  })
  const byId = Object.fromEntries(capabilities.map(item => [item.id, item]))

  expect(byId['release-readiness'].score).toBe(0)
  expect(byId['playbook-rehearsal'].score).toBe(0)
  expect(byId['incident-after-action'].score).toBe(55)
})

describe('turnaroundCompletion normalized workflow evidence', () => {
  it('treats equivalent padded terminal statuses as complete across workflow types', () => {
    const capabilities = buildTurnaroundCapabilityMap({
      operation: { id: 'op-830' },
      tasks: [{ status: ' completed ' }, { status: ' approved ' }],
      signoffs: [{ status: ' approved ' }],
      dependencies: [{ status: ' cleared ' }, { status: ' resolved ' }],
      handoffs: [{ status: ' closed ' }],
      operationalMetrics: { summary: { staffingCoverage: 100, releaseConfidence: 100 } },
      releasePacket: { releaseScore: 100 },
      playbookTemplate: { readinessScore: 100 },
      afterActionReview: { summary: { reviewScore: 100 } },
      reviewerPacket: { readiness: { readinessScore: 100 } },
      outreachBoard: { readiness: { readinessScore: 100 } }
    })

    const workflow = capabilities.find(capability => capability.id === 'workflow-crud')
    expect(workflow.score).toBe(100)
    expect(workflow.status).toBe('COMPLETE')
  })

  it('degrades malformed collections and non-finite evidence to conservative capability scores', () => {
    const capabilities = buildTurnaroundCapabilityMap({
      tasks: 'bad',
      staffing: {},
      signoffs: null,
      dependencies: 'bad',
      handoffs: {},
      auditEvents: 'bad',
      releasePacket: { releaseScore: Infinity },
      operationalTimeline: { summary: { totalEvents: Infinity } },
      operationalMetrics: { summary: { staffingCoverage: Infinity } },
      incidentCommand: { incidentScore: Infinity },
      afterActionReview: { summary: { reviewScore: Infinity } }
    })

    expect(capabilities.find(capability => capability.id === 'workflow-crud').score).toBe(0)
    expect(capabilities.find(capability => capability.id === 'release-readiness').score).toBe(0)
    expect(capabilities.find(capability => capability.id === 'audit-timeline').score).toBe(0)
  })

  it('covers remaining-work and next-slice priority branches', () => {
    const work = buildTurnaroundRemainingWork({
      capabilities: [{ id: 'weak', label: 'Weak area', score: 40, detail: 'Needs work' }],
      incidentCommand: { incidentScore: 80 },
      reviewerPacket: { dataQuality: { blockerCount: 5 } }
    })
    const slices = buildTurnaroundNextSlices({ maturityScore: 95, remainingWork: work })

    expect(work.map(item => item.priority)).toContain('HIGH')
    expect(slices[0]).toContain('high-priority')
    expect(slices).toEqual(expect.arrayContaining([expect.stringContaining('Approve the core turnaround release baseline')]))
  })
})
