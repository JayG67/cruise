export { parseJsonResponse, requestJson } from './httpClient.js'
export * from './turnaroundClient.js'
export * from './platformClient.js'

import { requestJson } from './httpClient.js'

export async function getCustomers(options = {}) {
  const customers = await requestJson('/cruise/customers', options)
  return Array.isArray(customers) ? customers : []
}

export async function getBookings(options = {}) {
  const bookings = await requestJson('/cruise/bookings', options)
  return Array.isArray(bookings) ? bookings : []
}


export async function getPlatformAuditEvents(filters = {}, options = {}) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(filters || {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value).trim())
    }
  }

  const queryString = searchParams.toString()
  const response = await requestJson(`/cruise/audit-events${queryString ? `?${queryString}` : ''}`, getScopedRequestOptions(options))
  return Array.isArray(response?.auditEvents) ? response.auditEvents : []
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

export async function getBookingDetails(bookingId, options = {}) {
  return requestJson(`/cruise/bookings/${encodeURIComponent(bookingId)}`, options)
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


export async function updatePassengerPreCruiseChecklist(customerId, payload, options = {}) {
  return requestJson(`/cruise/customers/${encodeURIComponent(customerId)}/pre-cruise-checklist`, {
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
