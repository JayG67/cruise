function validateBookingPassengerSet(passengers = []) {
  const uniquePassengerIds = new Set(passengers.map(passenger => passenger.customerId))

  if (uniquePassengerIds.size !== passengers.length) {
    return 'Booking cannot include duplicate customers'
  }

  const primaryGuestCount = passengers.filter(passenger => passenger.isPrimaryGuest).length

  if (primaryGuestCount !== 1) {
    return 'Booking must include exactly one primary guest'
  }

  return null
}

module.exports = { validateBookingPassengerSet }
