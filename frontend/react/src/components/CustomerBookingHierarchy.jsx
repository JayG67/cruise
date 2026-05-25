import { useMemo, useState } from 'react'

function getCustomerName(customer) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.name || customer.id
}

function bookingMatchesCustomer(booking, customerId) {
  if (booking.createdByCustomerId === customerId) return true

  return (booking.passengers || []).some(passenger => {
    return passenger.customerId === customerId || passenger.customer?.id === customerId
  })
}

export default function CustomerBookingHierarchy({ customers = [], bookings = [], isLoading, error }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCustomerIds, setExpandedCustomerIds] = useState(() => new Set())
  const [expandedBookingIds, setExpandedBookingIds] = useState(() => new Set())

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const rows = useMemo(() => {
    return customers.map(customer => {
      const linkedBookings = bookings.filter(booking => bookingMatchesCustomer(booking, customer.id))
      return { customer, linkedBookings }
    }).filter(({ customer, linkedBookings }) => {
      if (!normalizedSearch) return true

      const customerText = `${getCustomerName(customer)} ${customer.email || ''} ${customer.phone || ''} ${customer.loyaltyNumber || ''}`.toLowerCase()
      const bookingText = linkedBookings.map(booking => [
        booking.id,
        booking.bookingStatus,
        booking.cabinNumber,
        booking.fareCode,
        booking.cruiseLine?.name,
        booking.ship?.name,
        booking.sailing?.departureDate,
        booking.embarkationPort,
        booking.debarkationPort,
        ...(booking.passengers || []).map(passenger => getCustomerName(passenger.customer || passenger))
      ].filter(Boolean).join(' ')).join(' ').toLowerCase()

      return `${customerText} ${bookingText}`.includes(normalizedSearch)
    })
  }, [customers, bookings, normalizedSearch])

  function toggleSetValue(currentSet, value) {
    const nextSet = new Set(currentSet)
    if (nextSet.has(value)) nextSet.delete(value)
    else nextSet.add(value)
    return nextSet
  }

  if (isLoading) {
    return <p role="status" className="status-card">Loading React customer hierarchy snapshot…</p>
  }

  if (error) {
    return <p role="alert" className="status-card error">{error}</p>
  }

  return (
    <section className="hierarchy-card" aria-labelledby="react-hierarchy-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">First migration candidate</p>
          <h2 id="react-hierarchy-heading">Customer → booking hierarchy</h2>
        </div>
        <label className="search-control">
          <span>Search snapshot</span>
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Customer, booking, cabin, ship…"
          />
        </label>
      </div>

      <div className="table-scroll" tabIndex="0">
        <table>
          <caption>React proof-of-concept hierarchy using the existing API contract.</caption>
          <thead>
            <tr>
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
                <FragmentRow
                  key={customer.id}
                  customer={customer}
                  customerName={customerName}
                  linkedBookings={linkedBookings}
                  isExpanded={isExpanded}
                  expandedBookingIds={expandedBookingIds}
                  onToggleCustomer={() => setExpandedCustomerIds(current => toggleSetValue(current, customer.id))}
                  onToggleBooking={bookingId => setExpandedBookingIds(current => toggleSetValue(current, bookingId))}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function FragmentRow({ customer, customerName, linkedBookings, isExpanded, expandedBookingIds, onToggleCustomer, onToggleBooking }) {
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
              {linkedBookings.map(booking => {
                const bookingExpanded = expandedBookingIds.has(booking.id)
                return (
                  <article className="booking-card" key={`${customer.id}-${booking.id}`}>
                    <button
                      type="button"
                      className="link-button"
                      aria-expanded={bookingExpanded}
                      onClick={() => onToggleBooking(booking.id)}
                    >
                      {bookingExpanded ? 'Hide' : 'Details'} {booking.id}
                    </button>
                    <p><strong>{booking.cruiseLine?.name || 'Cruise unavailable'}</strong> · {booking.ship?.name || 'Ship unavailable'}</p>
                    <p>Cabin {booking.cabinNumber || 'not assigned'} · {booking.bookingStatus || 'Status unavailable'}</p>
                    {bookingExpanded && (
                      <dl className="details-grid">
                        <div><dt>Fare code</dt><dd>{booking.fareCode || 'Not assigned'}</dd></div>
                        <div><dt>Sailing</dt><dd>{booking.sailing?.departureDate || 'Date unavailable'}</dd></div>
                        <div><dt>Route</dt><dd>{booking.embarkationPort || booking.sailing?.departurePort || 'Departure'} → {booking.debarkationPort || booking.sailing?.arrivalPort || 'Arrival'}</dd></div>
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
