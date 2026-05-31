import { useState } from 'react'

import {
  findDemoCustomer,
  getBookingCardFields,
  getBookingCardTitle,
  getRoleDashboardTitle,
  getRoleSummaryLine,
  getSelectedRoleView,
  getVisiblePassengerRows
} from '../domain/roleView.js'

function PassengerProfile({ selectedCustomer, selectedDemoUser }) {
  const [message, setMessage] = useState('')


  const firstName = selectedCustomer?.firstName || selectedDemoUser?.displayName?.split(' ')[0] || ''
  const lastName = selectedCustomer?.lastName || selectedDemoUser?.displayName?.split(' ').slice(1).join(' ') || ''

  return (
    <section className="role-profile-card" aria-labelledby="react-passenger-profile-heading">
      <h3 id="react-passenger-profile-heading">My travel profile</h3>
      <p>Passengers can update limited contact and cruise preference information for the demo booking experience.</p>

      <div className="role-profile-grid">
        <label>
          <span>First name</span>
          <input value={firstName} readOnly />
        </label>
        <label>
          <span>Last name</span>
          <input value={lastName} readOnly />
        </label>
        <label>
          <span>Email</span>
          <input value={selectedCustomer?.email || selectedDemoUser?.email || ''} readOnly />
        </label>
        <label>
          <span>Phone</span>
          <input value={selectedCustomer?.phone || ''} readOnly />
        </label>
        <label>
          <span>Dining preference</span>
          <select defaultValue="anytime">
            <option value="anytime">Anytime dining</option>
            <option value="early">Early dining</option>
            <option value="late">Late dining</option>
          </select>
        </label>
        <label>
          <span>Accessibility notes</span>
          <input defaultValue="" />
        </label>
      </div>

      <button
        type="button"
        className="primary-action-button"
        onClick={() => setMessage('Profile workflow validated for React parity.')}
        data-testid="react-passenger-profile-save"
      >
        Save profile
      </button>
      {message && <p className="draft-message" data-testid="react-passenger-profile-message">{message}</p>}
    </section>
  )
}

function RoleBookingCard({ booking }) {
  const passengers = getVisiblePassengerRows(booking)

  return (
    <article className="role-booking-card" data-testid="react-role-booking-card">
      <div className="role-booking-heading">
        <h3>{getBookingCardTitle(booking)}</h3>
        <span className="status-pill">{booking.bookingStatus || 'Confirmed'}</span>
      </div>

      <dl className="role-booking-fields">
        {getBookingCardFields(booking).map(([label, value]) => (
          <div key={`${booking.id}-${label}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="visible-passenger-list">
        <strong>Visible passengers</strong>
        {passengers.length === 0 ? (
          <p>No visible passengers for this booking.</p>
        ) : passengers.map(passenger => (
          <div key={passenger.id} className="visible-passenger-row">
            <span>{passenger.name}</span>
            <span>{passenger.role}</span>
          </div>
        ))}
      </div>

      <button type="button" className="primary-action-button full-width-action">View Details</button>
    </article>
  )
}

export default function ReactRoleDashboard({
  selectedDemoUser,
  customers = [],
  bookings = [],
  visibleBookings = []
}) {
  const roleView = getSelectedRoleView(selectedDemoUser)
  const selectedCustomer = findDemoCustomer(selectedDemoUser, customers)
  const title = getRoleDashboardTitle(roleView)

  if (roleView === 'admin') return null

  return (
    <section className="react-role-dashboard" id="react-role-dashboard" aria-labelledby="react-role-dashboard-heading" data-testid={`react-${roleView}-dashboard`}>
      <p className="eyebrow">Role-aware view</p>
      <h2 id="react-role-dashboard-heading">{title}</h2>
      <p>
        {getRoleSummaryLine({
          selectedDemoUser,
          selectedCustomer,
          visibleBookings
        })}
      </p>

      {roleView === 'passenger' && (
        <PassengerProfile selectedCustomer={selectedCustomer} selectedDemoUser={selectedDemoUser} />
      )}

      <div className="role-booking-list">
        {visibleBookings.length === 0 ? (
          <p className="status-card compact">No bookings are visible for this selected demo user.</p>
        ) : visibleBookings.map(booking => (
          <RoleBookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </section>
  )
}
