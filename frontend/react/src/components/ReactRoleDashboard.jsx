import { useEffect, useMemo, useState } from 'react'

import {
  findDemoCustomer,
  getBookingCardFields,
  getBookingCardTitle,
  getBookingItineraryDays,
  getItineraryDayActivities,
  getRoleDashboardTitle,
  getRoleSummaryLine,
  getSelectedRoleView,
  getVisiblePassengerRows
} from '../domain/roleView.js'

function getSelectedPassengerPreferences(selectedCustomer, visibleBookings) {
  const selectedCustomerId = selectedCustomer?.id

  if (!selectedCustomerId) {
    return {
      diningPreference: 'Anytime dining',
      accessibilityNotes: ''
    }
  }

  const passenger = visibleBookings
    .flatMap(booking => booking.passengers || [])
    .find(row => row.customerId === selectedCustomerId || row.customer?.id === selectedCustomerId)

  return {
    diningPreference: passenger?.diningPreference || 'Anytime dining',
    accessibilityNotes: passenger?.accessibilityNotes || ''
  }
}

function buildPassengerProfileDraft(selectedCustomer, selectedDemoUser, visibleBookings) {
  const preferences = getSelectedPassengerPreferences(selectedCustomer, visibleBookings)

  return {
    firstName: selectedCustomer?.firstName || selectedDemoUser?.displayName?.split(' ')[0] || '',
    lastName: selectedCustomer?.lastName || selectedDemoUser?.displayName?.split(' ').slice(1).join(' ') || '',
    email: selectedCustomer?.email || selectedDemoUser?.email || '',
    phone: selectedCustomer?.phone || '',
    diningPreference: preferences.diningPreference,
    accessibilityNotes: preferences.accessibilityNotes
  }
}

