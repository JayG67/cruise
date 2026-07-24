const {
  buildTurnaroundPlaybookTemplate,
  buildDepartmentPlaybooks,
  buildTemplateReadinessChecks,
  getTemplateProfile
} = require('../../services/turnaroundPlaybook.service')

describe('turnaroundPlaybook service', () => {
  const tasks = [
    { id: 't3', departmentRole: 'housekeeping-lead', taskName: 'Reset cabins', status: 'BLOCKED', sortOrder: 3, dueTime: '09:30', location: 'Deck 8' },
    { id: 't1', departmentRole: 'turnaround-manager', taskName: 'Open command center', status: 'COMPLETE', sortOrder: 1 },
    { id: 't2', departmentRole: '', taskName: '', status: 'READY', sortOrder: 2 }
  ]

  const staffing = [
    { departmentRole: 'housekeeping-lead', plannedCount: 10, checkedInCount: 8, musterLocation: 'Guest services' },
    { departmentRole: 'turnaround-manager', plannedCount: 2, checkedInCount: 2, musterLocation: 'Pier office' }
  ]

  const signoffs = [
    { departmentRole: 'housekeeping-lead', status: 'PENDING' },
    { departmentRole: 'turnaround-manager', status: 'APPROVED' }
  ]

  const escalations = [
    { departmentRole: 'housekeeping-lead', status: 'OPEN', severity: 'CRITICAL' },
    { departmentRole: 'turnaround-manager', status: 'RESOLVED', severity: 'WATCH' }
  ]

  const handoffs = [
    { departmentRole: 'housekeeping-lead', status: 'PENDING' },
    { departmentRole: 'turnaround-manager', status: 'COMPLETE' }
  ]

  const dependencies = [
    { departmentRole: 'engineering-lead', status: 'OPEN' },
    { departmentRole: 'turnaround-manager', status: 'CLEARED' }
  ]

  it('builds a normalized template profile with risk, staffing, and signoff metrics', () => {
    const profile = getTemplateProfile({
      operation: { id: 'op-1', port: 'Miami', turnaroundDate: '2026-08-05' },
      tasks,
      staffing,
      signoffs,
      escalations,
      handoffs,
      dependencies,
      passengerCount: '3200'
    })

    expect(profile).toMatchObject({
      operationId: 'op-1',
      port: 'Miami',
      taskCount: 3,
      plannedStaff: 12,
      checkedInStaff: 10,
      passengerCount: 3200,
      openEscalations: 1,
      activeDependencies: 1,
      openHandoffs: 1,
      blockedTasks: 1,
      signoffApprovalPercent: 50,
      staffingCoveragePercent: 83
    })
    expect(profile.departments).toEqual(['engineering-lead', 'housekeeping-lead', 'turnaround-manager', 'Unassigned'])
  })

  it('returns safe defaults for empty template inputs', () => {
    expect(getTemplateProfile()).toMatchObject({
      operationId: null,
      port: null,
      taskCount: 0,
      departmentCount: 0,
      plannedStaff: 0,
      staffingCoveragePercent: 0,
      signoffApprovalPercent: 0
    })
  })

  it.each([
    [{ departmentCount: 5, taskCount: 10, plannedStaff: 4, staffingCoveragePercent: 100, blockedTasks: 0, openEscalations: 0 }, 90, 10, 'READY', 100],
    [{ departmentCount: 4, taskCount: 9, plannedStaff: 4, staffingCoveragePercent: 75, blockedTasks: 1, openEscalations: 1 }, 70, 40, 'REVIEW', 25],
    [{ departmentCount: 1, taskCount: 1, plannedStaff: 0, staffingCoveragePercent: 0, blockedTasks: 2, openEscalations: 3 }, 30, 80, 'NEEDS_REVIEW', 0]
  ])('classifies playbook readiness across ready, watch, and action paths', (profile, releaseScore, riskIndex, expectedStatus, expectedScore) => {
    const result = buildTemplateReadinessChecks(profile, { readinessScore: releaseScore }, { summary: { riskIndex } })
    expect(result.templateReadinessStatus).toBe(expectedStatus)
    expect(result.templateReadinessScore).toBe(expectedScore)
    expect(result.checks).toHaveLength(4)
  })

  it('builds department playbooks with cadence based on open operational risk', () => {
    const rows = buildDepartmentPlaybooks({ staffing, signoffs, escalations, handoffs, tasks })
    const housekeeping = rows.find(row => row.departmentRole === 'housekeeping-lead')
    const manager = rows.find(row => row.departmentRole === 'turnaround-manager')

    expect(housekeeping).toMatchObject({
      taskCount: 1,
      plannedStaff: 10,
      signoffRequired: true,
      openRiskCount: 2,
      recommendedCadence: '15-minute exception review'
    })
    expect(manager.recommendedCadence).toBe('30-minute readiness check')
  })

  it('creates a large-ship template with sorted tasks, exceptions, and remediation actions', () => {
    const template = buildTurnaroundPlaybookTemplate({
      operation: { id: 'op-1', port: 'Miami' },
      tasks,
      staffing,
      signoffs,
      escalations,
      handoffs,
      dependencies,
      releasePacket: { readinessScore: 45 },
      operationalMetrics: { summary: { riskIndex: 72 } },
      passengerCount: 3200
    })

    expect(template.templateType).toBe('LARGE_SHIP_TURNAROUND')
    expect(template.templateTasks.map(task => task.sourceTaskId)).toEqual(['t1', 't2', 't3'])
    expect(template.templateTasks[1].taskName).toBe('Turnaround task 2')
    expect(template.exceptionRules.map(rule => rule.currentMatches)).toEqual([1, 1, 2])
    expect(template.nextBestActions[0]).toContain('Resolve action-level')
  })

  it.each([
    [5200, 'MEGA_SHIP_TURNAROUND'],
    [2500, 'LARGE_SHIP_TURNAROUND'],
    [2499, 'STANDARD_TURNAROUND']
  ])('selects the template type for %s passengers', (passengerCount, expectedType) => {
    const template = buildTurnaroundPlaybookTemplate({ passengerCount })
    expect(template.templateType).toBe(expectedType)
    expect(template.templateName).toBe('Port turnaround operating playbook')
  })

  it('limits template tasks to twelve and returns promotion actions when every readiness check passes', () => {
    const manyTasks = Array.from({ length: 14 }, (_, index) => ({
      id: `task-${index}`,
      taskName: `Task ${String(index).padStart(2, '0')}`,
      departmentRole: `department-${index % 5}`,
      sortOrder: index,
      status: 'COMPLETE'
    }))
    const fullStaffing = Array.from({ length: 5 }, (_, index) => ({ departmentRole: `department-${index}`, plannedCount: 2, checkedInCount: 2 }))
    const fullSignoffs = Array.from({ length: 5 }, (_, index) => ({ departmentRole: `department-${index}`, status: 'APPROVED' }))

    const template = buildTurnaroundPlaybookTemplate({
      tasks: manyTasks,
      staffing: fullStaffing,
      signoffs: fullSignoffs,
      releasePacket: { readinessScore: 95 },
      operationalMetrics: { summary: { riskIndex: 0 } }
    })

    expect(template.templateTasks).toHaveLength(12)
    expect(template.summary.templateReadinessStatus).toBe('READY')
    expect(template.nextBestActions[0]).toContain('Reuse this operation')
  })
})
