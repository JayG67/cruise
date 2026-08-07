export const ROLE_OPTIONS = [
  ['turnaround-manager', 'Turnaround Manager'],
  ['housekeeping-lead', 'Housekeeping Lead'],
  ['guest-services-lead', 'Guest Services Lead'],
  ['food-beverage-lead', 'Food & Beverage Lead'],
  ['engineering-lead', 'Engineering Lead'],
  ['security-lead', 'Security Lead'],
  ['port-operations-lead', 'Port Operations Lead']
]

export const VISIBLE_ROSTER_LIMIT = 12
export const REQUIRED_TEAM_ROLES = ROLE_OPTIONS.map(([value]) => value)

export function normalizeRole(role = '') {
  return String(role || '').toLowerCase().replace(/_/g, '-')
}

export function getRoleLabel(role = '') {
  const normalizedRole = normalizeRole(role)
  const match = ROLE_OPTIONS.find(([value]) => value === normalizedRole)
  return match?.[1] || role
}


export function getTurnaroundAdminErrorMessage(error = {}) {
  const message = String(error.message || '')

  if (message.includes("Cannot find module '../encodings'") || message.includes('iconv-lite')) {
    return 'Local dependency install is incomplete. Stop the server, run npm install, then restart and create the assignment again.'
  }

  if (message === 'Internal server error') {
    return 'The server could not create this assignment. Refresh setup and try again; if it repeats, restart the app after reinstalling dependencies.'
  }

  return message || 'Unable to save turnaround assignment.'
}

export function initialDraft(cruiseLines = []) {
  return {
    displayName: '',
    role: 'housekeeping-lead',
    cruiseLineId: cruiseLines[0]?.id || '',
    assignedShipId: '',
    sailingId: ''
  }
}

export function getBasePersonName(displayName = '') {
  return String(displayName || '')
    .replace(/\s+—\s+.+$/, '')
    .replace(/\s+(Turnaround Manager|Housekeeping Lead|Guest Services Lead|Food & Beverage Lead|Engineering Lead|Security Lead|Port Operations Lead)$/i, '')
    .trim()
}

export function getSailingDate(sailing = {}) {
  if (!sailing) return ''
  return sailing.departureDate || sailing.date || sailing.sailingDate || ''
}

export function getAssignedSailingId(person = {}) {
  return person.assignedSailingId || person.sailingId || ''
}

export function getAssignmentPort({ person, ship, sailing } = {}) {
  return sailing?.departurePort || sailing?.port || ship?.currentPort || person?.homePort || person?.turnaroundPort || 'Port pool not assigned'
}

export function buildSameDayConflicts(people = [], sailings = []) {
  const safePeople = people.filter(Boolean)
  const safeSailings = sailings.filter(Boolean)
  const sailingById = new Map(safeSailings.map(sailing => [sailing.id, sailing]))
  const conflictMap = new Map()

  for (const person of safePeople) {
    const assignedSailingId = getAssignedSailingId(person)
    if (!assignedSailingId) continue

    const sailing = sailingById.get(assignedSailingId)
    const date = getSailingDate(sailing)
    if (!date) continue

    const baseName = getBasePersonName(person.displayName)
    const key = `${baseName}:${person.cruiseLineId || person.cruiseLineName || ''}:${date}`
    if (!conflictMap.has(key)) {
      conflictMap.set(key, {
        key,
        baseName,
        date,
        people: [],
        sailingIds: new Set(),
        shipIds: new Set()
      })
    }

    const conflict = conflictMap.get(key)
    conflict.people.push(person)
    conflict.sailingIds.add(assignedSailingId)
    if (person.assignedShipId) conflict.shipIds.add(person.assignedShipId)
  }

  return [...conflictMap.values()]
    .filter(conflict => conflict.sailingIds.size > 1 || conflict.shipIds.size > 1)
    .map(conflict => ({
      ...conflict,
      sailingIds: [...conflict.sailingIds],
      shipIds: [...conflict.shipIds]
    }))
}

