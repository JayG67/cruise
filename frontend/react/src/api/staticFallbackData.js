const DEFAULT_HEADERS = {
  Accept: 'application/json'
}

export const STATIC_DATA_URL = '/data/cruise.json'

let staticSeedDataPromise

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getCruiseLineId(line) {
  return line.id || slugify(line.name)
}

function getShipId(line, ship) {
  return ship.id || `${getCruiseLineId(line)}-${slugify(ship.name)}`
}

function getSailingId(line, ship, sailing) {
  return sailing.id || `${getShipId(line, ship)}-${sailing.departureDate}`
}

export async function loadStaticSeedData() {
  if (!staticSeedDataPromise) {
    staticSeedDataPromise = fetch(STATIC_DATA_URL, {
      headers: DEFAULT_HEADERS
    }).then(async response => {
      if (!response.ok) {
        throw new Error(`Unable to load bundled cruise data. HTTP ${response.status}.`)
      }

      return response.json()
    })
  }

  return staticSeedDataPromise
}

export function normalizeStaticCustomers(seedData) {
  return Array.isArray(seedData.customers) ? seedData.customers : []
}

export function normalizeStaticCruiseLines(seedData) {
  return (Array.isArray(seedData.cruiseLines) ? seedData.cruiseLines : []).map(line => ({
    ...line,
    id: getCruiseLineId(line),
    shipCount: Array.isArray(line.ships) ? line.ships.length : 0
  }))
}

export function normalizeStaticBookings(seedData) {
  const customersById = new Map(normalizeStaticCustomers(seedData).map(customer => [customer.id, customer]))

  return (Array.isArray(seedData.bookings) ? seedData.bookings : []).map(booking => {
    const matchingCruiseLine = normalizeStaticCruiseLines(seedData).find(line =>
      (line.ships || []).some(ship =>
        ship.name === booking.shipName &&
        (ship.sailings || []).some(sailing => sailing.departureDate === booking.departureDate)
      )
    )
    const matchingShip = matchingCruiseLine
      ? (matchingCruiseLine.ships || []).find(ship => ship.name === booking.shipName)
      : null
    const matchingSailing = matchingShip
      ? (matchingShip.sailings || []).find(sailing => sailing.departureDate === booking.departureDate)
      : null
    const sailingId = matchingCruiseLine && matchingShip && matchingSailing
      ? getSailingId(matchingCruiseLine, matchingShip, matchingSailing)
      : booking.sailingId
    const itineraryDays = Array.isArray(matchingSailing?.itinerary) ? matchingSailing.itinerary : []
    const sailingWithItinerary = matchingSailing
      ? {
          ...matchingSailing,
          id: sailingId,
          shipId: matchingShip ? getShipId(matchingCruiseLine, matchingShip) : undefined,
          shipName: matchingShip?.name,
          cruiseLineId: matchingCruiseLine?.id,
          cruiseLineName: matchingCruiseLine?.name,
          itinerary: itineraryDays,
          itineraryDays
        }
      : null

    return {
      ...booking,
      sailingId,
      sailing: sailingWithItinerary,
      itinerary: itineraryDays,
      itineraryDays,
      passengers: (booking.passengers || []).map(passenger => ({
        ...passenger,
        customer: customersById.get(passenger.customerId) || null
      }))
    }
  })
}

export function normalizeStaticDemoUsers(seedData) {
  return Array.isArray(seedData.demoUsers) ? seedData.demoUsers : []
}

export function normalizeStaticTurnaroundOperations(seedData) {
  return Array.isArray(seedData.turnaroundOperations) ? seedData.turnaroundOperations : []
}

export function getStaticShipsForCruiseLine(seedData, cruiseLineId) {
  const line = normalizeStaticCruiseLines(seedData).find(candidate => candidate.id === cruiseLineId || slugify(candidate.name) === cruiseLineId)

  if (!line) {
    return []
  }

  return (Array.isArray(line.ships) ? line.ships : []).map(ship => ({
    ...ship,
    id: getShipId(line, ship),
    cruiseLineId: line.id,
    cruiseLineName: line.name,
    sailingCount: Array.isArray(ship.sailings) ? ship.sailings.length : 0
  }))
}

export function getStaticSailingsForShip(seedData, shipId) {
  for (const line of normalizeStaticCruiseLines(seedData)) {
    for (const ship of (line.ships || [])) {
      if (getShipId(line, ship) !== shipId && slugify(ship.name) !== shipId) {
        continue
      }

      return (Array.isArray(ship.sailings) ? ship.sailings : []).map(sailing => ({
        ...sailing,
        id: getSailingId(line, ship, sailing),
        shipId: getShipId(line, ship),
        shipName: ship.name,
        cruiseLineId: line.id,
        cruiseLineName: line.name
      }))
    }
  }

  return []
}

export function getStaticItineraryForSailing(seedData, sailingId) {
  for (const line of normalizeStaticCruiseLines(seedData)) {
    for (const ship of (line.ships || [])) {
      for (const sailing of (ship.sailings || [])) {
        if (getSailingId(line, ship, sailing) === sailingId) {
          return Array.isArray(sailing.itinerary) ? sailing.itinerary : []
        }
      }
    }
  }

  return []
}
