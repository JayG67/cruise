export const DEFAULT_BOOKING_FARE_OPTIONS = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'BALCONY', label: 'Balcony' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'FAMILY', label: 'Family' }
]

const FARE_CODE_LABELS = {
  STANDARD: 'Standard',
  BALCONY: 'Balcony',
  BAL: 'Balcony',
  OCE: 'Ocean view',
  OCEAN: 'Ocean view',
  INT: 'Interior',
  INTERIOR: 'Interior',
  SUITE: 'Suite',
  FAM: 'Family',
  FAMILY: 'Family',
  SOLO: 'Solo traveler',
  GRP: 'Group fare',
  AFT: 'Aft cabin',
  FWD: 'Forward cabin',
  SPA: 'Spa cabin',
  AQ: 'Aqua class',
  HAVEN: 'Haven',
  CONC: 'Concierge'
}

export function sortByLabel(a, b) {
  return String(a?.name || a?.label || a || '').localeCompare(String(b?.name || b?.label || b || ''))
}

export function sortByDepartureDate(a, b) {
  return String(a?.departureDate || '').localeCompare(String(b?.departureDate || ''))
}

function getFareCodeLabel(code = '') {
  const normalizedCode = String(code || '').trim().toUpperCase()
  if (!normalizedCode) return 'Fare option'
  return FARE_CODE_LABELS[normalizedCode] || normalizedCode.replace(/[-_]+/g, ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
}

export function buildFareOptionsForShip(bookings = [], shipName = '') {
  const normalizedShipName = normalizeText(shipName)
  if (!normalizedShipName) return DEFAULT_BOOKING_FARE_OPTIONS

  const shipFareCodes = new Set(
    bookings
      .filter(booking => normalizeText(getBookingShipName(booking)) === normalizedShipName)
      .map(booking => String(booking.fareCode || '').trim().toUpperCase())
      .filter(Boolean)
  )

  if (shipFareCodes.size === 0) return DEFAULT_BOOKING_FARE_OPTIONS

  return [...shipFareCodes]
    .map(code => ({ value: code, label: getFareCodeLabel(code) }))
    .sort((a, b) => a.label.localeCompare(b.label) || a.value.localeCompare(b.value))
}

export const DINING_OPTIONS = [
  'Anytime dining',
  'Early seating',
  'Late seating',
  'My Time dining',
  'Freestyle dining',
  'Rotational dining',
  'Flexible dining',
  'Special dietary request'
]

export function normalizeText(value = '') {
  return String(value).trim().toLowerCase()
}

export function createReadableId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 11).toUpperCase().replace(/[^A-Z0-9]/g, '0')
  return `${prefix}${randomPart.padEnd(9, '0').slice(0, 9)}`
}

export function getCustomerDisplayName(customer = {}) {
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

export function buildPrimaryGuestDraft(selectedCustomer, selectedDemoUser) {
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

export function buildGuestDraft() {
  return {
    customerMode: 'existing',
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

export function getActionErrorMessage(action, error, fallback) {
  const detail = error?.message ? ` ${error.message}` : ''
  return `${action}${detail || ` ${fallback}`}`.trim()
}

export function getGuestLabel(guest) {
  return [guest.firstName, guest.lastName].filter(Boolean).join(' ') || guest.email || 'this guest'
}

export function normalizeGuestPayload(guest) {
  return {
    id: createReadableId('C'),
    firstName: guest.firstName.trim(),
    lastName: guest.lastName.trim(),
    email: guest.email.trim(),
    phone: guest.phone.trim(),
    loyaltyNumber: guest.loyaltyNumber.trim()
  }
}

export function getSailingLabel(sailing) {
  if (!sailing) return 'Select a sailing'
  return `${sailing.departureDate} — ${sailing.departurePort} to ${sailing.arrivalPort} (${sailing.days} nights)`
}

function getBookingPassengerIds(booking = {}) {
  return new Set((booking.passengers || []).map(passenger => passenger.customerId || passenger.customer?.id).filter(Boolean))
}

function getBookingCruiseLineName(booking = {}) {
  return booking.cruiseLine?.name || booking.cruiseLineName || 'Cruise line unavailable'
}

function getBookingShipName(booking = {}) {
  return booking.ship?.name || booking.shipName || 'Ship unavailable'
}

function getBookingSailingDate(booking = {}) {
  return booking.sailing?.departureDate || booking.departureDate || 'Date unavailable'
}

function getBookingRoute(booking = {}) {
  const departure = booking.sailing?.departurePort || booking.departurePort || booking.embarkationPort
  const arrival = booking.sailing?.arrivalPort || booking.arrivalPort || booking.debarkationPort

  if (departure && arrival) return `${departure} to ${arrival}`
  return departure || arrival || ''
}

function getCustomerBookingContexts(customer = {}, bookings = []) {
  if (!customer.id) return []

  return bookings.filter(booking => getBookingPassengerIds(booking).has(customer.id) || booking.createdByCustomerId === customer.id)
    .map(booking => ({
      bookingId: booking.id,
      cruiseLine: getBookingCruiseLineName(booking),
      ship: getBookingShipName(booking),
      sailingDate: getBookingSailingDate(booking),
      route: getBookingRoute(booking),
      cabinNumber: booking.cabinNumber || 'Cabin pending'
    }))
}

export function buildCustomerFinderOption(customer = {}, bookings = []) {
  const name = getCustomerDisplayName(customer)
  const contexts = getCustomerBookingContexts(customer, bookings)
  const primaryContext = contexts[0]

  return {
    customer,
    name,
    contexts,
    detail: primaryContext
      ? `${primaryContext.cruiseLine} · ${primaryContext.ship} · ${primaryContext.sailingDate}`
      : 'No active booking context yet',
    searchText: [
      name,
      customer.email,
      customer.id,
      customer.phone,
      customer.loyaltyNumber,
      ...contexts.flatMap(context => [context.bookingId, context.cruiseLine, context.ship, context.sailingDate, context.route, context.cabinNumber])
    ].filter(Boolean).join(' ').toLowerCase()
  }
}

export function getFinderFilterOptions(options = [], key) {
  const values = new Set()

  options.forEach(option => {
    option.contexts.forEach(context => {
      if (context[key]) values.add(context[key])
    })
  })

  return [...values].sort((a, b) => String(a).localeCompare(String(b)))
}

export function finderOptionMatchesFilter(option, filterKey, value) {
  if (!value) return true
  return option.contexts.some(context => context[filterKey] === value)
}
