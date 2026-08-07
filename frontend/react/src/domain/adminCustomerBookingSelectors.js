import { getCustomerDirectoryName } from './adminHierarchy.js'

export const MAX_ADMIN_SELECTOR_OPTIONS = 75

function uniqueSorted(values = []) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function getPersonParts(person = {}) {
  const rawName = getCustomerDirectoryName(person).trim()
  const firstName = String(person.firstName || person.givenName || '').trim()
  const lastName = String(person.lastName || person.familyName || '').trim()

  if (firstName || lastName) return { firstName, lastName, rawName }

  const parts = rawName.split(/\s+/).filter(Boolean)
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(''),
    rawName
  }
}

function getCustomerSortLabel(customer = {}) {
  const { firstName, lastName, rawName } = getPersonParts(customer)
  if (!lastName) return rawName || customer.id || 'Customer pending'
  return firstName ? `${lastName}, ${firstName}` : lastName
}

function getBookingPrimaryPassenger(booking = {}) {
  const passenger = (booking.passengers || [])[0]
  return passenger?.customer || passenger || {}
}

function compareCustomerNames(left = {}, right = {}) {
  const leftParts = getPersonParts(left)
  const rightParts = getPersonParts(right)
  return (leftParts.lastName || '').localeCompare(rightParts.lastName || '')
    || (leftParts.firstName || '').localeCompare(rightParts.firstName || '')
    || (leftParts.rawName || '').localeCompare(rightParts.rawName || '')
    || String(left.id || '').localeCompare(String(right.id || ''))
}

function compareBookingPassengerNames(left = {}, right = {}) {
  return compareCustomerNames(getBookingPrimaryPassenger(left), getBookingPrimaryPassenger(right))
    || String(left.id || '').localeCompare(String(right.id || ''))
}

function getBookingCruiseLineName(booking = {}) {
  return booking.cruiseLine?.name
    || booking.cruiseLineName
    || booking.sailing?.cruiseLineName
    || booking.ship?.cruiseLine?.name
    || booking.ship?.cruiseLineName
    || 'Cruise line pending'
}

function getBookingShipName(booking = {}) {
  return booking.ship?.name || booking.shipName || 'Ship pending'
}

function createBookingSelectorRows(bookings = []) {
  return bookings.map(booking => ({
    booking,
    lineName: getBookingCruiseLineName(booking),
    shipName: getBookingShipName(booking),
    primaryPassenger: getBookingPrimaryPassenger(booking),
    passengerIds: new Set((booking.passengers || []).map(passenger => passenger.customerId || passenger.customer?.id).filter(Boolean))
  }))
}

function createCustomerSelectorMeta(customers = [], bookingSelectorRows = []) {
  const metaMap = new Map()
  customers.forEach(customer => {
    const linkedRows = bookingSelectorRows.filter(row => row.booking.createdByCustomerId === customer.id || row.passengerIds.has(customer.id))
    metaMap.set(customer.id, {
      bookingIds: new Set(linkedRows.map(row => row.booking.id)),
      lineNames: uniqueSorted(linkedRows.map(row => row.lineName)),
      shipNames: uniqueSorted(linkedRows.map(row => row.shipName)),
      linkedCount: linkedRows.length
    })
  })
  return metaMap
}

function getScopedCustomerRows(customers, customerSelectorMeta, filters = {}) {
  return customers.filter(customer => {
    const metadata = customerSelectorMeta.get(customer.id) || {}
    const lineMatches = !filters.cruiseLine || (metadata.lineNames || []).includes(filters.cruiseLine)
    const shipMatches = !filters.ship || (metadata.shipNames || []).includes(filters.ship)
    const personParts = getPersonParts(customer)
    const lastNameMatches = !filters.lastName || personParts.lastName === filters.lastName
    const firstNameInitial = personParts.firstName.slice(0, 1).toUpperCase()
    const firstInitialMatches = !filters.firstNameInitial || firstNameInitial === filters.firstNameInitial
    return lineMatches && shipMatches && lastNameMatches && firstInitialMatches
  }).sort(compareCustomerNames)
}

