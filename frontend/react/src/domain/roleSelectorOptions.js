import {
  getOperationalAssignmentCruiseLineName,
  getOperationalAssignmentShipName,
  normalizeRole
} from './roleView.js'

export function formatDemoUserRole(role = 'Assigned person') {
  return role
    .toLowerCase()
    .replaceAll('-', '_')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatRoleOption(role = '') {
  if (role === 'admin') return 'Administrator'
  if (role === 'group-leader') return 'Group Leader'
  if (role === 'turnaround-manager') return 'Turnaround Manager'
  if (role === 'housekeeping-lead') return 'Housekeeping Lead'
  if (role === 'guest-services-lead') return 'Guest Services Lead'
  if (role === 'food-beverage-lead') return 'Food & Beverage Lead'
  if (role === 'engineering-lead') return 'Engineering Lead'
  if (role === 'security-lead') return 'Security Lead'
  if (role === 'port-operations-lead') return 'Port Operations Lead'
  return 'Passenger'
}

export function getDemoUserName(user = {}) {
  return user.displayName || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.id
}

function getBookingPassengerIds(booking = {}) {
  return new Set((booking.passengers || []).map(passenger => passenger.customerId || passenger.customer?.id).filter(Boolean))
}

function getBookingCruiseLineName(booking = {}) {
  return booking.cruiseLine?.name || booking.cruiseLineName || 'Cruise line unavailable'
}

function getBookingShipName(booking = {}) {
  return booking.ship?.name || booking.shipName || 'Ship unavailable'
}

function getBookingSailingDate(booking = {}) {
  return booking.sailing?.departureDate || booking.departureDate || 'Date unavailable'
}

function getBookingRoute(booking = {}) {
  const departure = booking.sailing?.departurePort || booking.departurePort || booking.embarkationPort
  const arrival = booking.sailing?.arrivalPort || booking.arrivalPort || booking.debarkationPort

  if (departure && arrival) return `${departure} to ${arrival}`
  return departure || arrival || ''
}

export function getPassengerBookingContexts(user = {}, bookings = []) {
  if (!user.customerId) return []

  return bookings.filter(booking => {
    const passengerIds = getBookingPassengerIds(booking)
    return booking.createdByCustomerId === user.customerId || passengerIds.has(user.customerId)
  }).map(booking => ({
    bookingId: booking.id,
    cruiseLine: getBookingCruiseLineName(booking),
    ship: getBookingShipName(booking),
    sailingDate: getBookingSailingDate(booking),
    route: getBookingRoute(booking),
    cabinNumber: booking.cabinNumber || 'Cabin pending'
  }))
}

export function buildPassengerOption(user = {}, bookings = []) {
  const contexts = getPassengerBookingContexts(user, bookings)
  const primaryContext = contexts[0]
  const name = getDemoUserName(user)

  if (!primaryContext) {
    return {
      user,
      name,
      contexts,
      label: name,
      detail: 'No active booking context yet',
      searchText: `${name} passenger no active booking context`.toLowerCase()
    }
  }

  const contextSummary = contexts.length > 1
    ? `${contexts.length} active bookings`
    : `${primaryContext.cruiseLine} · ${primaryContext.ship} · ${primaryContext.sailingDate}`

  return {
    user,
    name,
    contexts,
    label: `${name} — ${contextSummary}`,
    detail: `${primaryContext.cruiseLine} · ${primaryContext.ship} · ${primaryContext.sailingDate}${primaryContext.route ? ` · ${primaryContext.route}` : ''}`,
    searchText: [
      name,
      user.email,
      user.id,
      user.customerId,
      ...contexts.flatMap(context => [context.bookingId, context.cruiseLine, context.ship, context.sailingDate, context.route, context.cabinNumber])
    ].filter(Boolean).join(' ').toLowerCase()
  }
}

export function sortPassengerOptions(options = []) {
  return [...options].sort((a, b) => {
    const aHasContext = a.contexts.length > 0
    const bHasContext = b.contexts.length > 0

    if (aHasContext !== bHasContext) return aHasContext ? -1 : 1

    const aDate = a.contexts[0]?.sailingDate || ''
    const bDate = b.contexts[0]?.sailingDate || ''
    const dateComparison = String(aDate).localeCompare(String(bDate))

    if (dateComparison !== 0) return dateComparison
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

function sortPassengerFilterValues(values = [], key = '') {
  return [...values].sort((a, b) => key === 'sailingDate'
    ? String(a).localeCompare(String(b))
    : String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }))
}

export function getPassengerFilterOptions(passengerOptions = [], key, activeFilters = {}) {
  const values = new Set()

  passengerOptions.forEach(option => {
    option.contexts.forEach(context => {
      const matchesCruiseLine = key === 'cruiseLine' || !activeFilters.cruiseLine || context.cruiseLine === activeFilters.cruiseLine
      const matchesShip = key === 'ship' || !activeFilters.ship || context.ship === activeFilters.ship
      const matchesSailingDate = key === 'sailingDate' || !activeFilters.sailingDate || context.sailingDate === activeFilters.sailingDate

      if (matchesCruiseLine && matchesShip && matchesSailingDate && context[key]) values.add(context[key])
    })
  })

  return sortPassengerFilterValues(values, key)
}

export function passengerMatchesFilter(option, filterKey, value) {
  if (!value) return true
  return option.contexts.some(context => context[filterKey] === value)
}

export function formatDemoUserLabel(user, bookings = []) {
  const roleView = normalizeRole(user.role || user.userType)
  const name = getDemoUserName(user)

  if (roleView === 'passenger') return buildPassengerOption(user, bookings).label
  if (roleView === 'admin' || roleView === 'group-leader') {
    return `${name} (${formatDemoUserRole(user.role || user.userType || 'Assigned person')})`
  }
  return name
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getWorkspaceUserBaseName(user = {}) {
  const roleLabel = formatDemoUserRole(user.role || user.userType || 'Assigned person')
  const displayName = getDemoUserName(user)
  const withoutAssignment = displayName.split(' — ')[0].trim()
  const roleSuffixPattern = new RegExp(`\\s+${escapeRegExp(roleLabel)}$`, 'i')

  return withoutAssignment.replace(roleSuffixPattern, '').trim() || withoutAssignment || displayName
}

export function buildWorkspaceUserOption(user = {}, bookings = []) {
  const roleView = normalizeRole(user.role || user.userType)
  if (roleView === 'passenger') return buildPassengerOption(user, bookings)

  const displayName = getDemoUserName(user)
  const name = getWorkspaceUserBaseName(user)
  const roleLabel = formatDemoUserRole(user.role || user.userType || 'Assigned person')
  const assignment = getOperationalAssignmentShipName(user) || user.department || user.email || 'Workspace access'

  return {
    user,
    name,
    contexts: [],
    label: formatDemoUserLabel(user, bookings),
    detail: `${roleLabel} · ${assignment}`,
    searchText: [name, displayName, roleLabel, assignment, user.email, user.id].filter(Boolean).join(' ').toLowerCase()
  }
}

export function condenseWorkspaceUserOptions(options = []) {
  const groupedOptions = []
  const optionIndexes = new Map()

  options.forEach(option => {
    const roleLabel = formatDemoUserRole(option.user?.role || option.user?.userType || 'Assigned person')
    const groupKey = `${option.name}|${roleLabel}`.toLowerCase()
    const existingIndex = optionIndexes.get(groupKey)

    if (existingIndex === undefined) {
      optionIndexes.set(groupKey, groupedOptions.length)
      groupedOptions.push({ ...option, workspaceCount: 1, workspaceDetails: [option.detail].filter(Boolean) })
      return
    }

    const existing = groupedOptions[existingIndex]
    const workspaceDetails = new Set(existing.workspaceDetails || [])
    if (option.detail) workspaceDetails.add(option.detail)

    groupedOptions[existingIndex] = {
      ...existing,
      workspaceCount: existing.workspaceCount + 1,
      workspaceDetails: [...workspaceDetails],
      detail: `${roleLabel} · ${existing.workspaceCount + 1} assigned workspaces`,
      searchText: `${existing.searchText} ${option.searchText}`.toLowerCase()
    }
  })

  return groupedOptions.map(option => (option.workspaceCount || 1) <= 1
    ? option
    : { ...option, detail: `${formatDemoUserRole(option.user?.role || option.user?.userType || 'Assigned person')} · ${option.workspaceCount} assigned workspaces` })
}

export function isOperationalRole(roleView = '') {
  return ['turnaround-manager', 'housekeeping-lead', 'guest-services-lead', 'food-beverage-lead', 'engineering-lead'].includes(roleView)
}

export function getOperationalAssignmentContext(user = {}) {
  const shipName = getOperationalAssignmentShipName(user)
  const cruiseLineName = getOperationalAssignmentCruiseLineName(user)

  return {
    cruiseLineName,
    shipName,
    searchText: [cruiseLineName, shipName].filter(Boolean).join(' ').toLowerCase()
  }
}

export function getOperationalFilterOptions(options = [], key) {
  const values = new Set()
  options.forEach(option => {
    const value = option.assignment?.[key]
    if (value) values.add(value)
  })
  return [...values].sort((a, b) => String(a).localeCompare(String(b)))
}

export function getRoleSummary(user, customerCount, bookingCount, visibleBookingCount = bookingCount) {
  if (!user) return `Loading people — ${customerCount} customers and ${bookingCount} bookings available.`

  const role = (user.role || '').toLowerCase()
  if (role.includes('admin')) return `Admin mode — full cruise data management enabled. ${customerCount} customers and ${bookingCount} bookings available.`
  if (role.includes('group')) return `Group leader mode — ${visibleBookingCount} visible booking${visibleBookingCount === 1 ? '' : 's'} available.`
  if (role.includes('turnaround') || role.includes('housekeeping') || role.includes('guest_services') || role.includes('food_beverage') || role.includes('engineering')) {
    return `${formatDemoUserRole(user.role)} mode — operational workspace access is selected for upcoming turnaround operations.`
  }
  return `Passenger mode — ${visibleBookingCount} visible booking${visibleBookingCount === 1 ? '' : 's'} available.`
}
