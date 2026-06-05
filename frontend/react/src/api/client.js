const DEFAULT_HEADERS = {
  Accept: 'application/json'
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function buildApiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with "/": ${path}`)
  }

  return `${API_BASE_URL}${path}`
}

function getApiTroubleshootingMessage(response) {
  const requestedUrl = response?.url || 'API response'

  return `Expected JSON from ${requestedUrl}. Make sure the Express API is running on port 8000 and the React Vite proxy is configured for local preview.`
}

export async function parseJsonResponse(response) {
  let payload

  try {
    payload = await response.json()
  } catch (error) {
    throw new Error(getApiTroubleshootingMessage(response))
  }

  if (!response.ok) {
    throw new Error(payload?.message || `The server could not complete this request. Please review the request data and try again. HTTP ${response.status}.`)
  }

  return payload
}

export async function requestJson(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers || {})
    }
  })

  return parseJsonResponse(response)
}

export async function getCustomers(options = {}) {
  const customers = await requestJson('/cruise/customers', options)
  return Array.isArray(customers) ? customers : []
}

export async function getBookings(options = {}) {
  const bookings = await requestJson('/cruise/bookings', options)
  return Array.isArray(bookings) ? bookings : []
}

export async function getTurnaroundOperations(options = {}) {
  const operations = await requestJson('/cruise/turnaround-operations', options)
  return Array.isArray(operations) ? operations : []
}

export async function getDemoUsers(options = {}) {
  const demoUsers = await requestJson('/cruise/demo-users', options)
  return Array.isArray(demoUsers) ? demoUsers : []
}

export async function getAdminHierarchySnapshot(options = {}) {
  const [customers, bookings] = await Promise.all([
    getCustomers(options),
    getBookings(options)
  ])

  return { customers, bookings }
}


export async function createCustomer(payload, options = {}) {
  return requestJson('/cruise/customers', {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteCustomer(customerId, options = {}) {
  return requestJson(`/cruise/customers/${encodeURIComponent(customerId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function createBooking(payload, options = {}) {
  return requestJson('/cruise/bookings', {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteBooking(bookingId, options = {}) {
  return requestJson(`/cruise/bookings/${encodeURIComponent(bookingId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function updateCustomerProfile(customerId, payload, options = {}) {
  return requestJson(`/cruise/customers/${encodeURIComponent(customerId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}


export async function updatePassengerProfile(customerId, payload, options = {}) {
  return requestJson(`/cruise/customers/${encodeURIComponent(customerId)}/passenger-profile`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateBookingDetails(bookingId, payload, options = {}) {
  return requestJson(`/cruise/bookings/${encodeURIComponent(bookingId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function getCruiseLines(options = {}) {
  const cruiseLines = await requestJson('/cruise', options)
  return Array.isArray(cruiseLines) ? cruiseLines : []
}

export async function getShipsForCruiseLine(cruiseLineId, options = {}) {
  const ships = await requestJson(`/cruise/ships/${encodeURIComponent(cruiseLineId)}`, options)
  return Array.isArray(ships) ? ships : []
}

export async function createCruiseLine(payload, options = {}) {
  return requestJson('/cruise/cruise-line', {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateCruiseLine(cruiseLineId, payload, options = {}) {
  return requestJson(`/cruise/cruise-line/${encodeURIComponent(cruiseLineId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function createShip(payload, options = {}) {
  return requestJson('/cruise/ship', {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateShip(shipId, payload, options = {}) {
  return requestJson(`/cruise/ship/${encodeURIComponent(shipId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteShip(shipId, options = {}) {
  return requestJson(`/cruise/ship/${encodeURIComponent(shipId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function getSailingsForShip(shipId, options = {}) {
  const sailings = await requestJson(`/cruise/ship/${encodeURIComponent(shipId)}/sailings`, options)
  return Array.isArray(sailings) ? sailings : []
}

export async function createSailing(shipId, payload, options = {}) {
  return requestJson(`/cruise/ship/${encodeURIComponent(shipId)}/sailings`, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateSailing(sailingId, payload, options = {}) {
  return requestJson(`/cruise/sailings/${encodeURIComponent(sailingId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteSailing(sailingId, options = {}) {
  return requestJson(`/cruise/sailings/${encodeURIComponent(sailingId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function getItineraryForSailing(sailingId, options = {}) {
  const itinerary = await requestJson(`/cruise/sailings/${encodeURIComponent(sailingId)}/itinerary`, options)
  return Array.isArray(itinerary) ? itinerary : []
}

export async function createItineraryDay(sailingId, payload, options = {}) {
  return requestJson(`/cruise/sailings/${encodeURIComponent(sailingId)}/itinerary`, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateItineraryDay(itineraryDayId, payload, options = {}) {
  return requestJson(`/cruise/itinerary-days/${encodeURIComponent(itineraryDayId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteItineraryDay(itineraryDayId, options = {}) {
  return requestJson(`/cruise/itinerary-days/${encodeURIComponent(itineraryDayId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function createItineraryActivity(itineraryDayId, payload, options = {}) {
  return requestJson(`/cruise/itinerary-days/${encodeURIComponent(itineraryDayId)}/activities`, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function updateItineraryActivity(activityId, payload, options = {}) {
  return requestJson(`/cruise/activities/${encodeURIComponent(activityId)}`, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(payload)
  })
}

export async function deleteItineraryActivity(activityId, options = {}) {
  return requestJson(`/cruise/activities/${encodeURIComponent(activityId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function deleteCruiseLine(cruiseLineId, options = {}) {
  return requestJson(`/cruise/cruise-line/${encodeURIComponent(cruiseLineId)}`, {
    ...options,
    method: 'DELETE'
  })
}

export async function getHealthStatus(options = {}) {
  return requestJson('/health', options)
}

export async function resetDemoData(options = {}) {
  return requestJson('/admin/reset-demo-data', {
    ...options,
    method: 'POST'
  })
}
