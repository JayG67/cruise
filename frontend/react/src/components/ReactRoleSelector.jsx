const DEMO_ROLES = [
  {
    value: 'admin',
    label: 'Admin Demo User (Admin)',
    summary: 'Admin mode — customer, booking, fleet, and quality workflows enabled.'
  },
  {
    value: 'passenger',
    label: 'Jay Gallagher (Passenger)',
    summary: 'Passenger mode — booked cruise details and profile preferences remain the focus.'
  },
  {
    value: 'group-leader',
    label: 'Group Leader Demo User',
    summary: 'Group leader mode — passenger group visibility and booking context are emphasized.'
  }
]

export default function ReactRoleSelector({ customerCount = 0, bookingCount = 0 }) {
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
      <select id="react-demo-role" className="react-select" defaultValue="admin">
        {DEMO_ROLES.map(role => (
          <option key={role.value} value={role.value}>{role.label}</option>
        ))}
      </select>

      <div className="role-summary-card" aria-live="polite">
        <strong>Admin Demo User</strong>
        <span>Admin mode — full cruise data management enabled.</span>
        <span>{customerCount} customers and {bookingCount} bookings available.</span>
      </div>
    </section>
  )
}
