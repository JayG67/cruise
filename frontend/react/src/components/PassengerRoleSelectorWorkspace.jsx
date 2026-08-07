export default function PassengerRoleSelectorWorkspace({
  cruiseLineOptions = [],
  onCruiseLineChange,
  onPassengerSearchChange,
  onSailingDateChange,
  onSelectPerson,
  onShipChange,
  passengerCruiseLineFilter = '',
  passengerOptions = [],
  passengerSailingDateFilter = '',
  passengerSearch = '',
  passengerShipFilter = '',
  sailingDateOptions = [],
  selectedPersonId = '',
  shipOptions = [],
  visiblePassengerOptions = []
}) {
  return (
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
          <label className="react-field-label ce-field-label" htmlFor="react-passenger-search">Search passengers</label>
          <input
            id="react-passenger-search"
            className="react-input ce-input"
            type="search"
            value={passengerSearch}
            onChange={event => onPassengerSearchChange?.(event.target.value)}
            placeholder="Search by passenger, booking, cruise line, ship, port, or date"
            data-testid="react-passenger-search-input"
          />
        </div>

        <div className="role-selector-field ce-field">
          <label className="react-field-label ce-field-label" htmlFor="react-passenger-cruise-line-filter">Cruise line</label>
          <select
            id="react-passenger-cruise-line-filter"
            className="react-select ce-input"
            value={passengerCruiseLineFilter}
            onChange={event => onCruiseLineChange?.(event.target.value)}
            data-testid="react-passenger-cruise-line-filter"
          >
            <option value="">All cruise lines</option>
            {cruiseLineOptions.map(cruiseLine => <option key={cruiseLine} value={cruiseLine}>{cruiseLine}</option>)}
          </select>
        </div>

        <div className="role-selector-field ce-field">
          <label className="react-field-label ce-field-label" htmlFor="react-passenger-ship-filter">Ship</label>
          <select
            id="react-passenger-ship-filter"
            className="react-select ce-input"
            value={passengerShipFilter}
            onChange={event => onShipChange?.(event.target.value)}
            data-testid="react-passenger-ship-filter"
          >
            <option value="">All ships</option>
            {shipOptions.map(ship => <option key={ship} value={ship}>{ship}</option>)}
          </select>
        </div>

        <div className="role-selector-field ce-field">
          <label className="react-field-label ce-field-label" htmlFor="react-passenger-sailing-date-filter">Sailing date</label>
          <select
            id="react-passenger-sailing-date-filter"
            className="react-select ce-input"
            value={passengerSailingDateFilter}
            onChange={event => onSailingDateChange?.(event.target.value)}
            data-testid="react-passenger-sailing-date-filter"
          >
            <option value="">All sailing dates</option>
            {sailingDateOptions.map(sailingDate => <option key={sailingDate} value={sailingDate}>{sailingDate}</option>)}
          </select>
        </div>
      </div>

      <div className="passenger-finder-results" data-testid="react-passenger-finder-results">
        {visiblePassengerOptions.slice(0, 12).map(option => (
          <button
            key={option.user.id}
            type="button"
            className={`passenger-finder-card ce-selector-card ce-command-card${selectedPersonId === option.user.id ? ' selected' : ''}`}
            onClick={() => onSelectPerson?.(option.user.id)}
            aria-pressed={selectedPersonId === option.user.id}
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
  )
}
