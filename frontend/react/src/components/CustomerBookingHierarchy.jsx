import { useMemo, useState } from 'react'
import CustomerHierarchyRow from './CustomerHierarchyRow.jsx'
import {
  buildCustomerBookingRows,
  filterCustomerBookingRows,
  getCustomerName,
  summarizeHierarchyRows
} from '../domain/adminHierarchy.js'
import {
  collapseBookingsForVisibleCustomers,
  collapseVisibleCustomers,
  createBookingExpansionKey,
  expandVisibleCustomers,
  toggleExpandedId
} from '../domain/hierarchyExpansionState.js'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCustomerIds, setExpandedCustomerIds] = useState(() => new Set())
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())

  const allRows = useMemo(() => buildCustomerBookingRows(customers, bookings), [customers, bookings])
  const rows = useMemo(() => filterCustomerBookingRows(allRows, searchTerm), [allRows, searchTerm])
  const summary = useMemo(() => summarizeHierarchyRows(rows), [rows])


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

  function expandAllVisibleCustomers() {
    setExpandedCustomerIds(current => expandVisibleCustomers(current, rows))
  }

  function collapseAllVisibleCustomers() {
    setExpandedCustomerIds(current => collapseVisibleCustomers(current, rows))
    setExpandedBookingIds(current => collapseBookingsForVisibleCustomers(current, rows))
  }

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
          <p className="eyebrow">Stage 14 migration slice</p>
          <h2 id="react-hierarchy-heading">Customer → booking hierarchy</h2>
          <p className="section-summary">
            React now owns search, summary counts, duplicate-booking-safe expansion state,
            customer and booking mutation boundaries, reusable draft editor components, shared accessible feedback contracts, and extracted row/card presentation components, explicit aria-controls contracts for expandable hierarchy panels, and extracted draft workflow hooks for customer and booking edits.
          </p>
        </div>
        <label className="search-control">
          <span>Search snapshot</span>
          <input
            data-testid="react-hierarchy-search-input"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
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
                    onToggleCustomer={() => setExpandedCustomerIds(current => toggleExpandedId(current, customer.id))}
                    onToggleBooking={bookingId => setExpandedBookingIds(current => toggleExpandedId(current, createBookingExpansionKey(customer.id, bookingId)))}
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
