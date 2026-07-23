import { useEffect, useState } from 'react'
import { getBookingDetails, getItineraryForSailing } from '../../api/client.js'
import {
  getBookingCardFields,
  getBookingCardTitle,
  getBookingItineraryDays,
  getItineraryDayActivities,
  getVisiblePassengerRows
} from '../../domain/roleView.js'

function getActivityFavoriteKey(dayKey, activity = {}) {
  return `${dayKey}::${activity.id || activity.time || activity.activity || activity.name || 'activity'}`
}

function RoleBookingDetails({ booking, favoriteActivityKeys, favoritesOnly, onToggleFavorite, onToggleFavoritesOnly }) {
  const passengers = getVisiblePassengerRows(booking)
  const itineraryDays = getBookingItineraryDays(booking)
  const visibleItineraryDays = favoritesOnly
    ? itineraryDays.filter(day => {
      const dayKey = String(day.id || day.day || day.title)
      return getItineraryDayActivities(day).some(activity => favoriteActivityKeys.has(getActivityFavoriteKey(dayKey, activity)))
    })
    : itineraryDays

  return (
    <section className="role-booking-detail-panel ce-command-card" aria-label={`Details for ${getBookingCardTitle(booking)}`} data-testid="react-role-booking-details">
      <div className="role-booking-detail-grid ce-detail-grid">
        <div className="role-detail-card ce-editor-card">
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

        <div className="role-detail-card ce-editor-card">
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

      <div className="role-itinerary-panel ce-command-card">
        <div className="role-itinerary-heading">
          <div>
            <h4>Cruise itinerary</h4>
            <p>Passengers can review port days, activities, and save favorite itinerary activities.</p>
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
          <p className="status-card compact ce-command-card" data-testid="react-role-no-itinerary">No itinerary details are available for this booking yet.</p>
        ) : visibleItineraryDays.length === 0 ? (
          <p className="status-card compact ce-command-card" data-testid="react-role-no-favorite-itinerary">No favorite itinerary activities selected yet.</p>
        ) : (
          <div className="role-itinerary-list">
            {visibleItineraryDays.map(day => {
              const dayKey = String(day.id || day.day || day.title)
              const activities = getItineraryDayActivities(day)
              const visibleActivities = favoritesOnly
                ? activities.filter(activity => favoriteActivityKeys.has(getActivityFavoriteKey(dayKey, activity)))
                : activities

              return (
                <article className="role-itinerary-day ce-editor-card" key={`${booking.id}-${dayKey}`} data-testid="react-role-itinerary-day">
                  <div className="role-itinerary-day-heading">
                    <div>
                      <h5>Day {day.day || '?'} — {day.title || 'Itinerary day'}</h5>
                      <p>{day.port || 'Port to be announced'}</p>
                    </div>
                  </div>

                  {activities.length === 0 ? (
                    <p>No scheduled activities yet.</p>
                  ) : (
                    <ul className="role-activity-list">
                      {visibleActivities.map(activity => {
                        const activityKey = getActivityFavoriteKey(dayKey, activity)

                        return (
                          <li key={`${dayKey}-${activity.id || activity.time || activity.activity}`} data-testid="react-role-itinerary-activity">
                            <div>
                              <strong>{activity.time || 'Time TBD'}</strong>
                              <span>{activity.activity || activity.name || 'Activity to be announced'}</span>
                            </div>
                            <label className="react-checkbox-label role-favorite-activity-toggle">
                              <input
                                type="checkbox"
                                checked={favoriteActivityKeys.has(activityKey)}
                                onChange={() => onToggleFavorite(activityKey)}
                                data-testid="react-role-favorite-itinerary-toggle"
                              />
                              <span>Favorite activity</span>
                            </label>
                          </li>
                        )
                      })}
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

function getDefaultPreCruiseChecklist() {
  return {
    documents: false,
    luggage: false,
    dining: false,
    excursions: false
  }
}

function normalizePreCruiseChecklist(checklist = {}) {
  return {
    documents: Boolean(checklist.documents),
    luggage: Boolean(checklist.luggage),
    dining: Boolean(checklist.dining),
    excursions: Boolean(checklist.excursions)
  }
}

export default function RoleBookingCard({ booking, roleView, isExpanded, favoriteActivityKeys, favoritesOnly, onToggleDetails, onToggleFavorite, onToggleFavoritesOnly }) {
  const [detailedBooking, setDetailedBooking] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailLoadError, setDetailLoadError] = useState('')
  const bookingId = booking.id || booking.bookingId
  const effectiveBooking = detailedBooking || booking
  const passengers = getVisiblePassengerRows(effectiveBooking)
  const sailingId = effectiveBooking.sailingId || effectiveBooking.sailing?.id
  const needsItineraryDetails = isExpanded && bookingId && getBookingItineraryDays(effectiveBooking).length === 0
  const hasLoadedBookingDetails = Boolean(detailedBooking) || Boolean(detailLoadError)
  const isWaitingForItineraryDetails = Boolean(needsItineraryDetails && !hasLoadedBookingDetails)

  useEffect(() => {
    let isActive = true

    async function loadBookingDetails() {
      if (!needsItineraryDetails) return

      setIsLoadingDetails(true)
      setDetailLoadError('')

      try {
        const nextBooking = await getBookingDetails(bookingId)
        const nextSailingId = nextBooking?.sailingId || nextBooking?.sailing?.id || sailingId
        const nextItineraryDays = getBookingItineraryDays(nextBooking)

        if (nextItineraryDays.length > 0 || !nextSailingId) {
          if (isActive) setDetailedBooking(nextBooking)
          return
        }

        const itineraryDays = await getItineraryForSailing(nextSailingId)
        const bookingWithItinerary = {
          ...nextBooking,
          itinerary: itineraryDays,
          itineraryDays,
          sailing: nextBooking?.sailing
            ? {
                ...nextBooking.sailing,
                itinerary: itineraryDays,
                itineraryDays
              }
            : nextBooking?.sailing
        }

        if (isActive) setDetailedBooking(bookingWithItinerary)
      } catch (err) {
        if (isActive) setDetailLoadError(err.message || 'Unable to load itinerary details for this booking.')
      } finally {
        if (isActive) setIsLoadingDetails(false)
      }
    }

    loadBookingDetails()

    return () => {
      isActive = false
    }
  }, [bookingId, needsItineraryDetails, sailingId])

  useEffect(() => {
    setDetailedBooking(null)
    setDetailLoadError('')
    setIsLoadingDetails(false)
  }, [bookingId])

  return (
    <article className="role-booking-card ce-command-card" data-testid="react-role-booking-card">
      <div className="role-booking-heading">
        <h3>{getBookingCardTitle(effectiveBooking)}</h3>
        <div className="role-booking-badges">
          {roleView === 'group-leader' && <span className="status-pill ce-status-pill">Group Leader</span>}
          <span className="status-pill ce-status-pill">{booking.bookingStatus || 'Confirmed'}</span>
        </div>
      </div>

      <dl className="role-booking-fields">
        {getBookingCardFields(effectiveBooking).map(([label, value]) => (
          <div key={`${bookingId}-${label}`}>
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

      {isExpanded && (isLoadingDetails || isWaitingForItineraryDetails) && (
        <p className="status-card compact ce-command-card" data-testid="react-role-booking-details-loading">Loading itinerary details…</p>
      )}

      {isExpanded && detailLoadError && (
        <p className="status-card compact error ce-feedback-message ce-editor-card" data-testid="react-role-booking-details-error">{detailLoadError}</p>
      )}

      {isExpanded && !isLoadingDetails && !isWaitingForItineraryDetails && (
        <RoleBookingDetails
          booking={effectiveBooking}
          favoriteActivityKeys={favoriteActivityKeys}
          favoritesOnly={favoritesOnly}
          onToggleFavorite={onToggleFavorite}
          onToggleFavoritesOnly={onToggleFavoritesOnly}
        />
      )}
    </article>
  )
}
