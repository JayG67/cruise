import { DINING_OPTIONS, getCustomerDisplayName, getGuestLabel } from '../domain/passengerBookingWorkflow.js'

export default function PassengerBookingGuestWorkspace({
  addGuest,
  customers,
  getVisibleCustomerFinderOptions,
  guestCruiseLineOptions,
  guestDrafts,
  guestFinderFilters,
  guestSailingDateOptions,
  guestSearches,
  guestShipOptions,
  removeGuest,
  selectExistingGuest,
  updateGuest,
  updateGuestFinderFilter,
  updateGuestSearch
}) {
  return (
    <div className="passenger-booking-guests ce-editor-card ce-surface-light" data-testid="react-booking-guest-list">
      <div className="section-heading-row ce-section-heading">
        <div>
          <h4>Guests</h4>
          <p>Use your profile as the primary guest, select existing guests, or add a new guest profile during booking.</p>
        </div>
        <button type="button" className="secondary-action-button ce-button-secondary" onClick={addGuest} data-testid="react-booking-add-guest-button">+ Add Guest</button>
      </div>

      {guestDrafts.map((guest, index) => {
        const visibleOptions = getVisibleCustomerFinderOptions(index)
        const selectedCustomer = customers.find(customer => customer.id === guest.customerId)

        return (
          <fieldset className={`passenger-booking-guest-card ce-editor-card ce-surface-light${index === 0 ? ' is-primary-guest' : ' is-additional-guest'}`} key={`guest-${index}`} data-testid="react-booking-guest-card">
            <legend>{index === 0 ? 'Primary guest' : `Guest ${index + 1}`}</legend>
            <div className="booking-guest-card-intro">
              <strong>{index === 0 ? 'Your passenger profile' : 'Choose who is joining this booking'}</strong>
              <span>{index === 0 ? 'This profile will be the booking owner and primary point of contact.' : 'Select an existing customer or create a new guest profile.'}</span>
            </div>
            <div className="booking-search-grid ce-field-grid booking-guest-fields">
              <label className="booking-guest-source-field">
                <span>{index === 0 ? 'Profile source' : 'Guest source'}</span>
                <select value={guest.customerMode} disabled={index === 0} onChange={event => updateGuest(index, 'customerMode', event.target.value)} data-testid="react-booking-guest-mode-select">
                  <option value="existing">{index === 0 ? 'Your passenger profile' : 'Existing customer'}</option>
                  <option value="new">New guest</option>
                </select>
              </label>

              {guest.customerMode === 'existing' ? (
                <div className="booking-guest-finder" data-testid="react-booking-guest-finder">
                  {index === 0 ? (
                    <div className="booking-selected-guest-card ce-editor-card ce-surface-light" data-testid="react-booking-selected-guest-card">
                      <span className="booking-selected-guest-label">Selected profile</span>
                      <strong>{getGuestLabel(guest)}</strong>
                      <span>{guest.email || 'Primary passenger profile'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="booking-guest-finder-controls">
                        <label className="booking-guest-search-field">
                          <span>Find existing guest</span>
                          <input type="search" value={guestSearches[index] || ''} onChange={event => updateGuestSearch(index, event.target.value)} placeholder="Search by name, email, cruise line, ship, sailing date, or cabin" data-testid="react-booking-guest-search-input" />
                        </label>
                        <label><span>Cruise line</span><select value={guestFinderFilters.cruiseLine} onChange={event => updateGuestFinderFilter('cruiseLine', event.target.value)} data-testid="react-booking-guest-cruise-line-filter"><option value="">All cruise lines</option>{guestCruiseLineOptions.map(cruiseLine => <option key={cruiseLine} value={cruiseLine}>{cruiseLine}</option>)}</select></label>
                        <label><span>Ship</span><select value={guestFinderFilters.ship} onChange={event => updateGuestFinderFilter('ship', event.target.value)} data-testid="react-booking-guest-ship-filter"><option value="">All ships</option>{guestShipOptions.map(ship => <option key={ship} value={ship}>{ship}</option>)}</select></label>
                        <label><span>Sailing date</span><select value={guestFinderFilters.sailingDate} onChange={event => updateGuestFinderFilter('sailingDate', event.target.value)} data-testid="react-booking-guest-sailing-date-filter"><option value="">All sailing dates</option>{guestSailingDateOptions.map(sailingDate => <option key={sailingDate} value={sailingDate}>{sailingDate}</option>)}</select></label>
                      </div>

                      {guest.customerId && (
                        <div className="booking-selected-guest-card ce-editor-card ce-surface-light" data-testid="react-booking-selected-guest-card">
                          <span className="booking-selected-guest-label">Selected guest</span>
                          <strong>{getCustomerDisplayName(selectedCustomer || {})}</strong>
                          <span>{selectedCustomer?.email || 'Existing customer profile'}</span>
                        </div>
                      )}

                      <div className="booking-guest-results" data-testid="react-booking-guest-results">
                        {visibleOptions.length === 0 ? (
                          <p className="empty-state compact ce-empty-state ce-editor-card ce-surface-light" data-testid="react-booking-guest-finder-empty">No existing guests match the current search.</p>
                        ) : visibleOptions.map(option => (
                          <button key={option.customer.id} type="button" className={`booking-guest-result-card ce-selector-card ce-command-card${guest.customerId === option.customer.id ? ' selected' : ''}`} onClick={() => selectExistingGuest(index, option.customer.id)} aria-pressed={guest.customerId === option.customer.id} data-testid="react-booking-guest-result-card">
                            <span className="booking-guest-result-main ce-selector-card-main"><strong>{option.name}</strong><span>{option.customer.email || 'No email on file'}</span></span>
                            <span className="booking-guest-result-context ce-selector-card-detail">{option.detail}</span>
                            {option.contexts.length > 0 && <span className="booking-guest-result-chips">{option.contexts.slice(0, 2).map(context => <span key={`${option.customer.id}-${context.bookingId}`}>{context.ship} · {context.sailingDate}</span>)}</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <label><span>First name</span><input value={guest.firstName} onChange={event => updateGuest(index, 'firstName', event.target.value)} data-testid="react-booking-new-guest-first-name" /></label>
                  <label><span>Last name</span><input value={guest.lastName} onChange={event => updateGuest(index, 'lastName', event.target.value)} data-testid="react-booking-new-guest-last-name" /></label>
                  <label><span>Email</span><input type="email" value={guest.email} onChange={event => updateGuest(index, 'email', event.target.value)} data-testid="react-booking-new-guest-email" /></label>
                  <label><span>Phone</span><input value={guest.phone} onChange={event => updateGuest(index, 'phone', event.target.value)} data-testid="react-booking-new-guest-phone" /></label>
                </>
              )}

              <label><span>Dining</span><select value={guest.diningPreference} onChange={event => updateGuest(index, 'diningPreference', event.target.value)} data-testid="react-booking-guest-dining-select">{DINING_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
              <label><span>Accessibility notes</span><input value={guest.accessibilityNotes} onChange={event => updateGuest(index, 'accessibilityNotes', event.target.value)} data-testid="react-booking-guest-accessibility-input" /></label>
            </div>
            {index > 0 && <button type="button" className="danger-outline-button ce-button-danger" onClick={() => removeGuest(index)} data-testid="react-booking-remove-guest-button">Remove Guest</button>}
          </fieldset>
        )
      })}
    </div>
  )
}
