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

export function getWorkspaceUserAssignedShip(selectedDemoUser = {}) {
  const displayName = String(selectedDemoUser.displayName || '').trim()
  return selectedDemoUser.shipName
    || selectedDemoUser.assignedShip
    || selectedDemoUser.workspaceShip
    || (displayName.includes(' — ') ? displayName.split(' — ').slice(1).join(' — ').trim() : '')
}

function textMatchesName(value = '', baseName = '') {
  if (!baseName) return false
  return String(value || '').toLowerCase().includes(baseName.toLowerCase())
}

function operationMatchesAssignedShip(operation = {}, assignedShip = '') {
  if (!assignedShip) return true
  const shipName = operation.ship?.name || operation.shipName || ''
  const title = operation.title || ''
  const notes = operation.notes || ''
  const searchText = [shipName, title, notes].filter(Boolean).join(' ').toLowerCase()
  return searchText.includes(String(assignedShip).toLowerCase())
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
  const scopedOperations = turnaroundOperations.filter(operation =>
    operationMatchesAssignedShip(operation, assignedShip)
    && (!baseName || operationHasRoleUserAssignment(operation, roleView, baseName))
  )

  return scopedOperations.length > 0 ? scopedOperations : turnaroundOperations.filter(operation => operationMatchesAssignedShip(operation, assignedShip))
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
