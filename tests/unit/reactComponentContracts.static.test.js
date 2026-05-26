const fs = require('fs')
const path = require('path')

describe('React component accessibility and presentation contracts', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  function read(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  }

  it('links customer expansion controls to the controlled booking panel', () => {
    const customerRow = read('frontend/react/src/components/CustomerHierarchyRow.jsx')

    expect(customerRow).toContain('const bookingsRowId = `react-customer-bookings-${customer.id}`')
    expect(customerRow).toContain('aria-expanded={isExpanded}')
    expect(customerRow).toContain('aria-controls={bookingsRowId}')
    expect(customerRow).toContain('id={bookingsRowId}')
    expect(customerRow).toContain('data-testid="react-customer-bookings-row"')
  })

  it('links booking detail controls to the controlled detail panel without losing duplicate-safe keys', () => {
    const customerRow = read('frontend/react/src/components/CustomerHierarchyRow.jsx')
    const bookingCard = read('frontend/react/src/components/BookingCard.jsx')

    expect(customerRow).toContain('createBookingExpansionKey(customer.id, booking.id)')
    expect(bookingCard).toContain('const detailsId = `react-booking-details-${bookingRowKey}`')
    expect(bookingCard).toContain('aria-expanded={bookingExpanded}')
    expect(bookingCard).toContain('aria-controls={detailsId}')
    expect(bookingCard).toContain('id={detailsId}')
  })

  it('keeps extracted booking cards independently understandable to assistive technology', () => {
    const bookingCard = read('frontend/react/src/components/BookingCard.jsx')

    expect(bookingCard).toContain('const passengerSummary = passengerNames.join')
    expect(bookingCard).toContain('aria-label={`Booking ${booking.id} for ${passengerSummary}`}')
    expect(bookingCard).toContain('aria-label={`Details for booking ${booking.id}`}')
    expect(bookingCard).toContain('data-testid="react-booking-card"')
  })
})