function getScopedBookingRows(bookingSelectorRows, filters = {}) {
  return bookingSelectorRows.filter(row => {
    const lineMatches = !filters.cruiseLine || row.lineName === filters.cruiseLine
    const shipMatches = !filters.ship || row.shipName === filters.ship
    const passengerParts = getPersonParts(row.primaryPassenger)
    const lastNameMatches = !filters.passengerLastName || passengerParts.lastName === filters.passengerLastName
    const firstNameInitial = passengerParts.firstName.slice(0, 1).toUpperCase()
    const firstInitialMatches = !filters.passengerFirstNameInitial || firstNameInitial === filters.passengerFirstNameInitial
    return lineMatches && shipMatches && lastNameMatches && firstInitialMatches
  }).map(row => row.booking).sort(compareBookingPassengerNames)
}

function getScopedLineOptions({ customers, bookingSelectorRows, customerSelectorMeta, filters = {}, mode = 'booking' }) {
  if (mode === 'customer') {
    return uniqueSorted(customers
      .filter(customer => !filters.ship || (customerSelectorMeta.get(customer.id)?.shipNames || []).includes(filters.ship))
      .flatMap(customer => customerSelectorMeta.get(customer.id)?.lineNames || []))
  }
  return uniqueSorted(bookingSelectorRows.filter(row => !filters.ship || row.shipName === filters.ship).map(row => row.lineName))
}

function getScopedShipOptions({ customers, bookingSelectorRows, customerSelectorMeta, filters = {}, mode = 'booking' }) {
  if (mode === 'customer') {
    return uniqueSorted(customers
      .filter(customer => !filters.cruiseLine || (customerSelectorMeta.get(customer.id)?.lineNames || []).includes(filters.cruiseLine))
      .flatMap(customer => customerSelectorMeta.get(customer.id)?.shipNames || []))
  }
  return uniqueSorted(bookingSelectorRows.filter(row => !filters.cruiseLine || row.lineName === filters.cruiseLine).map(row => row.shipName))
}

