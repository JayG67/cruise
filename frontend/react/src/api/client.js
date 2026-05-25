const DEFAULT_HEADERS = {
  Accept: 'application/json'
}

export async function parseJsonResponse(response) {
  let payload

  try {
    payload = await response.json()
  } catch (error) {
    throw new Error(`Expected JSON from ${response.url || 'API response'}.`)
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}.`)
  }

  return payload
}

export async function requestJson(path, options = {}) {
  const response = await fetch(path, {
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
