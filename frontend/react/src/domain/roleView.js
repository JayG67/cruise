import { getCustomerName, getBookingPassengerNames, getBookingRoute } from './adminHierarchy.js'

export function normalizeRole(role = '') {
  const normalizedRole = String(role).toLowerCase().replace(/-/g, '_')

  if (normalizedRole.includes('admin')) return 'admin'
  if (normalizedRole.includes('group')) return 'group-leader'
  if (normalizedRole.includes('turnaround')) return 'turnaround-manager'
  if (normalizedRole.includes('housekeeping')) return 'housekeeping-lead'
  if (normalizedRole.includes('guest_services') || normalizedRole.includes('guest services')) return 'guest-services-lead'
  if (normalizedRole.includes('food_beverage') || normalizedRole.includes('food beverage')) return 'food-beverage-lead'
  if (normalizedRole.includes('engineering')) return 'engineering-lead'

  return 'passenger'
}

export function isOperationalRoleView(roleView = '') {
  return [
    'turnaround-manager',
    'housekeeping-lead',
    'guest-services-lead',
    'food-beverage-lead',
    'engineering-lead'
  ].includes(roleView)
}

export function getSelectedRoleView(selectedDemoUser = {}) {
  return normalizeRole(selectedDemoUser.role || selectedDemoUser.userType)
}

export function findDemoCustomer(selectedDemoUser = {}, customers = []) {
  return customers.find(customer => customer.id === selectedDemoUser.customerId)
}

export function getBookingsForCustomer(customerId, bookings = []) {
  if (!customerId) return []

  return bookings.filter(booking =>
    booking.createdByCustomerId === customerId
    || (booking.passengers || []).some(passenger =>
      passenger.customerId === customerId || passenger.customer?.id === customerId
    )
  )
}

export function getGroupVisibleBookings(selectedDemoUser = {}, bookings = []) {
  const groupCustomerIds = new Set(selectedDemoUser.customerIds || selectedDemoUser.visibleCustomerIds || [])

  if (selectedDemoUser.customerId) {
    groupCustomerIds.add(selectedDemoUser.customerId)
  }

  if (groupCustomerIds.size === 0) {
    return getBookingsForCustomer(selectedDemoUser.customerId, bookings)
  }

  return bookings.filter(booking =>
    (booking.passengers || []).some(passenger =>
      groupCustomerIds.has(passenger.customerId) || groupCustomerIds.has(passenger.customer?.id)
    )
  )
}

export function getVisibleRoleBookings(selectedDemoUser = {}, bookings = []) {
  const roleView = getSelectedRoleView(selectedDemoUser)

  if (roleView === 'admin' || isOperationalRoleView(roleView)) return bookings
  if (roleView === 'group-leader') return getGroupVisibleBookings(selectedDemoUser, bookings)

  return getBookingsForCustomer(selectedDemoUser.customerId, bookings)
}

export function getRoleDashboardTitle(roleView) {
  if (roleView === 'admin') return 'Admin workspace'
  if (roleView === 'group-leader') return 'Group booking dashboard'
  if (roleView === 'turnaround-manager') return 'Turnaround operations'
  if (roleView === 'housekeeping-lead') return 'Housekeeping operations'
  if (roleView === 'guest-services-lead') return 'Guest services operations'
  if (roleView === 'food-beverage-lead') return 'Food & beverage operations'
  if (roleView === 'engineering-lead') return 'Engineering operations'
  return 'Passenger booking dashboard'
}

export function getRoleSummaryLine({ selectedDemoUser, selectedCustomer, visibleBookings = [], customerCount = 0, bookingCount = 0 }) {
  const roleView = getSelectedRoleView(selectedDemoUser)

  if (roleView === 'admin') {
    return `Admin mode — full cruise data management enabled. ${customerCount} customers and ${bookingCount} bookings available.`
  }

  if (roleView === 'group-leader') {
    return `Showing ${visibleBookings.length} bookings visible to ${selectedDemoUser?.displayName || 'the group leader'}.`
  }

  if (isOperationalRoleView(roleView)) {
    return `${selectedDemoUser?.displayName || 'The selected operator'} is viewing the operational workspace for ${getRoleDashboardTitle(roleView).toLowerCase()} across ${visibleBookings.length} active booking${visibleBookings.length === 1 ? '' : 's'}.`
  }

  return `Showing ${visibleBookings.length} booking${visibleBookings.length === 1 ? '' : 's'} visible to ${selectedCustomer ? getCustomerName(selectedCustomer) : selectedDemoUser?.displayName || 'the selected passenger'}.`
}

