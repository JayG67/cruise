import { useEffect, useMemo, useState } from 'react'

import { normalizeRole } from '../domain/roleView.js'

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

function getPassengerFilterOptions(passengerOptions = [], key) {
  const values = new Set()

  passengerOptions.forEach(option => {
    option.contexts.forEach(context => {
      if (context[key]) values.add(context[key])
    })
  })

  return [...values].sort((a, b) => String(a).localeCompare(String(b)))
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

function getRoleSummary(user, customerCount, bookingCount, visibleBookingCount = bookingCount) {
  if (!user) {
    return `Loading workspace users — ${customerCount} customers and ${bookingCount} bookings available.`
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
  const roleOptions = availableRoles.length > 0 ? availableRoles : ['admin', 'passenger', 'group-leader']
  const isPassengerFilterActive = selectedRole === 'passenger'

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

    if (selectedPassenger && !resultUsers.some(user => user.id === selectedPassenger.id)) {
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
  const cruiseLineOptions = useMemo(() => getPassengerFilterOptions(passengerOptions, 'cruiseLine'), [passengerOptions])
  const shipOptions = useMemo(() => getPassengerFilterOptions(passengerOptions, 'ship'), [passengerOptions])
  const sailingDateOptions = useMemo(() => getPassengerFilterOptions(passengerOptions, 'sailingDate'), [passengerOptions])

  useEffect(() => {
    if (!isPassengerFilterActive || visibleDemoUsers.length === 0) return
    if (visibleDemoUsers.some(user => user.id === selectedDemoUserId)) return

    onSelectDemoUser?.(visibleDemoUsers[0].id)
  }, [isPassengerFilterActive, onSelectDemoUser, selectedDemoUserId, visibleDemoUsers])

  function handleRoleChange(role) {
    setPassengerSearch('')
    setPassengerCruiseLineFilter('')
    setPassengerShipFilter('')
    setPassengerSailingDateFilter('')
    onSelectRole?.(role)
  }

  function handlePassengerSearchChange(value) {
    setPassengerSearch(value)
  }

  return (
    <section className="react-app-section role-selector-section" id="react-role-selector" aria-labelledby="react-role-selector-heading" data-testid="react-role-selector">
      <p className="eyebrow">Workspace selection</p>
      <h2 id="react-role-selector-heading">View application as</h2>
      <p>
        Select a role, then choose the specific person or workspace user for operational testing.
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

        <div className="role-selector-field">
          <label className="react-field-label" htmlFor="react-demo-role">
            Person
          </label>
          <select
            id="react-demo-role"
            className="react-select person-select"
            value={visibleDemoUsers.some(user => user.id === selectedDemoUserId) ? selectedDemoUserId : ''}
            onChange={event => onSelectDemoUser?.(event.target.value)}
            disabled={isLoadingDemoUsers || visibleDemoUsers.length === 0}
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
        <strong>{selectedDemoUser ? formatDemoUserLabel(selectedDemoUser, bookings) : 'Loading workspace users'}</strong>
        <span>{getRoleSummary(selectedDemoUser, customerCount, bookingCount, visibleBookingCount)}</span>
        <span>{visibleDemoUsers.length} people visible in the current selector.</span>
        <span>{filteredDemoUsers.length} people available for the selected role.</span>
        <span>{demoUsers.length} total workspace users available.</span>
      </div>
    </section>
  )
}

