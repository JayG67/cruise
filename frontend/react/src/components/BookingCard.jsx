import BookingDraftForm from './BookingDraftForm.jsx'
import { getBookingPassengerNames, getBookingRoute } from '../domain/adminHierarchy.js'

export default function BookingCard({
  booking,
  bookingRowKey,
  bookingExpanded,
  bookingDraft,
  bookingDraftMessage,
  onToggleBooking,
  onEditBooking,
  onUpdateBookingDraft,
  onValidateBookingDraft,
  onSaveBookingDraft,
  isSavingBooking,
  onCancelBookingDraft
}) {
  const passengerNames = getBookingPassengerNames(booking)

  return (
    <article className="booking-card" key={bookingRowKey} data-testid="react-booking-card">
      <div className="booking-card-heading">
        <button
          type="button"
          className="link-button"
          aria-expanded={bookingExpanded}
          onClick={() => onToggleBooking(booking.id)}
          data-testid="react-toggle-booking-details"
        >
          {bookingExpanded ? 'Hide' : 'Details'} {booking.id}
        </button>
        <span className="status-pill">{booking.bookingStatus || 'Status unavailable'}</span>
      </div>
      <p><strong>{booking.cruiseLine?.name || 'Cruise unavailable'}</strong> · {booking.ship?.name || 'Ship unavailable'}</p>
      <p>Cabin {booking.cabinNumber || 'not assigned'} · {getBookingRoute(booking)}</p>
      <button
        type="button"
        className="secondary-button compact-button"
        onClick={() => onEditBooking(booking)}
        data-testid="react-edit-booking-button"
      >
        Edit booking draft
      </button>
      {bookingDraft && (
        <BookingDraftForm
          draft={bookingDraft}
          message={bookingDraftMessage}
          onUpdate={(fieldName, value) => onUpdateBookingDraft(bookingRowKey, fieldName, value)}
          onValidate={() => onValidateBookingDraft(booking)}
          onSave={() => onSaveBookingDraft(booking)}
          isSaving={isSavingBooking}
          onCancel={() => onCancelBookingDraft(bookingRowKey)}
        />
      )}
      {bookingExpanded && (
        <dl className="details-grid" data-testid="react-booking-details">
          <div><dt>Fare code</dt><dd>{booking.fareCode || 'Not assigned'}</dd></div>
          <div><dt>Sailing</dt><dd>{booking.sailing?.departureDate || 'Date unavailable'}</dd></div>
          <div><dt>Passengers</dt><dd>{passengerNames.join(', ') || 'Passengers unavailable'}</dd></div>
        </dl>
      )}
    </article>
  )
}
