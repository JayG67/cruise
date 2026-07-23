import { useMemo, useState } from 'react'
import { getBookingItineraryDays } from '../../domain/roleView.js'
import RoleBookingCard from './RoleBookingCard.jsx'

export default function RoleBookingList({
  roleView,
  visibleBookings = [],
  favoriteItineraryActivitiesByBooking = {},
  onFavoriteItineraryActivitiesChange
}) {
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())
  const [favoritesOnlyByBooking, setFavoritesOnlyByBooking] = useState({})
  const visibleBookingIds = useMemo(() => new Set(visibleBookings.map(booking => booking.id)), [visibleBookings])
  const itineraryReadyVisibleBookings = useMemo(() => {
    return [...visibleBookings].sort((leftBooking, rightBooking) => {
      const leftItineraryCount = getBookingItineraryDays(leftBooking).length
      const rightItineraryCount = getBookingItineraryDays(rightBooking).length

      if (leftItineraryCount !== rightItineraryCount) {
        return rightItineraryCount - leftItineraryCount
      }

      return String(rightBooking.sailing?.departureDate || rightBooking.createdAt || rightBooking.id || '')
        .localeCompare(String(leftBooking.sailing?.departureDate || leftBooking.createdAt || leftBooking.id || ''))
    })
  }, [visibleBookings])

  function toggleBookingDetails(bookingId) {
    setExpandedBookingIds(current => {
      const next = new Set([...current].filter(id => visibleBookingIds.has(id)))

      if (next.has(bookingId)) next.delete(bookingId)
      else next.add(bookingId)

      return next
    })
  }

  function toggleFavoriteItineraryActivity(bookingId, activityKey) {
    onFavoriteItineraryActivitiesChange?.(current => {
      const nextFavorites = new Set(current[bookingId] || [])

      if (nextFavorites.has(activityKey)) nextFavorites.delete(activityKey)
      else nextFavorites.add(activityKey)

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
    <div className="role-booking-list">
      {itineraryReadyVisibleBookings.length === 0 ? (
        <p className="status-card compact ce-command-card">No bookings are visible for this selected person.</p>
      ) : itineraryReadyVisibleBookings.map(booking => {
        const bookingId = booking.id || booking.bookingId
        const favoriteActivityKeys = new Set(favoriteItineraryActivitiesByBooking[bookingId] || [])

        return (
          <RoleBookingCard
            key={bookingId}
            booking={booking}
            roleView={roleView}
            isExpanded={expandedBookingIds.has(bookingId)}
            favoriteActivityKeys={favoriteActivityKeys}
            favoritesOnly={Boolean(favoritesOnlyByBooking[bookingId])}
            onToggleDetails={() => toggleBookingDetails(bookingId)}
            onToggleFavorite={activityKey => toggleFavoriteItineraryActivity(bookingId, activityKey)}
            onToggleFavoritesOnly={() => toggleFavoritesOnly(bookingId)}
          />
        )
      })}
    </div>
  )
}