export function getBookingCardTitle(booking = {}) {
  return `Booking ${booking.id || booking.bookingId || 'unavailable'}`
}

export function getBookingCardFields(booking = {}) {
  return [
    ['Cruise Line', booking.cruiseLine?.name || 'Cruise line unavailable'],
    ['Ship', booking.ship?.name || 'Ship unavailable'],
    ['Sailing Date', booking.sailing?.departureDate || 'Date unavailable'],
    ['Cabin', booking.cabinNumber || 'Not assigned'],
    ['Route', getBookingRoute(booking)]
  ]
}

export function getVisiblePassengerRows(booking = {}) {
  return (booking.passengers || []).map(passenger => {
    const name = passenger.customer ? getCustomerName(passenger.customer) : getCustomerName(passenger)
    return {
      id: passenger.customerId || passenger.customer?.id || name,
      name,
      role: passenger.passengerType || passenger.role || 'Guest'
    }
  }).filter(passenger => passenger.name)
}

export function getBookingItineraryDays(booking = {}) {
  const possibleItineraries = [
    booking.itinerary,
    booking.itineraryDays,
    booking.sailing?.itinerary,
    booking.sailing?.itineraryDays
  ]

  const itineraryDays = possibleItineraries.find(candidate => Array.isArray(candidate)) || []

  return [...itineraryDays].sort((a, b) => Number(a.day || 0) - Number(b.day || 0))
}

export function getItineraryDayActivities(day = {}) {
  const activities = Array.isArray(day.activities)
    ? day.activities
    : Array.isArray(day.activitySchedule)
      ? day.activitySchedule
      : []

  return [...activities].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
}

export function getSelectedCustomerName(selectedDemoUser = {}, customers = []) {
  return getCustomerName(findDemoCustomer(selectedDemoUser, customers) || { name: selectedDemoUser.displayName, id: selectedDemoUser.id })
}