export function buildTurnaroundTeamWorkspace({ people = [], cruiseLines = [], ships = [], sailings = [], selectedCruiseLineId = '', selectedShipId = '', selectedSailingId = '' } = {}) {
  const safePeople = people.filter(Boolean)
  const safeCruiseLines = cruiseLines.filter(Boolean)
  const safeShips = ships.filter(Boolean)
  const safeSailings = sailings.filter(Boolean)

  const selectedCruiseLine = safeCruiseLines.find(line => line.id === selectedCruiseLineId) || null
  const shipsForCruiseLine = safeShips.filter(ship => !selectedCruiseLineId || ship.cruiseLineId === selectedCruiseLineId)
  const selectedShip = shipsForCruiseLine.find(ship => ship.id === selectedShipId) || null
  const sailingsForShip = safeSailings.filter(sailing => !selectedShipId || sailing.shipId === selectedShipId)
  const selectedSailing = sailingsForShip.find(sailing => sailing.id === selectedSailingId) || null

  const peopleForCruiseLine = safePeople.filter(person => !selectedCruiseLineId || person.cruiseLineId === selectedCruiseLineId)
  const selectedTeam = peopleForCruiseLine
    .filter(person => selectedShipId ? person.assignedShipId === selectedShipId : !person.assignedShipId)
    .filter(person => !selectedSailingId || !getAssignedSailingId(person) || getAssignedSailingId(person) === selectedSailingId)
    .sort((a, b) => getRoleLabel(a.role).localeCompare(getRoleLabel(b.role)) || String(a.displayName).localeCompare(String(b.displayName)))

  const assignedRoleSet = new Set(selectedTeam.map(person => normalizeRole(person.roleView || person.role)))
  const missingRoles = REQUIRED_TEAM_ROLES.filter(role => !assignedRoleSet.has(role))
  const staffedRoleCount = REQUIRED_TEAM_ROLES.length - missingRoles.length
  const readinessScore = Math.round((staffedRoleCount / REQUIRED_TEAM_ROLES.length) * 100)

  const sailingDate = getSailingDate(selectedSailing)
  const sameDayConflicts = buildSameDayConflicts(peopleForCruiseLine, safeSailings)
  const selectedDateConflicts = sailingDate
    ? sameDayConflicts.filter(conflict => conflict.date === sailingDate)
    : []

  const replacementCandidatesByRole = REQUIRED_TEAM_ROLES.reduce((groups, role) => {
    groups[role] = peopleForCruiseLine.filter(person => {
      const personRole = normalizeRole(person.roleView || person.role)
      if (personRole !== role) return false
      if (selectedTeam.some(teamPerson => teamPerson.id === person.id)) return false
      return true
    })
    return groups
  }, {})

  return {
    selectedCruiseLine,
    shipsForCruiseLine,
    selectedShip,
    sailingsForShip,
    selectedSailing,
    peopleForCruiseLine,
    selectedTeam,
    missingRoles,
    readinessScore,
    staffedRoleCount,
    requiredRoleCount: REQUIRED_TEAM_ROLES.length,
    sameDayConflicts,
    selectedDateConflicts,
    replacementCandidatesByRole
  }
}

export function buildRosterGroups(people = [], ships = [], sailings = []) {
  const safePeople = people.filter(Boolean)
  const safeShips = ships.filter(Boolean)
  const safeSailings = sailings.filter(Boolean)
  const shipById = new Map(safeShips.map(ship => [ship.id, ship]))
  const firstSailingByShipId = new Map()

  for (const sailing of safeSailings) {
    if (!sailing.shipId || firstSailingByShipId.has(sailing.shipId)) continue
    firstSailingByShipId.set(sailing.shipId, sailing)
  }

  const groupMap = new Map()

  for (const person of safePeople) {
    const role = normalizeRole(person.roleView || person.role)
    const baseName = getBasePersonName(person.displayName)
    const ship = person.assignedShipId ? shipById.get(person.assignedShipId) : null
    const assignedSailingId = getAssignedSailingId(person)
    const sailing = assignedSailingId ? safeSailings.find(item => item.id === assignedSailingId) : firstSailingByShipId.get(person.assignedShipId)
    const homePort = getAssignmentPort({ person, ship, sailing })
    const groupKey = `${baseName}:${role}:${person.cruiseLineId || person.cruiseLineName || ''}:${homePort}`
    const assignmentDate = getSailingDate(sailing)

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        id: groupKey,
        baseName,
        role,
        roleLabel: getRoleLabel(role),
        cruiseLineName: person.cruiseLineName,
        homePort,
        people: [],
        ships: [],
        dates: [],
        conflicts: []
      })
    }

    const group = groupMap.get(groupKey)
    group.people.push(person)

    const shipName = person.assignedShipName || ship?.name || 'Cruise-line wide'
    if (!group.ships.includes(shipName)) group.ships.push(shipName)
    if (assignmentDate && !group.dates.includes(assignmentDate)) group.dates.push(assignmentDate)
  }

  for (const group of groupMap.values()) {
    const dateCounts = group.people.reduce((counts, person) => {
      const assignedSailingId = getAssignedSailingId(person)
      const sailing = assignedSailingId ? safeSailings.find(item => item.id === assignedSailingId) : firstSailingByShipId.get(person.assignedShipId)
      const date = getSailingDate(sailing)
      if (date) counts.set(date, (counts.get(date) || 0) + 1)
      return counts
    }, new Map())

    group.conflicts = [...dateCounts.entries()].filter(([, count]) => count > 1).map(([date]) => date)
  }

  return [...groupMap.values()].sort((a, b) => {
    const roleCompare = a.roleLabel.localeCompare(b.roleLabel)
    return roleCompare || a.baseName.localeCompare(b.baseName)
  })
}
