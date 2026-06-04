import { useMemo, useState } from 'react'
import { createBooking, createCustomer, getSailingsForShip, getShipsForCruiseLine } from '../api/client.js'

const DINING_OPTIONS = [
  'Anytime dining',
  'Early seating',
  'Late seating',
  'My Time dining',
  'Freestyle dining',
  'Rotational dining',
  'Flexible dining',
  'Special dietary request'
]

function normalizeText(value = '') {
  return String(value).trim().toLowerCase()
}

function createReadableId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 11).toUpperCase().replace(/[^A-Z0-9]/g, '0')
  return `${prefix}${randomPart.padEnd(9, '0').slice(0, 9)}`
}

function getCustomerDisplayName(customer = {}) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.id
}

function getSelectedCustomerDefaults(selectedCustomer, selectedDemoUser) {
  return {
    id: selectedCustomer?.id || selectedDemoUser?.customerId || '',
    firstName: selectedCustomer?.firstName || selectedDemoUser?.displayName?.split(' ')[0] || '',
    lastName: selectedCustomer?.lastName || selectedDemoUser?.displayName?.split(' ').slice(1).join(' ') || '',
    email: selectedCustomer?.email || selectedDemoUser?.email || '',
    phone: selectedCustomer?.phone || '',
    loyaltyNumber: selectedCustomer?.loyaltyNumber || ''
  }
}

function buildPrimaryGuestDraft(selectedCustomer, selectedDemoUser) {
  const defaults = getSelectedCustomerDefaults(selectedCustomer, selectedDemoUser)

  return {
    customerMode: 'existing',
    customerId: defaults.id,
    firstName: defaults.firstName,
    lastName: defaults.lastName,
    email: defaults.email,
    phone: defaults.phone,
    loyaltyNumber: defaults.loyaltyNumber,
    passengerRole: 'Primary',
    diningPreference: 'Anytime dining',
    accessibilityNotes: '',
    boardingGroup: 'Group A'
  }
}

function buildGuestDraft() {
  return {
    customerMode: 'new',
    customerId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    loyaltyNumber: '',
    passengerRole: 'Guest',
    diningPreference: 'Anytime dining',
    accessibilityNotes: '',
    boardingGroup: 'Group B'
  }
}

function getActionErrorMessage(action, error, fallback) {
  const detail = error?.message ? ` ${error.message}` : ''
  return `${action}${detail || ` ${fallback}`}`.trim()
}

function getGuestLabel(guest) {
  return [guest.firstName, guest.lastName].filter(Boolean).join(' ') || guest.email || 'this guest'
}

function normalizeGuestPayload(guest) {
  return {
    id: createReadableId('C'),
    firstName: guest.firstName.trim(),
    lastName: guest.lastName.trim(),
    email: guest.email.trim(),
    phone: guest.phone.trim(),
    loyaltyNumber: guest.loyaltyNumber.trim()
  }
}

function getSailingLabel(sailing) {
  if (!sailing) return 'Select a sailing'
  return `${sailing.departureDate} — ${sailing.departurePort} to ${sailing.arrivalPort} (${sailing.days} nights)`
}

