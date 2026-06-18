const { reactSelectorKeys: rs } = require('./reactSelectors')
const { testId, byTestId } = require('./reactSelectors')

function getRequestPath(req) {
  return new URL(req.url).pathname
}

function getPathSegmentAfter(pathname, marker, suffix = '') {
  const remainder = pathname.split(marker)[1] || ''
  return suffix ? remainder.split(suffix)[0] : remainder
}

const reactCruiseLines = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Celebrity Cruises',
    country: 'United States',
    website: 'https://www.celebritycruises.com'
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Princess Cruises',
    country: 'United States',
    website: ''
  }
]

const reactShips = [
  {
    id: 'ship-react-icon',
    cruiseLineId: reactCruiseLines[0].id,
    name: 'React Icon',
    currentPort: 'Miami, Florida'
  },
  {
    id: 'ship-react-utopia',
    cruiseLineId: reactCruiseLines[0].id,
    name: 'React Utopia',
    currentPort: 'Port Canaveral, Florida'
  }
]

const reactSailings = [
  {
    id: 'sailing-react-1',
    shipId: 'ship-react-icon',
    departureDate: '2026-12-12',
    departurePort: 'Miami, Florida',
    arrivalPort: 'Nassau, Bahamas',
    days: 4,
    isRepositioning: false
  },
  {
    id: 'sailing-react-2',
    shipId: 'ship-react-icon',
    departureDate: '2027-01-18',
    departurePort: 'San Juan, Puerto Rico',
    arrivalPort: 'Miami, Florida',
    days: 7,
    isRepositioning: true
  }
]

const reactItinerary = [
  {
    id: 'itinerary-react-day-1',
    sailingId: 'sailing-react-1',
    day: 1,
    title: 'Embarkation Day',
    port: 'Miami, Florida',
    activities: [
      { id: 'activity-react-1', time: '11:00 AM', activity: 'Terminal arrival' },
      { id: 'activity-react-2', time: '07:00 PM', activity: 'Welcome dinner' }
    ],
    activitySchedule: [
      { id: 'activity-react-1', time: '11:00 AM', activity: 'Terminal arrival' },
      { id: 'activity-react-2', time: '07:00 PM', activity: 'Welcome dinner' }
    ]
  },
  {
    id: 'itinerary-react-day-2',
    sailingId: 'sailing-react-1',
    day: 2,
    title: 'Perfect Day',
    port: 'CocoCay',
    activities: [
      { id: 'activity-react-3', time: '09:00 AM', activity: 'Beach club arrival' }
    ],
    activitySchedule: [
      { id: 'activity-react-3', time: '09:00 AM', activity: 'Beach club arrival' }
    ]
  }
]

const reactCustomers = [
  {
    id: 'react-customer-1',
    firstName: 'Jay',
    lastName: 'Gallagher',
    email: 'jay.react@example.com',
    phone: '555-0101',
    loyaltyNumber: 'RG-100'
  },
  {
    id: 'react-customer-2',
    firstName: 'Alisa',
    lastName: 'Gallagher',
    email: 'alisa.react@example.com',
    phone: '555-0102',
    loyaltyNumber: 'RG-200'
  },
  {
    id: 'react-customer-3',
    firstName: 'Morgan',
    lastName: 'Leader',
    email: 'morgan.leader@example.com',
    phone: '555-0103',
    loyaltyNumber: 'GL-300'
  }
]

const reactBookings = [
  {
    id: 'react-booking-1',
    bookingStatus: 'CONFIRMED',
    cabinNumber: 'P101',
    fareCode: 'BALCONY',
    embarkationPort: 'Miami, Florida',
    debarkationPort: 'Nassau, Bahamas',
    createdByCustomerId: 'react-customer-1',
    cruiseLine: { name: 'Royal Caribbean International' },
    ship: { name: 'React Icon' },
    sailing: {
      departureDate: '2026-12-12',
      itinerary: reactItinerary
    },
    passengers: [
      {
        customerId: 'react-customer-1',
        passengerType: 'Primary',
        diningPreference: 'Anytime dining',
        accessibilityNotes: '',
        customer: reactCustomers[0]
      },
      {
        customerId: 'react-customer-2',
        passengerType: 'Guest',
        diningPreference: 'Early seating',
        accessibilityNotes: 'Uses elevators',
        customer: reactCustomers[1]
      }
    ]
  },
  {
    id: 'react-booking-2',
    bookingStatus: 'PENDING',
    cabinNumber: 'G202',
    fareCode: 'GROUP',
    embarkationPort: 'San Juan, Puerto Rico',
    debarkationPort: 'Miami, Florida',
    createdByCustomerId: 'react-customer-3',
    cruiseLine: { name: 'Royal Caribbean International' },
    ship: { name: 'React Utopia' },
    sailing: {
      departureDate: '2027-01-18',
      itinerary: [reactItinerary[1]]
    },
    passengers: [
      {
        customerId: 'react-customer-3',
        passengerType: 'Group Leader',
        diningPreference: 'Late seating',
        accessibilityNotes: '',
        customer: reactCustomers[2]
      },
      {
        customerId: 'react-customer-1',
        passengerType: 'Guest',
        diningPreference: 'Anytime dining',
        accessibilityNotes: '',
        customer: reactCustomers[0]
      }
    ]
  }
]


