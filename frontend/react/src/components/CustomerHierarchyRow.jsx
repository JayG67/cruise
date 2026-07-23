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
  onCancelBookingDraft,
  onDeleteCustomer,
  isDeletingCustomer = false,
  onDeleteBooking,
  deletingBookingId = ''
}) {
  const bookingsRowId = `react-customer-bookings-${customer.id}`

  return (
    <>
      <tr data-testid="react-customer-row">
        <td>
          <button
            className="link-button customer-disclosure-button ce-button-secondary"
            type="button"
            aria-expanded={isExpanded}
            aria-controls={bookingsRowId}
            onClick={onToggleCustomer}
            data-testid="react-toggle-customer-bookings"
          >
            <span aria-hidden="true">{isExpanded ? '▾' : '▸'}</span> {customerName}
          </button>
        </td>
        <td>{customer.email || 'Not provided'}</td>
        <td>{customer.phone || 'Not provided'}</td>
        <td>{customer.loyaltyNumber || customer.loyaltyId || '—'}</td>
        <td>
          <span className="linked-booking-pill ce-status-pill">{linkedBookings.length} bookings</span>
        </td>
        <td>
          <div className="react-row-action-cluster ce-action-row">
            <button className="primary-action-button compact-action-button ce-button-primary" type="button" onClick={onEditCustomer} data-testid="react-edit-customer-button">
              Edit
            </button>
            <button
              className="fleet-danger-action compact-action-button ce-button-danger"
              type="button"
              onClick={onDeleteCustomer}
              disabled={isDeletingCustomer}
              data-testid="react-delete-customer-row-button"
            >
              {isDeletingCustomer ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </td>
      </tr>
      {customerDraft && (
        <tr className="editor-row ce-editor-row" data-testid="react-customer-draft-row">
          <td colSpan="6">
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
        <tr className="child-row ce-editor-row" data-testid="react-customer-bookings-row" id={bookingsRowId}>
          <td colSpan="6">
            <div className="child-panel ce-editor-card" aria-label={`Bookings for ${customerName}`}>
              {linkedBookings.length === 0 ? (
                <p className="muted ce-muted">No linked bookings for this customer.</p>
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
                    onDeleteBooking={() => onDeleteBooking?.(booking)}
                    isDeletingBooking={deletingBookingId === booking.id}
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
