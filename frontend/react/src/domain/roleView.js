import { getCustomerName, getBookingPassengerNames, getBookingRoute } from './adminHierarchy.js'

export function normalizeRole(role = '') {
  const normalizedRole = role.toLowerCase()

  if (normalizedRole.includes('admin')) return 'admin'
  if (normalizedRole.includes('group')) return 'group-leader'
  return 'passenger'
}

export function getSelectedRoleView(selectedDemoUser = {}) {
  return normalizeRole(selectedDemoUser.role || selectedDemoUser.userType)
}

export function findDemoCustomer(selectedDemoUser = {}, customers = []) {
  return customers.find(customer => customer.id === selectedDemoUser.customerId)
}

export function getBookingsForCustomer(customerId, bookings = []) {
  if (!customerId) return []

  return bookings.filter(booking =>
    booking.createdByCustomerId === customerId
    || (booking.passengers || []).some(passenger =>
      passenger.customerId === customerId || passenger.customer?.id === customerId
    )
  )
}

export function getGroupVisibleBookings(selectedDemoUser = {}, bookings = []) {
  const groupCustomerIds = new Set(selectedDemoUser.customerIds || selectedDemoUser.visibleCustomerIds || [])

  if (selectedDemoUser.customerId) {
    groupCustomerIds.add(selectedDemoUser.customerId)
  }

  if (groupCustomerIds.size === 0) {
    return getBookingsForCustomer(selectedDemoUser.customerId, bookings)
  }

  return bookings.filter(booking =>
    (booking.passengers || []).some(passenger =>
      groupCustomerIds.has(passenger.customerId) || groupCustomerIds.has(passenger.customer?.id)
    )
  )
}

export function getVisibleRoleBookings(selectedDemoUser = {}, bookings = []) {
  const roleView = getSelectedRoleView(selectedDemoUser)

  if (roleView === 'admin') return bookings
  if (roleView === 'group-leader') return getGroupVisibleBookings(selectedDemoUser, bookings)

  return getBookingsForCustomer(selectedDemoUser.customerId, bookings)
}

export function getRoleDashboardTitle(roleView) {
  if (roleView === 'admin') return 'Admin workspace'
  if (roleView === 'group-leader') return 'Group booking dashboard'
  return 'Passenger booking dashboard'
}

export function getRoleSummaryLine({ selectedDemoUser, selectedCustomer, visibleBookings = [], customerCount = 0, bookingCount = 0 }) {
  const roleView = getSelectedRoleView(selectedDemoUser)

  if (roleView === 'admin') {
    return `Admin mode — full cruise data management enabled. ${customerCount} customers and ${bookingCount} bookings available.`
  }

  if (roleView === 'group-leader') {
    return `Showing ${visibleBookings.length} bookings visible to ${selectedDemoUser?.displayName || 'the group leader'}.`
  }

  return `Showing ${visibleBookings.length} booking${visibleBookings.length === 1 ? '' : 's'} visible to ${selectedCustomer ? getCustomerName(selectedCustomer) : selectedDemoUser?.displayName || 'the selected passenger'}.`
}

export function getBookingCardTitle(booking = {}) {
  return `Booking ${booking.id || booking.bookingId || 'unavailable'}`
}

export function getBookingCardFields(booking = {}) {
  return [
    ['Cruise Line', booking.cruiseLine?.name || 'Cruise line unavailable'],
    ['Ship', booking.ship?.name || 'Ship unavailable'],
    ['Sailing Date', booking.sailing?.departureDate || 'Date unavailable'],
    ['Cabin', booking.cabinNumber || 'Not assigned'],
    ['Route', getBookingRoute(booking)]
  ]
}

export function getVisiblePassengerRows(booking = {}) {
  return (booking.passengers || []).map(passenger => {
    const name = passenger.customer ? getCustomerName(passenger.customer) : getCustomerName(passenger)
    return {
      id: passenger.customerId || passenger.customer?.id || name,
      name,
      role: passenger.passengerType || passenger.role || 'Guest'
    }
  }).filter(passenger => passenger.name)
}

export function getSelectedCustomerName(selectedDemoUser = {}, customers = []) {
  return getCustomerName(findDemoCustomer(selectedDemoUser, customers) || { name: selectedDemoUser.displayName, id: selectedDemoUser.id })
}

export { getBookingPassengerNames }
