import { getCustomerName } from './adminHierarchy.js'

export function normalizeRole(role = '') {
  const normalizedRole = String(role).toLowerCase().replace(/-/g, '_')

  if (normalizedRole.includes('admin')) return 'admin'
  if (normalizedRole.includes('group')) return 'group-leader'
  if (normalizedRole.includes('turnaround')) return 'turnaround-manager'
  if (normalizedRole.includes('housekeeping')) return 'housekeeping-lead'
  if (normalizedRole.includes('guest_services') || normalizedRole.includes('guest services')) return 'guest-services-lead'
  if (normalizedRole.includes('food_beverage') || normalizedRole.includes('food beverage')) return 'food-beverage-lead'
  if (normalizedRole.includes('engineering')) return 'engineering-lead'

  return 'passenger'
}

export function isOperationalRoleView(roleView = '') {
  return [
    'turnaround-manager',
    'housekeeping-lead',
    'guest-services-lead',
    'food-beverage-lead',
    'engineering-lead'
  ].includes(roleView)
}

export function getSelectedRoleView(selectedDemoUser = {}) {
  return normalizeRole(selectedDemoUser.role || selectedDemoUser.userType)
}

export function findDemoCustomer(selectedDemoUser = {}, customers = []) {
  return customers.find(customer => customer.id === selectedDemoUser.customerId)
}

export function getBookingsForCustomer(customerId, bookings = []) {
  if (!customerId) return []

  return bookings.filter(booking =>
    booking.createdByCustomerId === customerId
    || (booking.passengers || []).some(passenger =>
      passenger.customerId === customerId || passenger.customer?.id === customerId
    )
  )
}

export function getGroupVisibleBookings(selectedDemoUser = {}, bookings = []) {
  const groupCustomerIds = new Set(selectedDemoUser.customerIds || selectedDemoUser.visibleCustomerIds || [])

  if (selectedDemoUser.customerId) {
    groupCustomerIds.add(selectedDemoUser.customerId)
  }

  if (groupCustomerIds.size === 0) {
    return getBookingsForCustomer(selectedDemoUser.customerId, bookings)
  }

  return bookings.filter(booking =>
    (booking.passengers || []).some(passenger =>
      groupCustomerIds.has(passenger.customerId) || groupCustomerIds.has(passenger.customer?.id)
    )
  )
}

export function getVisibleRoleBookings(selectedDemoUser = {}, bookings = []) {
  const roleView = getSelectedRoleView(selectedDemoUser)

  if (roleView === 'admin' || isOperationalRoleView(roleView)) return bookings
  if (roleView === 'group-leader') return getGroupVisibleBookings(selectedDemoUser, bookings)

  return getBookingsForCustomer(selectedDemoUser.customerId, bookings)
}

export function getRoleDashboardTitle(roleView) {
  if (roleView === 'admin') return 'Admin workspace'
  if (roleView === 'group-leader') return 'Group booking dashboard'
  if (roleView === 'turnaround-manager') return 'Turnaround operations'
  if (roleView === 'housekeeping-lead') return 'Housekeeping operations'
  if (roleView === 'guest-services-lead') return 'Guest services operations'
  if (roleView === 'food-beverage-lead') return 'Food & beverage operations'
  if (roleView === 'engineering-lead') return 'Engineering operations'
  return 'Passenger booking dashboard'
}

export function getRoleSummaryLine({ selectedDemoUser, selectedCustomer, visibleBookings = [], customerCount = 0, bookingCount = 0 }) {
  const roleView = getSelectedRoleView(selectedDemoUser)

  if (roleView === 'admin') {
    return `Admin mode — full cruise data management enabled. ${customerCount} customers and ${bookingCount} bookings available.`
  }

  if (roleView === 'group-leader') {
    return `Showing ${visibleBookings.length} bookings visible to ${selectedDemoUser?.displayName || 'the group leader'}.`
  }

  if (isOperationalRoleView(roleView)) {
    return `${selectedDemoUser?.displayName || 'The selected operator'} is viewing the operational workspace for ${getRoleDashboardTitle(roleView).toLowerCase()} across ${visibleBookings.length} active booking${visibleBookings.length === 1 ? '' : 's'}.`
  }

  return `Showing ${visibleBookings.length} booking${visibleBookings.length === 1 ? '' : 's'} visible to ${selectedCustomer ? getCustomerName(selectedCustomer) : selectedDemoUser?.displayName || 'the selected passenger'}.`
}

