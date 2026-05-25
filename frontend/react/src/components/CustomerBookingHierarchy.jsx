import { useMemo, useState } from 'react'
import {
  buildCustomerBookingRows,
  filterCustomerBookingRows,
  getBookingPassengerNames,
  getBookingRoute,
  getCustomerName,
  summarizeHierarchyRows
} from '../domain/adminHierarchy.js'
import {
  createCustomerDraft,
  summarizeCustomerDraftChanges,
  updateCustomerDraftField,
  validateCustomerDraft
} from '../domain/customerDrafts.js'
import {
  collapseBookingsForVisibleCustomers,
  collapseVisibleCustomers,
  createBookingExpansionKey,
  expandVisibleCustomers,
  toggleExpandedId
} from '../domain/hierarchyExpansionState.js'

export default function CustomerBookingHierarchy({ customers = [], bookings = [], isLoading, error, onRetry }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCustomerIds, setExpandedCustomerIds] = useState(() => new Set())
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())
  const [customerDrafts, setCustomerDrafts] = useState(() => ({}))
  const [customerDraftMessages, setCustomerDraftMessages] = useState(() => ({}))

  const allRows = useMemo(() => buildCustomerBookingRows(customers, bookings), [customers, bookings])
  const rows = useMemo(() => filterCustomerBookingRows(allRows, searchTerm), [allRows, searchTerm])
  const summary = useMemo(() => summarizeHierarchyRows(rows), [rows])


  function openCustomerDraft(customer) {
    setCustomerDrafts(current => ({
      ...current,
      [customer.id]: createCustomerDraft(customer)
    }))
    setCustomerDraftMessages(current => ({
      ...current,
      [customer.id]: ''
    }))
  }

  function updateCustomerDraft(customerId, fieldName, value) {
    setCustomerDrafts(current => ({
      ...current,
      [customerId]: updateCustomerDraftField(current[customerId], fieldName, value)
    }))
  }

  function cancelCustomerDraft(customerId) {
    setCustomerDrafts(current => {
      const nextDrafts = { ...current }
      delete nextDrafts[customerId]
      return nextDrafts
    })
    setCustomerDraftMessages(current => {
      const nextMessages = { ...current }
      delete nextMessages[customerId]
      return nextMessages
    })
  }

  function validateCustomerDraftFor(customer) {
    const draft = customerDrafts[customer.id]
    const validation = validateCustomerDraft(draft)
    const changedFields = summarizeCustomerDraftChanges(customer, draft)

    setCustomerDraftMessages(current => ({
      ...current,
      [customer.id]: validation.isValid
        ? `Draft is valid with ${changedFields.length} changed fields. API mutation wiring is intentionally deferred to a later stage.`
        : Object.values(validation.errors).join(' ')
    }))
  }

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
          <p className="eyebrow">Stage 4 migration slice</p>
          <h2 id="react-hierarchy-heading">Customer → booking hierarchy</h2>
          <p className="section-summary">
            React now owns search, summary counts, duplicate-booking-safe expansion state,
            and customer edit draft state without mutating the production API yet.
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
                    onCancelCustomerDraft={() => cancelCustomerDraft(customer.id)}
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

function CustomerHierarchyRow({
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
  onCancelCustomerDraft
}) {
  return (
    <>
      <tr>
        <td>
          <button className="link-button" type="button" aria-expanded={isExpanded} onClick={onToggleCustomer}>
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
              onCancel={onCancelCustomerDraft}
            />
          </td>
        </tr>
      )}
      {isExpanded && (
        <tr className="child-row">
          <td colSpan="4">
            <div className="child-panel" aria-label={`Bookings for ${customerName}`}>
              {linkedBookings.length === 0 ? (
                <p className="muted">No linked bookings for this customer.</p>
              ) : linkedBookings.map(booking => {
                const bookingRowKey = createBookingExpansionKey(customer.id, booking.id)
                const bookingExpanded = expandedBookingIds.has(bookingRowKey)
                const passengerNames = getBookingPassengerNames(booking)

                return (
                  <article className="booking-card" key={bookingRowKey} data-testid="react-booking-card">
                    <div className="booking-card-heading">
                      <button
                        type="button"
                        className="link-button"
                        aria-expanded={bookingExpanded}
                        onClick={() => onToggleBooking(booking.id)}
                      >
                        {bookingExpanded ? 'Hide' : 'Details'} {booking.id}
                      </button>
                      <span className="status-pill">{booking.bookingStatus || 'Status unavailable'}</span>
                    </div>
                    <p><strong>{booking.cruiseLine?.name || 'Cruise unavailable'}</strong> · {booking.ship?.name || 'Ship unavailable'}</p>
                    <p>Cabin {booking.cabinNumber || 'not assigned'} · {getBookingRoute(booking)}</p>
                    {bookingExpanded && (
                      <dl className="details-grid">
                        <div><dt>Fare code</dt><dd>{booking.fareCode || 'Not assigned'}</dd></div>
                        <div><dt>Sailing</dt><dd>{booking.sailing?.departureDate || 'Date unavailable'}</dd></div>
                        <div><dt>Passengers</dt><dd>{passengerNames.join(', ') || 'Passengers unavailable'}</dd></div>
                      </dl>
                    )}
                  </article>
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}


function CustomerDraftForm({ draft, message, onUpdate, onValidate, onCancel }) {
  return (
    <form className="draft-editor" aria-label={`Edit draft for ${draft.firstName} ${draft.lastName}`} onSubmit={event => event.preventDefault()}>
      <div className="draft-grid">
        <label>
          <span>First name</span>
          <input value={draft.firstName} onChange={event => onUpdate('firstName', event.target.value)} />
        </label>
        <label>
          <span>Last name</span>
          <input value={draft.lastName} onChange={event => onUpdate('lastName', event.target.value)} />
        </label>
        <label>
          <span>Email</span>
          <input value={draft.email} onChange={event => onUpdate('email', event.target.value)} />
        </label>
        <label>
          <span>Phone</span>
          <input value={draft.phone} onChange={event => onUpdate('phone', event.target.value)} />
        </label>
        <label>
          <span>Loyalty number</span>
          <input value={draft.loyaltyNumber} onChange={event => onUpdate('loyaltyNumber', event.target.value)} />
        </label>
      </div>
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onValidate} data-testid="react-validate-customer-draft">
          Validate draft
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {message && <p className="draft-message" role="status">{message}</p>}
    </form>
  )
}
