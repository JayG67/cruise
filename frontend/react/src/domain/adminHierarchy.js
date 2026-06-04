export function getCustomerName(customer = {}) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.name || customer.id || 'Unknown customer'
}

export function getCustomerDirectoryName(customer = {}) {
  const firstName = customer.firstName?.trim()
  const lastName = customer.lastName?.trim()

  if (lastName && firstName) return `${lastName}, ${firstName}`
  if (lastName) return lastName
  if (firstName) return firstName

  return customer.name || customer.id || 'Unknown customer'
}

export function compareCustomersByDirectoryName(left = {}, right = {}) {
  const leftLastName = (left.lastName || '').trim().toLocaleLowerCase()
  const rightLastName = (right.lastName || '').trim().toLocaleLowerCase()
  const lastNameComparison = leftLastName.localeCompare(rightLastName)

  if (lastNameComparison !== 0) return lastNameComparison

  const leftFirstName = (left.firstName || '').trim().toLocaleLowerCase()
  const rightFirstName = (right.firstName || '').trim().toLocaleLowerCase()
  const firstNameComparison = leftFirstName.localeCompare(rightFirstName)

  if (firstNameComparison !== 0) return firstNameComparison

  return String(left.id || '').localeCompare(String(right.id || ''))
}

export function getPassengerName(passenger = {}) {
  return getCustomerName(passenger.customer || passenger)
}

export function bookingMatchesCustomer(booking = {}, customerId) {
  if (!customerId) return false
  if (booking.createdByCustomerId === customerId) return true

  return (booking.passengers || []).some(passenger => {
    return passenger.customerId === customerId || passenger.customer?.id === customerId
  })
}

export function getBookingPassengerNames(booking = {}) {
  return (booking.passengers || []).map(getPassengerName).filter(Boolean)
}

export function getBookingRoute(booking = {}) {
  const departure = booking.embarkationPort || booking.sailing?.departurePort || 'Departure unavailable'
  const arrival = booking.debarkationPort || booking.sailing?.arrivalPort || 'Arrival unavailable'

  return `${departure} → ${arrival}`
}

export function buildCustomerBookingRows(customers = [], bookings = []) {
  return [...customers].sort(compareCustomersByDirectoryName).map(customer => {
    const linkedBookings = bookings.filter(booking => bookingMatchesCustomer(booking, customer.id))
    return { customer, linkedBookings }
  })
}

export function buildHierarchySearchText(customer = {}, linkedBookings = []) {
  const customerText = [
    getCustomerName(customer),
    getCustomerDirectoryName(customer),
    customer.email,
    customer.phone,
    customer.loyaltyNumber
  ]

  const bookingText = linkedBookings.flatMap(booking => [
    booking.id,
    booking.bookingStatus,
    booking.cabinNumber,
    booking.fareCode,
    booking.cruiseLine?.name,
    booking.ship?.name,
    booking.sailing?.departureDate,
    booking.embarkationPort,
    booking.debarkationPort,
    getBookingRoute(booking),
    ...getBookingPassengerNames(booking)
  ])

  return [...customerText, ...bookingText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function filterCustomerBookingRows(rows = [], searchTerm = '') {
  const normalizedSearch = searchTerm.trim().toLowerCase()

  if (!normalizedSearch) return rows

  return rows.filter(({ customer, linkedBookings }) => {
    return buildHierarchySearchText(customer, linkedBookings).includes(normalizedSearch)
  })
}

export function summarizeHierarchyRows(rows = []) {
  const bookingIds = new Set()

  rows.forEach(({ linkedBookings }) => {
    linkedBookings.forEach(booking => bookingIds.add(booking.id))
  })

  return {
    customerCount: rows.length,
    uniqueBookingCount: bookingIds.size,
    totalCustomerBookingLinks: rows.reduce((total, row) => total + row.linkedBookings.length, 0)
  }
}
