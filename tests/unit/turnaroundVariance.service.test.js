const {
  buildTurnaroundPlaybookVariance,
  buildDepartmentVariances,
  buildVarianceScenario,
  scoreDepartmentVariance
} = require('../../services/turnaroundVariance.service')

describe('turnaroundVariance service', () => {
  it('scores approved, pending, and blocked department execution with bounded variance', () => {
    expect(scoreDepartmentVariance({
      checkedInStaff: 4,
      completeTaskCount: 3,
      blockedTaskCount: 0,
      openEscalationCount: 0,
      openHandoffCount: 0,
      activeDependencyCount: 0,
      signoffStatus: 'APPROVED'
    }, { plannedStaff: 4, taskCount: 3 })).toBe(0)

    expect(scoreDepartmentVariance({
      checkedInStaff: 2,
      completeTaskCount: 2,
      blockedTaskCount: 1,
      signoffStatus: 'PENDING'
    }, { plannedStaff: 3, taskCount: 3 })).toBe(32)

    expect(scoreDepartmentVariance({
      checkedInStaff: 0,
      completeTaskCount: 0,
      blockedTaskCount: 5,
      openEscalationCount: 4,
      openHandoffCount: 3,
      activeDependencyCount: 2,
      signoffStatus: 'BLOCKED'
    }, { plannedStaff: 20, taskCount: 20 })).toBe(100)
  })

  it('builds and sorts department variances across task, staffing, signoff, escalation, handoff, and dependency evidence', () => {
    const rows = buildDepartmentVariances({
      playbookTemplate: {
        departmentPlaybooks: [
          { departmentRole: 'Engineering', taskCount: 2, plannedStaff: 2, recommendedCadence: '15-minute readiness check' },
          { departmentRole: 'Guest Services', taskCount: 1, plannedStaff: 1 },
          { departmentRole: 'Security', taskCount: 0, plannedStaff: 0 }
        ]
      },
      tasks: [
        { departmentRole: 'Engineering', status: 'BLOCKED' },
        { departmentRole: 'Engineering', status: 'COMPLETE' },
        { departmentRole: 'Guest Services', status: 'COMPLETE' }
      ],
      staffing: [
        { departmentRole: 'Engineering', plannedCount: 2, checkedInCount: 1 },
        { departmentRole: 'Guest Services', plannedCount: 1, checkedInCount: 1 }
      ],
      signoffs: [
        { departmentRole: 'Engineering', status: 'BLOCKED' },
        { departmentRole: 'Guest Services', status: 'APPROVED' }
      ],
      escalations: [
        { departmentRole: 'Engineering', status: 'OPEN' },
        { departmentRole: 'Guest Services', status: 'RESOLVED' }
      ],
      handoffs: [
        { departmentRole: 'Engineering', status: 'OPEN' },
        { departmentRole: 'Guest Services', status: 'COMPLETE' }
      ],
      dependencies: [
        { departmentRole: 'Engineering', status: 'ACTIVE' },
        { departmentRole: 'Guest Services', status: 'CLEARED' }
      ]
    })

    expect(rows.map(row => row.departmentRole)).toEqual(['Engineering', 'Security', 'Guest Services'])
    expect(rows[0]).toEqual(expect.objectContaining({
      status: 'ACTION',
      exceptionCount: 4,
      recommendedCadence: '15-minute readiness check'
    }))
    expect(rows[1]).toEqual(expect.objectContaining({ status: 'ON_TRACK', signoffStatus: 'PENDING', recommendedCadence: '30-minute readiness check' }))
    expect(rows[2]).toEqual(expect.objectContaining({ status: 'ON_TRACK', varianceScore: 0, exceptionCount: 0 }))
  })

  it('treats a null department playbook collection as empty instead of crashing', () => {
    expect(buildDepartmentVariances({ playbookTemplate: { departmentPlaybooks: null } })).toEqual([])
  })

  it('preserves an authoritative zero readiness score instead of replacing it with a metrics fallback', () => {
    const scenario = buildVarianceScenario({
      releasePacket: { readinessScore: 0 },
      operationalMetrics: { summary: { readinessScore: 92, riskIndex: 0 } },
      departmentVariances: []
    })

    expect(scenario).toEqual({
      rehearsalScore: 0,
      rehearsalStatus: 'RED',
      riskAdjustedReleaseDelta: 0,
      highVarianceCount: 0,
      watchVarianceCount: 0
    })
  })

  it('uses metrics readiness only when release readiness is absent and covers GREEN/AMBER variance scenarios', () => {
    expect(buildVarianceScenario({
      operationalMetrics: { summary: { readinessScore: 90, riskIndex: 0 } },
      departmentVariances: []
    })).toEqual(expect.objectContaining({ rehearsalScore: 90, rehearsalStatus: 'GREEN' }))

    expect(buildVarianceScenario({
      releasePacket: { readinessScore: 80 },
      operationalMetrics: { summary: { riskIndex: 20 } },
      departmentVariances: [{ status: 'WATCH' }, { status: 'ON_TRACK' }]
    })).toEqual(expect.objectContaining({
      rehearsalScore: 70,
      rehearsalStatus: 'AMBER',
      highVarianceCount: 0,
      watchVarianceCount: 1,
      riskAdjustedReleaseDelta: 10
    }))
  })

  it('handles null variance rows and clamps negative readiness inputs', () => {
    expect(buildVarianceScenario({
      releasePacket: { readinessScore: -10 },
      operationalMetrics: { summary: { riskIndex: 50 } },
      departmentVariances: null
    })).toEqual(expect.objectContaining({
      rehearsalScore: 0,
      rehearsalStatus: 'RED',
      highVarianceCount: 0,
      watchVarianceCount: 0,
      riskAdjustedReleaseDelta: 0
    }))
  })

  it('returns an unavailable result safely when operation and playbook are absent', () => {
    expect(buildTurnaroundPlaybookVariance({ operation: null, playbookTemplate: null })).toEqual(expect.objectContaining({
      operationId: null,
      status: 'UNAVAILABLE',
      departmentVariances: [],
      rehearsalActions: ['Generate a turnaround playbook template before comparing live execution variance.']
    }))
  })

  it('builds action and promotion guidance from the highest department variance', () => {
    const result = buildTurnaroundPlaybookVariance({
      operation: { id: 'op-1' },
      playbookTemplate: {
        summary: { templateReadinessScore: 88 },
        departmentPlaybooks: [
          { departmentRole: 'Engineering', taskCount: 2, plannedStaff: 2 },
          { departmentRole: 'Security', taskCount: 1, plannedStaff: 1 }
        ]
      },
      tasks: [
        { departmentRole: 'Engineering', status: 'BLOCKED' },
        { departmentRole: 'Engineering', status: 'OPEN' },
        { departmentRole: 'Security', status: 'COMPLETE' }
      ],
      staffing: [
        { departmentRole: 'Engineering', checkedInCount: 0 },
        { departmentRole: 'Security', checkedInCount: 1 }
      ],
      signoffs: [
        { departmentRole: 'Engineering', status: 'BLOCKED' },
        { departmentRole: 'Security', status: 'APPROVED' }
      ],
      releasePacket: { readinessScore: 80 },
      operationalMetrics: { summary: { riskIndex: 0 } }
    })

    expect(result.operationId).toBe('op-1')
    expect(result.summary).toEqual(expect.objectContaining({ templateReadinessScore: 88, comparedDepartmentCount: 2, topVarianceDepartment: 'Engineering' }))
    expect(result.rehearsalActions[0]).toMatch(/Stabilize 1 department variance/)
    expect(result.rehearsalActions[1]).toMatch(/Review Engineering cadence/)
    expect(result.rehearsalActions[2]).toMatch(/another readiness review/)
  })

  it('uses stable-baseline and template-promotion guidance when no variance remains', () => {
    const result = buildTurnaroundPlaybookVariance({
      playbookTemplate: { departmentPlaybooks: [{ departmentRole: 'Security', taskCount: 1, plannedStaff: 1 }] },
      tasks: [{ departmentRole: 'Security', status: 'COMPLETE' }],
      staffing: [{ departmentRole: 'Security', checkedInCount: 1 }],
      signoffs: [{ departmentRole: 'Security', status: 'APPROVED' }],
      releasePacket: { readinessScore: 90 },
      operationalMetrics: { summary: { riskIndex: 0 } }
    })

    expect(result.status).toBe('GREEN')
    expect(result.rehearsalActions).toEqual([
      'No action-level department variance is blocking playbook rehearsal.',
      'Baseline departments are tracking against current execution.',
      'Use this operation as a strong candidate for ship/port template promotion.'
    ])
  })
})
