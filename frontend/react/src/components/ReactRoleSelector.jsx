function formatDemoUserRole(role = 'Demo User') {
  return role
    .toLowerCase()
    .replaceAll('-', '_')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatRoleOption(role = '') {
  if (role === 'admin') return 'Administrator'
  if (role === 'group-leader') return 'Group Leader'
  if (role === 'turnaround-manager') return 'Turnaround Manager'
  if (role === 'housekeeping-lead') return 'Housekeeping Lead'
  if (role === 'guest-services-lead') return 'Guest Services Lead'
  if (role === 'food-beverage-lead') return 'Food & Beverage Lead'
  if (role === 'engineering-lead') return 'Engineering Lead'
  return 'Passenger'
}

function formatDemoUserLabel(user) {
  const name = user.displayName || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.id
  const role = formatDemoUserRole(user.role || user.userType || 'Demo User')

  return `${name} (${role})`
}

function getRoleSummary(user, customerCount, bookingCount, visibleBookingCount = bookingCount) {
  if (!user) {
    return `Loading workspace users — ${customerCount} customers and ${bookingCount} bookings available.`
  }

  const role = (user.role || '').toLowerCase()

  if (role.includes('admin')) {
    return `Admin mode — full cruise data management enabled. ${customerCount} customers and ${bookingCount} bookings available.`
  }

  if (role.includes('group')) {
    return `Group leader mode — ${visibleBookingCount} visible booking${visibleBookingCount === 1 ? '' : 's'} available.`
  }

  if (role.includes('turnaround') || role.includes('housekeeping') || role.includes('guest_services') || role.includes('food_beverage') || role.includes('engineering')) {
    return `${formatDemoUserRole(user.role)} mode — operational workspace access is selected for upcoming turnaround operations.`
  }

  return `Passenger mode — ${visibleBookingCount} visible booking${visibleBookingCount === 1 ? '' : 's'} available.`
}

export default function ReactRoleSelector({
  customerCount = 0,
  bookingCount = 0,
  demoUsers = [],
  filteredDemoUsers = demoUsers,
  availableRoles = [],
  selectedRole = '',
  selectedDemoUserId = '',
  selectedDemoUser,
  isLoadingDemoUsers = false,
  demoUserError = '',
  onSelectRole,
  onSelectDemoUser,
  visibleBookingCount = bookingCount
}) {
  const roleOptions = availableRoles.length > 0 ? availableRoles : ['admin', 'passenger', 'group-leader']

  return (
    <section className="react-app-section role-selector-section" id="react-role-selector" aria-labelledby="react-role-selector-heading" data-testid="react-role-selector">
      <p className="eyebrow">Workspace selection</p>
      <h2 id="react-role-selector-heading">View application as</h2>
      <p>
        Select a role, then choose the specific person or workspace user for operational testing.
      </p>

      <div className="role-selector-grid">
        <label className="react-field-label" htmlFor="react-role-type">
          Role
        </label>
        <select
          id="react-role-type"
          className="react-select"
          value={selectedRole}
          onChange={event => onSelectRole?.(event.target.value)}
          disabled={isLoadingDemoUsers || roleOptions.length === 0}
          data-testid="react-role-type-select"
        >
          <option value="">All roles</option>
          {roleOptions.map(role => (
            <option key={role} value={role}>{formatRoleOption(role)}</option>
          ))}
        </select>

        <label className="react-field-label" htmlFor="react-demo-role">
          Person
        </label>
        <select
          id="react-demo-role"
          className="react-select"
          value={selectedDemoUserId}
          onChange={event => onSelectDemoUser?.(event.target.value)}
          disabled={isLoadingDemoUsers || filteredDemoUsers.length === 0}
          data-testid="react-demo-user-select"
        >
          {filteredDemoUsers.map(user => (
            <option key={user.id} value={user.id}>{formatDemoUserLabel(user)}</option>
          ))}
        </select>
      </div>

      {demoUserError && <p className="error" role="alert">{demoUserError}</p>}

      <div className="role-summary-card" aria-live="polite" data-testid="react-demo-user-summary">
        <strong>{selectedDemoUser ? formatDemoUserLabel(selectedDemoUser) : 'Loading workspace users'}</strong>
        <span>{getRoleSummary(selectedDemoUser, customerCount, bookingCount, visibleBookingCount)}</span>
        <span>{filteredDemoUsers.length} people available for the selected role.</span>
        <span>{demoUsers.length} total workspace users available.</span>
      </div>
    </section>
  )
}
