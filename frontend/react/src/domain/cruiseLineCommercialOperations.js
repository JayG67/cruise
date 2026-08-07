import {
  getBookingCruiseLineName,
  getBookingDepartureDate,
  getBookingShipName,
  getLineSailings,
  getOperationalShips,
  getPassengerName,
  getPassengerPreference,
  getPassengerRows,
  getSailingDestination,
  getSailingItinerary,
  getShipSailings
} from './cruiseLineOperationsData.js'

function buildRevenueMix(line = {}, bookings = []) {
  const ships = getOperationalShips(line, bookings)
  const shipNames = new Set(ships.map(ship => ship.name).filter(Boolean))
  const matchingBookings = bookings.filter(booking => getBookingCruiseLineName(booking) === line.name || shipNames.has(getBookingShipName(booking)))
  const categoryTotals = new Map()

  matchingBookings.forEach(booking => {
    const category = booking.stateroomCategory || booking.cabinCategory || booking.fareClass || booking.roomType || 'Standard fare'
    const guestCount = Math.max(1, getPassengerRows(booking).length)
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + guestCount)
  })

  if (categoryTotals.size === 0) {
    ships.slice(0, 3).forEach((ship, index) => {
      categoryTotals.set(index === 0 ? 'Balcony' : index === 1 ? 'Oceanview' : 'Interior', Math.max(1, getShipSailings(ship).length * 2))
    })
  }

  const totalGuests = [...categoryTotals.values()].reduce((total, count) => total + count, 0) || 1

  return [...categoryTotals.entries()]
    .map(([category, guests]) => ({ category, guests, share: Math.round((guests / totalGuests) * 100) }))
    .sort((left, right) => right.guests - left.guests)
    .slice(0, 5)
}

function buildSailingCalendar(line = {}, bookings = []) {
  return getLineSailings(line, bookings)
    .sort((left, right) => String(left.departureDate || '').localeCompare(String(right.departureDate || '')))
    .slice(0, 6)
    .map(sailing => ({
      id: `${sailing.shipName}-${sailing.departureDate}-${sailing.destination || sailing.arrivalPort || sailing.days}`,
      shipName: sailing.shipName || 'Ship',
      departureDate: sailing.departureDate || 'Date pending',
      duration: sailing.days || getSailingItinerary(sailing).length || 0,
      destination: getSailingDestination(sailing),
      departurePort: sailing.departurePort || sailing.port || 'Home port',
      itineraryDays: getSailingItinerary(sailing).length
    }))
}

function buildGuestExperienceRows(line = {}, bookings = []) {
  const ships = getOperationalShips(line, bookings)
  const shipNames = new Set(ships.map(ship => ship.name).filter(Boolean))

  return bookings
    .filter(booking => getBookingCruiseLineName(booking) === line.name || shipNames.has(getBookingShipName(booking)))
    .flatMap(booking => getPassengerRows(booking).map(passenger => ({
      id: `${booking.id}-${getPassengerName(passenger)}`,
      passengerName: getPassengerName(passenger),
      bookingId: booking.id,
      shipName: getBookingShipName(booking) || 'Ship assignment',
      preference: getPassengerPreference(passenger),
      status: booking.status || booking.bookingStatus || 'Booked'
    })))
    .slice(0, 8)
}

function getFareCode(booking = {}) {
  return booking.fareCode || booking.stateroomCategory || booking.cabinCategory || booking.fareClass || booking.roomType || 'STD'
}

function normalizeFareLabel(fareCode = '') {
  const normalized = String(fareCode || '').trim().toUpperCase()
  if (normalized.startsWith('BAL')) return 'Balcony'
  if (normalized.startsWith('STE') || normalized.startsWith('SUI')) return 'Suite'
  if (normalized.startsWith('OV') || normalized.includes('OCEAN')) return 'Oceanview'
  if (normalized.startsWith('INT')) return 'Interior'
  return normalized ? normalized.charAt(0) + normalized.slice(1).toLowerCase() : 'Standard'
}

function buildSailingRevenueBoard(line = {}, bookings = []) {
  const ships = getOperationalShips(line, bookings)
  const shipNames = new Set(ships.map(ship => ship.name).filter(Boolean))
  const matchingBookings = bookings.filter(booking => getBookingCruiseLineName(booking) === line.name || shipNames.has(getBookingShipName(booking)))
  const guestCountsByKey = new Map()

  matchingBookings.forEach(booking => {
    const key = `${getBookingShipName(booking) || 'Ship'}|${getBookingDepartureDate(booking) || 'Date pending'}`
    const current = guestCountsByKey.get(key) || { guests: 0, bookings: 0, fareCodes: new Map() }
    const guestCount = Math.max(1, getPassengerRows(booking).length)
    const fareLabel = normalizeFareLabel(getFareCode(booking))
    current.guests += guestCount
    current.bookings += 1
    current.fareCodes.set(fareLabel, (current.fareCodes.get(fareLabel) || 0) + guestCount)
    guestCountsByKey.set(key, current)
  })

  return buildSailingCalendar(line, bookings).map((sailing, index) => {
    const key = `${sailing.shipName}|${sailing.departureDate}`
    const visibleDemand = guestCountsByKey.get(key) || { guests: 0, bookings: 0, fareCodes: new Map() }
    const estimatedCapacity = Math.max(120, (sailing.duration || sailing.itineraryDays || 5) * 42 + (index + 1) * 18)
    const occupancy = Math.min(99, Math.max(8, Math.round((visibleDemand.guests / estimatedCapacity) * 100)))
    const topFare = [...visibleDemand.fareCodes.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || 'Open inventory'
    const opportunity = occupancy >= 80
      ? 'Protect premium inventory and prepare upgrade offers.'
      : occupancy >= 45
        ? 'Target group bookings and onboard experience bundles.'
        : 'Open promotional demand through agents and loyalty campaigns.'

    return { ...sailing, estimatedCapacity, visibleGuests: visibleDemand.guests, visibleBookings: visibleDemand.bookings, occupancy, topFare, opportunity }
  })
}

function buildPortOperationsPlan(line = {}, bookings = []) {
  const portMap = new Map()

  getOperationalShips(line, bookings).forEach(ship => {
    getShipSailings(ship).forEach(sailing => {
      const ports = [sailing.departurePort || sailing.port, sailing.arrivalPort]
      getSailingItinerary(sailing).forEach(day => ports.push(day.port))
      ports.filter(Boolean).forEach(port => {
        const current = portMap.get(port) || { port, calls: 0, ships: new Set(), sampleSailings: [] }
        current.calls += 1
        current.ships.add(ship.name)
        if (current.sampleSailings.length < 2) current.sampleSailings.push(`${ship.name} · ${sailing.departureDate || 'date pending'}`)
        portMap.set(port, current)
      })
    })
  })

  return [...portMap.values()]
    .map(row => ({
      port: row.port,
      calls: row.calls,
      ships: row.ships.size,
      sampleSailings: row.sampleSailings,
      operatingFocus: row.calls >= 6 ? 'High-frequency port coordination' : row.calls >= 3 ? 'Repeat-call service planning' : 'Destination experience planning'
    }))
    .sort((left, right) => right.calls - left.calls || left.port.localeCompare(right.port))
    .slice(0, 6)
}

export { buildGuestExperienceRows, buildPortOperationsPlan, buildRevenueMix, buildSailingCalendar, buildSailingRevenueBoard }
