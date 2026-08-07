import { getRoleDashboardTitle, getSelectedRoleView, isOperationalRoleView, normalizeRole } from './roleIdentity.js'

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



