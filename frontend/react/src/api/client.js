const API_BASE = '/cruise'

async function parseJsonResponse(response) {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Invalid JSON response from ${response.url}`)
  }
}

export async function fetchAdminCustomers() {
  const response = await fetch(`${API_BASE}/customers`)
  const data = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(data?.message || `Customer request failed with status ${response.status}`)
  }

  return Array.isArray(data) ? data : []
}

export async function fetchAdminBookings() {
  const response = await fetch(`${API_BASE}/bookings`)
  const data = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(data?.message || `Booking request failed with status ${response.status}`)
  }

  return Array.isArray(data) ? data : []
}

export async function fetchAdminHierarchySnapshot() {
  const [customers, bookings] = await Promise.all([
    fetchAdminCustomers(),
    fetchAdminBookings()
  ])

  return { customers, bookings }
}
