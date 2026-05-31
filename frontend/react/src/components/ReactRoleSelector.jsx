function formatDemoUserRole(role = 'Demo User') {
  return role
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDemoUserLabel(user) {
  const name = user.displayName || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.id
  const role = formatDemoUserRole(user.role || user.userType || 'Demo User')

  return `${name} (${role})`
}

function getRoleSummary(user, customerCount, bookingCount, visibleBookingCount = bookingCount) {
  if (!user) {
    return `Loading demo users — ${customerCount} customers and ${bookingCount} bookings available.`
  }

  const role = (user.role || '').toLowerCase()

  if (role.includes('admin')) {
    return `Admin mode — full cruise data management enabled. ${customerCount} customers and ${bookingCount} bookings available.`
  }

  if (role.includes('group')) {
    return `Group leader mode — ${visibleBookingCount} visible booking${visibleBookingCount === 1 ? '' : 's'} available.`
  }

  return `Passenger mode — ${visibleBookingCount} visible booking${visibleBookingCount === 1 ? '' : 's'} available.`
}

export default function ReactRoleSelector({
  customerCount = 0,
  bookingCount = 0,
  demoUsers = [],
  selectedDemoUserId = '',
  selectedDemoUser,
  isLoadingDemoUsers = false,
  demoUserError = '',
  onSelectDemoUser,
  visibleBookingCount = bookingCount
}) {
  return (
    <section className="react-app-section role-selector-section" id="react-role-selector" aria-labelledby="react-role-selector-heading" data-testid="react-role-selector">
      <p className="eyebrow">Demo role selector</p>
      <h2 id="react-role-selector-heading">View application as</h2>
      <p>
        Switch between admin and passenger perspectives without adding authentication yet.
      </p>

      <label className="react-field-label" htmlFor="react-demo-role">
        Demo user
      </label>
      <select
        id="react-demo-role"
        className="react-select"
        value={selectedDemoUserId}
        onChange={event => onSelectDemoUser?.(event.target.value)}
        disabled={isLoadingDemoUsers || demoUsers.length === 0}
        data-testid="react-demo-user-select"
      >
        {demoUsers.map(user => (
          <option key={user.id} value={user.id}>{formatDemoUserLabel(user)}</option>
        ))}
      </select>

      {demoUserError && <p className="error" role="alert">{demoUserError}</p>}

      <div className="role-summary-card" aria-live="polite" data-testid="react-demo-user-summary">
        <strong>{selectedDemoUser ? formatDemoUserLabel(selectedDemoUser) : 'Loading demo users'}</strong>
        <span>{getRoleSummary(selectedDemoUser, customerCount, bookingCount, visibleBookingCount)}</span>
        <span>{demoUsers.length} demo users available.</span>
      </div>
    </section>
  )
}
