import CustomerHierarchyRow from './CustomerHierarchyRow.jsx'
import { getCustomerName } from '../domain/adminHierarchy.js'
import { useAdminHierarchyViewState } from '../hooks/useAdminHierarchyViewState.js'
import { useBookingDraftWorkflow } from '../hooks/useBookingDraftWorkflow.js'
import { useCustomerDraftWorkflow } from '../hooks/useCustomerDraftWorkflow.js'

export default function CustomerBookingHierarchy({
  customers = [],
  bookings = [],
  isLoading,
  error,
  onRetry,
  onSaveCustomerDraft,
  savingCustomerId = '',
  mutationError = '',
  onSaveBookingDraft,
  savingBookingId = '',
  bookingMutationError = ''
}) {
  const {
    searchTerm,
    rows,
    summary,
    expandedCustomerIds,
    expandedBookingIds,
    updateSearchTerm,
    toggleCustomer,
    toggleBooking,
    expandAllVisibleCustomers,
    collapseAllVisibleCustomers
  } = useAdminHierarchyViewState(customers, bookings)

  const {
    customerDrafts,
    customerDraftMessages,
    openCustomerDraft,
    updateCustomerDraft,
    validateCustomerDraftFor,
    saveCustomerDraftFor,
    cancelCustomerDraft
  } = useCustomerDraftWorkflow({ onSaveCustomerDraft, mutationError })

  const {
    bookingDrafts,
    bookingDraftMessages,
    openBookingDraft,
    updateBookingDraft,
    validateBookingDraftFor,
    saveBookingDraftFor,
    cancelBookingDraft
  } = useBookingDraftWorkflow({ onSaveBookingDraft, bookingMutationError })


  if (isLoading) {
    return <p role="status" className="status-card">Loading React customer hierarchy snapshot…</p>
  }

  if (error) {
    return (
      <section className="status-card error" role="alert" aria-label="React hierarchy loading error">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="secondary-button" onClick={onRetry}>
            Retry loading snapshot
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="hierarchy-card" aria-labelledby="react-hierarchy-heading" data-testid="react-admin-hierarchy">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Stage 17 migration slice</p>
          <h2 id="react-hierarchy-heading">Customer → booking hierarchy</h2>
          <p className="section-summary">
            React now owns search, summary counts, duplicate-booking-safe expansion state,
            customer and booking mutation boundaries, reusable draft editor components, shared accessible feedback contracts, and extracted row/card presentation components, explicit aria-controls contracts for expandable hierarchy panels, extracted draft workflow hooks for customer and booking edits, and a reusable hierarchy view-state hook for search, summary, expansion, and collapse behavior.
          </p>
        </div>
        <label className="search-control">
          <span>Search snapshot</span>
          <input
            data-testid="react-hierarchy-search-input"
            value={searchTerm}
            onChange={event => updateSearchTerm(event.target.value)}
            placeholder="Customer, booking, cabin, ship…"
            aria-describedby="react-hierarchy-summary"
          />
        </label>
      </div>

      <div className="hierarchy-toolbar" aria-label="React hierarchy controls">
        <p id="react-hierarchy-summary" className="result-summary" role="status" data-testid="react-hierarchy-summary">
          Showing {summary.customerCount} customers, {summary.uniqueBookingCount} unique bookings,
          and {summary.totalCustomerBookingLinks} customer-booking links.
        </p>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={expandAllVisibleCustomers} data-testid="react-expand-visible-customers">
            Expand visible customers
          </button>
          <button type="button" className="secondary-button" onClick={collapseAllVisibleCustomers} data-testid="react-collapse-visible-customers">
            Collapse visible customers
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="status-card compact" role="status">
          No customer or linked booking records match “{searchTerm.trim()}”.
        </p>
      ) : (
        <div className="table-scroll" tabIndex="0">
          <table>
            <caption>React proof-of-concept hierarchy using the existing API contract.</caption>
            <thead>
              <tr data-testid="react-customer-row">
                <th scope="col">Customer</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, linkedBookings }) => {
                const customerName = getCustomerName(customer)
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
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