function normalizeTurnaroundRoleLabel(role) {
  return String(role || '')
    .replace(/_/g, '-')
    .split('-')
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function buildReactTurnaroundLifecycleState(operation = {}) {
  const tasks = operation.tasks || []
  const dependencies = operation.taskDependencies || []
  const handoffs = operation.handoffs || []
  const escalations = operation.escalations || []
  const signoffs = operation.signoffs || []
  const staffing = operation.staffing || []
  const totalTasks = operation.taskSummary?.totalTasks ?? tasks.length
  const completeTasks = operation.taskSummary?.completeTasks ?? tasks.filter(task => task.status === 'COMPLETE').length
  const blockedTasks = operation.taskSummary?.blockedTasks ?? tasks.filter(task => task.status === 'BLOCKED' || task.blockerReason).length
  const inProgressTasks = operation.taskSummary?.inProgressTasks ?? tasks.filter(task => task.status === 'IN_PROGRESS').length
  const taskCompletionPercent = totalTasks === 0 ? 0 : Math.round((completeTasks / totalTasks) * 100)
  const activeDependencies = operation.dependencySummary?.activeDependencies ?? dependencies.filter(dependency => dependency.status !== 'CLEARED').length
  const openHandoffs = operation.handoffSummary?.openHandoffs ?? handoffs.filter(handoff => handoff.status !== 'COMPLETE').length
  const openEscalations = operation.escalationSummary?.openEscalations ?? escalations.filter(escalation => escalation.status !== 'RESOLVED').length
  const pendingSignoffs = operation.signoffSummary?.pendingSignoffs ?? signoffs.filter(signoff => signoff.status === 'PENDING').length
  const staffingGaps = operation.staffingSummary?.gapCount ?? staffing.reduce((sum, row) => sum + Math.max(Number(row.plannedCount || 0) - Number(row.checkedInCount || 0), 0), 0)
  const completionPercent = Math.round((
    taskCompletionPercent +
    (activeDependencies === 0 ? 100 : 45) +
    (openHandoffs === 0 ? 100 : 45) +
    (openEscalations === 0 ? 100 : 55) +
    (pendingSignoffs === 0 ? 100 : 40)
  ) / 5)
  const status = completionPercent >= 100 && blockedTasks === 0 && activeDependencies === 0 && openHandoffs === 0 && openEscalations === 0 && pendingSignoffs === 0
    ? 'COMPLETED'
    : blockedTasks > 0 || openEscalations > 0
      ? 'AT_RISK'
      : inProgressTasks > 0
        ? 'IN_PROGRESS'
        : 'SETUP'
  const phases = [
    ['setup', 'Setup', 'Create the turnaround plan, scoped people, and operating assignments.', totalTasks > 0 ? 100 : 25],
    ['pre-arrival', 'Pre-arrival', 'Confirm arrival windows, leadership coverage, and dependency gates.', activeDependencies === 0 ? 100 : 50],
    ['disembarkation', 'Disembarkation', 'Sequence guest flow and luggage release before reset work begins.', taskCompletionPercent >= 20 ? 75 : 35],
    ['cleaning-reset', 'Cleaning / reset', 'Drive cabin readiness and ship reset workstream completion.', taskCompletionPercent >= 50 ? 80 : 40],
    ['provisioning', 'Provisioning', 'Clear food, beverage, supply, and dock-side receiving work.', openHandoffs === 0 ? 100 : 45],
    ['embarkation', 'Embarkation', 'Coordinate guest-services readiness and terminal release handoffs.', openEscalations === 0 ? 90 : 45],
    ['final-readiness', 'Final readiness', 'Resolve blockers and collect department signoffs.', pendingSignoffs === 0 ? 100 : 40],
    ['completed', 'Completed', 'Turnaround is ready to close with all workstreams complete.', status === 'COMPLETED' ? 100 : 0]
  ].map(([id, label, description, percentComplete], index) => ({
    id,
    label,
    description,
    sequence: index + 1,
    percentComplete,
    status: percentComplete >= 100 ? 'COMPLETE' : percentComplete > 0 ? 'IN_PROGRESS' : 'PENDING',
    blockers: id === 'completed' && status !== 'COMPLETED' ? ['Outstanding operational closure items remain'] : []
  }))
  const finalBlockers = [
    ...tasks.filter(task => task.blockerReason || task.status === 'BLOCKED').map(task => ({
      id: `task-${task.id}`,
      type: 'Task blocker',
      label: task.taskName,
      detail: task.blockerReason || 'Task is blocked'
    })),
    ...dependencies.filter(dependency => dependency.status !== 'CLEARED').map(dependency => ({
      id: `dependency-${dependency.id}`,
      type: 'Dependency',
      label: dependency.taskName,
      detail: dependency.notes || dependency.dependsOnTaskName
    })),
    ...escalations.filter(escalation => escalation.status !== 'RESOLVED').map(escalation => ({
      id: `escalation-${escalation.id}`,
      type: 'Escalation',
      label: escalation.title,
      detail: escalation.resolutionNotes || escalation.ownerName || escalation.severity
    })),
    ...signoffs.filter(signoff => signoff.status !== 'APPROVED').map(signoff => ({
      id: `signoff-${signoff.id}`,
      type: 'Signoff',
      label: normalizeTurnaroundRoleLabel(signoff.departmentRole),
      detail: signoff.notes || 'Department signoff is still open'
    }))
  ]
  const departmentReadiness = staffing.map(row => {
    const departmentTasks = tasks.filter(task => String(task.departmentRole || '').replace(/_/g, '-') === row.departmentRole)
    const completeDepartmentTasks = departmentTasks.filter(task => task.status === 'COMPLETE').length
    const roleSignoff = signoffs.find(signoff => signoff.departmentRole === row.departmentRole)

    return {
      departmentRole: normalizeTurnaroundRoleLabel(row.departmentRole),
      ready: roleSignoff?.status === 'APPROVED' && departmentTasks.every(task => task.status === 'COMPLETE' || task.status === 'READY'),
      taskCompletionPercent: departmentTasks.length === 0 ? 0 : Math.round((completeDepartmentTasks / departmentTasks.length) * 100),
      openEscalations: escalations.filter(escalation => escalation.departmentRole === row.departmentRole && escalation.status !== 'RESOLVED').length,
      openDependencies: dependencies.filter(dependency => String(dependency.taskName || '').toLowerCase().includes(String(row.departmentRole || '').split('-')[0])).length
    }
  })
  const currentPhaseLabel = phases.find(phase => phase.status !== 'COMPLETE')?.label || 'Completed'
  const nextBestAction = finalBlockers.length > 0
    ? `Resolve ${finalBlockers[0].type.toLowerCase()}: ${finalBlockers[0].label}`
    : status === 'COMPLETED'
      ? 'Archive the completed turnaround packet and brief the next sailing team.'
      : 'Keep progressing department workstreams toward final readiness.'

  return {
    status,
    completionPercent,
    currentPhaseLabel,
    completionLanguage: status === 'COMPLETED'
      ? 'Turnaround is complete and ready for final packet review.'
      : `${completionPercent}% complete with ${finalBlockers.length} lifecycle blocker${finalBlockers.length === 1 ? '' : 's'} remaining.`,
    storyBeats: [
      `${completeTasks}/${totalTasks} tasks complete`,
      `${activeDependencies} open dependencies`,
      `${openHandoffs} handoffs open`,
      `${openEscalations} escalations open`,
      `${pendingSignoffs} signoffs pending`,
      `${staffingGaps} staffing gaps`
    ],
    phases,
    finalBlockers,
    departmentReadiness,
    nextBestAction
  }
}

function buildReactTurnaroundCommandCenter(operation = {}) {
  const lifecycleState = buildReactTurnaroundLifecycleState(operation)
  const tasks = operation.tasks || []
  const dependencies = operation.taskDependencies || []
  const handoffs = operation.handoffs || []
  const escalations = operation.escalations || []
  const signoffs = operation.signoffs || []
  const staffing = operation.staffing || []
  const taskCount = tasks.length
  const completeTaskCount = tasks.filter(task => task.status === 'COMPLETE').length
  const blockedTaskCount = tasks.filter(task => task.status === 'BLOCKED' || task.blockerReason).length
  const openDependencyCount = dependencies.filter(dependency => dependency.status !== 'CLEARED').length
  const openHandoffCount = handoffs.filter(handoff => handoff.status !== 'COMPLETE').length
  const openEscalationCount = escalations.filter(escalation => escalation.status !== 'RESOLVED').length
  const pendingSignoffCount = signoffs.filter(signoff => signoff.status === 'PENDING').length
  const staffingGapCount = staffing.reduce((total, row) => total + Math.max(Number(row.plannedCount || 0) - Number(row.checkedInCount || 0), 0), 0)
  const closeoutReadiness = Math.max(0, Math.min(100, lifecycleState.completionPercent - (openEscalationCount * 5) - (pendingSignoffCount * 4)))
  const firstDependency = dependencies.find(dependency => dependency.status !== 'CLEARED')
  const firstTask = tasks.find(task => task.status !== 'COMPLETE')
  const firstHandoff = handoffs.find(handoff => handoff.status !== 'COMPLETE')
  const firstEscalation = escalations.find(escalation => escalation.status !== 'RESOLVED')

  return {
    commandStatus: closeoutReadiness >= 85 ? 'CLOSEOUT_READY' : closeoutReadiness >= 60 ? 'ACTIVE_COMMAND' : 'NEEDS_COMMAND_ATTENTION',
    commandScore: closeoutReadiness,
    commanderBrief: {
      headline: 'Turnaround command center is coordinating every department through closeout.',
      summary: `${operation.title || 'Turnaround'} is ${lifecycleState.completionPercent}% complete with ${openDependencyCount + openHandoffCount + openEscalationCount + pendingSignoffCount} command items still active.`,
      nextDecision: lifecycleState.nextBestAction,
      activePhase: lifecycleState.currentPhaseLabel
    },
    kpis: [
      { id: 'task-execution', label: 'Task execution', value: `${completeTaskCount}/${taskCount}`, detail: `${blockedTaskCount} blockers remain in the operational queue.` },
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
      firstTask ? { id: 'task-decision', severity: firstTask.status === 'BLOCKED' ? 'HIGH' : 'NORMAL', owner: firstTask.ownerName || 'Department lead', decision: firstTask.title, action: firstTask.blockerReason || firstTask.notes || 'Move the task to completion.' } : null
    ].filter(Boolean),
    criticalPath: [
      { id: 'command-setup', label: 'Command setup', status: 'READY', score: 100, evidence: 'Admin-created operational people are scoped to cruise line, ship, and sailing.' },
      { id: 'department-execution', label: 'Department execution', status: completeTaskCount === taskCount ? 'READY' : 'ACTIVE', score: taskCount ? Math.round((completeTaskCount / taskCount) * 100) : 100, evidence: `${completeTaskCount}/${taskCount} operational tasks complete.` },
      { id: 'dependency-release', label: 'Dependency release', status: openDependencyCount ? 'ACTIVE' : 'READY', score: openDependencyCount ? 60 : 100, evidence: `${openDependencyCount} dependencies remain open.` },
      { id: 'handoff-acceptance', label: 'Handoff acceptance', status: openHandoffCount ? 'ACTIVE' : 'READY', score: openHandoffCount ? 65 : 100, evidence: `${openHandoffCount} handoffs remain open.` },
      { id: 'readiness-signoff', label: 'Readiness signoff', status: pendingSignoffCount ? 'ACTIVE' : 'READY', score: pendingSignoffCount ? 70 : 100, evidence: `${pendingSignoffCount} signoffs remain pending.` },
      { id: 'management-closeout', label: 'Management closeout', status: closeoutReadiness >= 85 ? 'READY' : 'ACTIVE', score: closeoutReadiness, evidence: 'Closeout packet readiness reflects blockers, evidence, and final approvals.' }
    ],
    departmentBoard: lifecycleState.departmentReadiness.map(department => ({
      departmentRole: department.departmentRole,
      readinessScore: department.readinessScore,
      status: department.status,
      nextAction: department.detail,
      taskCount: department.taskCount,
      openEscalations: department.openEscalations,
      signoffCompletion: department.signoffCompletion
    })),
    handoffTimeline: handoffs.map(handoff => ({
      id: handoff.id,
      dueTime: handoff.dueTime || 'TBD',
      status: handoff.status,
      owner: handoff.ownerName || handoff.fromDepartmentRole || 'Department lead',
      detail: handoff.title || handoff.notes || 'Department handoff'
    }))
  }
}


function buildReactTurnaroundContinuityCenter(operation = {}) {
  const lifecycleState = buildReactTurnaroundLifecycleState(operation)
  const commandCenter = operation.commandCenter || buildReactTurnaroundCommandCenter(operation)
  const tasks = operation.tasks || []
  const dependencies = operation.taskDependencies || []
  const handoffs = operation.handoffs || []
  const escalations = operation.escalations || []
  const signoffs = operation.signoffs || []
  const staffing = operation.staffing || []
  const blockedTasks = tasks.filter(task => task.status === 'BLOCKED' || task.blockerReason)
  const openDependencies = dependencies.filter(dependency => dependency.status !== 'CLEARED')
  const openHandoffs = handoffs.filter(handoff => handoff.status !== 'COMPLETE')
  const openEscalations = escalations.filter(escalation => escalation.status !== 'RESOLVED')
  const pendingSignoffs = signoffs.filter(signoff => signoff.status !== 'APPROVED')
  const staffingGaps = staffing.filter(row => Number(row.plannedCount || 0) > Number(row.checkedInCount || 0))
  const continuityScore = Math.max(0, Math.min(100, Number(commandCenter.commandScore || lifecycleState.completionPercent || 0) - (blockedTasks.length * 7) - (openEscalations.length * 6) - (openDependencies.length * 4) - (pendingSignoffs.length * 3)))
  const firstTask = blockedTasks[0] || tasks.find(task => task.status !== 'COMPLETE')
  const firstEscalation = openEscalations[0]

  return {
    headline: `${operation.shipName || operation.ship?.name || 'Selected ship'} continuity and recovery control`,
    summary: `${operation.title || 'Turnaround'} has ${openEscalations.length} open escalations, ${openDependencies.length} dependencies, ${openHandoffs.length} handoffs, and ${pendingSignoffs.length} pending signoffs under continuity review.`,
    continuityScore,
    commandStatus: continuityScore >= 85 ? 'CONTINUITY_READY' : continuityScore >= 65 ? 'CONTINUITY_WATCH' : 'CONTINUITY_AT_RISK',
    passengerImpact: operation.passengerCount ? `${operation.passengerCount} passengers protected by continuity checks.` : 'Passenger impact is tracked through the selected sailing.',
    executivePrompt: continuityScore >= 85 ? 'Continuity is ready for final closeout.' : 'Continuity requires active command attention before final release.',
    scenarios: [
      firstEscalation ? { id: 'active-escalation', label: 'Active escalation', severity: firstEscalation.severity || 'MEDIUM', trigger: firstEscalation.title || 'Open escalation', impact: firstEscalation.description || 'Operational risk requires recovery owner.', owner: firstEscalation.ownerName || 'Incident Commander', recoveryWindow: 'Immediate command review', play: firstEscalation.resolutionNotes || 'Assign owner, update time, and closeout evidence.' } : null,
      firstTask ? { id: 'task-recovery', label: 'Task recovery', severity: firstTask.status === 'BLOCKED' ? 'HIGH' : 'MEDIUM', trigger: firstTask.title || firstTask.taskName, impact: 'Open work can affect downstream readiness if not timeboxed.', owner: firstTask.ownerName || 'Department lead', recoveryWindow: 'Next command checkpoint', play: firstTask.blockerReason || firstTask.notes || 'Publish owner, workaround, and verification step.' } : null,
      openDependencies[0] ? { id: 'dependency-recovery', label: 'Dependency recovery', severity: 'MEDIUM', trigger: openDependencies[0].title || openDependencies[0].taskName || 'Open dependency', impact: 'Dependency gate needs release evidence.', owner: openDependencies[0].ownerName || 'Command', recoveryWindow: 'Before readiness signoff', play: 'Confirm prerequisite owner and evidence.' } : null
    ].filter(Boolean),
    departmentContinuity: lifecycleState.departmentReadiness.map(department => ({
      departmentRole: department.departmentRole,
      score: department.taskCompletionPercent,
      status: department.ready ? 'READY' : department.taskCompletionPercent >= 65 ? 'WATCH' : 'AT_RISK',
      openTasks: Math.max((department.taskCount || 0) - Math.round(((department.taskCompletionPercent || 0) / 100) * (department.taskCount || 0)), 0),
      openEscalations: department.openEscalations,
      openDependencies: department.openDependencies,
      staffingGap: staffingGaps.some(row => normalizeTurnaroundRoleLabel(row.departmentRole) === department.departmentRole),
      nextAction: 'Protect readiness cadence and evidence.'
    })),
    runbook: [
      { id: 'declare-command-window', label: 'Declare command window', owner: 'Turnaround Manager', evidence: operation.port || 'Selected port', action: 'Confirm phase, owner, and next recovery checkpoint.' },
      { id: 'protect-critical-path', label: 'Protect critical path', owner: 'Department leads', evidence: `${blockedTasks.length} blocked task signals`, action: 'Move blockers into owned recovery plays with timestamps.' },
      { id: 'close-readiness-loop', label: 'Close readiness loop', owner: 'Readiness approvers', evidence: `${pendingSignoffs.length} pending signoffs`, action: 'Verify final signoff evidence before release.' }
    ],
    watchlist: [
      ...blockedTasks.map(task => ({ id: `task-${task.id}`, type: 'Task', label: task.title || task.taskName, owner: task.ownerName || 'Department lead', detail: task.blockerReason || task.notes || 'Blocked task requires recovery path.' })),
      ...openEscalations.map(escalation => ({ id: `escalation-${escalation.id}`, type: 'Escalation', label: escalation.title || 'Open escalation', owner: escalation.ownerName || 'Incident Commander', detail: escalation.resolutionNotes || escalation.description || 'Escalation needs next update.' })),
      ...openDependencies.map(dependency => ({ id: `dependency-${dependency.id}`, type: 'Dependency', label: dependency.title || dependency.taskName || 'Open dependency', owner: dependency.ownerName || 'Command', detail: 'Dependency still needs release evidence.' }))
    ].slice(0, 8),
    evidenceChecklist: [
      { id: 'scenario-owners', label: 'Scenario owners assigned', complete: true },
      { id: 'critical-path-watchlist', label: 'Critical path watchlist current', complete: blockedTasks.length <= 2 },
      { id: 'signoff-path', label: 'Final signoff path visible', complete: pendingSignoffs.length === 0 }
    ]
  }
}




function buildReactTurnaroundShiftBriefing(operation = {}) {
  const commandCenter = operation.commandCenter || buildReactTurnaroundCommandCenter(operation)
  const continuityCenter = operation.continuityCenter || buildReactTurnaroundContinuityCenter(operation)
  const tasks = operation.tasks || []
  const signoffs = operation.signoffs || []
  const staffing = operation.staffing || []
  const escalations = operation.escalations || []
  const dependencies = operation.taskDependencies || []
  const handoffs = operation.handoffs || []
  const criticalItems = [
    ...escalations.filter(row => row.status !== 'RESOLVED').map(row => ({ id: `escalation-${row.id}`, type: row.severity === 'CRITICAL' ? 'CRITICAL_ESCALATION' : 'ESCALATION', departmentRole: normalizeTurnaroundRoleLabel(row.departmentRole), owner: row.ownerName || 'Incident Commander', label: row.title || 'Open escalation', detail: row.resolutionNotes || row.description || 'Escalation needs update.', priority: row.severity === 'CRITICAL' ? 100 : 80 })),
    ...tasks.filter(row => row.status === 'BLOCKED' || row.status === 'NOT_STARTED').map(row => ({ id: `task-${row.id}`, type: row.status === 'BLOCKED' ? 'BLOCKER' : 'START_READY', departmentRole: normalizeTurnaroundRoleLabel(row.departmentRole), owner: row.ownerName || 'Department lead', label: row.title || row.taskName, detail: row.blockerReason || row.notes || 'Task needs update.', priority: row.status === 'BLOCKED' ? 90 : 45 })),
    ...dependencies.filter(row => row.status !== 'CLEARED').map(row => ({ id: `dependency-${row.id}`, type: 'DEPENDENCY', departmentRole: normalizeTurnaroundRoleLabel(row.departmentRole), owner: row.ownerName || 'Command', label: row.title || row.taskName || 'Dependency gate', detail: 'Dependency still active.', priority: 70 })),
    ...handoffs.filter(row => row.status !== 'COMPLETE').map(row => ({ id: `handoff-${row.id}`, type: 'HANDOFF', departmentRole: normalizeTurnaroundRoleLabel(row.departmentRole), owner: row.ownerName || 'Department lead', label: row.title || 'Operational handoff', detail: row.notes || 'Handoff needs acceptance.', priority: 55 }))
  ].sort((a, b) => b.priority - a.priority).slice(0, 8)
  const departmentBriefs = (commandCenter.departmentBoard || []).slice(0, 6).map(row => {
    const staffingRow = staffing.find(item => normalizeTurnaroundRoleLabel(item.departmentRole) === row.departmentRole)
    const signoff = signoffs.find(item => normalizeTurnaroundRoleLabel(item.departmentRole) === row.departmentRole)
    return {
      departmentRole: row.departmentRole,
      completionPercent: row.readinessScore || row.signoffCompletion || 0,
      signoffStatus: signoff?.status || row.status || 'PENDING',
      blockedTasks: tasks.filter(task => normalizeTurnaroundRoleLabel(task.departmentRole) === row.departmentRole && task.status === 'BLOCKED').length,
      staffingGap: staffingRow ? Math.max(Number(staffingRow.plannedCount || 0) - Number(staffingRow.checkedInCount || 0), 0) : 0,
      openEscalations: row.openEscalations || 0,
      briefingFocus: row.nextAction || 'Keep pace and report exceptions before the next command check.'
    }
  })
  const actionCount = criticalItems.filter(item => item.priority >= 80).length
  const watchCount = criticalItems.length - actionCount

  return {
    summary: {
      briefingScore: Math.max(0, Math.min(100, Number(commandCenter.commandScore || 75) - actionCount * 7 - watchCount * 3)),
      handoffStatus: actionCount ? 'COMMAND_REVIEW' : watchCount > 1 ? 'WATCH_HANDOFF' : 'READY_HANDOFF',
      actionCount,
      watchCount,
      criticalItemCount: criticalItems.length,
      nextShiftFocus: criticalItems[0]?.departmentRole || departmentBriefs[0]?.departmentRole || 'All departments'
    },
    criticalItems,
    departmentBriefs,
    checklist: [
      { id: 'release-confidence', label: 'Release confidence', status: 'READY', detail: 'Release confidence is visible for shift handoff.' },
      { id: 'decision-queue', label: 'Decision queue', status: (commandCenter.decisionQueue || []).length ? 'ACTION' : 'READY', detail: `${(commandCenter.decisionQueue || []).length} command decisions need acknowledgement.` },
      { id: 'continuity-watchlist', label: 'Continuity watchlist', status: (continuityCenter.watchlist || []).length ? 'WATCH' : 'READY', detail: `${(continuityCenter.watchlist || []).length} continuity items carry into the next shift.` }
    ]
  }
}

function buildReactTurnaroundGoLiveCenter(operation = {}) {
  const commandCenter = operation.commandCenter || buildReactTurnaroundCommandCenter(operation)
  const continuityCenter = operation.continuityCenter || buildReactTurnaroundContinuityCenter(operation)
  const shiftBriefing = operation.shiftBriefing || buildReactTurnaroundShiftBriefing(operation)
  const lifecycleState = operation.lifecycleState || buildReactTurnaroundLifecycleState(operation)
  const closeoutPacket = operation.closeoutPacket || { closeoutScore: lifecycleState.completionPercent || 72 }
  const productionScore = operation.productionReadiness?.readinessScore || lifecycleState.completionPercent || 72
  const releaseScore = operation.releasePacket?.summary?.releaseScore || lifecycleState.completionPercent || 72
  const gates = [
    { id: 'workflow-complete', label: 'Workflow completeness', owner: 'Turnaround Manager', score: lifecycleState.completionPercent || 72, status: lifecycleState.completionPercent >= 90 ? 'GO' : 'WATCH', detail: 'Task and signoff evidence is visible.' },
    { id: 'risk-controlled', label: 'Risk controlled', owner: 'Incident Commander', score: Math.max(0, 100 - (operation.escalations || []).filter(row => row.status !== 'RESOLVED').length * 15), status: (operation.escalations || []).some(row => row.status !== 'RESOLVED') ? 'WATCH' : 'GO', detail: 'Escalation and blocker evidence is visible.' },
    { id: 'shift-handoff', label: 'Shift handoff ready', owner: 'Operations Lead', score: shiftBriefing.summary?.briefingScore || 72, status: 'WATCH', detail: 'Next-shift handoff evidence is available.' },
    { id: 'continuity-ready', label: 'Continuity ready', owner: 'Continuity Lead', score: continuityCenter.continuityScore || 72, status: 'WATCH', detail: 'Exception recovery evidence is available.' },
    { id: 'production-ready', label: 'Production surface ready', owner: 'Engineering Lead', score: productionScore, status: productionScore >= 90 ? 'GO' : 'WATCH', detail: 'Production and release evidence is available.' },
    { id: 'reviewer-proof', label: 'Reviewer proof ready', owner: 'Portfolio Reviewer', score: closeoutPacket.closeoutScore || 72, status: 'WATCH', detail: 'Reviewer proof package is available.' }
  ]
  const goLiveScore = Math.round(gates.reduce((total, gate) => total + gate.score, 0) / gates.length)

  return {
    headline: `${operation.shipName || operation.ship?.name || 'Selected ship'} turnaround go-live is ${goLiveScore}% ready.`,
    context: `${operation.cruiseLineName || operation.cruiseLine?.name || 'Cruise line'} · ${operation.turnaroundDate || operation.sailingDate || 'date pending'} · ${operation.title || 'Turnaround operation'}`,
    summary: {
      goLiveScore,
      goLiveStatus: gates.some(gate => gate.status === 'NO_GO') ? 'NO_GO' : gates.some(gate => gate.status === 'WATCH') ? 'GO_WITH_WATCH' : 'READY_TO_LAUNCH',
      goGateCount: gates.filter(gate => gate.status === 'GO').length,
      watchCount: gates.filter(gate => gate.status === 'WATCH').length,
      noGoCount: gates.filter(gate => gate.status === 'NO_GO').length,
      actionCount: gates.filter(gate => gate.status !== 'GO').length,
      launchRecommendation: 'Resolve watch items or document them in launch notes before public deployment.'
    },
    gates,
    actions: gates.filter(gate => gate.status !== 'GO').map(gate => ({ id: `gate-${gate.id}`, owner: gate.owner, priority: gate.status === 'NO_GO' ? 'HIGH' : 'MEDIUM', action: `${gate.label}: ${gate.detail}` })).slice(0, 8),
    evidence: gates.slice(0, 5).map(gate => ({ id: `evidence-${gate.id}`, label: gate.label, status: gate.status, detail: gate.detail })),
    remainingScope: [
      { id: 'production-hardening', label: 'Production hardening', status: 'REMAINING', detail: 'Deployment settings, error states, and environment readiness.' },
      { id: 'data-hardening', label: 'Data architecture hardening', status: 'REMAINING', detail: 'Normalize production data contracts.' },
      { id: 'portfolio-launch', label: 'Portfolio launch packaging', status: 'REMAINING', detail: 'Screenshots, README story, and final live-site smoke evidence.' }
    ]
  }
}

function buildReactTurnaroundPresentationGuide(operation = {}) {
  const lifecycleState = buildReactTurnaroundLifecycleState(operation)
  const releaseScore = operation.releasePacket?.readinessScore || lifecycleState.completionPercent
  const reviewerScore = operation.reviewerPacket?.readiness?.readinessScore || Math.max(55, releaseScore - 5)
  const finalBlockers = lifecycleState.finalBlockers || []
  const status = lifecycleState.completionPercent >= 85 && finalBlockers.length === 0
    ? 'DEMO_READY'
    : lifecycleState.completionPercent >= 55
      ? 'PRESENTATION_HARDENING'
      : 'NEEDS_FOCUS'
  const firstBlocker = finalBlockers[0]

  return {
    status,
    averageScore: Math.round((lifecycleState.completionPercent + releaseScore + reviewerScore) / 3),
    headline: status === 'DEMO_READY'
      ? 'Turnaround management is ready for the five-minute employer demo.'
      : 'Turnaround management is close; use this guide to keep the demo tight.',
    positioning: 'Show admin setup, scoped operational roles, lifecycle progress, and reviewer-ready proof.',
    scores: {
      lifecycleScore: lifecycleState.completionPercent,
      releaseScore,
      reviewerScore,
      launchScore: releaseScore,
      productionScore: reviewerScore,
      dossierScore: reviewerScore
    },
    storyline: [
      { id: 'admin-setup', label: 'Admin sets up operations', duration: '0:00-1:00', status: 'READY', detail: 'Open the admin setup board and show scoped people.' },
      { id: 'role-work', label: 'Roles execute the turnaround', duration: '1:00-2:30', status: finalBlockers.length ? 'WATCH' : 'READY', detail: firstBlocker ? `Drive ${firstBlocker.type}: ${firstBlocker.label}.` : 'Show role work moving to completion.' },
      { id: 'manager-command', label: 'Manager sees progress', duration: '2:30-3:30', status: 'WATCH', detail: `${lifecycleState.completionPercent}% lifecycle completion tells the command story.` },
      { id: 'readiness-proof', label: 'Readiness becomes provable', duration: '3:30-4:30', status: 'WATCH', detail: 'Reviewer evidence turns workflow state into proof.' },
      { id: 'portfolio-close', label: 'Close with employer value', duration: '4:30-5:00', status: 'READY', detail: 'Cypress owns the soup-to-nuts workflow and Playwright stays responsive-only.' }
    ],
    focus: {
      priority: lifecycleState.nextBestAction,
      talkingPoints: lifecycleState.storyBeats || [],
      showFirst: ['Role selector', 'Lifecycle phase board', 'Reviewer packet']
    },
    risks: finalBlockers.length
      ? finalBlockers.slice(0, 3).map(blocker => ({ id: blocker.id, label: blocker.type, mitigation: blocker.detail }))
      : [{ id: 'presentation-ready', label: 'No critical demo risks surfaced', mitigation: 'Use the five-minute run of show.' }],
    freezeRecommendation: status === 'DEMO_READY'
      ? 'Freeze turnaround feature expansion and begin cross-app UX cleanup.'
      : 'Finish the listed risks, rerun the Cypress lifecycle workflow, then freeze turnaround expansion.'
  }
}

function hydrateReactTurnaroundOperation(operation = {}) {
  return {
    ...operation,
    lifecycleState: buildReactTurnaroundLifecycleState(operation),
    presentationGuide: buildReactTurnaroundPresentationGuide(operation),
    commandCenter: operation.commandCenter || buildReactTurnaroundCommandCenter(operation),
    continuityCenter: operation.continuityCenter || buildReactTurnaroundContinuityCenter(operation),
    shiftBriefing: operation.shiftBriefing || buildReactTurnaroundShiftBriefing(operation),
    goLiveCenter: operation.goLiveCenter || buildReactTurnaroundGoLiveCenter(operation)
  }
}

function hydrateReactTurnaroundOperations(operations = []) {
  return operations.map(operation => hydrateReactTurnaroundOperation(operation))
}

const reactTurnaroundOperations = [
  {
    id: 'turnaround-react-1',
    title: 'Miami same-day turnaround readiness',
    turnaroundDate: '2026-12-12',
    port: 'Miami, Florida',
    status: 'PLANNED',
    commandStatus: 'PLANNED',
    readinessLevel: 'High coordination',
    commandReadinessLevel: 'High coordination',
    notes: 'Coordinate disembarkation, cabin reset, provisioning, and embarkation for the next Miami sailing.',
    passengerCount: 2,
    taskSummary: { totalTasks: 4, completeTasks: 0, blockedTasks: 0, inProgressTasks: 0, completionPercent: 0 },
    signoffSummary: { totalSignoffs: 3, approvedSignoffs: 1, blockedSignoffs: 0, pendingSignoffs: 2, approvalPercent: 33 },
    escalationSummary: { totalEscalations: 1, openEscalations: 1, monitoringEscalations: 0, resolvedEscalations: 0, criticalEscalations: 0 },
    staffingSummary: { totalDepartments: 5, plannedCount: 114, checkedInCount: 103, gapCount: 11, checkInPercent: 90 },
    dependencySummary: { totalDependencies: 2, activeDependencies: 2, clearedDependencies: 0 },
    handoffSummary: { totalHandoffs: 2, completedHandoffs: 0, blockedHandoffs: 0, openHandoffs: 2 },
    staffing: [
      { id: 'turnaround-staffing-1', operationId: 'turnaround-react-1', departmentRole: 'turnaround-manager', plannedCount: 5, checkedInCount: 4, leadName: 'Alex Turner', musterLocation: 'Port operations center', notes: 'Command desk has one runner staged for pier updates.' },
      { id: 'turnaround-staffing-2', operationId: 'turnaround-react-1', departmentRole: 'housekeeping-lead', plannedCount: 42, checkedInCount: 38, leadName: 'Maria Rodriguez', musterLocation: 'Guest decks', notes: 'Cabin runners are staged by deck zone.' },
      { id: 'turnaround-staffing-3', operationId: 'turnaround-react-1', departmentRole: 'guest-services-lead', plannedCount: 24, checkedInCount: 21, leadName: 'Angela Brooks', musterLocation: 'Terminal help desk', notes: 'Guest services coverage prioritizes luggage hall and exception queue.' },
      { id: 'turnaround-staffing-4', operationId: 'turnaround-react-1', departmentRole: 'food-beverage-lead', plannedCount: 31, checkedInCount: 29, leadName: 'Michael Chen', musterLocation: 'Provisioning dock', notes: 'Galley support is aligned with cold-chain receiving windows.' },
      { id: 'turnaround-staffing-5', operationId: 'turnaround-react-1', departmentRole: 'engineering-lead', plannedCount: 12, checkedInCount: 11, leadName: 'David Torres', musterLocation: 'Engine control room', notes: 'Engineering watch is covering utilities and final safety clearance.' }
    ],
    escalations: [
      { id: 'turnaround-escalation-1', operationId: 'turnaround-react-1', departmentRole: 'guest-services-lead', severity: 'HIGH', title: 'Terminal luggage hall capacity watch', ownerName: 'Angela Brooks', status: 'OPEN', resolutionNotes: 'Port team is monitoring luggage hall release timing.', createdAt: '2026-12-12T08:20:00.000Z' }
    ],
    signoffs: [
      { id: 'turnaround-signoff-1', operationId: 'turnaround-react-1', departmentRole: 'turnaround-manager', approverName: 'Alex Turner', status: 'APPROVED', notes: 'Command readiness accepted.', signedAt: '2026-12-12T07:25:00.000Z' },
      { id: 'turnaround-signoff-2', operationId: 'turnaround-react-1', departmentRole: 'housekeeping-lead', approverName: '', status: 'PENDING', notes: 'Cabin readiness pending.', signedAt: null },
      { id: 'turnaround-signoff-3', operationId: 'turnaround-react-1', departmentRole: 'engineering-lead', approverName: '', status: 'PENDING', notes: 'Engineering readiness pending.', signedAt: null }
    ],
    ship: { name: 'React Icon' },
    sailing: {
      departureDate: '2026-12-12',
      departurePort: 'Miami, Florida',
      arrivalPort: 'Nassau, Bahamas'
    },
    cruiseLine: { name: 'Royal Caribbean International' },
    taskDependencies: [
      { id: 'turnaround-dependency-1', operationId: 'turnaround-react-1', taskId: 'turnaround-task-3', dependsOnTaskId: 'turnaround-task-2', taskName: 'Prioritize cabin strip and reset windows', dependsOnTaskName: 'Sequence disembarkation, provisioning, cleaning, and embarkation', dependencyType: 'BLOCKS', status: 'ACTIVE', notes: 'Cabin work depends on command sequencing.' },
      { id: 'turnaround-dependency-2', operationId: 'turnaround-react-1', taskId: 'turnaround-task-4', dependsOnTaskId: 'turnaround-task-1', taskName: 'Confirm shore power, fuel, potable water, and waste windows', dependsOnTaskName: 'Coordinate department readiness standups', dependencyType: 'BLOCKS', status: 'ACTIVE', notes: 'Technical clearance follows the readiness huddle.' }
    ],
    handoffs: [
      { id: 'turnaround-handoff-1', operationId: 'turnaround-react-1', fromDepartmentRole: 'housekeeping-lead', toDepartmentRole: 'guest-services-lead', title: 'Cabin readiness to embarkation desk handoff', status: 'PENDING', ownerName: 'Maria Rodriguez', dueTime: '11:00', notes: 'Guest services needs cabin readiness confirmation before opening general boarding.', completedAt: null },
      { id: 'turnaround-handoff-2', operationId: 'turnaround-react-1', fromDepartmentRole: 'engineering-lead', toDepartmentRole: 'turnaround-manager', title: 'Technical clearance to command center handoff', status: 'IN_REVIEW', ownerName: 'David Torres', dueTime: '10:30', notes: 'Engineering is confirming shore power release and potable water windows.', completedAt: null }
    ],
    tasks: [
      { id: 'turnaround-task-1', departmentRole: 'turnaround_manager', taskName: 'Coordinate department readiness standups', ownerName: 'Alex Turner', dueTime: '07:30', location: 'Port operations center', status: 'READY', sortOrder: 1, updates: [{ id: 'turnaround-update-1', authorName: 'Alex Turner', updateType: 'NOTE', message: 'Readiness huddle completed from the database update log.', createdAt: '2026-12-12T07:15:00.000Z' }] },
      { id: 'turnaround-task-2', departmentRole: 'turnaround_manager', taskName: 'Sequence disembarkation, provisioning, cleaning, and embarkation', ownerName: 'Alex Turner', dueTime: '08:00', location: 'Port operations center', status: 'READY', sortOrder: 2, updates: [] },
      { id: 'turnaround-task-3', departmentRole: 'housekeeping_lead', taskName: 'Prioritize cabin strip and reset windows', ownerName: 'Maria Rodriguez', dueTime: '10:45', location: 'Guest decks', status: 'READY', sortOrder: 1 },
      { id: 'turnaround-task-4', departmentRole: 'engineering_lead', taskName: 'Confirm shore power, fuel, potable water, and waste windows', ownerName: 'David Torres', dueTime: '08:00', location: 'Engine control room', status: 'READY', sortOrder: 1 }
    ]
  },
  {
    id: 'turnaround-react-2',
    title: 'San Juan repositioning turnaround readiness',
    turnaroundDate: '2027-01-18',
    port: 'San Juan, Puerto Rico',
    status: 'PLANNED',
    commandStatus: 'PLANNED',
    readinessLevel: 'Standard coordination',
    commandReadinessLevel: 'Standard coordination',
    notes: 'Monitor passenger volume and stateroom readiness for the next sailing.',
    passengerCount: 2,
    taskSummary: { totalTasks: 3, completeTasks: 0, blockedTasks: 0, inProgressTasks: 0, completionPercent: 0 },
    signoffSummary: { totalSignoffs: 2, approvedSignoffs: 0, blockedSignoffs: 0, pendingSignoffs: 2, approvalPercent: 0 },
    escalationSummary: { totalEscalations: 0, openEscalations: 0, monitoringEscalations: 0, resolvedEscalations: 0, criticalEscalations: 0 },
    staffingSummary: { totalDepartments: 5, plannedCount: 104, checkedInCount: 93, gapCount: 11, checkInPercent: 89 },
    dependencySummary: { totalDependencies: 1, activeDependencies: 1, clearedDependencies: 0 },
    handoffSummary: { totalHandoffs: 1, completedHandoffs: 0, blockedHandoffs: 0, openHandoffs: 1 },
    staffing: [
      { id: 'turnaround-staffing-6', operationId: 'turnaround-react-2', departmentRole: 'turnaround-manager', plannedCount: 3, checkedInCount: 2, leadName: 'Alex Turner', musterLocation: 'Port operations center', notes: 'Command desk has one runner staged for pier updates.' },
      { id: 'turnaround-staffing-7', operationId: 'turnaround-react-2', departmentRole: 'housekeeping-lead', plannedCount: 40, checkedInCount: 36, leadName: 'Maria Rodriguez', musterLocation: 'Guest decks', notes: 'Cabin runners are staged by deck zone.' },
      { id: 'turnaround-staffing-8', operationId: 'turnaround-react-2', departmentRole: 'guest-services-lead', plannedCount: 22, checkedInCount: 19, leadName: 'Angela Brooks', musterLocation: 'Terminal help desk', notes: 'Guest services coverage prioritizes luggage hall and exception queue.' },
      { id: 'turnaround-staffing-9', operationId: 'turnaround-react-2', departmentRole: 'food-beverage-lead', plannedCount: 29, checkedInCount: 27, leadName: 'Michael Chen', musterLocation: 'Provisioning dock', notes: 'Galley support is aligned with cold-chain receiving windows.' },
      { id: 'turnaround-staffing-10', operationId: 'turnaround-react-2', departmentRole: 'engineering-lead', plannedCount: 10, checkedInCount: 9, leadName: 'David Torres', musterLocation: 'Engine control room', notes: 'Engineering watch is covering utilities and final safety clearance.' }
    ],
    escalations: [],
    signoffs: [
      { id: 'turnaround-signoff-4', operationId: 'turnaround-react-2', departmentRole: 'turnaround-manager', approverName: '', status: 'PENDING', notes: 'Command readiness pending.', signedAt: null },
      { id: 'turnaround-signoff-5', operationId: 'turnaround-react-2', departmentRole: 'engineering-lead', approverName: '', status: 'PENDING', notes: 'Engineering readiness pending.', signedAt: null }
    ],
    ship: { name: 'React Utopia' },
    sailing: {
      departureDate: '2027-01-18',
      departurePort: 'San Juan, Puerto Rico',
      arrivalPort: 'Miami, Florida'
    },
    cruiseLine: { name: 'Royal Caribbean International' },
    taskDependencies: [
      { id: 'turnaround-dependency-3', operationId: 'turnaround-react-2', taskId: 'turnaround-task-6', dependsOnTaskId: 'turnaround-task-5', taskName: 'Confirm inspection checkpoints before guest boarding', dependsOnTaskName: 'Confirm arrival and next departure ports', dependencyType: 'BLOCKS', status: 'ACTIVE', notes: 'Inspection checkpoints depend on command port confirmation.' }
    ],
    handoffs: [
      { id: 'turnaround-handoff-3', operationId: 'turnaround-react-2', fromDepartmentRole: 'turnaround-manager', toDepartmentRole: 'housekeeping-lead', title: 'Next-sailing cabin preparation handoff', status: 'PENDING', ownerName: 'Alex Turner', dueTime: '10:15', notes: 'Command center is preparing the next department release window.', completedAt: null }
    ],
    tasks: [
      { id: 'turnaround-task-5', departmentRole: 'turnaround_manager', taskName: 'Confirm arrival and next departure ports', ownerName: 'Alex Turner', dueTime: '07:30', location: 'Port operations center', status: 'READY', sortOrder: 1 },
      { id: 'turnaround-task-6', departmentRole: 'housekeeping_lead', taskName: 'Confirm inspection checkpoints before guest boarding', ownerName: 'Maria Rodriguez', dueTime: '10:45', location: 'Guest decks', status: 'READY', sortOrder: 1 },
      { id: 'turnaround-task-7', departmentRole: 'engineering_lead', taskName: 'Confirm technical clearance checks before embarkation', ownerName: 'David Torres', dueTime: '08:00', location: 'Engine control room', status: 'READY', sortOrder: 1 }
    ]
  }
]

const reactDemoUsers = [
  {
    id: 'react-admin-user',
    displayName: 'React Admin',
    role: 'Admin',
    email: 'admin.react@example.com'
  },
  {
    id: 'react-passenger-user',
    displayName: 'React Passenger',
    role: 'Passenger',
    customerId: 'react-customer-1',
    email: 'jay.react@example.com'
  },
  {
    id: 'react-group-leader-user',
    displayName: 'React Group Leader',
    role: 'Group Leader',
    customerId: 'react-customer-3',
    email: 'morgan.leader@example.com'
  },
  {
    id: 'ops-turnaround',
    displayName: 'Alex Turner',
    role: 'turnaround_manager',
    cruiseLineName: 'Royal Caribbean International',
    email: 'alex.turner@example.com'
  },
  {
    id: 'ops-housekeeping',
    displayName: 'Maria Rodriguez',
    role: 'housekeeping_lead',
    cruiseLineName: 'Royal Caribbean International',
    email: 'maria.rodriguez@example.com'
  },
  {
    id: 'ops-guest-services',
    displayName: 'Angela Brooks',
    role: 'guest_services_lead',
    cruiseLineName: 'Royal Caribbean International',
    email: 'angela.brooks@example.com'
  },
  {
    id: 'ops-food-beverage',
    displayName: 'Michael Chen',
    role: 'food_beverage_lead',
    cruiseLineName: 'Royal Caribbean International',
    email: 'michael.chen@example.com'
  },
  {
    id: 'ops-engineering',
    displayName: 'David Torres',
    role: 'engineering_lead',
    cruiseLineName: 'Royal Caribbean International',
    email: 'david.torres@example.com'
  }
]

Cypress.Commands.add('getByTestId', selectorKey => cy.get(byTestId(selectorKey)))
Cypress.Commands.add('getReactSelector', selectorKey => cy.get(byTestId(selectorKey)))

function selectDemoUserByVisibleRole(roleText, personText = '') {
  cy.getByTestId(rs.roleTypeSelect)
    .find('option')
    .contains(roleText)
    .invoke('val')
    .then(roleValue => {
      cy.getByTestId(rs.roleTypeSelect).select(roleValue)
    })

  if (/passenger/i.test(roleText)) {
    cy.getByTestId(rs.passengerFinderPanel).should('be.visible')
    cy.getByTestId(rs.passengerFinderResultCard).should('have.length.greaterThan', 0)

    if (personText) {
      cy.getByTestId(rs.passengerSearchInput).clear().type(personText)
      cy.getByTestId(rs.passengerFinderResultCard).contains(personText).click()
      return
    }

    cy.getByTestId(rs.passengerFinderResultCard).first().click()
    return
  }

  if (/turnaround|housekeeping|guest services|food|beverage|engineering|security|port operations/i.test(roleText)) {
    cy.getByTestId(rs.operationalPersonFilterPanel).should('be.visible')
    cy.getByTestId(rs.personFinderResultCard).should('have.length.greaterThan', 0)

    if (personText) {
      cy.getByTestId(rs.personSearchInput).clear().type(personText)
      cy.getByTestId(rs.personFinderResultCard).contains(personText).click()
      return
    }

    cy.getByTestId(rs.personFinderResultCard).first().click()
    return
  }

  cy.getByTestId(rs.personFinderPanel).should('be.visible')
  cy.getByTestId(rs.personFinderResultCard).should('have.length.greaterThan', 0)

  if (personText) {
    cy.getByTestId(rs.personSearchInput).clear().type(personText)
    cy.getByTestId(rs.personFinderResultCard).contains(personText).click()
    return
  }

  cy.getByTestId(rs.personFinderResultCard).first().click()
}

function interceptReactCoreApis(overrides = {}) {
  cy.intercept('GET', '/cruise/demo-users', overrides.demoUsers || reactDemoUsers).as('reactDemoUsers')
  cy.intercept('GET', '/cruise/customers', overrides.customers || reactCustomers).as('reactCustomers')
  cy.intercept('GET', '/cruise/bookings', overrides.bookings || reactBookings).as('reactBookings')
  const baseTurnaroundOperations = hydrateReactTurnaroundOperations(overrides.turnaroundOperations || reactTurnaroundOperations)
  cy.intercept({ method: 'GET', pathname: '/cruise/turnaround-operations' }, baseTurnaroundOperations).as('reactTurnaroundOperations')

  const turnaroundSetup = {
    turnaroundPeople: (overrides.demoUsers || reactDemoUsers).filter(user => String(user.role || '').toLowerCase().includes('lead') || String(user.role || '').toLowerCase().includes('manager')),
    cruiseLines: overrides.cruiseLines || reactCruiseLines,
    ships: overrides.ships || reactShips,
    sailings: overrides.sailings || reactSailings,
    supportedRoles: ['turnaround-manager', 'housekeeping-lead', 'guest-services-lead', 'food-beverage-lead', 'engineering-lead', 'security-lead', 'port-operations-lead']
  }
  cy.intercept('GET', '/cruise/turnaround-admin/setup', turnaroundSetup).as('reactTurnaroundAdminSetup')
  cy.intercept('POST', '/cruise/turnaround-admin/people', req => {
    const person = {
      id: 'tu-cypress-person',
      displayName: req.body?.displayName || 'Cypress Person',
      role: String(req.body?.role || 'housekeeping-lead').toUpperCase().replace(/-/g, '_'),
      cruiseLineId: req.body?.cruiseLineId,
      assignedShipId: req.body?.assignedShipId || null,
      cruiseLineName: (overrides.cruiseLines || reactCruiseLines).find(line => line.id === req.body?.cruiseLineId)?.name || 'Cruise line',
      assignedShipName: (overrides.ships || reactShips).find(ship => ship.id === req.body?.assignedShipId)?.name || null
    }
    req.reply({ statusCode: 201, body: { message: 'Turnaround person created and assigned successfully', person, setup: { ...turnaroundSetup, turnaroundPeople: [...turnaroundSetup.turnaroundPeople, person] } } })
  }).as('reactCreateTurnaroundPerson')

  cy.intercept({ method: 'PATCH', pathname: '/cruise/turnaround-operations/*' }, req => {
    if (req.url.includes('/signoffs/') || req.url.includes('/staffing/')) return req.continue()

    const operationId = getPathSegmentAfter(getRequestPath(req), '/turnaround-operations/')
    const updatedOperations = baseTurnaroundOperations.map(operation => (
      operation.id === operationId
        ? {
            ...operation,
            ...req.body,
            commandStatus: req.body?.status || operation.commandStatus || operation.status,
            commandReadinessLevel: req.body?.readinessLevel || operation.commandReadinessLevel || operation.readinessLevel
          }
        : operation
    ))
    const operation = updatedOperations.find(candidate => candidate.id === operationId)

    req.reply({ statusCode: 200, body: { message: 'Turnaround command plan updated successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactUpdateTurnaroundOperationCommand')

  cy.intercept({ method: 'PATCH', pathname: '/cruise/turnaround-handoffs/*' }, req => {
    const handoffId = getPathSegmentAfter(getRequestPath(req), '/turnaround-handoffs/')
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      const handoffs = (operation.handoffs || []).map(handoff => handoff.id === handoffId ? { ...handoff, ...req.body, completedAt: req.body?.status === 'COMPLETE' ? '2026-12-12T10:45:00.000Z' : null } : handoff)
      const completedHandoffs = handoffs.filter(handoff => handoff.status === 'COMPLETE').length
      const blockedHandoffs = handoffs.filter(handoff => handoff.status === 'BLOCKED').length

      return {
        ...operation,
        handoffs,
        handoffSummary: {
          totalHandoffs: handoffs.length,
          completedHandoffs,
          blockedHandoffs,
          openHandoffs: Math.max(handoffs.length - completedHandoffs, 0)
        }
      }
    })
    const operation = updatedOperations.find(candidate => (candidate.handoffs || []).some(handoff => handoff.id === handoffId))

    req.reply({ statusCode: 200, body: { message: 'Turnaround handoff updated successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactUpdateTurnaroundHandoff')

  cy.intercept({ method: 'PATCH', pathname: '/cruise/turnaround-operations/*/staffing/*' }, req => {
    const routeRemainder = getPathSegmentAfter(getRequestPath(req), '/turnaround-operations/')
    const [operationId, staffingPath] = routeRemainder.split('/staffing/')
    const departmentRole = decodeURIComponent(staffingPath)
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      if (operation.id !== operationId) return operation

      const existingStaffing = operation.staffing || []
      const hasExistingStaffing = existingStaffing.some(staffing => staffing.departmentRole === departmentRole)
      const updatedStaffing = {
        id: hasExistingStaffing ? existingStaffing.find(staffing => staffing.departmentRole === departmentRole).id : 'turnaround-staffing-created',
        operationId,
        departmentRole,
        plannedCount: Number(req.body?.plannedCount || 0),
        checkedInCount: Number(req.body?.checkedInCount || 0),
        leadName: req.body?.leadName || 'Operational lead',
        musterLocation: req.body?.musterLocation || '',
        notes: req.body?.notes || ''
      }
      const staffing = hasExistingStaffing
        ? existingStaffing.map(row => row.departmentRole === departmentRole ? updatedStaffing : row)
        : [...existingStaffing, updatedStaffing]
      const plannedCount = staffing.reduce((sum, row) => sum + Number(row.plannedCount || 0), 0)
      const checkedInCount = staffing.reduce((sum, row) => sum + Number(row.checkedInCount || 0), 0)

      return {
        ...operation,
        staffing,
        staffingSummary: {
          totalDepartments: staffing.length,
          plannedCount,
          checkedInCount,
          gapCount: Math.max(plannedCount - checkedInCount, 0),
          checkInPercent: plannedCount === 0 ? 0 : Math.round((checkedInCount / plannedCount) * 100)
        }
      }
    })
    const operation = updatedOperations.find(candidate => candidate.id === operationId)

    req.reply({ statusCode: 200, body: { message: 'Turnaround staffing plan updated successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactUpdateTurnaroundStaffing')
  cy.intercept({ method: 'PATCH', pathname: '/cruise/turnaround-operations/*/signoffs/*' }, req => {
    const routeRemainder = getPathSegmentAfter(getRequestPath(req), '/turnaround-operations/')
    const [operationId, signoffPath] = routeRemainder.split('/signoffs/')
    const departmentRole = decodeURIComponent(signoffPath)
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      if (operation.id !== operationId) return operation

      const existingSignoffs = operation.signoffs || []
      const hasExistingSignoff = existingSignoffs.some(signoff => signoff.departmentRole === departmentRole)
      const updatedSignoff = {
        id: hasExistingSignoff ? existingSignoffs.find(signoff => signoff.departmentRole === departmentRole).id : 'turnaround-signoff-created',
        operationId,
        departmentRole,
        approverName: req.body?.approverName || 'Operational lead',
        status: req.body?.status || 'PENDING',
        notes: req.body?.notes || '',
        signedAt: req.body?.status === 'PENDING' ? null : '2026-12-12T10:30:00.000Z'
      }
      const signoffs = hasExistingSignoff
        ? existingSignoffs.map(signoff => signoff.departmentRole === departmentRole ? updatedSignoff : signoff)
        : [...existingSignoffs, updatedSignoff]
      const approvedSignoffs = signoffs.filter(signoff => signoff.status === 'APPROVED').length
      const blockedSignoffs = signoffs.filter(signoff => signoff.status === 'BLOCKED').length
      const pendingSignoffs = signoffs.filter(signoff => signoff.status === 'PENDING').length

      return {
        ...operation,
        signoffs,
        signoffSummary: {
          totalSignoffs: signoffs.length,
          approvedSignoffs,
          blockedSignoffs,
          pendingSignoffs,
          approvalPercent: signoffs.length === 0 ? 0 : Math.round((approvedSignoffs / signoffs.length) * 100)
        }
      }
    })
    const operation = updatedOperations.find(candidate => candidate.id === operationId)

    req.reply({ statusCode: 200, body: { message: 'Turnaround readiness signoff updated successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactUpdateTurnaroundSignoff')
  cy.intercept({ method: 'PATCH', pathname: '/cruise/turnaround-tasks/*/status' }, req => {
    const taskId = getPathSegmentAfter(getRequestPath(req), '/turnaround-tasks/').split('/status')[0]
    const requestedStatus = req.body?.status || 'IN_PROGRESS'
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      const tasks = operation.tasks.map(task => task.id === taskId ? { ...task, status: requestedStatus, blockerReason: req.body?.blockerReason || (requestedStatus === 'BLOCKED' ? 'Awaiting pier-side supervisor confirmation' : '') } : task)
      const completeTasks = tasks.filter(task => task.status === 'COMPLETE').length
      const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
      const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length
      const taskSummary = {
        totalTasks: tasks.length,
        completeTasks,
        blockedTasks,
        inProgressTasks,
        completionPercent: tasks.length === 0 ? 0 : Math.round((completeTasks / tasks.length) * 100)
      }

      return { ...operation, tasks, taskSummary, status: blockedTasks > 0 ? 'BLOCKED' : inProgressTasks > 0 ? 'IN_PROGRESS' : operation.status }
    })
    const operation = updatedOperations.find(candidate => candidate.tasks.some(task => task.id === taskId))

    req.reply({ statusCode: 200, body: { message: 'Turnaround task status updated successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactUpdateTurnaroundTaskStatus')
  cy.intercept({ method: 'PATCH', pathname: '/cruise/turnaround-tasks/*/details' }, req => {
    const taskId = getPathSegmentAfter(getRequestPath(req), '/turnaround-tasks/').split('/details')[0]
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      const tasks = operation.tasks.map(task => task.id === taskId ? { ...task, ...req.body } : task)

      return { ...operation, tasks }
    })
    const operation = updatedOperations.find(candidate => candidate.tasks.some(task => task.id === taskId))

    req.reply({ statusCode: 200, body: { message: 'Turnaround task details updated successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactUpdateTurnaroundTaskDetails')
  cy.intercept({ method: 'POST', pathname: '/cruise/turnaround-operations/*/tasks' }, req => {
    const operationId = getPathSegmentAfter(getRequestPath(req), '/turnaround-operations/').split('/tasks')[0]
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      if (operation.id !== operationId) return operation

      const createdTask = {
        id: 'turnaround-task-created',
        operationId,
        departmentRole: req.body?.departmentRole || 'turnaround-manager',
        taskName: req.body?.taskName || 'Created turnaround task',
        ownerName: req.body?.ownerName || '',
        dueTime: req.body?.dueTime || '',
        location: req.body?.location || '',
        blockerReason: req.body?.blockerReason || '',
        status: req.body?.status || 'READY',
        sortOrder: (operation.tasks || []).length + 1,
        updates: []
      }
      const tasks = [...(operation.tasks || []), createdTask]
      const completeTasks = tasks.filter(task => task.status === 'COMPLETE').length
      const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
      const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length

      return {
        ...operation,
        tasks,
        taskSummary: {
          totalTasks: tasks.length,
          completeTasks,
          blockedTasks,
          inProgressTasks,
          completionPercent: tasks.length === 0 ? 0 : Math.round((completeTasks / tasks.length) * 100)
        }
      }
    })
    const operation = updatedOperations.find(candidate => candidate.id === operationId)

    req.reply({ statusCode: 201, body: { message: 'Turnaround task created successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactCreateTurnaroundTask')
  cy.intercept({ method: 'POST', pathname: '/cruise/turnaround-tasks/*/updates' }, req => {
    const taskId = getPathSegmentAfter(getRequestPath(req), '/turnaround-tasks/').split('/updates')[0]
    const update = {
      id: 'turnaround-update-created',
      authorName: req.body?.authorName || 'Operational lead',
      updateType: req.body?.updateType || 'NOTE',
      message: req.body?.message || 'Update added',
      createdAt: '2026-12-12T09:30:00.000Z'
    }
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      const tasks = operation.tasks.map(task => task.id === taskId ? { ...task, updates: [update, ...(task.updates || [])] } : task)

      return { ...operation, tasks }
    })
    const operation = updatedOperations.find(candidate => candidate.tasks.some(task => task.id === taskId))

    req.reply({ statusCode: 201, body: { message: 'Turnaround task update added successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactCreateTurnaroundTaskUpdate')
  cy.intercept({ method: 'DELETE', pathname: '/cruise/turnaround-tasks/*' }, req => {
    const taskId = getPathSegmentAfter(getRequestPath(req), '/turnaround-tasks/')
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      const tasks = (operation.tasks || []).filter(task => task.id !== taskId)
      const completeTasks = tasks.filter(task => task.status === 'COMPLETE').length
      const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length
      const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length

      return {
        ...operation,
        tasks,
        taskSummary: {
          totalTasks: tasks.length,
          completeTasks,
          blockedTasks,
          inProgressTasks,
          completionPercent: tasks.length === 0 ? 0 : Math.round((completeTasks / tasks.length) * 100)
        }
      }
    })
    const operation = baseTurnaroundOperations.find(candidate => (candidate.tasks || []).some(task => task.id === taskId))
    const refreshedOperation = updatedOperations.find(candidate => candidate.id === operation?.id)

    req.reply({ statusCode: 200, body: { message: 'Turnaround task removed successfully', operation: hydrateReactTurnaroundOperation(refreshedOperation) } })
  }).as('reactDeleteTurnaroundTask')
  cy.intercept({ method: 'POST', pathname: '/cruise/turnaround-operations/*/escalations' }, req => {
    const operationId = getPathSegmentAfter(getRequestPath(req), '/turnaround-operations/').split('/escalations')[0]
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      if (operation.id !== operationId) return operation

      const escalation = {
        id: 'turnaround-escalation-created',
        operationId,
        departmentRole: req.body?.departmentRole || 'turnaround-manager',
        severity: req.body?.severity || 'WATCH',
        title: req.body?.title || 'Created escalation',
        ownerName: req.body?.ownerName || '',
        status: req.body?.status || 'OPEN',
        resolutionNotes: req.body?.resolutionNotes || '',
        createdAt: '2026-12-12T10:45:00.000Z'
      }
      const escalations = [escalation, ...(operation.escalations || [])]
      const openEscalations = escalations.filter(row => row.status === 'OPEN').length
      const monitoringEscalations = escalations.filter(row => row.status === 'MONITORING').length
      const resolvedEscalations = escalations.filter(row => row.status === 'RESOLVED').length
      const criticalEscalations = escalations.filter(row => row.severity === 'CRITICAL' && row.status !== 'RESOLVED').length

      return {
        ...operation,
        escalations,
        escalationSummary: { totalEscalations: escalations.length, openEscalations, monitoringEscalations, resolvedEscalations, criticalEscalations }
      }
    })
    const operation = updatedOperations.find(candidate => candidate.id === operationId)

    req.reply({ statusCode: 201, body: { message: 'Turnaround escalation created successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactCreateTurnaroundEscalation')
  cy.intercept({ method: 'PATCH', pathname: '/cruise/turnaround-escalations/*' }, req => {
    const escalationId = getPathSegmentAfter(getRequestPath(req), '/turnaround-escalations/')
    const updatedOperations = baseTurnaroundOperations.map(operation => {
      const escalations = (operation.escalations || []).map(escalation => escalation.id === escalationId ? { ...escalation, ...req.body } : escalation)
      const openEscalations = escalations.filter(row => row.status === 'OPEN').length
      const monitoringEscalations = escalations.filter(row => row.status === 'MONITORING').length
      const resolvedEscalations = escalations.filter(row => row.status === 'RESOLVED').length
      const criticalEscalations = escalations.filter(row => row.severity === 'CRITICAL' && row.status !== 'RESOLVED').length

      return {
        ...operation,
        escalations,
        escalationSummary: { totalEscalations: escalations.length, openEscalations, monitoringEscalations, resolvedEscalations, criticalEscalations }
      }
    })
    const operation = updatedOperations.find(candidate => (candidate.escalations || []).some(escalation => escalation.id === escalationId))

    req.reply({ statusCode: 200, body: { message: 'Turnaround escalation updated successfully', operation: hydrateReactTurnaroundOperation(operation) } })
  }).as('reactUpdateTurnaroundEscalation')
  cy.intercept('GET', '/cruise', overrides.cruiseLines || reactCruiseLines).as('reactCruiseLines')
}


function visitReactAppAsAdmin(overrides = {}) {
  interceptReactCoreApis(overrides)
  cy.visit('/')
  cy.wait('@reactDemoUsers')
  cy.wait('@reactCustomers')
  cy.wait('@reactBookings')
  cy.wait('@reactCruiseLines')
  cy.getByTestId(rs.personFinderPanel).should('be.visible')
  selectDemoUserByVisibleRole('Admin')
  cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Admin')
}

function openFirstReactFleetShips(ships = reactShips) {
  cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, ships).as('reactShips')
  cy.getByTestId(rs.fleetCard).first().within(() => {
    cy.getByTestId(rs.viewShipsButton).click()
  })
  cy.wait('@reactShips')
  cy.getByTestId(rs.selectedShipsPanel).should('be.visible')
  cy.getByTestId(rs.shipCard).should('have.length', ships.length)
}

function openFirstReactShipSailings(sailings = reactSailings) {
  cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, sailings).as('reactSailings')
  cy.getByTestId(rs.shipCard).first().within(() => {
    cy.getByTestId(rs.viewSailingsButton).click()
  })
  cy.wait('@reactSailings')
  cy.getByTestId(rs.sailingsPanel).should('be.visible')
  cy.getByTestId(rs.sailingCard).should('have.length', sailings.length)
}

function openFirstReactSailingItinerary(itinerary = reactItinerary) {
  cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, itinerary).as('reactItinerary')
  cy.getByTestId(rs.sailingCard).first().within(() => {
    cy.getByTestId(rs.viewItineraryButton).click()
  })
  cy.wait('@reactItinerary')
  cy.getByTestId(rs.itineraryPanel).should('be.visible')
  cy.getByTestId(rs.itineraryDayCard).should('have.length', itinerary.length)
}

module.exports = {
  reactCruiseLines,
  reactShips,
  reactSailings,
  reactItinerary,
  reactCustomers,
  reactBookings,
  reactTurnaroundOperations,
  reactDemoUsers,
  selectDemoUserByVisibleRole,
  interceptReactCoreApis,
  visitReactAppAsAdmin,
  openFirstReactFleetShips,
  openFirstReactShipSailings,
  openFirstReactSailingItinerary
}
