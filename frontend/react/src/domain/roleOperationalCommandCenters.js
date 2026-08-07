export function getCommandCenterFallback(operation = {}, tasks = [], taskSummary = {}) {
  if (operation.commandCenter) return operation.commandCenter

  const dependencies = Array.isArray(operation.taskDependencies) ? operation.taskDependencies : []
  const handoffs = Array.isArray(operation.handoffs) ? operation.handoffs : []
  const escalations = Array.isArray(operation.escalations) ? operation.escalations : []
  const signoffs = Array.isArray(operation.signoffs) ? operation.signoffs : []
  const staffing = Array.isArray(operation.staffing) ? operation.staffing : []
  const openDependencyCount = dependencies.filter(dependency => String(dependency.status || '').toUpperCase() !== 'CLEARED').length
  const openHandoffCount = handoffs.filter(handoff => String(handoff.status || '').toUpperCase() !== 'COMPLETE').length
  const openEscalationCount = escalations.filter(escalation => String(escalation.status || '').toUpperCase() !== 'RESOLVED').length
  const pendingSignoffCount = signoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'PENDING').length
  const staffingGapCount = staffing.reduce((total, row) => total + Math.max(Number(row.plannedCount || 0) - Number(row.checkedInCount || 0), 0), 0)
  const completionPercent = Number(operation.lifecycleState?.completionPercent || taskSummary.completionPercent || 0)
  const closeoutReadiness = Math.max(0, Math.min(100, completionPercent - (openEscalationCount * 5) - (pendingSignoffCount * 4)))
  const firstDependency = dependencies.find(dependency => String(dependency.status || '').toUpperCase() !== 'CLEARED')
  const firstHandoff = handoffs.find(handoff => String(handoff.status || '').toUpperCase() !== 'COMPLETE')
  const firstEscalation = escalations.find(escalation => String(escalation.status || '').toUpperCase() !== 'RESOLVED')
  const firstTask = tasks.find(task => String(task.status || '').toUpperCase() !== 'COMPLETE') || (Array.isArray(operation.tasks) ? operation.tasks.find(task => String(task.status || '').toUpperCase() !== 'COMPLETE') : null)
  const departmentRoles = Array.from(new Set([
    ...tasks.map(task => task.departmentRole).filter(Boolean),
    ...staffing.map(row => row.departmentRole).filter(Boolean),
    ...signoffs.map(row => row.departmentRole).filter(Boolean)
  ]))

  return {
    commandStatus: closeoutReadiness >= 85 ? 'CLOSEOUT_READY' : closeoutReadiness >= 60 ? 'ACTIVE_COMMAND' : 'NEEDS_COMMAND_ATTENTION',
    commandScore: closeoutReadiness,
    commanderBrief: {
      headline: 'Turnaround command center is coordinating every department through closeout.',
      summary: `${operation.title || 'Turnaround'} is ${completionPercent}% complete with ${openDependencyCount + openHandoffCount + openEscalationCount + pendingSignoffCount} command items still active.`,
      nextDecision: operation.lifecycleState?.nextBestAction || firstDependency?.title || firstTask?.title || 'Keep the turnaround moving through closeout.',
      activePhase: operation.lifecycleState?.currentPhaseLabel || operation.status || 'Active turnaround command'
    },
    kpis: [
      { id: 'task-execution', label: 'Task execution', value: `${taskSummary.completeTasks || 0}/${taskSummary.totalTasks || tasks.length}`, detail: `${taskSummary.blockedTasks || 0} blockers remain in the operational queue.` },
      { id: 'dependency-control', label: 'Dependency control', value: String(openDependencyCount), detail: 'Open dependencies requiring command sequencing.' },
      { id: 'handoff-control', label: 'Handoff control', value: String(openHandoffCount), detail: 'Department handoffs still moving toward acceptance.' },
      { id: 'risk-control', label: 'Risk control', value: String(openEscalationCount), detail: 'Open escalations requiring leadership attention.' },
      { id: 'staffing-coverage', label: 'Staffing coverage', value: String(staffingGapCount), detail: 'Crew gaps across department staffing plans.' },
      { id: 'closeout-readiness', label: 'Closeout readiness', value: `${closeoutReadiness}%`, detail: `${pendingSignoffCount} signoffs pending before final packet review.` }
    ],
    decisionQueue: [
      firstDependency ? { id: 'dependency-decision', severity: 'HIGH', owner: firstDependency.ownerName || 'Command', decision: firstDependency.title, action: firstDependency.blockerReason || firstDependency.notes || 'Clear the dependency before readiness signoff.' } : null,
      firstEscalation ? { id: 'escalation-decision', severity: firstEscalation.severity || 'MEDIUM', owner: firstEscalation.ownerName || 'Command', decision: firstEscalation.title, action: firstEscalation.resolutionNotes || firstEscalation.description || 'Resolve the escalation before closeout.' } : null,
      firstHandoff ? { id: 'handoff-decision', severity: 'MEDIUM', owner: firstHandoff.ownerName || 'Command', decision: firstHandoff.title, action: firstHandoff.notes || 'Accept the handoff and confirm release timing.' } : null,
      firstTask ? { id: 'task-decision', severity: firstTask.status === 'BLOCKED' ? 'HIGH' : 'NORMAL', owner: firstTask.ownerName || 'Department lead', decision: firstTask.title || firstTask.taskName, action: firstTask.blockerReason || firstTask.notes || 'Move the task to completion.' } : null
    ].filter(Boolean),
    criticalPath: [
      { id: 'command-setup', label: 'Command setup', status: 'READY', score: 100, evidence: 'Admin-created operational people are scoped to cruise line, ship, and sailing.' },
      { id: 'department-execution', label: 'Department execution', status: taskSummary.totalTasks && taskSummary.completeTasks === taskSummary.totalTasks ? 'READY' : 'ACTIVE', score: taskSummary.completionPercent || 0, evidence: `${taskSummary.completeTasks || 0}/${taskSummary.totalTasks || tasks.length} operational tasks complete.` },
      { id: 'dependency-release', label: 'Dependency release', status: openDependencyCount ? 'ACTIVE' : 'READY', score: openDependencyCount ? 60 : 100, evidence: `${openDependencyCount} dependencies remain open.` },
      { id: 'handoff-acceptance', label: 'Handoff acceptance', status: openHandoffCount ? 'ACTIVE' : 'READY', score: openHandoffCount ? 65 : 100, evidence: `${openHandoffCount} handoffs remain open.` },
      { id: 'readiness-signoff', label: 'Readiness signoff', status: pendingSignoffCount ? 'ACTIVE' : 'READY', score: pendingSignoffCount ? 70 : 100, evidence: `${pendingSignoffCount} signoffs remain pending.` },
      { id: 'management-closeout', label: 'Management closeout', status: closeoutReadiness >= 85 ? 'READY' : 'ACTIVE', score: closeoutReadiness, evidence: 'Closeout packet readiness reflects blockers, evidence, and final approvals.' }
    ],
    departmentBoard: (departmentRoles.length ? departmentRoles : ['turnaround-manager']).map(departmentRole => {
      const departmentTasks = tasks.filter(task => task.departmentRole === departmentRole)
      const completeDepartmentTasks = departmentTasks.filter(task => String(task.status || '').toUpperCase() === 'COMPLETE').length
      const departmentSignoffs = signoffs.filter(signoff => signoff.departmentRole === departmentRole)
      const approvedSignoffs = departmentSignoffs.filter(signoff => String(signoff.status || '').toUpperCase() === 'APPROVED').length
      const signoffCompletion = departmentSignoffs.length ? Math.round((approvedSignoffs / departmentSignoffs.length) * 100) : 0
      const readinessScore = Math.round(((departmentTasks.length ? (completeDepartmentTasks / departmentTasks.length) * 100 : 75) + signoffCompletion) / 2)

      return {
        departmentRole,
        readinessScore,
        status: readinessScore >= 85 ? 'READY' : readinessScore >= 60 ? 'ACTIVE' : 'WATCH',
        nextAction: departmentTasks.find(task => String(task.status || '').toUpperCase() !== 'COMPLETE')?.title || 'Keep department readiness moving.',
        taskCount: departmentTasks.length,
        openEscalations: escalations.filter(escalation => escalation.departmentRole === departmentRole && String(escalation.status || '').toUpperCase() !== 'RESOLVED').length,
        signoffCompletion
      }
    }),
    handoffTimeline: handoffs.map(handoff => ({
      id: handoff.id,
      dueTime: handoff.dueTime || 'TBD',
      status: handoff.status,
      owner: handoff.ownerName || handoff.fromDepartmentRole || 'Department lead',
      detail: handoff.title || handoff.notes || 'Department handoff'
    }))
  }
}


