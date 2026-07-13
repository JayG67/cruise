import CustomerHierarchyRow from '../CustomerHierarchyRow.jsx'
import { getCustomerDirectoryName } from '../../domain/adminHierarchy.js'

export default function AdminCustomerWorkflowTable({
  summary,
  expandAllVisibleCustomers,
  collapseAllVisibleCustomers,
  visibleWorkflowRows,
  searchTerm,
  hasActiveHierarchySearch,
  hiddenWorkflowRowCount,
  expandedCustomerIds,
  expandedBookingIds,
  toggleCustomer,
  toggleBooking,
  customerDrafts,
  customerDraftMessages,
  openCustomerDraft,
  updateCustomerDraft,
  validateCustomerDraftFor,
  saveCustomerDraftFor,
  savingCustomerId,
  cancelCustomerDraft,
  bookingDrafts,
  bookingDraftMessages,
  openBookingDraft,
  updateBookingDraft,
  validateBookingDraftFor,
  saveBookingDraftFor,
  savingBookingId,
  cancelBookingDraft,
  requestDeleteCustomerById,
  requestDeleteBookingById,
  activeDeleteId
}) {
  return (
    <div id="react-customer-workflow-table" className="react-admin-table-wrap ce-editor-card" data-testid="react-customer-workflow-table">
      <div className="react-admin-table-heading">
        <strong>Customer records with linked bookings</strong>
        <span>Showing {summary.customerCount} customer workflows with linked bookings available as expandable child rows.</span>
      </div>

      <div className="hierarchy-toolbar" aria-label="React hierarchy controls">
        <p className="result-summary">Admin-visible customers with expandable linked bookings and booking details</p>
        <div className="button-row ce-action-row">
          <button type="button" className="secondary-button ce-button-secondary" onClick={expandAllVisibleCustomers} data-testid="react-expand-visible-customers">Expand visible customers</button>
          <button type="button" className="secondary-button ce-button-secondary" onClick={collapseAllVisibleCustomers} data-testid="react-collapse-visible-customers">Collapse visible customers</button>
        </div>
      </div>

      {visibleWorkflowRows.length === 0 ? (
        <p className="status-card compact ce-command-card" role="status">No customer or linked booking records match “{searchTerm.trim()}”.</p>
      ) : (
        <>
          {!hasActiveHierarchySearch && hiddenWorkflowRowCount > 0 && (
            <p className="result-summary compact" role="status" data-testid="react-customer-workflow-render-limit">Showing the first {visibleWorkflowRows.length} customer workflows. Use search to load a specific customer quickly.</p>
          )}
          <div className="table-scroll react-admin-table-scroll" tabIndex="0">
            <table className="react-admin-table">
              <caption>Admin-visible customers with expandable linked bookings and booking details</caption>
              <thead><tr data-testid="react-customer-header-row"><th scope="col">Customer</th><th scope="col">Email</th><th scope="col">Phone</th><th scope="col">Loyalty</th><th scope="col">Bookings</th><th scope="col">Actions</th></tr></thead>
              <tbody>
                {visibleWorkflowRows.map(({ customer, linkedBookings }) => {
                  const customerName = getCustomerDirectoryName(customer)
                  const isExpanded = expandedCustomerIds.has(customer.id)
                  return (
                    <CustomerHierarchyRow
                      key={customer.id}
                      customer={customer}
                      customerName={customerName}
                      linkedBookings={linkedBookings}
                      isExpanded={isExpanded}
                      expandedBookingIds={expandedBookingIds}
                      onToggleCustomer={() => toggleCustomer(customer.id)}
                      onToggleBooking={bookingId => toggleBooking(customer.id, bookingId)}
                      customerDraft={customerDrafts[customer.id]}
                      customerDraftMessage={customerDraftMessages[customer.id]}
                      onEditCustomer={() => openCustomerDraft(customer)}
                      onUpdateCustomerDraft={(fieldName, value) => updateCustomerDraft(customer.id, fieldName, value)}
                      onValidateCustomerDraft={() => validateCustomerDraftFor(customer)}
                      onSaveCustomerDraft={() => saveCustomerDraftFor(customer)}
                      isSavingCustomer={savingCustomerId === customer.id}
                      onCancelCustomerDraft={() => cancelCustomerDraft(customer.id)}
                      bookingDrafts={bookingDrafts}
                      bookingDraftMessages={bookingDraftMessages}
                      onEditBooking={booking => openBookingDraft(customer.id, booking)}
                      onUpdateBookingDraft={updateBookingDraft}
                      onValidateBookingDraft={booking => validateBookingDraftFor(customer.id, booking)}
                      onSaveBookingDraft={booking => saveBookingDraftFor(customer.id, booking)}
                      savingBookingId={savingBookingId}
                      onCancelBookingDraft={cancelBookingDraft}
                      onDeleteCustomer={() => requestDeleteCustomerById(customer.id, customerName)}
                      isDeletingCustomer={activeDeleteId === `customer:${customer.id}`}
                      onDeleteBooking={booking => requestDeleteBookingById(booking.id, booking.id)}
                      deletingBookingId={activeDeleteId.startsWith('booking:') ? activeDeleteId.replace('booking:', '') : ''}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