export default function PassengerCruiseBookingWorkflow({
  cruiseLines = [],
  customers = [],
  selectedCustomer,
  selectedDemoUser,
  onBookingCreated
}) {
  const [selectedCruiseLineId, setSelectedCruiseLineId] = useState('')
  const [selectedShipId, setSelectedShipId] = useState('')
  const [selectedSailingId, setSelectedSailingId] = useState('')
  const [shipOptions, setShipOptions] = useState([])
  const [sailingOptions, setSailingOptions] = useState([])
  const [isLoadingShips, setIsLoadingShips] = useState(false)
  const [isLoadingSailings, setIsLoadingSailings] = useState(false)
  const [searchFilters, setSearchFilters] = useState({ destination: '', departurePort: '', duration: '', cruiseLine: '' })
  const [guestDrafts, setGuestDrafts] = useState(() => [buildPrimaryGuestDraft(selectedCustomer, selectedDemoUser)])
  const [cabinNumber, setCabinNumber] = useState('To be assigned')
  const [fareCode, setFareCode] = useState('STANDARD')
  const [statusMessage, setStatusMessage] = useState('Select a cruise line, ship, and sailing to start a new booking.')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedCruiseLine = cruiseLines.find(line => line.id === selectedCruiseLineId)
  const selectedShip = shipOptions.find(ship => ship.id === selectedShipId)
  const selectedSailing = sailingOptions.find(sailing => sailing.id === selectedSailingId)

  const filteredCruiseLines = useMemo(() => {
    const cruiseLineFilter = normalizeText(searchFilters.cruiseLine)
    return cruiseLines.filter(line => {
      if (!cruiseLineFilter) return true
      return normalizeText(line.name).includes(cruiseLineFilter) || normalizeText(line.country).includes(cruiseLineFilter)
    })
  }, [cruiseLines, searchFilters.cruiseLine])

  const filteredSailings = useMemo(() => {
    const destination = normalizeText(searchFilters.destination)
    const departurePort = normalizeText(searchFilters.departurePort)
    const duration = searchFilters.duration

    return sailingOptions.filter(sailing => {
      const destinationMatches = !destination || normalizeText(`${sailing.arrivalPort} ${sailing.port}`).includes(destination)
      const departureMatches = !departurePort || normalizeText(sailing.departurePort).includes(departurePort)
      const durationMatches = !duration || String(sailing.days) === duration
      return destinationMatches && departureMatches && durationMatches
    })
  }, [sailingOptions, searchFilters.destination, searchFilters.departurePort, searchFilters.duration])

  async function handleCruiseLineChange(value) {
    setSelectedCruiseLineId(value)
    setSelectedShipId('')
    setSelectedSailingId('')
    setShipOptions([])
    setSailingOptions([])

    if (!value) {
      setStatusMessage('Select a cruise line to load available ships.')
      return
    }

    setIsLoadingShips(true)
    setStatusMessage('Loading ships for this cruise line...')

    try {
      const ships = await getShipsForCruiseLine(value)
      setShipOptions(ships)
      setStatusMessage(ships.length ? 'Choose a ship to load available sailings.' : 'No ships are available for this cruise line yet.')
    } catch (error) {
      setStatusMessage(getActionErrorMessage('Could not load ships for the selected cruise line.', error, 'Try again or choose a different cruise line.'))
    } finally {
      setIsLoadingShips(false)
    }
  }

  async function handleShipChange(value) {
    setSelectedShipId(value)
    setSelectedSailingId('')
    setSailingOptions([])

    if (!value) {
      setStatusMessage('Select a ship to load sailing dates.')
      return
    }

    setIsLoadingSailings(true)
    setStatusMessage('Loading sailing dates for this ship...')

    try {
      const sailings = await getSailingsForShip(value)
      setSailingOptions(sailings)
      setStatusMessage(sailings.length ? 'Choose a sailing date and add guests before booking.' : 'No sailings are available for this ship yet.')
    } catch (error) {
      setStatusMessage(getActionErrorMessage('Could not load sailing dates for the selected ship.', error, 'Try again or choose a different ship.'))
    } finally {
      setIsLoadingSailings(false)
    }
  }

  function updateGuest(index, fieldName, value) {
    setGuestDrafts(current => current.map((guest, guestIndex) => (
      guestIndex === index ? { ...guest, [fieldName]: value } : guest
    )))
  }

  function addGuest() {
    setGuestDrafts(current => [...current, buildGuestDraft()])
  }

  function removeGuest(index) {
    setGuestDrafts(current => current.filter((_, guestIndex) => guestIndex !== index))
  }

  function validateBookingDraft() {
    if (guestDrafts.length === 0) {
      return 'At least one passenger is required before booking.'
    }

    for (const guest of guestDrafts) {
      if (guest.customerMode === 'existing' && !guest.customerId) {
        return 'Each existing guest must select a customer record.'
      }

      if (guest.customerMode === 'new' && (!guest.firstName.trim() || !guest.lastName.trim() || !guest.email.trim())) {
        return 'New guests require first name, last name, and email before booking.'
      }

      if (guest.customerMode === 'new' && !guest.email.includes('@')) {
        return 'New guest email must be a valid email address before booking.'
      }
    }

    if (!selectedCruiseLineId || !selectedShipId || !selectedSailingId || !selectedSailing) {
      return 'Cruise line, ship, and sailing date are required before booking.'
    }

    return ''
  }

  async function resolveGuestCustomer(guest) {
    if (guest.customerMode === 'existing') {
      return guest.customerId
    }

    const newCustomer = normalizeGuestPayload(guest)

    try {
      await createCustomer(newCustomer)
      return newCustomer.id
    } catch (error) {
      throw new Error(getActionErrorMessage(`Could not create guest profile for ${getGuestLabel(guest)}.`, error, 'Please review the guest details and try again.'))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateBookingDraft()

    if (validationMessage) {
      setStatusMessage(validationMessage)
      return
    }

    setIsSubmitting(true)
    setStatusMessage('Creating passenger booking...')

    try {
      const resolvedPassengerIds = []

      for (const guest of guestDrafts) {
        resolvedPassengerIds.push(await resolveGuestCustomer(guest))
      }

      const bookingId = createReadableId('B')

      try {
        await createBooking({
          id: bookingId,
          sailingId: selectedSailingId,
          bookingStatus: 'REQUESTED',
          cabinNumber: cabinNumber.trim() || 'To be assigned',
          fareCode,
          embarkationPort: selectedSailing.departurePort,
          debarkationPort: selectedSailing.arrivalPort,
          createdByCustomerId: selectedCustomer?.id || selectedDemoUser?.customerId || resolvedPassengerIds[0],
          passengers: resolvedPassengerIds.map((customerId, index) => ({
            customerId,
            passengerRole: index === 0 ? 'Primary' : (guestDrafts[index].passengerRole || 'Guest'),
            isPrimaryGuest: index === 0,
            diningPreference: guestDrafts[index].diningPreference || 'Anytime dining',
            accessibilityNotes: guestDrafts[index].accessibilityNotes || '',
            boardingGroup: guestDrafts[index].boardingGroup || (index === 0 ? 'Group A' : 'Group B')
          }))
        })
      } catch (error) {
        throw new Error(getActionErrorMessage('Booking request was not created.', error, 'Please review the selected sailing and guest details before trying again.'))
      }

      try {
        await onBookingCreated?.()
      } catch (error) {
        setStatusMessage(getActionErrorMessage(`Booking request ${bookingId} was created, but the booking list could not refresh.`, error, 'Refresh the page to confirm the booking appears.'))
        return
      }

      setStatusMessage(`Booking request ${bookingId} created for ${selectedCruiseLine?.name || 'selected cruise line'} on ${selectedShip?.name || 'selected ship'}.`)
    } catch (error) {
      setStatusMessage(error.message || 'Passenger booking failed before the booking could be confirmed in the application.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="role-profile-card passenger-booking-workflow" aria-labelledby="react-passenger-booking-heading" data-testid="react-passenger-booking-workflow">
      <p className="eyebrow">New cruise booking</p>
      <h3 id="react-passenger-booking-heading">Find and book a cruise</h3>
      <p>Search by cruise line, ship, destination, departure port, or sailing length, then add guests and request a booking.</p>

      <form className="passenger-booking-form" noValidate onSubmit={handleSubmit} data-testid="react-passenger-booking-form">
        <div className="booking-search-grid">
          <label>
            <span>Cruise line search</span>
            <input value={searchFilters.cruiseLine} onChange={event => setSearchFilters(current => ({ ...current, cruiseLine: event.target.value }))} placeholder="Royal Caribbean, Celebrity, MSC..." data-testid="react-booking-cruise-line-search" />
          </label>
          <label>
            <span>Destination</span>
            <input value={searchFilters.destination} onChange={event => setSearchFilters(current => ({ ...current, destination: event.target.value }))} placeholder="Nassau, Cozumel, Alaska..." data-testid="react-booking-destination-search" />
          </label>
          <label>
            <span>Departure port</span>
            <input value={searchFilters.departurePort} onChange={event => setSearchFilters(current => ({ ...current, departurePort: event.target.value }))} placeholder="Miami, Port Canaveral..." data-testid="react-booking-departure-port-search" />
          </label>
          <label>
            <span>Length</span>
            <select value={searchFilters.duration} onChange={event => setSearchFilters(current => ({ ...current, duration: event.target.value }))} data-testid="react-booking-duration-filter">
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
            <select value={selectedCruiseLineId} onChange={event => handleCruiseLineChange(event.target.value)} data-testid="react-booking-cruise-line-select">
              <option value="">Select cruise line</option>
              {filteredCruiseLines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
            </select>
          </label>
          <label>
            <span>Ship</span>
            <select value={selectedShipId} disabled={!selectedCruiseLineId || isLoadingShips} onChange={event => handleShipChange(event.target.value)} data-testid="react-booking-ship-select">
              <option value="">{isLoadingShips ? 'Loading ships...' : 'Select ship'}</option>
              {shipOptions.map(ship => <option key={ship.id} value={ship.id}>{ship.name}</option>)}
            </select>
          </label>
          <label>
            <span>Sailing date</span>
            <select value={selectedSailingId} disabled={!selectedShipId || isLoadingSailings} onChange={event => setSelectedSailingId(event.target.value)} data-testid="react-booking-sailing-select">
              <option value="">{isLoadingSailings ? 'Loading sailings...' : 'Select sailing'}</option>
              {filteredSailings.map(sailing => <option key={sailing.id} value={sailing.id}>{getSailingLabel(sailing)}</option>)}
            </select>
          </label>
          <label>
            <span>Fare preference</span>
            <select value={fareCode} onChange={event => setFareCode(event.target.value)} data-testid="react-booking-fare-code-select">
              <option value="STANDARD">Standard</option>
              <option value="BALCONY">Balcony</option>
              <option value="SUITE">Suite</option>
              <option value="FAMILY">Family</option>
            </select>
          </label>
        </div>

        <label className="passenger-cabin-field">
          <span>Cabin request</span>
          <input value={cabinNumber} onChange={event => setCabinNumber(event.target.value)} data-testid="react-booking-cabin-input" />
        </label>

        <div className="passenger-booking-guests" data-testid="react-booking-guest-list">
          <div className="section-heading-row">
            <div>
              <h4>Guests</h4>
              <p>Use your profile as the primary guest, select existing guests, or add a new guest profile during booking.</p>
            </div>
            <button type="button" className="secondary-action-button" onClick={addGuest} data-testid="react-booking-add-guest-button">+ Add Guest</button>
          </div>

          {guestDrafts.map((guest, index) => (
            <fieldset className="passenger-booking-guest-card" key={`guest-${index}`} data-testid="react-booking-guest-card">
              <legend>{index === 0 ? 'Primary guest' : `Guest ${index + 1}`}</legend>
              <div className="booking-search-grid">
                <label>
                  <span>Guest source</span>
                  <select value={guest.customerMode} disabled={index === 0} onChange={event => updateGuest(index, 'customerMode', event.target.value)} data-testid="react-booking-guest-mode-select">
                    <option value="existing">Existing customer</option>
                    <option value="new">New guest</option>
                  </select>
                </label>

                {guest.customerMode === 'existing' ? (
                  <label>
                    <span>Customer</span>
                    <select value={guest.customerId} disabled={index === 0} onChange={event => updateGuest(index, 'customerId', event.target.value)} data-testid="react-booking-existing-customer-select">
                      <option value="">Select customer</option>
                      {customers.map(customer => <option key={customer.id} value={customer.id}>{getCustomerDisplayName(customer)}</option>)}
                    </select>
                  </label>
                ) : (
                  <>
                    <label><span>First name</span><input value={guest.firstName} onChange={event => updateGuest(index, 'firstName', event.target.value)} data-testid="react-booking-new-guest-first-name" /></label>
                    <label><span>Last name</span><input value={guest.lastName} onChange={event => updateGuest(index, 'lastName', event.target.value)} data-testid="react-booking-new-guest-last-name" /></label>
                    <label><span>Email</span><input type="email" value={guest.email} onChange={event => updateGuest(index, 'email', event.target.value)} data-testid="react-booking-new-guest-email" /></label>
                    <label><span>Phone</span><input value={guest.phone} onChange={event => updateGuest(index, 'phone', event.target.value)} data-testid="react-booking-new-guest-phone" /></label>
                  </>
                )}

                <label>
                  <span>Dining</span>
                  <select value={guest.diningPreference} onChange={event => updateGuest(index, 'diningPreference', event.target.value)} data-testid="react-booking-guest-dining-select">
                    {DINING_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label><span>Accessibility notes</span><input value={guest.accessibilityNotes} onChange={event => updateGuest(index, 'accessibilityNotes', event.target.value)} data-testid="react-booking-guest-accessibility-input" /></label>
              </div>
              {index > 0 && <button type="button" className="danger-outline-button" onClick={() => removeGuest(index)} data-testid="react-booking-remove-guest-button">Remove Guest</button>}
            </fieldset>
          ))}
        </div>

        <button type="submit" className="primary-action-button" disabled={isSubmitting} data-testid="react-booking-submit-button">
          {isSubmitting ? 'Creating booking...' : 'Request Booking'}
        </button>
        <p className="draft-message" role="status" aria-live="polite" data-testid="react-booking-status-message">{statusMessage}</p>
      </form>
    </section>
  )
}