export function buildAdminCustomerBookingSelectorState({
  customers = [], bookings = [], deleteCustomerFilters = {}, deleteBookingFilters = {}, workflowFilters = {}
} = {}) {
  const bookingSelectorRows = createBookingSelectorRows(bookings)
  const customerSelectorMeta = createCustomerSelectorMeta(customers, bookingSelectorRows)
  const scope = { customers, bookingSelectorRows, customerSelectorMeta }
  const customerRows = filters => getScopedCustomerRows(customers, customerSelectorMeta, filters)
  const bookingRows = filters => getScopedBookingRows(bookingSelectorRows, filters)

  const customerCruiseLineOptions = getScopedLineOptions({ ...scope, filters: deleteCustomerFilters, mode: 'customer' })
  const bookingCruiseLineOptions = getScopedLineOptions({ ...scope, filters: deleteBookingFilters })
  const customerShipOptions = getScopedShipOptions({ ...scope, filters: deleteCustomerFilters, mode: 'customer' })
  const bookingShipOptions = getScopedShipOptions({ ...scope, filters: deleteBookingFilters })
  const customerLastNameOptions = uniqueSorted(customerRows({ cruiseLine: deleteCustomerFilters.cruiseLine, ship: deleteCustomerFilters.ship }).map(customer => getPersonParts(customer).lastName))
  const customerFirstNameInitialOptions = uniqueSorted(customerRows({ cruiseLine: deleteCustomerFilters.cruiseLine, ship: deleteCustomerFilters.ship, lastName: deleteCustomerFilters.lastName }).map(customer => getPersonParts(customer).firstName.slice(0, 1).toUpperCase()))
  const bookingPassengerLastNameOptions = uniqueSorted(bookingRows({ cruiseLine: deleteBookingFilters.cruiseLine, ship: deleteBookingFilters.ship }).map(booking => getPersonParts(getBookingPrimaryPassenger(booking)).lastName))
  const bookingPassengerFirstNameInitialOptions = uniqueSorted(bookingRows({ cruiseLine: deleteBookingFilters.cruiseLine, ship: deleteBookingFilters.ship, passengerLastName: deleteBookingFilters.passengerLastName }).map(booking => getPersonParts(getBookingPrimaryPassenger(booking)).firstName.slice(0, 1).toUpperCase()))
  const allFilteredDeleteCustomers = customerRows(deleteCustomerFilters)
  const allFilteredDeleteBookings = bookingRows(deleteBookingFilters)
  const customerSelectorNeedsNarrowing = allFilteredDeleteCustomers.length > MAX_ADMIN_SELECTOR_OPTIONS
  const bookingSelectorNeedsNarrowing = allFilteredDeleteBookings.length > MAX_ADMIN_SELECTOR_OPTIONS
  const workflowCruiseLineOptions = getScopedLineOptions({ ...scope, filters: workflowFilters, mode: 'customer' })
  const workflowShipOptions = getScopedShipOptions({ ...scope, filters: workflowFilters, mode: 'customer' })
  const workflowLastNameOptions = uniqueSorted(customerRows({ cruiseLine: workflowFilters.cruiseLine, ship: workflowFilters.ship }).map(customer => getPersonParts(customer).lastName))
  const workflowFirstNameInitialOptions = uniqueSorted(customerRows({ cruiseLine: workflowFilters.cruiseLine, ship: workflowFilters.ship, lastName: workflowFilters.lastName }).map(customer => getPersonParts(customer).firstName.slice(0, 1).toUpperCase()))
  const allFilteredWorkflowCustomers = customerRows(workflowFilters)
  const workflowSelectorNeedsNarrowing = allFilteredWorkflowCustomers.length > MAX_ADMIN_SELECTOR_OPTIONS

  return {
    customerSelectorMeta,
    customerCruiseLineOptions, bookingCruiseLineOptions, customerShipOptions, bookingShipOptions,
    customerLastNameOptions, customerFirstNameInitialOptions, bookingPassengerLastNameOptions, bookingPassengerFirstNameInitialOptions,
    allFilteredDeleteCustomers, allFilteredDeleteBookings, customerSelectorNeedsNarrowing, bookingSelectorNeedsNarrowing,
    filteredDeleteCustomers: customerSelectorNeedsNarrowing ? [] : allFilteredDeleteCustomers,
    filteredDeleteBookings: bookingSelectorNeedsNarrowing ? [] : allFilteredDeleteBookings,
    workflowCruiseLineOptions, workflowShipOptions, workflowLastNameOptions, workflowFirstNameInitialOptions,
    allFilteredWorkflowCustomers, workflowSelectorNeedsNarrowing,
    filteredWorkflowCustomers: workflowSelectorNeedsNarrowing ? [] : allFilteredWorkflowCustomers,
    getBookingDeleteLabel(booking = {}) {
      const passengerNames = (booking.passengers || []).map(passenger => getCustomerSortLabel(passenger.customer || passenger)).filter(Boolean).slice(0, 2).join('; ')
      const shipName = booking.ship?.name || booking.shipName || 'Ship pending'
      const sailingDate = booking.sailing?.departureDate || booking.departureDate || 'Date pending'
      const cabin = booking.cabinNumber ? `Cabin ${booking.cabinNumber}` : 'Cabin pending'
      return `${passengerNames || 'Passenger pending'} — ${booking.id} · ${shipName} · ${sailingDate} · ${cabin}`
    },
    getCustomerDeleteLabel(customer = {}) {
      const linkedCount = customerSelectorMeta.get(customer.id)?.linkedCount || 0
      return `${getCustomerSortLabel(customer)} — ${customer.email || customer.id} · ${linkedCount === 1 ? '1 linked booking' : `${linkedCount} linked bookings`}`
    }
  }
}
