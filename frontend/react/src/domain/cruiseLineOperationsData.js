function formatCount(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

function getLineId(line = {}) {
  return line?.id || line?.name || 'cruise-line'
}

function getLineShips(line = {}) {
  return Array.isArray(line.ships) ? line.ships : []
}

function getBookingDepartureDate(booking = {}) {
  return booking.departureDate || booking.sailingDate || booking.sailing?.departureDate || ''
}

function getBookingEmbarkationPort(booking = {}) {
  return booking.embarkationPort || booking.departurePort || booking.sailing?.departurePort || ''
}

function getBookingDebarkationPort(booking = {}) {
  return booking.debarkationPort || booking.arrivalPort || booking.sailing?.arrivalPort || ''
}

function getBookingShipName(booking = {}) {
  return booking.ship?.name || booking.shipName || booking.ship?.shipName || ''
}

function getBookingCruiseLineName(booking = {}) {
  return booking.cruiseLine?.name || booking.cruiseLineName || ''
}

function getPassengerRows(booking = {}) {
  return Array.isArray(booking.passengers) ? booking.passengers : []
}

function getPassengerName(passenger = {}) {
  return passenger.customer?.name || passenger.customerName || passenger.name || passenger.customerId || 'Guest'
}

function getPassengerPreference(passenger = {}) {
  return passenger.customer?.diningPreference || passenger.diningPreference || passenger.customer?.accessibilityNotes || passenger.accessibilityNotes || 'Standard guest service'
}

function buildFallbackItinerary(sailing = {}) {
  const departurePort = sailing.departurePort || 'Embarkation port'
  const arrivalPort = sailing.arrivalPort || sailing.destination || departurePort

  return [
    {
      day: 1,
      title: `Embarkation — ${departurePort}`,
      port: departurePort,
      activitySchedule: [
        { time: '12:00 PM', activity: 'Guest boarding and welcome lunch' },
        { time: '4:00 PM', activity: 'Safety briefing and sail-away' }
      ]
    },
    {
      day: 2,
      title: 'Onboard programming',
      port: 'At Sea',
      activitySchedule: [
        { time: '10:00 AM', activity: 'Pool deck and family programming' },
        { time: '7:30 PM', activity: 'Main dining and evening entertainment' }
      ]
    },
    {
      day: 3,
      title: `Return — ${arrivalPort}`,
      port: arrivalPort,
      activitySchedule: [
        { time: '8:00 AM', activity: 'Breakfast and debark preparation' },
        { time: '10:00 AM', activity: 'Guest debarkation' }
      ]
    }
  ]
}

function buildBookingDerivedShips(line = {}, bookings = []) {
  const lineName = line.name || ''
  const matchingBookings = bookings.filter(booking => getBookingCruiseLineName(booking) === lineName || (!getBookingCruiseLineName(booking) && getBookingShipName(booking)))
  const shipMap = new Map()

  matchingBookings.forEach(booking => {
    const shipName = getBookingShipName(booking)
    if (!shipName) return

    const departureDate = getBookingDepartureDate(booking) || 'Date pending'
    const sailingKey = `${shipName}|${departureDate}`
    const ship = shipMap.get(shipName) || { name: shipName, sailingsByKey: new Map() }
    const sailing = ship.sailingsByKey.get(sailingKey) || {
      id: sailingKey,
      departureDate,
      departurePort: getBookingEmbarkationPort(booking),
      arrivalPort: getBookingDebarkationPort(booking),
      destination: getBookingDebarkationPort(booking) || getBookingEmbarkationPort(booking) || 'Featured voyage',
      days: 3,
      itinerary: []
    }

    if (!sailing.departurePort && getBookingEmbarkationPort(booking)) sailing.departurePort = getBookingEmbarkationPort(booking)
    if (!sailing.arrivalPort && getBookingDebarkationPort(booking)) sailing.arrivalPort = getBookingDebarkationPort(booking)
    if (!sailing.destination && getBookingDebarkationPort(booking)) sailing.destination = getBookingDebarkationPort(booking)

    ship.sailingsByKey.set(sailingKey, sailing)
    shipMap.set(shipName, ship)
  })

  return [...shipMap.values()].map(ship => ({
    name: ship.name,
    sailings: [...ship.sailingsByKey.values()].map(sailing => ({
      ...sailing,
      itinerary: sailing.itinerary.length > 0 ? sailing.itinerary : buildFallbackItinerary(sailing)
    }))
  }))
}

function getOperationalShips(line = {}, bookings = []) {
  const ships = getLineShips(line)
  return ships.length > 0 ? ships : buildBookingDerivedShips(line, bookings)
}

function getShipSailings(ship = {}) {
  return Array.isArray(ship.sailings) ? ship.sailings : []
}

function getSailingItinerary(sailing = {}) {
  return Array.isArray(sailing.itinerary) ? sailing.itinerary : []
}

function getSailingDestination(sailing = {}) {
  return sailing.destination || sailing.arrivalPort || sailing.region || 'Featured itinerary'
}

function buildSelectedOperatingScope(line = {}, ship = {}, sailing = {}, bookings = [], authoritativeItinerary) {
  line = line && typeof line === 'object' ? line : {}; ship = ship && typeof ship === 'object' ? ship : {}; sailing = sailing && typeof sailing === 'object' ? sailing : {}; bookings = Array.isArray(bookings) ? bookings : []
  const lineName = line.name || ''
  const shipName = ship.name || ''
  const departureDate = sailing.departureDate || ''
  const matchingBookings = bookings.filter(booking => {
    const bookingLine = getBookingCruiseLineName(booking)
    const bookingShip = getBookingShipName(booking)
    const bookingDate = getBookingDepartureDate(booking)
    return (!lineName || bookingLine === lineName)
      && (!shipName || bookingShip === shipName)
      && (!departureDate || bookingDate === departureDate)
  })
  const passengerCount = matchingBookings.reduce((total, booking) => total + Math.max(1, getPassengerRows(booking).length), 0)
  const itinerary = Array.isArray(authoritativeItinerary) ? authoritativeItinerary : getSailingItinerary(sailing)
  return {
    lineId: getLineId(line),
    lineName: lineName || 'Cruise line pending',
    shipId: ship.id || '',
    shipName: shipName || 'Ship pending',
    sailingId: sailing.id || departureDate,
    departureDate: departureDate || 'Date pending',
    departurePort: sailing.departurePort || sailing.port || 'Departure port pending',
    destination: getSailingDestination(sailing),
    days: Number((Array.isArray(authoritativeItinerary) && itinerary.length) || sailing.days || itinerary.length || 0),
    itineraryDayCount: itinerary.length,
    bookingCount: matchingBookings.length,
    passengerCount,
    matchingBookings
  }
}

function getPortsForLine(line = {}, bookings = []) {
  const ports = new Set()

  getOperationalShips(line, bookings).forEach(ship => {
    getShipSailings(ship).forEach(sailing => {
      if (sailing.departurePort || sailing.port) ports.add(sailing.departurePort || sailing.port)
      if (sailing.arrivalPort) ports.add(sailing.arrivalPort)
      getSailingItinerary(sailing).forEach(day => {
        if (day.port && day.port !== 'At Sea') ports.add(day.port)
      })
    })
  })

  return [...ports]
}

function getActivityHighlights(line = {}, bookings = []) {
  const activities = []

  getOperationalShips(line, bookings).forEach(ship => {
    getShipSailings(ship).forEach(sailing => {
      getSailingItinerary(sailing).forEach(day => {
        const schedule = Array.isArray(day.activitySchedule) ? day.activitySchedule : []
        schedule.slice(0, 2).forEach(activity => {
          activities.push({
            id: `${ship.name}-${sailing.departureDate}-${day.day}-${activity.time}-${activity.activity}`,
            shipName: ship.name,
            sailingDate: sailing.departureDate,
            dayTitle: day.title || `Day ${day.day}`,
            time: activity.time,
            activity: activity.activity
          })
        })
      })
    })
  })

  return activities.slice(0, 8)
}

function getLineSailings(line = {}, bookings = []) {
  return getOperationalShips(line, bookings).flatMap(ship => getShipSailings(ship).map(sailing => ({ ...sailing, shipName: ship.name })))
}

function buildLineMetrics(line = {}, bookings = []) {
  const ships = getOperationalShips(line, bookings)
  const sailings = ships.flatMap(getShipSailings)
  const lineShipNames = new Set(ships.map(ship => ship.name).filter(Boolean))
  const matchingBookings = bookings.filter(booking => getBookingCruiseLineName(booking) === line.name || lineShipNames.has(getBookingShipName(booking)))
  const passengerCount = matchingBookings.reduce((total, booking) => total + Math.max(1, getPassengerRows(booking).length), 0)
  const totalItineraryDays = sailings.reduce((total, sailing) => total + getSailingItinerary(sailing).length, 0)
  const ports = getPortsForLine(line, bookings)

  return {
    shipCount: ships.length,
    sailingCount: sailings.length,
    bookingCount: matchingBookings.length,
    passengerCount,
    itineraryDayCount: totalItineraryDays,
    portCount: ports.length,
    matchingBookings,
    ports
  }
}

export {
  buildLineMetrics,
  buildSelectedOperatingScope,
  formatCount,
  getActivityHighlights,
  getBookingCruiseLineName,
  getBookingDepartureDate,
  getBookingShipName,
  getLineId,
  getLineSailings,
  getOperationalShips,
  getPassengerName,
  getPassengerPreference,
  getPassengerRows,
  getPortsForLine,
  getSailingDestination,
  getSailingItinerary,
  getShipSailings
}
