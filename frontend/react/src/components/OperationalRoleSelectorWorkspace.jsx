import { formatDemoUserLabel, formatDemoUserRole, getRoleSummary } from '../domain/roleSelectorOptions.js'

export default function OperationalRoleSelectorWorkspace({
  bookings,
  bookingCount,
  customerCount,
  displayedPersonOptionCards,
  onOperationalCruiseLineChange,
  onOperationalShipChange,
  onPersonSearchChange,
  onSelectDemoUser,
  operationalCruiseLineFilter,
  operationalCruiseLineOptions,
  operationalShipFilter,
  operationalShipOptions,
  personOptionCards,
  personSearch,
  selectedDemoUser,
  selectedDemoUserId,
  visibleBookingCount
}) {
  return (
    <div className="passenger-finder-panel ce-command-card operational-person-filter-panel" data-testid="react-operational-person-filter-panel">
      <div className="passenger-finder-heading">
        <div>
          <p className="eyebrow ce-kicker">Turnaround person finder</p>
          <h3>Choose the person whose workspace you want to review</h3>
          <p className="role-selector-helper-text">
            Select a cruise line, optionally narrow to one ship queue, then choose an assigned person. The selector only shows people inside the selected cruise-line scope.
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
            onChange={event => onOperationalCruiseLineChange(event.target.value)}
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
            onChange={event => onOperationalShipChange(event.target.value)}
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
            onChange={event => onPersonSearchChange(event.target.value)}
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
              <span>{formatDemoUserRole(option.user.role || option.user.userType || 'Assigned person')}</span>
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
        <p className="empty-state compact ce-empty-state ce-editor-card" data-testid="react-person-finder-empty">
          {!operationalCruiseLineFilter ? 'Select a cruise line to show assigned turnaround people.' : 'No people match the current filters.'}
        </p>
      )}
    </div>
  )
}
