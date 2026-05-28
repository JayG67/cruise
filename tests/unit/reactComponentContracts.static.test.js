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


describe('React route preview accessibility contracts', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  function read(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  }

  it('keeps React workspace controls accessible and discoverable', () => {
    const app = read('frontend/react/src/App.jsx')

    expect(app).toContain('aria-label="React application workspaces"')
    expect(app).toContain('data-testid="react-workspace-role-button"')
    expect(app).toContain('data-testid="react-workspace-operations-button"')
    expect(app).toContain('data-testid="react-workspace-fleet-button"')
    expect(app).toContain('data-testid="react-workspace-quality-button"')
    expect(app).toContain('aria-label="Customer-centered operations"')
  })

  it('keeps React recommended workflow buttons accessible', () => {
    const app = read('frontend/react/src/App.jsx')
    const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')

    expect(app).toContain('aria-label="Recommended workflow controls"')
    expect(app).toContain('type="button" className="workflow-step-button"')
    expect(hierarchy).toContain('aria-expanded={workflowsVisible}')
    expect(hierarchy).toContain('aria-controls="react-customer-workflow-table"')
  })


  it('keeps React admin workspace table semantics aligned with the DOM workflow table', () => {
    const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
    const row = read('frontend/react/src/components/CustomerHierarchyRow.jsx')

    expect(hierarchy).toContain('aria-labelledby="react-admin-workspace-heading"')
    expect(hierarchy).toContain('aria-label="Admin workspace record counts"')
    expect(hierarchy).toContain('caption>Admin-visible customers')
    expect(row).toContain('aria-expanded={isExpanded}')
    expect(row).toContain('aria-controls={bookingsRowId}')
    expect(row).toContain('td colSpan="6"')
  })


  it('keeps React admin and fleet sections sequenced like the DOM app', () => {
    const app = read('frontend/react/src/App.jsx')

    expect(app.indexOf('<ReactRoleSelector')).toBeLessThan(app.indexOf('<CustomerBookingHierarchy'))
    expect(app.indexOf('<CustomerBookingHierarchy')).toBeLessThan(app.indexOf('<ReactFleetDirectory'))
    expect(app.indexOf('<ReactFleetDirectory')).toBeLessThan(app.indexOf('<ReactQueryStatusPanel'))
  })

})
