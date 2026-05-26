const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function assertContains(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} must contain: ${expected}`)
  }
}

function assertNotContains(content, unexpected, label) {
  if (content.includes(unexpected)) {
    throw new Error(`${label} should no longer contain: ${unexpected}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
const customerRow = read('frontend/react/src/components/CustomerHierarchyRow.jsx')
const bookingCard = read('frontend/react/src/components/BookingCard.jsx')
const migrationPlan = read('docs/react-migration-plan.md')

assertContains(packageJson.scripts['react:stage12:audit'], 'verify-react-stage-12.js', 'package.json react:stage12:audit')
assertContains(packageJson.scripts['react:migration:audit'], 'react:stage12:audit', 'package.json react:migration:audit')

assertContains(hierarchy, "import CustomerHierarchyRow from './CustomerHierarchyRow.jsx'", 'CustomerBookingHierarchy.jsx')
assertNotContains(hierarchy, 'function CustomerHierarchyRow', 'CustomerBookingHierarchy.jsx')
assertContains(customerRow, "import BookingCard from './BookingCard.jsx'", 'CustomerHierarchyRow.jsx')
assertContains(customerRow, 'data-testid="react-toggle-customer-bookings"', 'CustomerHierarchyRow.jsx')
assertContains(customerRow, 'data-testid="react-customer-bookings-row"', 'CustomerHierarchyRow.jsx')
assertContains(customerRow, 'CustomerDraftForm', 'CustomerHierarchyRow.jsx')

assertContains(bookingCard, 'export default function BookingCard', 'BookingCard.jsx')
assertContains(bookingCard, 'data-testid="react-toggle-booking-details"', 'BookingCard.jsx')
assertContains(bookingCard, 'data-testid="react-booking-details"', 'BookingCard.jsx')
assertContains(bookingCard, 'BookingDraftForm', 'BookingCard.jsx')
assertContains(bookingCard, 'getBookingPassengerNames', 'BookingCard.jsx')
assertContains(bookingCard, 'getBookingRoute', 'BookingCard.jsx')

assertContains(migrationPlan, 'Stage 12: Presentation component decomposition', 'docs/react-migration-plan.md')

console.log('React Stage 12 presentation component decomposition audit passed.')