export function getContinuityCenterFallback(operation = {}, tasks = [], taskSummary = {}) {
  if (operation.continuityCenter) return operation.continuityCenter

  const dependencies = Array.isArray(operation.taskDependencies) ? operation.taskDependencies : []
  const handoffs = Array.isArray(operation.handoffs) ? operation.handoffs : []
  const escalations = Array.isArray(operation.escalations) ? operation.escalations : []
  const signoffs = Array.isArray(operation.signoffs) ? operation.signoffs : []
  const staffing = Array.isArray(operation.staffing) ? operation.staffing : []
  const openDependencies = dependencies.filter(dependency => String(dependency.status || '').toUpperCase() !== 'CLEARED')
  const openHandoffs = handoffs.filter(handoff => String(handoff.status || '').toUpperCase() !== 'COMPLETE')
  const openEscalations = escalations.filter(escalation => String(escalation.status || '').toUpperCase() !== 'RESOLVED')
  const pendingSignoffs = signoffs.filter(signoff => String(signoff.status || '').toUpperCase() !== 'APPROVED')
  const staffingGaps = staffing.filter(row => Number(row.plannedCount || 0) > Number(row.checkedInCount || 0))
  const blockedTasks = tasks.filter(task => ['BLOCKED', 'AT_RISK'].includes(String(task.status || '').toUpperCase()) || task.blockerReason)
  const continuityScore = Math.max(0, Math.min(100, Number(operation.commandCenter?.commandScore || operation.lifecycleState?.completionPercent || taskSummary.completionPercent || 0) - (blockedTasks.length * 7) - (openEscalations.length * 6) - (openDependencies.length * 4) - (pendingSignoffs.length * 3)))
  const firstScenarioTask = blockedTasks[0] || tasks.find(task => String(task.status || '').toUpperCase() !== 'COMPLETE') || {}
  const firstScenarioEscalation = openEscalations[0]
  const departmentRoles = Array.from(new Set([
    ...tasks.map(task => task.departmentRole).filter(Boolean),
    ...staffing.map(row => row.departmentRole).filter(Boolean),
    ...signoffs.map(row => row.departmentRole).filter(Boolean),
    ...dependencies.map(row => row.departmentRole).filter(Boolean),
    ...handoffs.map(row => row.departmentRole).filter(Boolean)
  ]))

  return {
    headline: `${operation.shipName || 'Selected ship'} continuity and recovery control`,
    summary: `${operation.title || 'Selected turnaround'} has ${openEscalations.length} open escalations, ${openDependencies.length} dependencies, ${openHandoffs.length} handoffs, and ${pendingSignoffs.length} pending signoffs under continuity review.`,
    continuityScore,
    commandStatus: continuityScore >= 85 ? 'CONTINUITY_READY' : continuityScore >= 65 ? 'CONTINUITY_WATCH' : 'CONTINUITY_AT_RISK',
    passengerImpact: operation.passengerCount ? `${operation.passengerCount} passengers protected by continuity checks.` : 'Passenger impact is tracked through the selected sailing.',
    scenarios: [
      firstScenarioEscalation ? { id: 'active-escalation', label: 'Active escalation', severity: firstScenarioEscalation.severity || 'MEDIUM', trigger: firstScenarioEscalation.title || 'Open escalation', impact: firstScenarioEscalation.description || 'Operational risk requires a recovery owner.', owner: firstScenarioEscalation.ownerName || 'Incident Commander', recoveryWindow: 'Immediate command review', play: firstScenarioEscalation.resolutionNotes || 'Assign owner, update time, and closeout evidence.' } : null,
      firstScenarioTask?.id ? { id: 'task-recovery', label: 'Task recovery', severity: firstScenarioTask.status === 'BLOCKED' ? 'HIGH' : 'MEDIUM', trigger: firstScenarioTask.title || firstScenarioTask.taskName, impact: 'Open work can affect downstream readiness if not timeboxed.', owner: firstScenarioTask.ownerName || 'Department lead', recoveryWindow: 'Next command checkpoint', play: firstScenarioTask.blockerReason || firstScenarioTask.notes || 'Publish owner, workaround, and verification step.' } : null,
      openDependencies[0] ? { id: 'dependency-recovery', label: 'Dependency recovery', severity: 'MEDIUM', trigger: openDependencies[0].title || openDependencies[0].taskName || 'Open dependency', impact: 'Dependency gate needs release evidence.', owner: openDependencies[0].ownerName || 'Command', recoveryWindow: 'Before readiness signoff', play: 'Confirm prerequisite owner and evidence.' } : null
    ].filter(Boolean).slice(0, 4),
    departmentContinuity: (departmentRoles.length ? departmentRoles : ['turnaround-manager']).map(departmentRole => {
      const departmentTasks = tasks.filter(task => task.departmentRole === departmentRole)
      const completeTasks = departmentTasks.filter(task => String(task.status || '').toUpperCase() === 'COMPLETE').length
      const score = departmentTasks.length ? Math.round((completeTasks / departmentTasks.length) * 100) : 75
      return { departmentRole, score, status: score >= 85 ? 'READY' : score >= 65 ? 'WATCH' : 'AT_RISK', openTasks: Math.max(departmentTasks.length - completeTasks, 0), openEscalations: openEscalations.filter(escalation => escalation.departmentRole === departmentRole).length, openDependencies: openDependencies.filter(dependency => dependency.departmentRole === departmentRole).length, staffingGap: staffingGaps.some(row => row.departmentRole === departmentRole), nextAction: departmentTasks.find(task => String(task.status || '').toUpperCase() !== 'COMPLETE')?.title || 'Protect readiness cadence and evidence.' }
    }).slice(0, 8),
    runbook: [
      { id: 'declare-command-window', label: 'Declare command window', owner: 'Turnaround Manager', evidence: operation.port || operation.arrivalPort || 'Selected port', action: 'Confirm phase, owner, and next recovery checkpoint.' },
      { id: 'protect-critical-path', label: 'Protect critical path', owner: 'Department leads', evidence: `${blockedTasks.length} blocked task signals`, action: 'Move blockers into owned recovery plays with timestamps.' },
      { id: 'close-readiness-loop', label: 'Close readiness loop', owner: 'Readiness approvers', evidence: `${pendingSignoffs.length} pending signoffs`, action: 'Verify final signoff evidence before release.' }
    ],
    watchlist: [
      ...blockedTasks.map(task => ({ id: `task-${task.id}`, type: 'Task', label: task.title || task.taskName, owner: task.ownerName || 'Department lead', detail: task.blockerReason || task.notes || 'Blocked task requires recovery path.' })),
      ...openEscalations.map(escalation => ({ id: `escalation-${escalation.id}`, type: 'Escalation', label: escalation.title || 'Open escalation', owner: escalation.ownerName || 'Incident Commander', detail: escalation.resolutionNotes || escalation.description || 'Escalation needs next update.' })),
      ...openDependencies.map(dependency => ({ id: `dependency-${dependency.id}`, type: 'Dependency', label: dependency.title || dependency.taskName || 'Open dependency', owner: dependency.ownerName || 'Command', detail: 'Dependency still needs release evidence.' }))
    ].slice(0, 8),
    executivePrompt: continuityScore >= 85 ? 'Continuity is ready for final closeout.' : 'Continuity requires active command attention before final release.',
    evidenceChecklist: [
      { id: 'scenario-owners', label: 'Scenario owners assigned', complete: true },
      { id: 'critical-path-watchlist', label: 'Critical path watchlist current', complete: blockedTasks.length <= 2 },
      { id: 'signoff-path', label: 'Final signoff path visible', complete: pendingSignoffs.length === 0 }
    ]
  }
}



