import { useEffect, useMemo, useState } from 'react'

import { getOperationalAssignmentCruiseLineName, getOperationalAssignmentShipName, normalizeRole } from '../domain/roleView.js'

function formatDemoUserRole(role = 'Demo User') {
  return role
    .toLowerCase()
    .replaceAll('-', '_')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatRoleOption(role = '') {
  if (role === 'admin') return 'Administrator'
  if (role === 'group-leader') return 'Group Leader'
  if (role === 'turnaround-manager') return 'Turnaround Manager'
  if (role === 'housekeeping-lead') return 'Housekeeping Lead'
  if (role === 'guest-services-lead') return 'Guest Services Lead'
  if (role === 'food-beverage-lead') return 'Food & Beverage Lead'
  if (role === 'engineering-lead') return 'Engineering Lead'
  return 'Passenger'
}

function getDemoUserName(user = {}) {
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

function getPassengerBookingContexts(user = {}, bookings = []) {
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

function buildPassengerOption(user = {}, bookings = []) {
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

function sortPassengerFilterValues(values = [], key = '') {
  return [...values].sort((a, b) => {
    if (key === 'sailingDate') {
      return String(a).localeCompare(String(b))
    }

    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
  })
}

function getPassengerFilterOptions(passengerOptions = [], key, activeFilters = {}) {
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

function passengerMatchesFilter(option, filterKey, value) {
  if (!value) return true
  return option.contexts.some(context => context[filterKey] === value)
}

function formatDemoUserLabel(user, bookings = []) {
  const roleView = normalizeRole(user.role || user.userType)
  const name = getDemoUserName(user)

  if (roleView === 'passenger') {
    return buildPassengerOption(user, bookings).label
  }

  if (roleView === 'admin' || roleView === 'group-leader') {
    return `${name} (${formatDemoUserRole(user.role || user.userType || 'Demo User')})`
  }

  return name
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getWorkspaceUserBaseName(user = {}) {
  const roleLabel = formatDemoUserRole(user.role || user.userType || 'Demo User')
  const displayName = getDemoUserName(user)
  const withoutAssignment = displayName.split(' — ')[0].trim()
  const roleSuffixPattern = new RegExp(`\\s+${escapeRegExp(roleLabel)}$`, 'i')

  return withoutAssignment.replace(roleSuffixPattern, '').trim() || withoutAssignment || displayName
}

function buildWorkspaceUserOption(user = {}, bookings = []) {
  const roleView = normalizeRole(user.role || user.userType)

  if (roleView === 'passenger') return buildPassengerOption(user, bookings)

  const displayName = getDemoUserName(user)
  const name = getWorkspaceUserBaseName(user)
  const roleLabel = formatDemoUserRole(user.role || user.userType || 'Demo User')
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


function condenseWorkspaceUserOptions(options = []) {
  const groupedOptions = []
  const optionIndexes = new Map()

  options.forEach(option => {
    const roleLabel = formatDemoUserRole(option.user?.role || option.user?.userType || 'Demo User')
    const groupKey = `${option.name}|${roleLabel}`.toLowerCase()
    const existingIndex = optionIndexes.get(groupKey)

    if (existingIndex === undefined) {
      optionIndexes.set(groupKey, groupedOptions.length)
      groupedOptions.push({
        ...option,
        workspaceCount: 1,
        workspaceDetails: [option.detail].filter(Boolean)
      })
      return
    }

    const existing = groupedOptions[existingIndex]
    const workspaceDetails = new Set(existing.workspaceDetails || [])
    if (option.detail) workspaceDetails.add(option.detail)

    groupedOptions[existingIndex] = {
      ...existing,
      workspaceCount: existing.workspaceCount + 1,
      workspaceDetails: [...workspaceDetails],
      detail: existing.workspaceCount + 1 > 1
        ? `${roleLabel} · ${existing.workspaceCount + 1} assigned workspaces`
        : existing.detail,
      searchText: `${existing.searchText} ${option.searchText}`.toLowerCase()
    }
  })

  return groupedOptions.map(option => {
    if ((option.workspaceCount || 1) <= 1) return option

    return {
      ...option,
      detail: `${formatDemoUserRole(option.user?.role || option.user?.userType || 'Demo User')} · ${option.workspaceCount} assigned workspaces`
    }
  })
}


function isOperationalRole(roleView = '') {
  return roleView === 'turnaround-manager'
    || roleView === 'housekeeping-lead'
    || roleView === 'guest-services-lead'
    || roleView === 'food-beverage-lead'
    || roleView === 'engineering-lead'
}

function getOperationalAssignmentContext(user = {}) {
  const shipName = getOperationalAssignmentShipName(user)
  const cruiseLineName = getOperationalAssignmentCruiseLineName(user)

  return {
    cruiseLineName,
    shipName,
    searchText: [cruiseLineName, shipName].filter(Boolean).join(' ').toLowerCase()
  }
}

function getOperationalFilterOptions(options = [], key) {
  const values = new Set()

  options.forEach(option => {
    const value = option.assignment?.[key]
    if (value) values.add(value)
  })

  return [...values].sort((a, b) => String(a).localeCompare(String(b)))
}

function getOperationalAssignmentAudit({
  sourceOptions = [],
  filteredOptions = [],
  cruiseLineFilter = '',
  shipFilter = '',
  displayLimit = 16
} = {}) {
  const scopedOptions = sourceOptions.filter(option => option.assignment?.cruiseLineName === cruiseLineFilter)
  const scopedShipNames = new Set(scopedOptions.map(option => option.assignment?.shipName).filter(Boolean))
  const scopedRoleNames = new Set(scopedOptions.map(option => formatDemoUserRole(option.user?.role || option.user?.userType || 'Demo User')))
  const visibleCruiseLines = new Set(filteredOptions.map(option => option.assignment?.cruiseLineName).filter(Boolean))
  const selectedShipOptions = shipFilter
    ? scopedOptions.filter(option => option.assignment?.shipName === shipFilter)
    : scopedOptions
  const visibleCardCount = Math.min(filteredOptions.length, displayLimit)
  const hiddenCardCount = Math.max(filteredOptions.length - displayLimit, 0)

  return {
    cruiseLineName: cruiseLineFilter || 'No cruise line selected',
    shipName: shipFilter || (cruiseLineFilter ? 'All ships in selected cruise line' : 'Select a cruise line first'),
    scopedPeopleCount: scopedOptions.length,
    scopedShipCount: scopedShipNames.size,
    scopedRoleCount: scopedRoleNames.size,
    matchingPeopleCount: filteredOptions.length,
    selectedShipPeopleCount: selectedShipOptions.length,
    visibleCardCount,
    hiddenCardCount,
    crossLineVisibleCount: Math.max(visibleCruiseLines.size - (cruiseLineFilter ? 1 : 0), 0)
  }
}


function getOperationalAssignmentRoster({
  sourceOptions = [],
  filteredOptions = [],
  cruiseLineFilter = '',
  shipFilter = ''
} = {}) {
  const scopedOptions = cruiseLineFilter
    ? sourceOptions.filter(option => option.assignment?.cruiseLineName === cruiseLineFilter)
    : []
  const visibleOptionIds = new Set(filteredOptions.map(option => option.user?.id).filter(Boolean))
  const roleLabelFor = option => formatDemoUserRole(option.user?.role || option.user?.userType || 'Demo User')

  const shipMap = new Map()
  scopedOptions.forEach(option => {
    const shipName = option.assignment?.shipName || 'Unassigned ship'
    const roleLabel = roleLabelFor(option)
    if (!shipMap.has(shipName)) {
      shipMap.set(shipName, {
        shipName,
        peopleCount: 0,
        visibleCount: 0,
        roleCounts: new Map()
      })
    }

    const shipRow = shipMap.get(shipName)
    shipRow.peopleCount += 1
    if (visibleOptionIds.has(option.user?.id)) shipRow.visibleCount += 1
    shipRow.roleCounts.set(roleLabel, (shipRow.roleCounts.get(roleLabel) || 0) + 1)
  })

  const roleMap = new Map()
  scopedOptions.forEach(option => {
    const roleLabel = roleLabelFor(option)
    const shipName = option.assignment?.shipName || 'Unassigned ship'
    if (!roleMap.has(roleLabel)) {
      roleMap.set(roleLabel, {
        roleLabel,
        peopleCount: 0,
        visibleCount: 0,
        shipNames: new Set()
      })
    }

    const roleRow = roleMap.get(roleLabel)
    roleRow.peopleCount += 1
    if (visibleOptionIds.has(option.user?.id)) roleRow.visibleCount += 1
    roleRow.shipNames.add(shipName)
  })

  const shipRows = [...shipMap.values()]
    .map(row => ({
      ...row,
      roleSummary: [...row.roleCounts.entries()]
        .sort(([roleA], [roleB]) => roleA.localeCompare(roleB))
        .map(([role, count]) => `${count} ${role}`)
        .join(' · ') || 'No role assignments'
    }))
    .sort((a, b) => a.shipName.localeCompare(b.shipName))

  const roleRows = [...roleMap.values()]
    .map(row => ({
      ...row,
      shipCount: row.shipNames.size,
      shipSummary: [...row.shipNames].sort((a, b) => a.localeCompare(b)).join(' · ') || 'No ship assignments'
    }))
    .sort((a, b) => a.roleLabel.localeCompare(b.roleLabel))

  return {
    cruiseLineName: cruiseLineFilter || 'Select a cruise line',
    shipFilter: shipFilter || 'All selected-line ships',
    shipRows: shipFilter ? shipRows.filter(row => row.shipName === shipFilter) : shipRows,
    roleRows,
    totalScopedPeople: scopedOptions.length,
    totalVisiblePeople: filteredOptions.length
  }
}


function getOperationalDeploymentMatrix({
  sourceOptions = [],
  filteredOptions = [],
  cruiseLineFilter = '',
  shipFilter = ''
} = {}) {
  const scopedOptions = cruiseLineFilter
    ? sourceOptions.filter(option => option.assignment?.cruiseLineName === cruiseLineFilter)
    : []
  const visibleOptionIds = new Set(filteredOptions.map(option => option.user?.id).filter(Boolean))
  const roleLabelFor = option => formatDemoUserRole(option.user?.role || option.user?.userType || 'Demo User')
  const roleLabels = [...new Set(scopedOptions.map(roleLabelFor))].sort((a, b) => a.localeCompare(b))
  const shipMap = new Map()

  scopedOptions.forEach(option => {
    const shipName = option.assignment?.shipName || 'Unassigned ship'
    const roleLabel = roleLabelFor(option)
    if (!shipMap.has(shipName)) {
      shipMap.set(shipName, {
        shipName,
        peopleCount: 0,
        visibleCount: 0,
        roleCounts: new Map(),
        personNames: new Set()
      })
    }

    const row = shipMap.get(shipName)
    row.peopleCount += 1
    if (visibleOptionIds.has(option.user?.id)) row.visibleCount += 1
    row.roleCounts.set(roleLabel, (row.roleCounts.get(roleLabel) || 0) + 1)
    row.personNames.add(option.name)
  })

  const rows = [...shipMap.values()]
    .filter(row => !shipFilter || row.shipName === shipFilter)
    .map(row => {
      const roleCells = roleLabels.map(roleLabel => {
        const count = row.roleCounts.get(roleLabel) || 0
        return {
          roleLabel,
          count,
          status: count > 0 ? 'Covered' : 'Gap'
        }
      })
      const coveredRoleCount = roleCells.filter(cell => cell.count > 0).length
      const gapCount = Math.max(roleLabels.length - coveredRoleCount, 0)

      return {
        shipName: row.shipName,
        peopleCount: row.peopleCount,
        visibleCount: row.visibleCount,
        roleCells,
        coveredRoleCount,
        gapCount,
        coveragePercent: roleLabels.length === 0 ? 0 : Math.round((coveredRoleCount / roleLabels.length) * 100),
        peopleSummary: [...row.personNames].slice(0, 4).join(' · ')
      }
    })
    .sort((a, b) => a.shipName.localeCompare(b.shipName))

  const totalRoleGaps = rows.reduce((sum, row) => sum + row.gapCount, 0)
  const readyShipCount = rows.filter(row => row.gapCount === 0 && row.peopleCount > 0).length

  return {
    cruiseLineName: cruiseLineFilter || 'Select a cruise line',
    shipFilter: shipFilter || 'All selected-line ships',
    roleLabels,
    rows,
    totalRoleGaps,
    readyShipCount,
    reviewedShipCount: rows.length,
    summary: rows.length === 0
      ? 'Select a cruise line to review ship-role coverage.'
      : `${readyShipCount} of ${rows.length} ships fully covered · ${totalRoleGaps} role gaps`
  }
}

function getRoleSummary(user, customerCount, bookingCount, visibleBookingCount = bookingCount) {
  if (!user) {
    return `Loading people — ${customerCount} customers and ${bookingCount} bookings available.`
  }

  const role = (user.role || '').toLowerCase()

  if (role.includes('admin')) {
    return `Admin mode — full cruise data management enabled. ${customerCount} customers and ${bookingCount} bookings available.`
  }

  if (role.includes('group')) {
    return `Group leader mode — ${visibleBookingCount} visible booking${visibleBookingCount === 1 ? '' : 's'} available.`
  }

  if (role.includes('turnaround') || role.includes('housekeeping') || role.includes('guest_services') || role.includes('food_beverage') || role.includes('engineering')) {
    return `${formatDemoUserRole(user.role)} mode — operational workspace access is selected for upcoming turnaround operations.`
  }

  return `Passenger mode — ${visibleBookingCount} visible booking${visibleBookingCount === 1 ? '' : 's'} available.`
}

export default function ReactRoleSelector({
  customerCount = 0,
  bookingCount = 0,
  bookings = [],
  demoUsers = [],
  filteredDemoUsers = demoUsers,
  availableRoles = [],
  selectedRole = '',
  selectedDemoUserId = '',
  selectedDemoUser,
  isLoadingDemoUsers = false,
  demoUserError = '',
  onSelectRole,
  onSelectDemoUser,
  visibleBookingCount = bookingCount
}) {
  const [passengerSearch, setPassengerSearch] = useState('')
  const [passengerCruiseLineFilter, setPassengerCruiseLineFilter] = useState('')
  const [passengerShipFilter, setPassengerShipFilter] = useState('')
  const [passengerSailingDateFilter, setPassengerSailingDateFilter] = useState('')
  const [personSearch, setPersonSearch] = useState('')
  const [operationalCruiseLineFilter, setOperationalCruiseLineFilter] = useState('')
  const [operationalShipFilter, setOperationalShipFilter] = useState('')
  const [operationalFilterTouched, setOperationalFilterTouched] = useState(false)
  const roleOptions = availableRoles.length > 0 ? availableRoles : ['admin', 'passenger', 'group-leader']
  const isPassengerFilterActive = selectedRole === 'passenger'
  const selectedRoleView = normalizeRole(selectedRole)
  const isOperationalFilterActive = isOperationalRole(selectedRoleView)

  const passengerOptions = useMemo(() => {
    if (!isPassengerFilterActive) return []

    return filteredDemoUsers
      .filter(user => normalizeRole(user.role || user.userType) === 'passenger')
      .map(user => buildPassengerOption(user, bookings))
  }, [filteredDemoUsers, bookings, isPassengerFilterActive])

  const visiblePassengerOptions = useMemo(() => {
    const search = passengerSearch.trim().toLowerCase()

    return passengerOptions.filter(option => {
      const matchesSearch = !search || option.searchText.includes(search)
      const matchesCruiseLine = passengerMatchesFilter(option, 'cruiseLine', passengerCruiseLineFilter)
      const matchesShip = passengerMatchesFilter(option, 'ship', passengerShipFilter)
      const matchesSailingDate = passengerMatchesFilter(option, 'sailingDate', passengerSailingDateFilter)

      return matchesSearch && matchesCruiseLine && matchesShip && matchesSailingDate
    })
  }, [passengerOptions, passengerSearch, passengerCruiseLineFilter, passengerShipFilter, passengerSailingDateFilter])

  const personSelectUsers = useMemo(() => {
    if (!isPassengerFilterActive) return filteredDemoUsers

    const selectedPassenger = selectedDemoUserId
      ? passengerOptions.find(option => option.user.id === selectedDemoUserId)?.user
      : null

    const hasActiveFinderCriteria = Boolean(
      passengerSearch.trim()
      || passengerCruiseLineFilter
      || passengerShipFilter
      || passengerSailingDateFilter
    )

    const resultUsers = visiblePassengerOptions
      .slice(0, hasActiveFinderCriteria ? 50 : 12)
      .map(option => option.user)

    if (!hasActiveFinderCriteria && selectedPassenger && !resultUsers.some(user => user.id === selectedPassenger.id)) {
      return [selectedPassenger, ...resultUsers]
    }

    return resultUsers
  }, [
    filteredDemoUsers,
    isPassengerFilterActive,
    passengerOptions,
    passengerSearch,
    passengerCruiseLineFilter,
    passengerShipFilter,
    passengerSailingDateFilter,
    selectedDemoUserId,
    visiblePassengerOptions
  ])

  const visibleDemoUsers = personSelectUsers
  const personSearchText = personSearch.trim().toLowerCase()
  const operationalSourceOptions = useMemo(() => {
    if (!isOperationalFilterActive) return []

    return filteredDemoUsers
      .filter(user => normalizeRole(user.role || user.userType) === selectedRoleView)
      .map(user => ({
        ...buildWorkspaceUserOption(user, bookings),
        assignment: getOperationalAssignmentContext(user)
      }))
  }, [bookings, filteredDemoUsers, isOperationalFilterActive, selectedRoleView])

  const operationalCruiseLineOptions = useMemo(() => getOperationalFilterOptions(operationalSourceOptions, 'cruiseLineName'), [operationalSourceOptions])
  const operationalShipOptions = useMemo(() => {
    if (!operationalCruiseLineFilter) return []
    return getOperationalFilterOptions(
      operationalSourceOptions.filter(option => option.assignment?.cruiseLineName === operationalCruiseLineFilter),
      'shipName'
    )
  }, [operationalCruiseLineFilter, operationalSourceOptions])

  const personOptionCards = useMemo(() => {
    if (isOperationalFilterActive) {
      if (!operationalCruiseLineFilter) return []

      return operationalSourceOptions.filter(option => {
        const matchesSearch = !personSearchText || (`${option.searchText} ${option.assignment?.searchText || ''}`).includes(personSearchText)
        const matchesCruiseLine = option.assignment?.cruiseLineName === operationalCruiseLineFilter
        const matchesShip = !operationalShipFilter || option.assignment?.shipName === operationalShipFilter

        return matchesSearch && matchesCruiseLine && matchesShip
      })
    }

    const sourceUsers = isPassengerFilterActive ? visibleDemoUsers : filteredDemoUsers
    const matchingOptions = sourceUsers
      .map(user => buildWorkspaceUserOption(user, bookings))
      .filter(option => !personSearchText || option.searchText.includes(personSearchText))

    if (isPassengerFilterActive) return matchingOptions

    return condenseWorkspaceUserOptions(matchingOptions)
  }, [
    bookings,
    filteredDemoUsers,
    isOperationalFilterActive,
    isPassengerFilterActive,
    operationalCruiseLineFilter,
    operationalShipFilter,
    operationalSourceOptions,
    personSearchText,
    visibleDemoUsers
  ])

  const displayedPersonOptionCards = useMemo(() => {
    const selectedOption = selectedDemoUserId
      ? personOptionCards.find(option => option.user.id === selectedDemoUserId)
      : null
    const visibleOptions = personOptionCards.slice(0, 16)

    if (selectedOption && !visibleOptions.some(option => option.user.id === selectedOption.user.id)) {
      return [selectedOption, ...visibleOptions.slice(0, 15)]
    }

    return visibleOptions
  }, [personOptionCards, selectedDemoUserId])

  const visibleSelectorCount = isOperationalFilterActive ? personOptionCards.length : visibleDemoUsers.length
  const availableRoleCount = isOperationalFilterActive ? operationalSourceOptions.length : filteredDemoUsers.length
  const operationalAssignmentAudit = useMemo(() => getOperationalAssignmentAudit({
    sourceOptions: operationalSourceOptions,
    filteredOptions: personOptionCards,
    cruiseLineFilter: operationalCruiseLineFilter,
    shipFilter: operationalShipFilter,
    displayLimit: 16
  }), [operationalCruiseLineFilter, operationalShipFilter, operationalSourceOptions, personOptionCards])
  const operationalAssignmentRoster = useMemo(() => getOperationalAssignmentRoster({
    sourceOptions: operationalSourceOptions,
    filteredOptions: personOptionCards,
    cruiseLineFilter: operationalCruiseLineFilter,
    shipFilter: operationalShipFilter
  }), [operationalCruiseLineFilter, operationalShipFilter, operationalSourceOptions, personOptionCards])
  const operationalDeploymentMatrix = useMemo(() => getOperationalDeploymentMatrix({
    sourceOptions: operationalSourceOptions,
    filteredOptions: personOptionCards,
    cruiseLineFilter: operationalCruiseLineFilter,
    shipFilter: operationalShipFilter
  }), [operationalCruiseLineFilter, operationalShipFilter, operationalSourceOptions, personOptionCards])

  const cruiseLineOptions = useMemo(() => getPassengerFilterOptions(passengerOptions, 'cruiseLine', {
    ship: passengerShipFilter,
    sailingDate: passengerSailingDateFilter
  }), [passengerOptions, passengerShipFilter, passengerSailingDateFilter])
  const shipOptions = useMemo(() => getPassengerFilterOptions(passengerOptions, 'ship', {
    cruiseLine: passengerCruiseLineFilter,
    sailingDate: passengerSailingDateFilter
  }), [passengerOptions, passengerCruiseLineFilter, passengerSailingDateFilter])
  const sailingDateOptions = useMemo(() => getPassengerFilterOptions(passengerOptions, 'sailingDate', {
    cruiseLine: passengerCruiseLineFilter,
    ship: passengerShipFilter
  }), [passengerOptions, passengerCruiseLineFilter, passengerShipFilter])

  useEffect(() => {
    if (!isOperationalFilterActive) return
    if (operationalFilterTouched || operationalCruiseLineFilter) return

    const selectedAssignmentCruiseLine = getOperationalAssignmentCruiseLineName(selectedDemoUser || {})
    if (selectedAssignmentCruiseLine && operationalCruiseLineOptions.includes(selectedAssignmentCruiseLine)) {
      setOperationalCruiseLineFilter(selectedAssignmentCruiseLine)
    }
  }, [isOperationalFilterActive, operationalCruiseLineFilter, operationalCruiseLineOptions, operationalFilterTouched, selectedDemoUser])

  useEffect(() => {
    if (!operationalShipFilter) return
    if (operationalShipOptions.includes(operationalShipFilter)) return
    setOperationalShipFilter('')
  }, [operationalShipFilter, operationalShipOptions])

  useEffect(() => {
    if (passengerCruiseLineFilter && !cruiseLineOptions.includes(passengerCruiseLineFilter)) {
      setPassengerCruiseLineFilter('')
    }
  }, [cruiseLineOptions, passengerCruiseLineFilter])

  useEffect(() => {
    if (passengerShipFilter && !shipOptions.includes(passengerShipFilter)) {
      setPassengerShipFilter('')
    }
  }, [passengerShipFilter, shipOptions])

  useEffect(() => {
    if (passengerSailingDateFilter && !sailingDateOptions.includes(passengerSailingDateFilter)) {
      setPassengerSailingDateFilter('')
    }
  }, [passengerSailingDateFilter, sailingDateOptions])

  useEffect(() => {
    if (personOptionCards.length === 0) return
    if (personOptionCards.some(option => option.user.id === selectedDemoUserId)) return

    onSelectDemoUser?.(personOptionCards[0].user.id)
  }, [onSelectDemoUser, personOptionCards, selectedDemoUserId])

  function handleRoleChange(role) {
    setPassengerSearch('')
    setPassengerCruiseLineFilter('')
    setPassengerShipFilter('')
    setPassengerSailingDateFilter('')
    setOperationalCruiseLineFilter('')
    setOperationalShipFilter('')
    setOperationalFilterTouched(false)
    setPersonSearch('')
    onSelectRole?.(role)
  }

  function handlePassengerSearchChange(value) {
    setPassengerSearch(value)
  }

  function handleOperationalCruiseLineChange(value) {
    setOperationalFilterTouched(true)
    setOperationalCruiseLineFilter(value)
    setOperationalShipFilter('')
  }

  return (
    <section className="react-app-section role-selector-section" id="react-role-selector" aria-labelledby="react-role-selector-heading" data-testid="react-role-selector">
      <p className="eyebrow">Workspace selection</p>
      <h2 id="react-role-selector-heading">View application as</h2>
      <p>
        Select a role, then choose the person whose operational view you want to review.
      </p>

      <div className="role-selector-grid">
        <div className="role-selector-field">
          <label className="react-field-label" htmlFor="react-role-type">
            Role
          </label>
          <select
            id="react-role-type"
            className="react-select"
            value={selectedRole}
            onChange={event => handleRoleChange(event.target.value)}
            disabled={isLoadingDemoUsers || roleOptions.length === 0}
            data-testid="react-role-type-select"
          >
            <option value="">All roles</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>{formatRoleOption(role)}</option>
            ))}
          </select>
        </div>

        {isPassengerFilterActive && (
          <div className="passenger-finder-panel" data-testid="react-passenger-finder-panel">
            <div className="passenger-finder-heading">
              <div>
                <p className="eyebrow">Passenger finder</p>
                <h3>Find passenger by sailing context</h3>
              </div>
              <span>{visiblePassengerOptions.length} of {passengerOptions.length} passengers</span>
            </div>
            <div className="passenger-finder-grid">
              <div className="role-selector-field passenger-search-field">
                <label className="react-field-label" htmlFor="react-passenger-search">
                  Search passengers
                </label>
                <input
                  id="react-passenger-search"
                  className="react-input"
                  type="search"
                  value={passengerSearch}
                  onChange={event => handlePassengerSearchChange(event.target.value)}
                  placeholder="Search by passenger, booking, cruise line, ship, port, or date"
                  data-testid="react-passenger-search-input"
                />
              </div>

              <div className="role-selector-field">
                <label className="react-field-label" htmlFor="react-passenger-cruise-line-filter">
                  Cruise line
                </label>
                <select
                  id="react-passenger-cruise-line-filter"
                  className="react-select"
                  value={passengerCruiseLineFilter}
                  onChange={event => setPassengerCruiseLineFilter(event.target.value)}
                  data-testid="react-passenger-cruise-line-filter"
                >
                  <option value="">All cruise lines</option>
                  {cruiseLineOptions.map(cruiseLine => (
                    <option key={cruiseLine} value={cruiseLine}>{cruiseLine}</option>
                  ))}
                </select>
              </div>

              <div className="role-selector-field">
                <label className="react-field-label" htmlFor="react-passenger-ship-filter">
                  Ship
                </label>
                <select
                  id="react-passenger-ship-filter"
                  className="react-select"
                  value={passengerShipFilter}
                  onChange={event => setPassengerShipFilter(event.target.value)}
                  data-testid="react-passenger-ship-filter"
                >
                  <option value="">All ships</option>
                  {shipOptions.map(ship => (
                    <option key={ship} value={ship}>{ship}</option>
                  ))}
                </select>
              </div>

              <div className="role-selector-field">
                <label className="react-field-label" htmlFor="react-passenger-sailing-date-filter">
                  Sailing date
                </label>
                <select
                  id="react-passenger-sailing-date-filter"
                  className="react-select"
                  value={passengerSailingDateFilter}
                  onChange={event => setPassengerSailingDateFilter(event.target.value)}
                  data-testid="react-passenger-sailing-date-filter"
                >
                  <option value="">All sailing dates</option>
                  {sailingDateOptions.map(sailingDate => (
                    <option key={sailingDate} value={sailingDate}>{sailingDate}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="passenger-finder-results" data-testid="react-passenger-finder-results">
              {visiblePassengerOptions.slice(0, 12).map(option => (
                <button
                  key={option.user.id}
                  type="button"
                  className={`passenger-finder-card${selectedDemoUserId === option.user.id ? ' selected' : ''}`}
                  onClick={() => onSelectDemoUser?.(option.user.id)}
                  data-testid="react-passenger-finder-result-card"
                >
                  <span className="passenger-finder-card-main">
                    <strong>{option.name}</strong>
                    <span>{option.user.email || option.user.customerId || 'Passenger profile'}</span>
                  </span>
                  <span className="passenger-finder-card-detail">{option.detail}</span>
                  {option.contexts.length > 0 && (
                    <span className="passenger-finder-card-chips">
                      {option.contexts.slice(0, 2).map(context => (
                        <span key={`${option.user.id}-${context.bookingId}`}>{context.ship} · {context.sailingDate}</span>
                      ))}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}


        {isOperationalFilterActive && (
          <div className="passenger-finder-panel operational-person-filter-panel" data-testid="react-operational-person-filter-panel">
            <div className="passenger-finder-heading">
              <div>
                <p className="eyebrow">Turnaround assignment finder</p>
                <h3>Filter turnaround people by assigned cruise line and ship</h3>
              </div>
              <span>{personOptionCards.length} matching people</span>
            </div>
            <div className="passenger-finder-grid">
              <div className="role-selector-field">
                <label className="react-field-label" htmlFor="react-operational-cruise-line-filter">
                  Cruise line
                </label>
                <select
                  id="react-operational-cruise-line-filter"
                  className="react-select"
                  value={operationalCruiseLineFilter}
                  onChange={event => handleOperationalCruiseLineChange(event.target.value)}
                  data-testid="react-operational-cruise-line-filter"
                >
                  <option value="">Select a cruise line</option>
                  {operationalCruiseLineOptions.map(cruiseLine => (
                    <option key={cruiseLine} value={cruiseLine}>{cruiseLine}</option>
                  ))}
                </select>
              </div>

              <div className="role-selector-field">
                <label className="react-field-label" htmlFor="react-operational-ship-filter">
                  Ship
                </label>
                <select
                  id="react-operational-ship-filter"
                  className="react-select"
                  value={operationalShipFilter}
                  onChange={event => setOperationalShipFilter(event.target.value)}
                  disabled={!operationalCruiseLineFilter}
                  data-testid="react-operational-ship-filter"
                >
                  <option value="">{operationalCruiseLineFilter ? 'All ships' : 'Select a cruise line first'}</option>
                  {operationalShipOptions.map(ship => (
                    <option key={ship} value={ship}>{ship}</option>
                  ))}
                </select>
              </div>

              <p className="finder-limit-note operational-scope-note" data-testid="react-operational-assignment-scope-note">
                Turnaround people are shown inside one cruise-line assignment at a time. Ship filtering becomes available after a cruise line is selected.
              </p>
            </div>

            <div className="operational-assignment-audit" data-testid="react-operational-assignment-audit-panel">
              <div className="operational-assignment-audit-card" data-testid="react-operational-assignment-audit-scope">
                <span>Scope locked</span>
                <strong>{operationalAssignmentAudit.cruiseLineName}</strong>
                <small>{operationalAssignmentAudit.shipName}</small>
              </div>
              <div className="operational-assignment-audit-card" data-testid="react-operational-assignment-audit-counts">
                <span>Assignment pool</span>
                <strong>{operationalAssignmentAudit.matchingPeopleCount} matching people</strong>
                <small>{operationalAssignmentAudit.scopedShipCount} ships · {operationalAssignmentAudit.scopedRoleCount} role groups · {operationalAssignmentAudit.selectedShipPeopleCount} in current ship filter</small>
              </div>
              <div className="operational-assignment-audit-card" data-testid="react-operational-assignment-audit-guardrail">
                <span>Cross-line guardrail</span>
                <strong>{operationalAssignmentAudit.crossLineVisibleCount} cross-line cards visible</strong>
                <small>Panel shows {operationalAssignmentAudit.visibleCardCount} people at once{operationalAssignmentAudit.hiddenCardCount > 0 ? ` · ${operationalAssignmentAudit.hiddenCardCount} more available by search or ship filter` : ''}</small>
              </div>
            </div>

            <div className="operational-assignment-roster" data-testid="react-operational-assignment-roster-panel">
              <div className="operational-assignment-roster-heading">
                <div>
                  <p className="eyebrow">Assignment roster</p>
                  <h4>{operationalAssignmentRoster.cruiseLineName}</h4>
                </div>
                <span>{operationalAssignmentRoster.totalVisiblePeople} visible of {operationalAssignmentRoster.totalScopedPeople} scoped people</span>
              </div>

              {operationalAssignmentRoster.shipRows.length > 0 ? (
                <div className="operational-assignment-roster-grid" data-testid="react-operational-assignment-roster-ships">
                  {operationalAssignmentRoster.shipRows.map(row => (
                    <div key={row.shipName} className="operational-assignment-roster-row" data-testid="react-operational-assignment-roster-ship-row">
                      <strong>{row.shipName}</strong>
                      <span>{row.visibleCount} visible · {row.peopleCount} assigned</span>
                      <small>{row.roleSummary}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state compact" data-testid="react-operational-assignment-roster-empty">Select a cruise line to review the ship-level assignment roster.</p>
              )}

              {operationalAssignmentRoster.roleRows.length > 0 && (
                <div className="operational-assignment-role-grid" data-testid="react-operational-assignment-roster-roles">
                  {operationalAssignmentRoster.roleRows.map(row => (
                    <div key={row.roleLabel} className="operational-assignment-role-row" data-testid="react-operational-assignment-roster-role-row">
                      <strong>{row.roleLabel}</strong>
                      <span>{row.peopleCount} people · {row.shipCount} ships</span>
                      <small>{row.shipSummary}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="operational-deployment-matrix" data-testid="react-operational-deployment-matrix-panel">
              <div className="operational-assignment-roster-heading">
                <div>
                  <p className="eyebrow">Deployment matrix</p>
                  <h4>{operationalDeploymentMatrix.cruiseLineName}</h4>
                </div>
                <span data-testid="react-operational-deployment-matrix-summary">{operationalDeploymentMatrix.summary}</span>
              </div>

              {operationalDeploymentMatrix.rows.length > 0 ? (
                <div className="operational-deployment-matrix-grid" data-testid="react-operational-deployment-matrix-rows">
                  {operationalDeploymentMatrix.rows.map(row => (
                    <div key={row.shipName} className="operational-deployment-matrix-row" data-testid="react-operational-deployment-matrix-row">
                      <div className="operational-deployment-matrix-ship">
                        <strong>{row.shipName}</strong>
                        <span>{row.coveragePercent}% role coverage · {row.peopleCount} assigned people</span>
                        <small>{row.peopleSummary || 'No assigned people'}</small>
                      </div>
                      <div className="operational-deployment-matrix-cells">
                        {row.roleCells.map(cell => (
                          <span
                            key={`${row.shipName}-${cell.roleLabel}`}
                            className={`operational-deployment-matrix-cell ${cell.count > 0 ? 'covered' : 'gap'}`}
                            data-testid="react-operational-deployment-matrix-cell"
                          >
                            <strong>{cell.roleLabel}</strong>
                            <small>{cell.status} · {cell.count}</small>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state compact" data-testid="react-operational-deployment-matrix-empty">Select a cruise line to review ship-role coverage.</p>
              )}
            </div>
          </div>
        )}

        <div className="person-finder-panel" data-testid="react-person-finder-panel">
          <div className="person-finder-heading">
            <div>
              <p className="eyebrow">Person</p>
              <h3>Choose a person</h3>
            </div>
            <span>{personOptionCards.length} visible</span>
          </div>

          <div className="role-selector-field">
            <label className="react-field-label" htmlFor="react-person-search">
              Search people
            </label>
            <input
              id="react-person-search"
              className="react-input"
              type="search"
              value={personSearch}
              onChange={event => setPersonSearch(event.target.value)}
              placeholder="Search by name, role, ship, email, or sailing context"
              data-testid="react-person-search-input"
            />
          </div>

          {selectedDemoUser && (
            <div className="selected-person-card" data-testid="react-selected-person-card">
              <span>Selected</span>
              <strong>{formatDemoUserLabel(selectedDemoUser, bookings)}</strong>
              <small>{getRoleSummary(selectedDemoUser, customerCount, bookingCount, visibleBookingCount)}</small>
            </div>
          )}

          <div className="person-finder-results" data-testid="react-person-finder-results">
            {displayedPersonOptionCards.map(option => (
              <button
                key={option.user.id}
                type="button"
                className={`person-finder-card${selectedDemoUserId === option.user.id ? ' selected' : ''}`}
                onClick={() => onSelectDemoUser?.(option.user.id)}
                aria-pressed={selectedDemoUserId === option.user.id}
                data-testid="react-person-finder-result-card"
              >
                <span className="person-finder-card-main">
                  <strong>{option.name}</strong>
                  <span>{formatDemoUserRole(option.user.role || option.user.userType || 'Demo User')}</span>
                </span>
                <span className="person-finder-card-detail">{option.detail}</span>
              </button>
            ))}
          </div>

          {personOptionCards.length > displayedPersonOptionCards.length && (
            <p className="finder-limit-note" data-testid="react-person-finder-limit-note">
              Showing the best {displayedPersonOptionCards.length} matches. Search to narrow the list instead of scanning a long dropdown.
            </p>
          )}

          {personOptionCards.length === 0 && (
            <p className="empty-state compact" data-testid="react-person-finder-empty">{isOperationalFilterActive && !operationalCruiseLineFilter ? 'Select a cruise line to show assigned turnaround people.' : 'No people match the current search.'}</p>
          )}

          <label className="sr-only" htmlFor="react-demo-role">Person fallback select</label>
          <select
            id="react-demo-role"
            className="react-select person-select sr-only"
            value={visibleDemoUsers.some(user => user.id === selectedDemoUserId) ? selectedDemoUserId : ''}
            onChange={event => onSelectDemoUser?.(event.target.value)}
            disabled={isLoadingDemoUsers || visibleDemoUsers.length === 0}
            aria-hidden="true"
            tabIndex={-1}
            hidden
            data-testid="react-demo-user-select"
          >
            {visibleDemoUsers.length === 0 ? (
              <option value="">No matching people</option>
            ) : visibleDemoUsers.map(user => (
              <option key={user.id} value={user.id}>{formatDemoUserLabel(user, bookings)}</option>
            ))}
          </select>
        </div>
      </div>

      {isPassengerFilterActive && visiblePassengerOptions.length === 0 && (
        <p className="empty-state compact" data-testid="react-passenger-finder-empty">No passengers match the current filters.</p>
      )}

      {demoUserError && <p className="error" role="alert">{demoUserError}</p>}

      <div className="role-summary-card" aria-live="polite" data-testid="react-demo-user-summary">
        <strong>{selectedDemoUser ? formatDemoUserLabel(selectedDemoUser, bookings) : 'Loading people'}</strong>
        <span>{getRoleSummary(selectedDemoUser, customerCount, bookingCount, visibleBookingCount)}</span>
        <span>{visibleSelectorCount} people visible in the current selector.</span>
        <span>{availableRoleCount} people available for the selected role.</span>
        <span>{demoUsers.length} total people available.</span>
      </div>
    </section>
  )
}

