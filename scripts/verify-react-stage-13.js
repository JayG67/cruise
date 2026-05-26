const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function assertContains(fileContent, expected, label) {
  if (!fileContent.includes(expected)) {
    throw new Error(`Missing ${label}: ${expected}`)
  }
}

const customerRow = readProjectFile('frontend/react/src/components/CustomerHierarchyRow.jsx')
const bookingCard = readProjectFile('frontend/react/src/components/BookingCard.jsx')
const hierarchy = readProjectFile('frontend/react/src/components/CustomerBookingHierarchy.jsx')
const packageJson = JSON.parse(readProjectFile('package.json'))

assertContains(customerRow, 'const bookingsRowId = `react-customer-bookings-${customer.id}`', 'stable customer bookings panel id')
assertContains(customerRow, 'aria-controls={bookingsRowId}', 'customer expansion aria-controls')
assertContains(customerRow, 'id={bookingsRowId}', 'controlled customer bookings panel id')
assertContains(customerRow, 'data-testid="react-customer-bookings-row"', 'customer bookings row test id')
assertContains(customerRow, 'createBookingExpansionKey(customer.id, booking.id)', 'duplicate-safe booking row key')

assertContains(bookingCard, 'const detailsId = `react-booking-details-${bookingRowKey}`', 'stable booking details id')
assertContains(bookingCard, 'aria-controls={detailsId}', 'booking details aria-controls')
assertContains(bookingCard, 'aria-label={`Booking ${booking.id} for ${passengerSummary}`}', 'booking card accessible summary')
assertContains(bookingCard, 'id={detailsId}', 'controlled booking details panel id')
assertContains(bookingCard, 'data-testid="react-booking-details"', 'booking details test id')

assertContains(hierarchy, 'aria-controls contracts', 'presentation accessibility summary copy')
assertContains(packageJson.scripts['react:migration:audit'], 'react:stage13:audit', 'Stage 13 included in aggregate audit')

console.log('React Stage 13 presentation accessibility contract audit passed.')
