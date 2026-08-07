import { getCustomerName, getBookingRoute } from './adminHierarchy.js'
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

export function getBookingItineraryDays(booking = {}) {
  const possibleItineraries = [
    booking.itinerary,
    booking.itineraryDays,
    booking.sailing?.itinerary,
    booking.sailing?.itineraryDays
  ]

  const itineraryDays = possibleItineraries.find(candidate => Array.isArray(candidate)) || []

  return [...itineraryDays].sort((a, b) => Number(a.day || 0) - Number(b.day || 0))
}

export function getItineraryDayActivities(day = {}) {
  const activities = Array.isArray(day.activities)
    ? day.activities
    : Array.isArray(day.activitySchedule)
      ? day.activitySchedule
      : []

  return [...activities].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
}

export function getSelectedCustomerName(selectedDemoUser = {}, customers = []) {
  return getCustomerName(findDemoCustomer(selectedDemoUser, customers) || { name: selectedDemoUser.displayName, id: selectedDemoUser.id })
}