export function getWorkspaceUserBaseName(selectedDemoUser = {}) {
  const displayName = String(selectedDemoUser.displayName || selectedDemoUser.name || selectedDemoUser.email || selectedDemoUser.id || '').trim()
  const roleTitle = getRoleDashboardTitle(getSelectedRoleView(selectedDemoUser)).replace(' operations', '').replace(' workspace', '')
  const withoutAssignment = displayName.split(' — ')[0].trim()
  const roleSuffixPattern = new RegExp(`\\s+${roleTitle.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i')

  return withoutAssignment.replace(roleSuffixPattern, '').trim() || withoutAssignment || displayName
}


export function getOperationalAssignmentShipName(selectedDemoUser = {}) {
  const displayName = String(selectedDemoUser.displayName || selectedDemoUser.name || '').trim()
  const explicitShip = selectedDemoUser.shipName
    || selectedDemoUser.assignedShip
    || selectedDemoUser.workspaceShip
    || selectedDemoUser.assignmentShipName
    || selectedDemoUser.assignedShipName

  if (explicitShip) return String(explicitShip).trim()

  if (displayName.includes(' — ')) {
    return displayName.split(' — ').slice(1).join(' — ').trim()
  }

  return ''
}

export function getOperationalAssignmentCruiseLineName(selectedDemoUser = {}, cruiseLines = []) {
  const explicitCruiseLine = selectedDemoUser.cruiseLineName
    || selectedDemoUser.assignedCruiseLine
    || selectedDemoUser.workspaceCruiseLine
    || selectedDemoUser.cruiseLineName

  if (explicitCruiseLine) return String(explicitCruiseLine).trim()

  const assignedShip = getOperationalAssignmentShipName(selectedDemoUser)
  if (!assignedShip) return ''

  const matchingCruiseLine = cruiseLines.find(cruiseLine =>
    (cruiseLine.ships || []).some(ship => String(ship.name || '').toLowerCase() === assignedShip.toLowerCase())
  )

  return matchingCruiseLine?.name || ''
}

export function hasOperationalAssignment(selectedDemoUser = {}) {
  return Boolean(getOperationalAssignmentShipName(selectedDemoUser))
}

export function normalizeOperationalDemoUsers(demoUsers = []) {
  const assignedByRole = new Map()

  demoUsers.forEach(user => {
    const roleView = normalizeRole(user.role || user.userType)
    if (!isOperationalRoleView(roleView)) return
    if (!hasOperationalAssignment(user)) return

    if (!assignedByRole.has(roleView)) assignedByRole.set(roleView, [])
    assignedByRole.get(roleView).push(user)
  })

  const seenAssignments = new Set()

  return demoUsers.filter(user => {
    const roleView = normalizeRole(user.role || user.userType)
    if (!isOperationalRoleView(roleView)) return true

    const hasAssignedUsersForRole = (assignedByRole.get(roleView) || []).length > 0
    if (hasAssignedUsersForRole && !hasOperationalAssignment(user)) return false

    const baseName = getWorkspaceUserBaseName(user).toLowerCase()
    const assignedShip = getOperationalAssignmentShipName(user).toLowerCase()
    const assignedCruiseLine = String(user.cruiseLineName || user.assignedCruiseLine || user.workspaceCruiseLine || '').toLowerCase()
    const assignmentKey = `${roleView}:${baseName}:${assignedCruiseLine}:${assignedShip}:${user.id || ''}`
    if (seenAssignments.has(assignmentKey)) return false

    seenAssignments.add(assignmentKey)
    return true
  })
}

export function getWorkspaceUserAssignedShip(selectedDemoUser = {}) {
  return getOperationalAssignmentShipName(selectedDemoUser)
}

function textMatchesName(value = '', baseName = '') {
  if (!baseName) return false
  return String(value || '').toLowerCase().includes(baseName.toLowerCase())
}

function operationMatchesAssignedShip(operation = {}, assignedShip = '') {
  if (!assignedShip) return false
  const shipName = operation.ship?.name || operation.shipName || ''
  const title = operation.title || ''
  const notes = operation.notes || ''
  const searchText = [shipName, title, notes].filter(Boolean).join(' ').toLowerCase()
  return searchText.includes(String(assignedShip).toLowerCase())
}

function operationMatchesAssignedCruiseLine(operation = {}, assignedCruiseLine = '') {
  if (!assignedCruiseLine) return false
  const cruiseLineName = operation.cruiseLine?.name || operation.cruiseLineName || ''
  return String(cruiseLineName).toLowerCase() === String(assignedCruiseLine).toLowerCase()
}

function operationHasRoleUserAssignment(operation = {}, roleView = '', baseName = '') {
  const normalizedRoleView = normalizeRole(roleView)
  const tasks = Array.isArray(operation.tasks) ? operation.tasks : []
  const staffing = Array.isArray(operation.staffing) ? operation.staffing : []
  const signoffs = Array.isArray(operation.signoffs) ? operation.signoffs : []
  const escalations = Array.isArray(operation.escalations) ? operation.escalations : []
  const handoffs = Array.isArray(operation.handoffs) ? operation.handoffs : []

  return tasks.some(task => normalizeRole(task.departmentRole) === normalizedRoleView && textMatchesName(task.ownerName, baseName))
    || staffing.some(row => normalizeRole(row.departmentRole) === normalizedRoleView && (
      textMatchesName(row.leadName, baseName)
      || textMatchesName(row.contacts, baseName)
      || textMatchesName((row.contactNames || []).join(' '), baseName)
    ))
    || signoffs.some(row => normalizeRole(row.departmentRole) === normalizedRoleView && textMatchesName(row.approverName, baseName))
    || escalations.some(row => normalizeRole(row.departmentRole) === normalizedRoleView && textMatchesName(row.ownerName, baseName))
    || handoffs.some(row => (
      normalizeRole(row.fromDepartmentRole) === normalizedRoleView
      || normalizeRole(row.toDepartmentRole) === normalizedRoleView
    ) && textMatchesName(row.ownerName, baseName))
}

export function getVisibleTurnaroundOperations(selectedDemoUser = {}, turnaroundOperations = []) {
  const roleView = getSelectedRoleView(selectedDemoUser)

  if (!isOperationalRoleView(roleView)) return []

  const baseName = getWorkspaceUserBaseName(selectedDemoUser)
  const assignedShip = getWorkspaceUserAssignedShip(selectedDemoUser)
  const assignedCruiseLine = getOperationalAssignmentCruiseLineName(selectedDemoUser)

  if (!assignedShip && !assignedCruiseLine) return []

  const assignedOperations = assignedCruiseLine
    ? turnaroundOperations.filter(operation => operationMatchesAssignedCruiseLine(operation, assignedCruiseLine))
    : turnaroundOperations.filter(operation => operationMatchesAssignedShip(operation, assignedShip))

  const specificallyAssignedOperations = assignedOperations.filter(operation =>
    !baseName || operationHasRoleUserAssignment(operation, roleView, baseName)
  )

  return specificallyAssignedOperations.length > 0 ? specificallyAssignedOperations : assignedOperations
}

export function getOperationalRoleFocus(roleView = '') {
  if (roleView === 'housekeeping-lead') return 'Cabin turnover, stateroom readiness, and inspection checkpoints'
  if (roleView === 'guest-services-lead') return 'Disembarkation flow, guest questions, and embarkation readiness'
  if (roleView === 'food-beverage-lead') return 'Provisioning, galley reset, and dining team handoff readiness'
  if (roleView === 'engineering-lead') return 'Fuel, water, safety systems, and technical clearance checks'
  return 'Cross-team turnaround plan, port timing, and ship readiness'
}

export function getOperationalChecklist(roleView = '') {
  const shared = ['Confirm arrival and next departure ports', 'Review passenger count and manifest pressure', 'Validate ship-readiness handoff before embarkation']

  if (roleView === 'housekeeping-lead') {
    return ['Prioritize cabin strip and reset windows', 'Flag accessibility and special-service cabins', ...shared]
  }

  if (roleView === 'guest-services-lead') {
    return ['Stage disembarkation communication', 'Prepare check-in exception handling', ...shared]
  }

  if (roleView === 'food-beverage-lead') {
    return ['Confirm provisions and cold-chain delivery windows', 'Review dining preference volume', ...shared]
  }

  if (roleView === 'engineering-lead') {
    return ['Confirm shore power, fuel, potable water, and waste windows', 'Review repositioning or route-risk notes', ...shared]
  }

  return ['Coordinate department readiness standups', 'Sequence disembarkation, provisioning, cleaning, and embarkation', ...shared]
}

export function getOperationalTasksForRole(operation = {}, roleView = '') {
  const tasks = Array.isArray(operation.tasks) ? operation.tasks : []

  if (roleView === 'turnaround-manager') {
    return tasks.filter(task => normalizeRole(task.departmentRole) === 'turnaround-manager')
  }

  return tasks.filter(task => normalizeRole(task.departmentRole) === roleView)
}



function getCommandCenterFallback(operation = {}, tasks = [], taskSummary = {}) {
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


export function buildTurnaroundOperationCards(turnaroundOperations = [], roleView = '') {
  return turnaroundOperations.map(operation => {
    const tasks = getOperationalTasksForRole(operation, roleView)
    const shipName = operation.ship?.name || 'Ship unavailable'
    const sailingDate = operation.sailing?.departureDate || operation.turnaroundDate || 'Date unavailable'
    const departurePort = operation.sailing?.departurePort || operation.port || 'Departure port unavailable'
    const arrivalPort = operation.sailing?.arrivalPort || operation.port || 'Arrival port unavailable'

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

    return {
      id: operation.id || `${shipName}-${sailingDate}`,
      operation,
      tasks,
      taskSummary,
      passengerCount: Number(operation.passengerCount || 0),
      route: `${departurePort} → ${arrivalPort}`,
      shipName,
      sailingDate,
      turnaroundDate: operation.turnaroundDate || sailingDate,
      port: operation.port || arrivalPort,
      departurePort,
      arrivalPort,
      readinessLevel: operation.readinessLevel || 'Readiness pending',
      commandStatus: operation.commandStatus || operation.status || 'PLANNED',
      commandReadinessLevel: operation.commandReadinessLevel || operation.readinessLevel || 'Readiness pending',
      signoffs: Array.isArray(operation.signoffs) ? operation.signoffs : [],
      signoffSummary: operation.signoffSummary || { totalSignoffs: 0, approvedSignoffs: 0, blockedSignoffs: 0, pendingSignoffs: 0, approvalPercent: 0 },
      escalations: Array.isArray(operation.escalations) ? operation.escalations : [],
      staffing: Array.isArray(operation.staffing) ? operation.staffing : [],
      staffingSummary: operation.staffingSummary || { totalDepartments: 0, plannedCount: 0, checkedInCount: 0, gapCount: 0, checkInPercent: 0 },
      taskDependencies: Array.isArray(operation.taskDependencies) ? operation.taskDependencies : [],
      dependencySummary: operation.dependencySummary || { totalDependencies: 0, activeDependencies: 0, clearedDependencies: 0 },
      handoffs: Array.isArray(operation.handoffs) ? operation.handoffs : [],
      handoffSummary: operation.handoffSummary || { totalHandoffs: 0, completedHandoffs: 0, blockedHandoffs: 0, openHandoffs: 0 },
      escalationSummary: operation.escalationSummary || { totalEscalations: 0, openEscalations: 0, monitoringEscalations: 0, resolvedEscalations: 0, criticalEscalations: 0 },
      lifecycleState: operation.lifecycleState || null,
      releasePacket: operation.releasePacket || null,
      operationalMetrics: operation.operationalMetrics || null,
      playbookTemplate: operation.playbookTemplate || null,
      operationalTimeline: operation.operationalTimeline || [],
      varianceReport: operation.varianceReport || null,
      playbookVariance: operation.playbookVariance || null,
      incidentCommand: operation.incidentCommand || null,
      afterActionReview: operation.afterActionReview || null,
      executiveBrief: operation.executiveBrief || null,
      reviewerPacket: operation.reviewerPacket || null,
      outreachBoard: operation.outreachBoard || null,
      managementStatus: operation.managementStatus || null,
      launchPlan: operation.launchPlan || null,
      scenarioPlan: operation.scenarioPlan || null,
      productionReadiness: operation.productionReadiness || null,
      applicationDossier: operation.applicationDossier || null,
      presentationGuide: operation.presentationGuide || null,
      closeoutPacket: operation.closeoutPacket || null,
      commandCenter: getCommandCenterFallback(operation, tasks, taskSummary),
      status: operation.status || 'PLANNED',
      title: operation.title || 'Turnaround operation',
      notes: operation.notes || ''
    }
  }).sort((a, b) => String(a.turnaroundDate).localeCompare(String(b.turnaroundDate)))
}

export function buildTurnaroundReadinessBookings(bookings = []) {
  return bookings.map(booking => {
    const passengerCount = (booking.passengers || []).length
    const itineraryDays = getBookingItineraryDays(booking)
    const firstDay = itineraryDays[0] || {}
    const lastDay = itineraryDays[itineraryDays.length - 1] || {}
    const route = getBookingRoute(booking)
    const shipName = booking.ship?.name || 'Ship unavailable'
    const sailingDate = booking.sailing?.departureDate || booking.departureDate || 'Date unavailable'
    const departurePort = booking.embarkationPort || booking.sailing?.departurePort || firstDay.port || 'Departure port unavailable'
    const arrivalPort = booking.debarkationPort || booking.sailing?.arrivalPort || lastDay.port || 'Arrival port unavailable'
    const readinessLevel = passengerCount >= 2 || itineraryDays.length >= 3 ? 'High coordination' : 'Standard coordination'

    return {
      id: booking.id || booking.bookingId || `${shipName}-${sailingDate}`,
      booking,
      passengerCount,
      itineraryDayCount: itineraryDays.length,
      route,
      shipName,
      sailingDate,
      departurePort,
      arrivalPort,
      readinessLevel
    }
  }).sort((a, b) => String(a.sailingDate).localeCompare(String(b.sailingDate)))
}

export { getBookingPassengerNames }
