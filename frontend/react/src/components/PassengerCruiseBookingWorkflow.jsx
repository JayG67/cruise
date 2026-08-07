import PassengerBookingGuestWorkspace from './PassengerBookingGuestWorkspace.jsx'
import usePassengerBookingWorkflowState from './usePassengerBookingWorkflowState.js'
import { getSailingLabel } from '../domain/passengerBookingWorkflow.js'

export default function PassengerCruiseBookingWorkflow({
  cruiseLines = [],
  customers = [],
  bookings = [],
  selectedCustomer,
  selectedDemoUser,
  onBookingCreated
}) {
  const workflow = usePassengerBookingWorkflowState({
    cruiseLines,
    customers,
    bookings,
    selectedCustomer,
    selectedDemoUser,
    onBookingCreated
  })

  return (
    <section className="role-profile-card passenger-booking-workflow ce-command-card ce-surface-dark" aria-labelledby="react-passenger-booking-heading" data-testid="react-passenger-booking-workflow">
      <p className="eyebrow ce-kicker">New cruise booking</p>
      <h3 id="react-passenger-booking-heading">Find and book a cruise</h3>
      <p>Search by cruise line, ship, destination, departure port, or sailing length, then add guests and request a booking.</p>

      <form className="passenger-booking-form ce-editor-card ce-surface-light" noValidate onSubmit={workflow.handleSubmit} data-testid="react-passenger-booking-form">
        <div className="booking-search-grid ce-field-grid">
          <label>
            <span>Cruise line search</span>
            <input value={workflow.searchFilters.cruiseLine} onChange={event => workflow.updateSearchFilter('cruiseLine', event.target.value)} placeholder="Royal Caribbean, Celebrity, MSC..." data-testid="react-booking-cruise-line-search" />
          </label>
          <label>
            <span>Destination</span>
            <input value={workflow.searchFilters.destination} onChange={event => workflow.updateSearchFilter('destination', event.target.value)} placeholder="Nassau, Cozumel, Alaska..." data-testid="react-booking-destination-search" />
          </label>
          <label>
            <span>Departure port</span>
            <input value={workflow.searchFilters.departurePort} onChange={event => workflow.updateSearchFilter('departurePort', event.target.value)} placeholder="Miami, Port Canaveral..." data-testid="react-booking-departure-port-search" />
          </label>
          <label>
            <span>Length</span>
            <select value={workflow.searchFilters.duration} onChange={event => workflow.updateSearchFilter('duration', event.target.value)} data-testid="react-booking-duration-filter">
              <option value="">Any length</option>
              <option value="3">3 nights</option>
              <option value="4">4 nights</option>
              <option value="5">5 nights</option>
              <option value="7">7 nights</option>
              <option value="10">10 nights</option>
            </select>
          </label>
        </div>

        <div className="booking-search-grid booking-selection-grid">
          <label>
            <span>Cruise line</span>
            <select value={workflow.selectedCruiseLineId} onChange={event => workflow.handleCruiseLineChange(event.target.value)} data-testid="react-booking-cruise-line-select">
              <option value="">Select cruise line</option>
              {workflow.filteredCruiseLines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
            </select>
          </label>
          <label>
            <span>Ship</span>
            <select value={workflow.selectedShipId} disabled={!workflow.selectedCruiseLineId || workflow.isLoadingShips} onChange={event => workflow.handleShipChange(event.target.value)} data-testid="react-booking-ship-select">
              <option value="">{workflow.isLoadingShips ? 'Loading ships...' : 'Select ship'}</option>
              {workflow.filteredShipOptions.map(ship => <option key={ship.id} value={ship.id}>{ship.name}</option>)}
            </select>
          </label>
          <label>
            <span>Sailing date</span>
            <select value={workflow.selectedSailingId} disabled={!workflow.selectedShipId || workflow.isLoadingSailings} onChange={event => workflow.setSelectedSailingId(event.target.value)} data-testid="react-booking-sailing-select">
              <option value="">{workflow.isLoadingSailings ? 'Loading sailings...' : 'Select sailing'}</option>
              {workflow.filteredSailings.map(sailing => <option key={sailing.id} value={sailing.id}>{getSailingLabel(sailing)}</option>)}
            </select>
          </label>
          <label>
            <span>Fare preference</span>
            <select value={workflow.selectedFareCode} onChange={event => workflow.setFareCode(event.target.value)} data-testid="react-booking-fare-code-select">
              {workflow.availableFareOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        <label className="passenger-cabin-field">
          <span>Cabin request</span>
          <input value={workflow.cabinNumber} onChange={event => workflow.setCabinNumber(event.target.value)} data-testid="react-booking-cabin-input" />
        </label>

        <PassengerBookingGuestWorkspace
          addGuest={workflow.addGuest}
          customers={customers}
          getVisibleCustomerFinderOptions={workflow.getVisibleCustomerFinderOptions}
          guestCruiseLineOptions={workflow.guestCruiseLineOptions}
          guestDrafts={workflow.guestDrafts}
          guestFinderFilters={workflow.guestFinderFilters}
          guestSailingDateOptions={workflow.guestSailingDateOptions}
          guestSearches={workflow.guestSearches}
          guestShipOptions={workflow.guestShipOptions}
          removeGuest={workflow.removeGuest}
          selectExistingGuest={workflow.selectExistingGuest}
          updateGuest={workflow.updateGuest}
          updateGuestFinderFilter={workflow.updateGuestFinderFilter}
          updateGuestSearch={workflow.updateGuestSearch}
        />

        <button type="submit" className="primary-action-button ce-button-primary" disabled={workflow.isSubmitting} data-testid="react-booking-submit-button">
          {workflow.isSubmitting ? 'Creating booking...' : 'Request Booking'}
        </button>
        <p className="draft-message ce-feedback-message ce-editor-card ce-surface-light" role="status" aria-live="polite" data-testid="react-booking-status-message">{workflow.statusMessage}</p>
      </form>
    </section>
  )
}
