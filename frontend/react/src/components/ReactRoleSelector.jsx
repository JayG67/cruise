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
  if (role === 'security-lead') return 'Security Lead'
  if (role === 'port-operations-lead') return 'Port Operations Lead'
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


function sortPassengerOptions(options = []) {
  return [...options].sort((a, b) => {
    const aHasContext = a.contexts.length > 0
    const bHasContext = b.contexts.length > 0

    if (aHasContext !== bHasContext) {
      return aHasContext ? -1 : 1
    }

    const aDate = a.contexts[0]?.sailingDate || ''
    const bDate = b.contexts[0]?.sailingDate || ''
    const dateComparison = String(aDate).localeCompare(String(bDate))

    if (dateComparison !== 0) return dateComparison

    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
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

    return sortPassengerOptions(filteredDemoUsers
      .filter(user => normalizeRole(user.role || user.userType) === 'passenger')
      .map(user => buildPassengerOption(user, bookings)))
  }, [filteredDemoUsers, bookings, isPassengerFilterActive])

  const visiblePassengerOptions = useMemo(() => {
    const search = passengerSearch.trim().toLowerCase()
    const hasActiveFinderCriteria = Boolean(
      search
      || passengerCruiseLineFilter
      || passengerShipFilter
      || passengerSailingDateFilter
    )

    if (!hasActiveFinderCriteria && bookings.length === 0) {
      return []
    }

    const matchingOptions = passengerOptions.filter(option => {
      const matchesSearch = !search || option.searchText.includes(search)
      const matchesCruiseLine = passengerMatchesFilter(option, 'cruiseLine', passengerCruiseLineFilter)
      const matchesShip = passengerMatchesFilter(option, 'ship', passengerShipFilter)
      const matchesSailingDate = passengerMatchesFilter(option, 'sailingDate', passengerSailingDateFilter)

      return matchesSearch && matchesCruiseLine && matchesShip && matchesSailingDate
    })

    if (hasActiveFinderCriteria) {
      return matchingOptions
    }

    const contextBackedOptions = matchingOptions.filter(option => option.contexts.length > 0)
    return contextBackedOptions.length > 0 ? contextBackedOptions : matchingOptions
  }, [bookings.length, passengerOptions, passengerSearch, passengerCruiseLineFilter, passengerShipFilter, passengerSailingDateFilter])

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
    <section className="react-app-section role-selector-section ce-command-panel" id="react-role-selector" aria-labelledby="react-role-selector-heading" data-testid="react-role-selector">
      <p className="eyebrow ce-kicker">Workspace selection</p>
      <h2 id="react-role-selector-heading">View application as</h2>
      <p>
        Select a role, then choose the person whose operational view you want to review.
      </p>

      <div className="role-selector-grid">
        <div className="role-selector-field ce-field">
          <label className="react-field-label ce-field-label" htmlFor="react-role-type">
            Role
          </label>
          <select
            id="react-role-type"
            className="react-select ce-input"
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
          <div className="passenger-finder-panel ce-command-card" data-testid="react-passenger-finder-panel">
            <div className="passenger-finder-heading">
              <div>
                <p className="eyebrow ce-kicker">Passenger finder</p>
                <h3>Find passenger by sailing context</h3>
              </div>
              <span>{visiblePassengerOptions.length} of {passengerOptions.length} passengers</span>
            </div>
            <div className="passenger-finder-grid">
              <div className="role-selector-field passenger-search-field">
                <label className="react-field-label ce-field-label" htmlFor="react-passenger-search">
                  Search passengers
                </label>
                <input
                  id="react-passenger-search"
                  className="react-input ce-input"
                  type="search"
                  value={passengerSearch}
                  onChange={event => handlePassengerSearchChange(event.target.value)}
                  placeholder="Search by passenger, booking, cruise line, ship, port, or date"
                  data-testid="react-passenger-search-input"
                />
              </div>

              <div className="role-selector-field ce-field">
                <label className="react-field-label ce-field-label" htmlFor="react-passenger-cruise-line-filter">
                  Cruise line
                </label>
                <select
                  id="react-passenger-cruise-line-filter"
                  className="react-select ce-input"
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

              <div className="role-selector-field ce-field">
                <label className="react-field-label ce-field-label" htmlFor="react-passenger-ship-filter">
                  Ship
                </label>
                <select
                  id="react-passenger-ship-filter"
                  className="react-select ce-input"
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

              <div className="role-selector-field ce-field">
                <label className="react-field-label ce-field-label" htmlFor="react-passenger-sailing-date-filter">
                  Sailing date
                </label>
                <select
                  id="react-passenger-sailing-date-filter"
                  className="react-select ce-input"
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
                  className={`passenger-finder-card ce-selector-card ce-command-card${selectedDemoUserId === option.user.id ? ' selected' : ''}`}
                  onClick={() => onSelectDemoUser?.(option.user.id)}
                  data-testid="react-person-finder-result-card"
                >
                  <span className="passenger-finder-card-main ce-selector-card-main" data-testid="react-passenger-finder-result-card">
                    <strong>{option.name}</strong>
                    <span>{option.user.email || option.user.customerId || 'Passenger profile'}</span>
                  </span>
                  <span className="passenger-finder-card-detail ce-selector-card-detail">{option.detail}</span>
                </button>
              ))}
            </div>
          </div>
        )}


        {isOperationalFilterActive && (
          <div className="passenger-finder-panel ce-command-card operational-person-filter-panel" data-testid="react-operational-person-filter-panel">
            <div className="passenger-finder-heading">
              <div>
                <p className="eyebrow ce-kicker">Turnaround person finder</p>
                <h3>Choose the person whose workspace you want to review</h3>
                <p className="role-selector-helper-text">
                  Select a cruise line, optionally narrow to one ship queue, then choose a real assignment card. The selector only shows people inside the selected cruise-line scope.
                </p>
              </div>
            </div>

            <div className="passenger-finder-grid operational-person-filter-grid">
              <div className="role-selector-field ce-field">
                <label className="react-field-label ce-field-label" htmlFor="react-operational-cruise-line-filter">
                  Cruise line
                </label>
                <select
                  id="react-operational-cruise-line-filter"
                  className="react-select ce-input"
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

              <div className="role-selector-field ce-field">
                <label className="react-field-label ce-field-label" htmlFor="react-operational-ship-filter">
                  Ship queue
                </label>
                <select
                  id="react-operational-ship-filter"
                  className="react-select ce-input"
                  value={operationalShipFilter}
                  onChange={event => setOperationalShipFilter(event.target.value)}
                  disabled={!operationalCruiseLineFilter}
                  data-testid="react-operational-ship-filter"
                >
                  <option value="">{operationalCruiseLineFilter ? 'All ship queues' : 'Select a cruise line first'}</option>
                  {operationalShipOptions.map(ship => (
                    <option key={ship} value={ship}>{ship}</option>
                  ))}
                </select>
              </div>

              <div className="role-selector-field operational-person-search-field">
                <label className="react-field-label ce-field-label" htmlFor="react-person-search">
                  Search assignments
                </label>
                <input
                  id="react-person-search"
                  className="react-input ce-input"
                  type="search"
                  value={personSearch}
                  onChange={event => setPersonSearch(event.target.value)}
                  placeholder="Search by person, role, cruise line, or ship"
                  data-testid="react-person-search-input"
                />
              </div>
            </div>

            <div className="operational-selector-summary" data-testid="react-operational-selector-summary">
              <div>
                <span>Current scope</span>
                <strong>{operationalCruiseLineFilter || 'Choose a cruise line'}</strong>
                <small>{operationalShipFilter || (operationalCruiseLineFilter ? 'All ship queues' : 'No ship queue selected')}</small>
              </div>
              <div>
                <span>Visible assignments</span>
                <strong>{personOptionCards.length} people</strong>
                <small>{operationalCruiseLineFilter ? 'Scoped to the selected cruise line' : 'Choose a cruise line to begin'}</small>
              </div>
            </div>

            {selectedDemoUser && (
              <div className="selected-person-card" data-testid="react-selected-person-card">
                <span>Selected workspace</span>
                <strong>{formatDemoUserLabel(selectedDemoUser, bookings)}</strong>
                <small>{getRoleSummary(selectedDemoUser, customerCount, bookingCount, visibleBookingCount)}</small>
              </div>
            )}

            <div className="person-finder-results operational-person-results" data-testid="react-person-finder-results">
              {displayedPersonOptionCards.map(option => (
                <button
                  key={option.user.id}
                  type="button"
                  className={`person-finder-card ce-selector-card ce-command-card${selectedDemoUserId === option.user.id ? ' selected' : ''}`}
                  onClick={() => onSelectDemoUser?.(option.user.id)}
                  aria-pressed={selectedDemoUserId === option.user.id}
                  data-testid="react-person-finder-result-card"
                >
                  <span className="person-finder-card-main ce-selector-card-main">
                    <strong>{option.name}</strong>
                    <span>{formatDemoUserRole(option.user.role || option.user.userType || 'Demo User')}</span>
                  </span>
                  <span className="person-finder-card-detail ce-selector-card-detail">{option.detail}</span>
                </button>
              ))}
            </div>

            {personOptionCards.length > displayedPersonOptionCards.length && (
              <p className="finder-limit-note" data-testid="react-person-finder-limit-note">
                Showing the best {displayedPersonOptionCards.length} matches. Search or choose a ship queue to narrow the assignment list.
              </p>
            )}

            {personOptionCards.length === 0 && (
              <p className="empty-state compact ce-empty-state ce-editor-card" data-testid="react-person-finder-empty">{!operationalCruiseLineFilter ? 'Select a cruise line to show assigned turnaround people.' : 'No people match the current filters.'}</p>
            )}
          </div>
        )}

        {!isPassengerFilterActive && !isOperationalFilterActive && (
          <div className="person-finder-panel" data-testid="react-person-finder-panel">
          <div className="person-finder-heading">
            <div>
              <p className="eyebrow ce-kicker">Person</p>
              <h3>Choose a person</h3>
            </div>
            <span>{personOptionCards.length} visible</span>
          </div>

          <div className="role-selector-field ce-field">
            <label className="react-field-label ce-field-label" htmlFor="react-person-search">
              Search people
            </label>
            <input
              id="react-person-search"
              className="react-input ce-input"
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
                className={`person-finder-card ce-selector-card ce-command-card${selectedDemoUserId === option.user.id ? ' selected' : ''}`}
                onClick={() => onSelectDemoUser?.(option.user.id)}
                aria-pressed={selectedDemoUserId === option.user.id}
                data-testid="react-person-finder-result-card"
              >
                <span className="person-finder-card-main ce-selector-card-main">
                  <strong>{option.name}</strong>
                  <span>{formatDemoUserRole(option.user.role || option.user.userType || 'Demo User')}</span>
                </span>
                <span className="person-finder-card-detail ce-selector-card-detail">{option.detail}</span>
              </button>
            ))}
          </div>

          {personOptionCards.length > displayedPersonOptionCards.length && (
            <p className="finder-limit-note" data-testid="react-person-finder-limit-note">
              Showing the best {displayedPersonOptionCards.length} matches. Search to narrow the list instead of scanning a long dropdown.
            </p>
          )}

          {personOptionCards.length === 0 && (
            <p className="empty-state compact ce-empty-state ce-editor-card" data-testid="react-person-finder-empty">{isOperationalFilterActive && !operationalCruiseLineFilter ? 'Select a cruise line to show assigned turnaround people.' : 'No people match the current search.'}</p>
          )}

          </div>
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

      {isPassengerFilterActive && visiblePassengerOptions.length === 0 && (
        <p className="empty-state compact ce-empty-state ce-editor-card" data-testid="react-passenger-finder-empty">No passengers match the current filters.</p>
      )}

      {demoUserError && <p className="error" role="alert">{demoUserError}</p>}

      <div className="role-summary-card ce-command-card" aria-live="polite" data-testid="react-demo-user-summary">
        <strong>{selectedDemoUser ? formatDemoUserLabel(selectedDemoUser, bookings) : 'Loading people'}</strong>
        <span>{getRoleSummary(selectedDemoUser, customerCount, bookingCount, visibleBookingCount)}</span>
        <span>{visibleSelectorCount} people visible in the current selector.</span>
        <span>{availableRoleCount} people available for the selected role.</span>
        <span>{demoUsers.length} total people available.</span>
      </div>
    </section>
  )
}

