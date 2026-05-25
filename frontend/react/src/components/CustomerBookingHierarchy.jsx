import { useMemo, useState } from 'react'
import {
  buildCustomerBookingRows,
  filterCustomerBookingRows,
  getBookingPassengerNames,
  getBookingRoute,
  getCustomerName,
  summarizeHierarchyRows
} from '../domain/adminHierarchy.js'

export default function CustomerBookingHierarchy({ customers = [], bookings = [], isLoading, error, onRetry }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCustomerIds, setExpandedCustomerIds] = useState(() => new Set())
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())

  const allRows = useMemo(() => buildCustomerBookingRows(customers, bookings), [customers, bookings])
  const rows = useMemo(() => filterCustomerBookingRows(allRows, searchTerm), [allRows, searchTerm])
  const summary = useMemo(() => summarizeHierarchyRows(rows), [rows])

  function toggleSetValue(currentSet, value) {
    const nextSet = new Set(currentSet)
    if (nextSet.has(value)) nextSet.delete(value)
    else nextSet.add(value)
    return nextSet
  }

  function expandAllVisibleCustomers() {
    setExpandedCustomerIds(current => {
      const nextSet = new Set(current)
      rows.forEach(({ customer }) => nextSet.add(customer.id))
      return nextSet
    })
  }

  function collapseAllVisibleCustomers() {
    setExpandedCustomerIds(current => {
      const visibleCustomerIds = new Set(rows.map(({ customer }) => customer.id))
      return new Set([...current].filter(customerId => !visibleCustomerIds.has(customerId)))
    })
    setExpandedBookingIds(new Set())
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
          <p className="eyebrow">Stage 1 migration slice</p>
          <h2 id="react-hierarchy-heading">Customer → booking hierarchy</h2>
          <p className="section-summary">
            React now owns search, filtered summary counts, customer expansion, booking detail
            expansion, and duplicate-booking-safe row state for this proof-of-concept workflow.
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
                    onToggleCustomer={() => setExpandedCustomerIds(current => toggleSetValue(current, customer.id))}
                    onToggleBooking={bookingId => setExpandedBookingIds(current => toggleSetValue(current, `${customer.id}:${bookingId}`))}
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
  onToggleBooking
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
        <td>{linkedBookings.length} bookings</td>
      </tr>
      {isExpanded && (
        <tr className="child-row">
          <td colSpan="4">
            <div className="child-panel" aria-label={`Bookings for ${customerName}`}>
              {linkedBookings.length === 0 ? (
                <p className="muted">No linked bookings for this customer.</p>
              ) : linkedBookings.map(booking => {
                const bookingRowKey = `${customer.id}:${booking.id}`
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
