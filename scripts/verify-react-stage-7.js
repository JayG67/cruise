const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function assertContains(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} must contain: ${expected}`)
  }
}

const client = read('frontend/react/src/api/client.js')
const hook = read('frontend/react/src/hooks/useBookingDetailsMutation.js')
const app = read('frontend/react/src/App.jsx')
const component = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
const plan = read('docs/react-migration-plan.md')

assertContains(client, 'export async function updateBookingDetails', 'React API client')
assertContains(client, '/cruise/bookings/${encodeURIComponent(bookingId)}', 'React booking API client')
assertContains(hook, 'export default function useBookingDetailsMutation', 'React booking mutation hook')
assertContains(hook, 'updateBookingDetails', 'React booking mutation hook')
assertContains(hook, 'passengers: (booking.passengers || []).map(getPassengerPayload)', 'React booking mutation hook')
assertContains(app, 'useBookingDetailsMutation', 'React App')
assertContains(app, 'onSaveBookingDraft={saveBookingDetails}', 'React App')
assertContains(component, 'async function saveBookingDraftFor', 'React hierarchy component')
assertContains(component, 'Booking draft saved through the React mutation boundary.', 'React hierarchy component')
assertContains(component, 'data-testid="react-save-booking-draft"', 'React hierarchy component')
assertContains(component, "Saving booking draft…", 'React hierarchy component')
assertContains(plan, 'Stage 7', 'React migration plan')

if (packageJson.scripts['react:stage7:audit'] !== 'node scripts/verify-react-stage-7.js') {
  throw new Error('package.json must expose react:stage7:audit')
}

console.log('React Stage 7 booking mutation boundary audit passed.')
