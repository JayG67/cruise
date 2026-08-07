import {
  getStaticItineraryForSailing,
  getStaticSailingsForShip,
  getStaticShipsForCruiseLine,
  loadStaticSeedData,
  normalizeStaticBookings,
  normalizeStaticCruiseLines,
  normalizeStaticCustomers,
  normalizeStaticDemoUsers,
  normalizeStaticTurnaroundOperations
} from './staticFallbackData'
import { getStaticReadinessResponse } from './staticFallbackReadiness'

function isReadOnlyRequest(options = {}) {
  return !options.method || String(options.method).toUpperCase() === 'GET'
}

export async function requestStaticFallback(path, options = {}) {
  if (!isReadOnlyRequest(options)) {
    throw new Error('Live data writes require the application API. Please try again when the service is available.')
  }

  const seedData = await loadStaticSeedData()
  const requestPath = path.split('?')[0]
  const readinessResponse = getStaticReadinessResponse(requestPath)

  if (readinessResponse) {
    return readinessResponse
  }

  if (requestPath === '/cruise/customers') {
    return normalizeStaticCustomers(seedData)
  }

  if (requestPath === '/cruise/bookings') {
    return normalizeStaticBookings(seedData)
  }

  if (requestPath === '/cruise/demo-users') {
    return normalizeStaticDemoUsers(seedData)
  }

  if (requestPath === '/cruise/turnaround-operations') {
    return normalizeStaticTurnaroundOperations(seedData)
  }

  if (requestPath === '/cruise/audit-events') {
    return { auditEvents: [], filters: {}, staticFallback: true }
  }

  if (requestPath === '/cruise') {
    return normalizeStaticCruiseLines(seedData)
  }

  if (requestPath.startsWith('/cruise/ships/')) {
    return getStaticShipsForCruiseLine(seedData, decodeURIComponent(requestPath.replace('/cruise/ships/', '')))
  }

  if (requestPath.startsWith('/cruise/ship/') && requestPath.endsWith('/sailings')) {
    const shipId = decodeURIComponent(requestPath.replace('/cruise/ship/', '').replace('/sailings', ''))
    return getStaticSailingsForShip(seedData, shipId)
  }

  if (requestPath.startsWith('/cruise/sailings/') && requestPath.endsWith('/itinerary')) {
    const sailingId = decodeURIComponent(requestPath.replace('/cruise/sailings/', '').replace('/itinerary', ''))
    return getStaticItineraryForSailing(seedData, sailingId)
  }

  if (requestPath === '/health') {
    return { status: 'continuity-mode', mode: 'read-only' }
  }

  throw new Error('Bundled read-only data is not available for this request.')
}