function PassengerProfile({
  selectedCustomer,
  selectedDemoUser,
  visibleBookings = [],
  onSavePassengerProfile,
  savingCustomerId = '',
  mutationError = ''
}) {
  const [draft, setDraft] = useState(() => buildPassengerProfileDraft(selectedCustomer, selectedDemoUser, visibleBookings))
  const [message, setMessage] = useState('')
  const selectedCustomerId = selectedCustomer?.id || selectedDemoUser?.customerId || ''
  const isSaving = Boolean(selectedCustomerId && savingCustomerId === selectedCustomerId)

  useEffect(() => {
    setDraft(buildPassengerProfileDraft(selectedCustomer, selectedDemoUser, visibleBookings))
    setMessage('')
  }, [selectedCustomerId, selectedDemoUser?.id])

  function updateDraft(fieldName, value) {
    setDraft(current => ({ ...current, [fieldName]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!selectedCustomerId) {
      setMessage('A customer profile is required before saving passenger preferences.')
      return
    }

    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim()) {
      setMessage('First name, last name, and email are required before saving profile changes.')
      return
    }

    setMessage('Saving profile...')

    try {
      const response = await onSavePassengerProfile?.(selectedCustomerId, draft)
      setMessage(response?.message || 'Passenger profile updated successfully')
    } catch (error) {
      setMessage(error.message || mutationError || 'Could not save profile.')
    }
  }

  return (
    <section className="role-profile-card passenger-self-service" aria-labelledby="react-passenger-profile-heading" data-testid="react-passenger-self-service-panel">
      <h3 id="react-passenger-profile-heading">My travel profile</h3>
      <p>Passengers can update limited contact and cruise preference information for the demo booking experience.</p>

      <form className="passenger-profile-form react-passenger-profile-form" onSubmit={handleSubmit} data-testid="react-passenger-profile-form">
        <label>
          <span>First name</span>
          <input name="firstName" aria-label="First name" value={draft.firstName} required onChange={event => updateDraft('firstName', event.target.value)} data-testid="react-passenger-profile-first-name" />
        </label>
        <label>
          <span>Last name</span>
          <input name="lastName" aria-label="Last name" value={draft.lastName} required onChange={event => updateDraft('lastName', event.target.value)} data-testid="react-passenger-profile-last-name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" aria-label="Email" type="email" value={draft.email} required onChange={event => updateDraft('email', event.target.value)} data-testid="react-passenger-profile-email" />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" aria-label="Phone" value={draft.phone} onChange={event => updateDraft('phone', event.target.value)} data-testid="react-passenger-profile-phone" />
        </label>
        <label>
          <span>Dining preference</span>
          <select name="diningPreference" aria-label="Dining preference" value={draft.diningPreference} onChange={event => updateDraft('diningPreference', event.target.value)} data-testid="react-dining-preference-select">
            <option value="Anytime dining">Anytime dining</option>
            <option value="Early seating">Early seating</option>
            <option value="Late seating">Late seating</option>
          </select>
        </label>
        <label>
          <span>Accessibility notes</span>
          <input name="accessibilityNotes" aria-label="Accessibility notes" value={draft.accessibilityNotes} onChange={event => updateDraft('accessibilityNotes', event.target.value)} data-testid="react-passenger-profile-accessibility-notes" />
        </label>

        <button type="submit" className="primary-action-button" disabled={isSaving} data-testid="react-passenger-profile-submit-button">
          {isSaving ? 'Saving profile...' : 'Save profile'}
        </button>
        <p className="draft-message" role="status" aria-live="polite" data-testid="react-passenger-profile-message">
          {message || mutationError || 'Profile changes will be announced here.'}
        </p>
      </form>
    </section>
  )
}

function RoleBookingDetails({ booking, favoriteDayKeys, favoritesOnly, onToggleFavorite, onToggleFavoritesOnly }) {
  const passengers = getVisiblePassengerRows(booking)
  const itineraryDays = getBookingItineraryDays(booking)
  const visibleItineraryDays = favoritesOnly
    ? itineraryDays.filter(day => favoriteDayKeys.has(String(day.id || day.day || day.title)))
    : itineraryDays

  return (
    <section className="role-booking-detail-panel" aria-label={`Details for ${getBookingCardTitle(booking)}`} data-testid="react-role-booking-details">
      <div className="role-booking-detail-grid">
        <div className="role-detail-card">
          <h4>Booking details</h4>
          <dl className="role-booking-fields compact-fields">
            {getBookingCardFields(booking).map(([label, value]) => (
              <div key={`${booking.id}-detail-${label}`}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="role-detail-card">
          <h4>Passenger manifest</h4>
          {passengers.length === 0 ? (
            <p>No visible passengers for this booking.</p>
          ) : passengers.map(passenger => (
            <div key={`${booking.id}-detail-${passenger.id}`} className="visible-passenger-row" data-testid="react-role-detail-passenger-row">
              <span>{passenger.name}</span>
              <span>{passenger.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="role-itinerary-panel">
        <div className="role-itinerary-heading">
          <div>
            <h4>Cruise itinerary</h4>
            <p>Passengers can review port days, activities, and save favorite itinerary days in React.</p>
          </div>
          <label className="react-checkbox-label role-favorites-filter">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={onToggleFavoritesOnly}
              data-testid="react-role-favorites-only-toggle"
            />
            <span>Show favorites only</span>
          </label>
        </div>

        {itineraryDays.length === 0 ? (
          <p className="status-card compact" data-testid="react-role-no-itinerary">No itinerary details are available for this booking yet.</p>
        ) : visibleItineraryDays.length === 0 ? (
          <p className="status-card compact" data-testid="react-role-no-favorite-itinerary">No favorite itinerary days selected yet.</p>
        ) : (
          <div className="role-itinerary-list">
            {visibleItineraryDays.map(day => {
              const dayKey = String(day.id || day.day || day.title)
              const activities = getItineraryDayActivities(day)

              return (
                <article className="role-itinerary-day" key={`${booking.id}-${dayKey}`} data-testid="react-role-itinerary-day">
                  <div className="role-itinerary-day-heading">
                    <div>
                      <h5>Day {day.day || '?'} — {day.title || 'Itinerary day'}</h5>
                      <p>{day.port || 'Port to be announced'}</p>
                    </div>
                    <label className="react-checkbox-label role-favorite-day-toggle">
                      <input
                        type="checkbox"
                        checked={favoriteDayKeys.has(dayKey)}
                        onChange={() => onToggleFavorite(dayKey)}
                        data-testid="react-role-favorite-itinerary-toggle"
                      />
                      <span>Favorite</span>
                    </label>
                  </div>

                  {activities.length === 0 ? (
                    <p>No scheduled activities yet.</p>
                  ) : (
                    <ul className="role-activity-list">
                      {activities.map(activity => (
                        <li key={`${dayKey}-${activity.id || activity.time || activity.activity}`}>
                          <strong>{activity.time || 'Time TBD'}</strong>
                          <span>{activity.activity || activity.name || 'Activity to be announced'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function RoleBookingCard({ booking, roleView, isExpanded, favoriteDayKeys, favoritesOnly, onToggleDetails, onToggleFavorite, onToggleFavoritesOnly }) {
  const passengers = getVisiblePassengerRows(booking)

  return (
    <article className="role-booking-card" data-testid="react-role-booking-card">
      <div className="role-booking-heading">
        <h3>{getBookingCardTitle(booking)}</h3>
        <div className="role-booking-badges">
          {roleView === 'group-leader' && <span className="status-pill">Group Leader</span>}
          <span className="status-pill">{booking.bookingStatus || 'Confirmed'}</span>
        </div>
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

      <button
        type="button"
        className="primary-action-button full-width-action"
        aria-expanded={isExpanded}
        onClick={onToggleDetails}
        data-testid="react-role-booking-details-toggle"
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
      </button>

      {isExpanded && (
        <RoleBookingDetails
          booking={booking}
          favoriteDayKeys={favoriteDayKeys}
          favoritesOnly={favoritesOnly}
          onToggleFavorite={onToggleFavorite}
          onToggleFavoritesOnly={onToggleFavoritesOnly}
        />
      )}
    </article>
  )
}

export default function ReactRoleDashboard({
  selectedDemoUser,
  customers = [],
  bookings = [],
  visibleBookings = [],
  onSavePassengerProfile,
  savingCustomerId = '',
  mutationError = ''
}) {
  const roleView = getSelectedRoleView(selectedDemoUser)
  const selectedCustomer = findDemoCustomer(selectedDemoUser, customers)
  const title = getRoleDashboardTitle(roleView)
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())
  const [favoriteItineraryDaysByBooking, setFavoriteItineraryDaysByBooking] = useState({})
  const [favoritesOnlyByBooking, setFavoritesOnlyByBooking] = useState({})
  const visibleBookingIds = useMemo(() => new Set(visibleBookings.map(booking => booking.id)), [visibleBookings])

  if (roleView === 'admin') return null

  function toggleBookingDetails(bookingId) {
    setExpandedBookingIds(current => {
      const next = new Set([...current].filter(id => visibleBookingIds.has(id)))

      if (next.has(bookingId)) next.delete(bookingId)
      else next.add(bookingId)

      return next
    })
  }

  function toggleFavoriteItineraryDay(bookingId, dayKey) {
    setFavoriteItineraryDaysByBooking(current => {
      const nextFavorites = new Set(current[bookingId] || [])

      if (nextFavorites.has(dayKey)) nextFavorites.delete(dayKey)
      else nextFavorites.add(dayKey)

      return {
        ...current,
        [bookingId]: [...nextFavorites]
      }
    })
  }

  function toggleFavoritesOnly(bookingId) {
    setFavoritesOnlyByBooking(current => ({
      ...current,
      [bookingId]: !current[bookingId]
    }))
  }

  return (
    <section className="react-role-dashboard" id="react-role-dashboard" aria-labelledby="react-role-dashboard-heading" data-testid={`react-${roleView}-dashboard`}>
      {roleView === 'group-leader' && (
        <div className="status-card compact" data-testid="react-passenger-dashboard">
          Group leader dashboard loaded with passenger-manifest visibility.
        </div>
      )}
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
        <PassengerProfile
          selectedCustomer={selectedCustomer}
          selectedDemoUser={selectedDemoUser}
          visibleBookings={visibleBookings}
          onSavePassengerProfile={onSavePassengerProfile}
          savingCustomerId={savingCustomerId}
          mutationError={mutationError}
        />
      )}

      <div className="role-booking-list">
        {visibleBookings.length === 0 ? (
          <p className="status-card compact">No bookings are visible for this selected demo user.</p>
        ) : visibleBookings.map(booking => {
          const bookingId = booking.id || booking.bookingId
          const favoriteDayKeys = new Set(favoriteItineraryDaysByBooking[bookingId] || [])

          return (
            <RoleBookingCard
              key={bookingId}
              booking={booking}
              roleView={roleView}
              isExpanded={expandedBookingIds.has(bookingId)}
              favoriteDayKeys={favoriteDayKeys}
              favoritesOnly={Boolean(favoritesOnlyByBooking[bookingId])}
              onToggleDetails={() => toggleBookingDetails(bookingId)}
              onToggleFavorite={dayKey => toggleFavoriteItineraryDay(bookingId, dayKey)}
              onToggleFavoritesOnly={() => toggleFavoritesOnly(bookingId)}
            />
          )
        })}
      </div>
    </section>
  )
}
