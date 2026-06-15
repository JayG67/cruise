const {
  buildTurnaroundContinuityCenter,
  buildContinuityInputs,
  buildContinuityScore,
  buildContinuityScenarios,
  buildContinuityDepartments,
  buildContinuityRunbook,
  buildContinuityWatchlist
} = require('../../services/turnaroundContinuity.service')

describe('turnaroundContinuity.service', () => {
  const baseInput = {
    operation: { id: 'turn-1', title: 'Icon turnaround', shipName: 'Icon of the Seas', port: 'Miami', passengerCount: 5600 },
    tasks: [
      { id: 'task-1', taskName: 'Cabin reset', departmentRole: 'housekeeping-lead', status: 'BLOCKED', blockerReason: 'Linen carts delayed', ownerDisplayName: 'Housekeeping Lead' },
      { id: 'task-2', taskName: 'Provision galley', departmentRole: 'food-beverage-lead', status: 'IN_PROGRESS', ownerDisplayName: 'F&B Lead' },
      { id: 'task-3', taskName: 'Bridge clearance', departmentRole: 'engineering-lead', status: 'COMPLETE', ownerDisplayName: 'Engineer' }
    ],
    staffing: [
      { departmentRole: 'housekeeping-lead', plannedCount: 10, checkedInCount: 7 },
      { departmentRole: 'engineering-lead', plannedCount: 4, checkedInCount: 4 }
    ],
    signoffs: [
      { id: 'sign-1', departmentRole: 'housekeeping-lead', status: 'PENDING', approverDisplayName: 'HK Approver' },
      { id: 'sign-2', departmentRole: 'engineering-lead', status: 'APPROVED', approverDisplayName: 'Engineering Approver' }
    ],
    escalations: [
      { id: 'esc-1', title: 'Terminal congestion', departmentRole: 'guest-services-lead', severity: 'CRITICAL', status: 'OPEN', description: 'Port queue is backing up.', ownerDisplayName: 'Guest Services Lead' }
    ],
    dependencies: [
      { id: 'dep-1', taskName: 'Cabin reset', departmentRole: 'housekeeping-lead', status: 'BLOCKED', dependsOnTaskName: 'Luggage sweep' }
    ],
    handoffs: [
      { id: 'hand-1', title: 'Cabin release to guest services', departmentRole: 'housekeeping-lead', status: 'OPEN', dueTime: '11:15' }
    ],
    lifecycleState: { completionPercent: 64 },
    releasePacket: { releaseScore: 72 },
    commandCenter: { commandScore: 68 },
    closeoutPacket: { closeoutScore: 58 },
    productionReadiness: { readinessScore: 70 }
  }

  it('normalizes continuity inputs across tasks, staffing, handoffs, dependencies, signoffs, and escalations', () => {
    const inputs = buildContinuityInputs(baseInput)

    expect(inputs.blockedTasks).toHaveLength(1)
    expect(inputs.openDependencies).toHaveLength(1)
    expect(inputs.openHandoffs).toHaveLength(1)
    expect(inputs.criticalEscalations).toHaveLength(1)
    expect(inputs.pendingSignoffs).toHaveLength(1)
    expect(inputs.staffingGaps).toHaveLength(1)
    expect(inputs.taskCompletion).toBe(33)
  })

  it('penalizes continuity score when command risk signals remain open', () => {
    const inputs = buildContinuityInputs(baseInput)
    const score = buildContinuityScore(inputs)

    expect(score).toBeLessThan(70)
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('builds prioritized recovery scenarios and department continuity board', () => {
    const inputs = buildContinuityInputs(baseInput)
    const scenarios = buildContinuityScenarios(inputs)
    const departments = buildContinuityDepartments(inputs)

    expect(scenarios[0]).toEqual(expect.objectContaining({ id: 'active-escalation', severity: 'CRITICAL' }))
    expect(scenarios.map(scenario => scenario.id)).toEqual(expect.arrayContaining(['critical-path-delay', 'staffing-shortfall', 'handoff-miss']))
    expect(departments).toEqual(expect.arrayContaining([
      expect.objectContaining({ departmentRole: 'housekeeping-lead', status: expect.any(String), staffingGap: true })
    ]))
  })

  it('creates a full continuity center with runbook, watchlist, and evidence checklist', () => {
    const center = buildTurnaroundContinuityCenter(baseInput)

    expect(center.headline).toContain('Icon of the Seas')
    expect(center.commandStatus).toBe('CONTINUITY_AT_RISK')
    expect(center.scenarios.length).toBeGreaterThan(1)
    expect(center.runbook.map(step => step.id)).toEqual(expect.arrayContaining(['declare-command-window', 'protect-critical-path', 'close-readiness-loop']))
    expect(center.watchlist.map(item => item.type)).toEqual(expect.arrayContaining(['Task', 'Escalation', 'Dependency', 'Handoff', 'Signoff']))
    expect(center.evidenceChecklist).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'scenario-owners' }),
      expect.objectContaining({ id: 'signoff-path', complete: false })
    ]))
  })

  it('falls back to a steady-state continuity scenario when no blockers are visible', () => {
    const inputs = buildContinuityInputs({
      operation: { title: 'Clean turnaround', shipName: 'Celebrity Apex' },
      tasks: [{ id: 'task-clean', taskName: 'All clear', departmentRole: 'turnaround-manager', status: 'COMPLETE' }],
      signoffs: [{ departmentRole: 'turnaround-manager', status: 'APPROVED' }],
      handoffs: [{ id: 'handoff-clean', status: 'COMPLETE' }],
      closeoutPacket: { closeoutScore: 94 },
      commandCenter: { commandScore: 95 },
      lifecycleState: { completionPercent: 96 },
      releasePacket: { releaseScore: 93 }
    })

    const scenarios = buildContinuityScenarios(inputs)
    const runbook = buildContinuityRunbook(inputs, scenarios)
    const watchlist = buildContinuityWatchlist(inputs)
    const center = buildTurnaroundContinuityCenter({
      operation: { title: 'Clean turnaround', shipName: 'Celebrity Apex' },
      tasks: [{ id: 'task-clean', taskName: 'All clear', departmentRole: 'turnaround-manager', status: 'COMPLETE' }],
      signoffs: [{ departmentRole: 'turnaround-manager', status: 'APPROVED' }],
      handoffs: [{ id: 'handoff-clean', status: 'COMPLETE' }],
      closeoutPacket: { closeoutScore: 94 },
      commandCenter: { commandScore: 95 },
      lifecycleState: { completionPercent: 96 },
      releasePacket: { releaseScore: 93 }
    })

    expect(scenarios[0]).toEqual(expect.objectContaining({ id: 'steady-state-continuity', severity: 'INFO' }))
    expect(runbook).toHaveLength(5)
    expect(watchlist).toHaveLength(0)
    expect(center.commandStatus).toBe('CONTINUITY_READY')
  })
})
