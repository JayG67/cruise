import { useEffect, useMemo, useState } from 'react'

import { createBooking, createCustomer, getSailingsForShip, getShipsForCruiseLine } from '../api/client.js'
import {
  buildCustomerFinderOption,
  buildFareOptionsForShip,
  buildGuestDraft,
  buildPrimaryGuestDraft,
  createReadableId,
  finderOptionMatchesFilter,
  getActionErrorMessage,
  getFinderFilterOptions,
  getGuestLabel,
  normalizeGuestPayload,
  normalizeText,
  sortByDepartureDate,
  sortByLabel
} from '../domain/passengerBookingWorkflow.js'

const INITIAL_SEARCH_FILTERS = { destination: '', departurePort: '', duration: '', cruiseLine: '' }
const INITIAL_GUEST_FINDER_FILTERS = { cruiseLine: '', ship: '', sailingDate: '' }

export default function usePassengerBookingWorkflowState({
  cruiseLines,
  customers,
  bookings,
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
  const [searchFilters, setSearchFilters] = useState(INITIAL_SEARCH_FILTERS)
  const [guestDrafts, setGuestDrafts] = useState(() => [buildPrimaryGuestDraft(selectedCustomer, selectedDemoUser)])
  const [guestSearches, setGuestSearches] = useState({})
  const [guestFinderFilters, setGuestFinderFilters] = useState(INITIAL_GUEST_FINDER_FILTERS)
  const [cabinNumber, setCabinNumber] = useState('To be assigned')
  const [fareCode, setFareCode] = useState('STANDARD')
  const [statusMessage, setStatusMessage] = useState('Select a cruise line, ship, and sailing to start a new booking.')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedPrimaryGuestId = selectedCustomer?.id || selectedDemoUser?.customerId || ''

  useEffect(() => {
    const nextPrimaryGuest = buildPrimaryGuestDraft(selectedCustomer, selectedDemoUser)

    setGuestDrafts(currentGuests => {
      if (currentGuests.length === 0) return [nextPrimaryGuest]

      const currentPrimaryGuest = currentGuests[0]
      return [{
        ...currentPrimaryGuest,
        ...nextPrimaryGuest,
        diningPreference: currentPrimaryGuest.diningPreference || nextPrimaryGuest.diningPreference,
        accessibilityNotes: currentPrimaryGuest.accessibilityNotes || '',
        boardingGroup: currentPrimaryGuest.boardingGroup || nextPrimaryGuest.boardingGroup
      }, ...currentGuests.slice(1)]
    })
  }, [
    selectedPrimaryGuestId,
    selectedCustomer?.firstName,
    selectedCustomer?.lastName,
    selectedCustomer?.email,
    selectedCustomer?.phone,
    selectedCustomer?.loyaltyNumber,
    selectedDemoUser?.displayName,
    selectedDemoUser?.email
  ])

  const selectedCruiseLine = cruiseLines.find(line => line.id === selectedCruiseLineId)
  const selectedShip = shipOptions.find(ship => ship.id === selectedShipId)
  const selectedSailing = sailingOptions.find(sailing => sailing.id === selectedSailingId)

  const filteredCruiseLines = useMemo(() => {
    const cruiseLineFilter = normalizeText(searchFilters.cruiseLine)
    return cruiseLines.filter(line => (
      !cruiseLineFilter
      || normalizeText(line.name).includes(cruiseLineFilter)
      || normalizeText(line.country).includes(cruiseLineFilter)
    )).slice().sort(sortByLabel)
  }, [cruiseLines, searchFilters.cruiseLine])

  const filteredShipOptions = useMemo(() => shipOptions.slice().sort(sortByLabel), [shipOptions])

  const filteredSailings = useMemo(() => {
    const destination = normalizeText(searchFilters.destination)
    const departurePort = normalizeText(searchFilters.departurePort)
    const duration = searchFilters.duration

    return sailingOptions.filter(sailing => {
      const destinationMatches = !destination || normalizeText(`${sailing.arrivalPort} ${sailing.port}`).includes(destination)
      const departureMatches = !departurePort || normalizeText(sailing.departurePort).includes(departurePort)
      const durationMatches = !duration || String(sailing.days) === duration
      return destinationMatches && departureMatches && durationMatches
    }).slice().sort(sortByDepartureDate)
  }, [sailingOptions, searchFilters.destination, searchFilters.departurePort, searchFilters.duration])

  const availableFareOptions = useMemo(
    () => buildFareOptionsForShip(bookings, selectedShip?.name),
    [bookings, selectedShip?.name]
  )
  const selectedFareCode = availableFareOptions.some(option => option.value === fareCode)
    ? fareCode
    : availableFareOptions[0]?.value || 'STANDARD'

  const customerFinderOptions = useMemo(() => customers
    .map(customer => buildCustomerFinderOption(customer, bookings))
    .sort((a, b) => a.name.localeCompare(b.name)), [customers, bookings])

  const guestCruiseLineOptions = useMemo(() => getFinderFilterOptions(customerFinderOptions, 'cruiseLine'), [customerFinderOptions])
  const guestShipOptions = useMemo(() => getFinderFilterOptions(customerFinderOptions, 'ship'), [customerFinderOptions])
  const guestSailingDateOptions = useMemo(() => getFinderFilterOptions(customerFinderOptions, 'sailingDate'), [customerFinderOptions])

  function updateSearchFilter(fieldName, value) {
    setSearchFilters(current => ({ ...current, [fieldName]: value }))
  }

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
      const nextShips = Array.isArray(ships) ? ships.slice().sort(sortByLabel) : []
      setShipOptions(nextShips)
      setStatusMessage(nextShips.length ? 'Choose a ship to load available sailings.' : 'No ships are available for this cruise line yet.')
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
      const nextSailings = Array.isArray(sailings) ? sailings.slice().sort(sortByDepartureDate) : []
      setSailingOptions(nextSailings)
      setStatusMessage(nextSailings.length ? 'Choose a sailing date and add guests before booking.' : 'No sailings are available for this ship yet.')
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
    setGuestSearches(current => Object.fromEntries(
      Object.entries(current)
        .filter(([key]) => Number(key) !== index)
        .map(([key, value]) => [Number(key) > index ? Number(key) - 1 : key, value])
    ))
  }

  function updateGuestSearch(index, value) {
    setGuestSearches(current => ({ ...current, [index]: value }))
  }

  function updateGuestFinderFilter(fieldName, value) {
    setGuestFinderFilters(current => ({ ...current, [fieldName]: value }))
  }

  function getVisibleCustomerFinderOptions(index) {
    const search = normalizeText(guestSearches[index] || '')

    return customerFinderOptions.filter(option => {
      if (option.customer.id === selectedCustomer?.id || option.customer.id === selectedDemoUser?.customerId) return false

      return (!search || option.searchText.includes(search))
        && finderOptionMatchesFilter(option, 'cruiseLine', guestFinderFilters.cruiseLine)
        && finderOptionMatchesFilter(option, 'ship', guestFinderFilters.ship)
        && finderOptionMatchesFilter(option, 'sailingDate', guestFinderFilters.sailingDate)
    }).slice(0, 8)
  }

  function selectExistingGuest(index, customerId) {
    updateGuest(index, 'customerId', customerId)
    const selectedOption = customerFinderOptions.find(option => option.customer.id === customerId)
    if (selectedOption) updateGuestSearch(index, selectedOption.name)
  }

  function validateBookingDraft() {
    if (guestDrafts.length === 0) return 'At least one passenger is required before booking.'

    for (const guest of guestDrafts) {
      if (guest.customerMode === 'existing' && !guest.customerId) return 'Each existing guest must select a customer record.'
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
    if (guest.customerMode === 'existing') return guest.customerId

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
      for (const guest of guestDrafts) resolvedPassengerIds.push(await resolveGuestCustomer(guest))

      const bookingId = createReadableId('B')
      try {
        await createBooking({
          id: bookingId,
          sailingId: selectedSailingId,
          bookingStatus: 'REQUESTED',
          cabinNumber: cabinNumber.trim() || 'To be assigned',
          fareCode: selectedFareCode,
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

  return {
    addGuest,
    availableFareOptions,
    cabinNumber,
    filteredCruiseLines,
    filteredSailings,
    filteredShipOptions,
    getVisibleCustomerFinderOptions,
    guestCruiseLineOptions,
    guestDrafts,
    guestFinderFilters,
    guestSailingDateOptions,
    guestSearches,
    guestShipOptions,
    handleCruiseLineChange,
    handleShipChange,
    handleSubmit,
    isLoadingSailings,
    isLoadingShips,
    isSubmitting,
    removeGuest,
    searchFilters,
    selectExistingGuest,
    selectedCruiseLineId,
    selectedFareCode,
    selectedSailingId,
    selectedShipId,
    setCabinNumber,
    setFareCode,
    setSelectedSailingId,
    statusMessage,
    updateGuest,
    updateGuestFinderFilter,
    updateGuestSearch,
    updateSearchFilter
  }
}
