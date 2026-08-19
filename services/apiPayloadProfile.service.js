const COMPACT_PROFILE = 'compact'
const FULL_PROFILE = 'full'
const API_PAYLOAD_PROFILE_HEADER = 'X-Cruise-Payload-Profile'

function normalizePayloadProfile(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === COMPACT_PROFILE ? COMPACT_PROFILE : FULL_PROFILE
}

function firstMeaningfulProfile(...values) {
  return values.find(value => typeof value === 'string' && value.trim().length > 0)
}

function getRequestedPayloadProfile(req = {}) {
  return normalizePayloadProfile(firstMeaningfulProfile(
    req.query?.payloadProfile,
    req.query?.payload,
    req.query?.view,
    req.get?.(API_PAYLOAD_PROFILE_HEADER)
  ))
}

function isCompactPayloadProfile(profile) {
  return normalizePayloadProfile(profile) === COMPACT_PROFILE
}

function compactNestedIdentity(entity) {
  if (!entity) return null

  return {
    id: entity.id,
    name: entity.name,
    apiIdentity: entity.apiIdentity
  }
}

function compactSailing(sailing) {
  if (!sailing) return null

  return {
    id: sailing.id,
    shipId: sailing.shipId,
    departureDate: sailing.departureDate,
    returnDate: sailing.returnDate,
    departurePort: sailing.departurePort,
    destination: sailing.destination,
    apiIdentity: sailing.apiIdentity
  }
}

function compactPassenger(passenger) {
  if (!passenger) return null

  return {
    id: passenger.id,
    bookingPassengerUuid: passenger.bookingPassengerUuid,
    bookingId: passenger.bookingId,
    customerId: passenger.customerId,
    passengerRole: passenger.passengerRole,
    isPrimaryGuest: passenger.isPrimaryGuest,
    apiIdentity: passenger.apiIdentity,
    customer: passenger.customer
      ? {
          id: passenger.customer.id,
          customerUuid: passenger.customer.customerUuid,
          firstName: passenger.customer.firstName,
          lastName: passenger.customer.lastName,
          apiIdentity: passenger.customer.apiIdentity
        }
      : null
  }
}

function compactChecklist(checklist) {
  if (!checklist) return null

  return {
    id: checklist.id,
    checklistUuid: checklist.checklistUuid,
    customerId: checklist.customerId,
    completionStatus: checklist.completionStatus,
    updatedAt: checklist.updatedAt,
    apiIdentity: checklist.apiIdentity
  }
}

function compactCustomer(customer) {
  if (!customer) return customer

  return {
    id: customer.id,
    customerUuid: customer.customerUuid,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    loyaltyNumber: customer.loyaltyNumber,
    apiIdentity: customer.apiIdentity,
    preCruiseChecklist: compactChecklist(customer.preCruiseChecklist)
  }
}

function compactBooking(booking) {
  if (!booking) return booking

  const passengers = Array.isArray(booking.passengers) ? booking.passengers.map(compactPassenger) : []

  return {
    id: booking.id,
    bookingUuid: booking.bookingUuid,
    sailingId: booking.sailingId,
    bookingStatus: booking.bookingStatus,
    cabinNumber: booking.cabinNumber,
    fareCode: booking.fareCode,
    embarkationPort: booking.embarkationPort,
    debarkationPort: booking.debarkationPort,
    createdByCustomerId: booking.createdByCustomerId,
    createdByUserId: booking.createdByUserId,
    apiIdentity: booking.apiIdentity,
    passengerCount: passengers.length,
    primaryPassenger: passengers.find(passenger => passenger?.isPrimaryGuest) || passengers[0] || null,
    passengers,
    sailing: compactSailing(booking.sailing),
    ship: compactNestedIdentity(booking.ship),
    cruiseLine: compactNestedIdentity(booking.cruiseLine)
  }
}

function applyBookingPayloadProfile(bookings, profile) {
  if (!isCompactPayloadProfile(profile)) return bookings
  return Array.isArray(bookings) ? bookings.map(compactBooking) : compactBooking(bookings)
}

function applyCustomerPayloadProfile(customers, profile) {
  if (!isCompactPayloadProfile(profile)) return customers
  return Array.isArray(customers) ? customers.map(compactCustomer) : compactCustomer(customers)
}

module.exports = {
  API_PAYLOAD_PROFILE_HEADER,
  COMPACT_PROFILE,
  FULL_PROFILE,
  normalizePayloadProfile,
  getRequestedPayloadProfile,
  isCompactPayloadProfile,
  applyBookingPayloadProfile,
  applyCustomerPayloadProfile,
  compactBooking,
  compactCustomer
}
