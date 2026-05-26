import BookingCard from './BookingCard.jsx'
import CustomerDraftForm from './CustomerDraftForm.jsx'
import { createBookingExpansionKey } from '../domain/hierarchyExpansionState.js'

export default function CustomerHierarchyRow({
  customer,
  customerName,
  linkedBookings,
  isExpanded,
  expandedBookingIds,
  onToggleCustomer,
  onToggleBooking,
  customerDraft,
  customerDraftMessage,
  onEditCustomer,
  onUpdateCustomerDraft,
  onValidateCustomerDraft,
  onSaveCustomerDraft,
  isSavingCustomer,
  onCancelCustomerDraft,
  bookingDrafts,
  bookingDraftMessages,
  onEditBooking,
  onUpdateBookingDraft,
  onValidateBookingDraft,
  onSaveBookingDraft,
  savingBookingId,
  onCancelBookingDraft
}) {
  return (
    <>
      <tr>
        <td>
          <button
            className="link-button"
            type="button"
            aria-expanded={isExpanded}
            onClick={onToggleCustomer}
            data-testid="react-toggle-customer-bookings"
          >
            {isExpanded ? '▾' : '▸'} {customerName}
          </button>
        </td>
        <td>{customer.email || 'Not provided'}</td>
        <td>{customer.phone || 'Not provided'}</td>
        <td>
          <span>{linkedBookings.length} bookings</span>
          <button className="secondary-button compact-button" type="button" onClick={onEditCustomer} data-testid="react-edit-customer-button">
            Edit customer
          </button>
        </td>
      </tr>
      {customerDraft && (
        <tr className="editor-row" data-testid="react-customer-draft-row">
          <td colSpan="4">
            <CustomerDraftForm
              draft={customerDraft}
              message={customerDraftMessage}
              onUpdate={onUpdateCustomerDraft}
              onValidate={onValidateCustomerDraft}
              onSave={onSaveCustomerDraft}
              isSaving={isSavingCustomer}
              onCancel={onCancelCustomerDraft}
            />
          </td>
        </tr>
      )}
      {isExpanded && (
        <tr className="child-row" data-testid="react-customer-bookings-row">
          <td colSpan="4">
            <div className="child-panel" aria-label={`Bookings for ${customerName}`}>
              {linkedBookings.length === 0 ? (
                <p className="muted">No linked bookings for this customer.</p>
              ) : linkedBookings.map(booking => {
                const bookingRowKey = createBookingExpansionKey(customer.id, booking.id)

                return (
                  <BookingCard
                    key={bookingRowKey}
                    booking={booking}
                    bookingRowKey={bookingRowKey}
                    bookingExpanded={expandedBookingIds.has(bookingRowKey)}
                    bookingDraft={bookingDrafts[bookingRowKey]}
                    bookingDraftMessage={bookingDraftMessages[bookingRowKey]}
                    onToggleBooking={onToggleBooking}
                    onEditBooking={onEditBooking}
                    onUpdateBookingDraft={onUpdateBookingDraft}
                    onValidateBookingDraft={onValidateBookingDraft}
                    onSaveBookingDraft={onSaveBookingDraft}
                    isSavingBooking={savingBookingId === booking.id}
                    onCancelBookingDraft={onCancelBookingDraft}
                  />
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
