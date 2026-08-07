import OperationalRoleSelectorWorkspace from './OperationalRoleSelectorWorkspace.jsx'
import PassengerRoleSelectorWorkspace from './PassengerRoleSelectorWorkspace.jsx'
import useRoleSelectorState from './useRoleSelectorState.js'
import {
  formatDemoUserLabel,
  formatDemoUserRole,
  formatRoleOption,
  getRoleSummary
} from '../domain/roleSelectorOptions.js'

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
  const roleOptions = availableRoles.length > 0 ? availableRoles : ['admin', 'passenger', 'group-leader']
  const {
    cruiseLineOptions,
    displayedPersonOptionCards,
    handleOperationalCruiseLineChange,
    handleRoleChange,
    isOperationalFilterActive,
    isPassengerFilterActive,
    operationalCruiseLineFilter,
    operationalCruiseLineOptions,
    operationalShipFilter,
    operationalShipOptions,
    operationalSourceOptions,
    passengerCruiseLineFilter,
    passengerOptions,
    passengerSailingDateFilter,
    passengerSearch,
    passengerShipFilter,
    personOptionCards,
    personSearch,
    sailingDateOptions,
    setOperationalShipFilter,
    setPassengerCruiseLineFilter,
    setPassengerSailingDateFilter,
    setPassengerSearch,
    setPassengerShipFilter,
    setPersonSearch,
    shipOptions,
    visibleDemoUsers,
    visiblePassengerOptions
  } = useRoleSelectorState({
    bookings,
    filteredDemoUsers,
    selectedDemoUser,
    selectedDemoUserId,
    selectedRole,
    onSelectDemoUser,
    onSelectRole
  })

  const visibleSelectorCount = isOperationalFilterActive ? personOptionCards.length : visibleDemoUsers.length
  const availableRoleCount = isOperationalFilterActive ? operationalSourceOptions.length : filteredDemoUsers.length

  return (
    <section className="react-app-section role-selector-section ce-command-panel" id="react-role-selector" aria-labelledby="react-role-selector-heading" data-testid="react-role-selector">
      <p className="eyebrow ce-kicker">Workspace selection</p>
      <h2 id="react-role-selector-heading">View application as</h2>
      <p>
        Select a role, then choose the person whose operational view you want to review.
      </p>

      <div className={`role-selector-grid${!isPassengerFilterActive && !isOperationalFilterActive ? ' role-selector-grid--compact-generic' : ''}`}>
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
          <PassengerRoleSelectorWorkspace
            cruiseLineOptions={cruiseLineOptions}
            onCruiseLineChange={setPassengerCruiseLineFilter}
            onPassengerSearchChange={setPassengerSearch}
            onSailingDateChange={setPassengerSailingDateFilter}
            onSelectPerson={onSelectDemoUser}
            onShipChange={setPassengerShipFilter}
            passengerCruiseLineFilter={passengerCruiseLineFilter}
            passengerOptions={passengerOptions}
            passengerSailingDateFilter={passengerSailingDateFilter}
            passengerSearch={passengerSearch}
            passengerShipFilter={passengerShipFilter}
            sailingDateOptions={sailingDateOptions}
            selectedPersonId={selectedDemoUserId}
            shipOptions={shipOptions}
            visiblePassengerOptions={visiblePassengerOptions}
          />
        )}


        {isOperationalFilterActive && (
          <OperationalRoleSelectorWorkspace
            bookings={bookings}
            bookingCount={bookingCount}
            customerCount={customerCount}
            displayedPersonOptionCards={displayedPersonOptionCards}
            onOperationalCruiseLineChange={handleOperationalCruiseLineChange}
            onOperationalShipChange={setOperationalShipFilter}
            onPersonSearchChange={setPersonSearch}
            onSelectDemoUser={onSelectDemoUser}
            operationalCruiseLineFilter={operationalCruiseLineFilter}
            operationalCruiseLineOptions={operationalCruiseLineOptions}
            operationalShipFilter={operationalShipFilter}
            operationalShipOptions={operationalShipOptions}
            personOptionCards={personOptionCards}
            personSearch={personSearch}
            selectedDemoUser={selectedDemoUser}
            selectedDemoUserId={selectedDemoUserId}
            visibleBookingCount={visibleBookingCount}
          />
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
                  <span>{formatDemoUserRole(option.user.role || option.user.userType || 'Assigned person')}</span>
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
        <div className="role-summary-identity"><strong>{selectedDemoUser ? formatDemoUserLabel(selectedDemoUser, bookings) : 'Loading people'}</strong>
          <span>{getRoleSummary(selectedDemoUser, customerCount, bookingCount, visibleBookingCount)}</span></div>
        <div className="role-summary-metrics" aria-label="Role selection counts">
          <span><strong>{visibleSelectorCount}</strong> people visible in the current selector.</span>
          <span><strong>{availableRoleCount}</strong> people available for the selected role.</span>
          <span><strong>{demoUsers.length}</strong> total people available.</span></div>
      </div>
    </section>
  )}

