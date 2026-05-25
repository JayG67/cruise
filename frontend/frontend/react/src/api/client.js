const DEFAULT_HEADERS = {
  Accept: 'application/json'
}

async function getJson(path) {
  const response = await fetch(path, { headers: DEFAULT_HEADERS })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`)
  }

  return data
}

export function getCustomers() {
  return getJson('/cruise/customers')
}

export function getBookings() {
  return getJson('/cruise/bookings')
}

export async function getAdminHierarchySnapshot() {
  const [customers, bookings] = await Promise.all([
    getCustomers(),
    getBookings()
  ])

  return { customers, bookings }
}
