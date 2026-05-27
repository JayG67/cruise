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
    throw new Error(payload?.message || `Request failed with status ${response.status}.`)
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

export async function getAdminHierarchySnapshot(options = {}) {
  const [customers, bookings] = await Promise.all([
    getCustomers(options),
    getBookings(options)
  ])

  return { customers, bookings }
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
