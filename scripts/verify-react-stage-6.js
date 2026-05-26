const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const componentPath = path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx')
const bookingCardPath = path.join(projectRoot, 'frontend/react/src/components/BookingCard.jsx')
const bookingFormPath = path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx')
const domainPath = path.join(projectRoot, 'frontend/react/src/domain/bookingDrafts.js')
const packageJsonPath = path.join(projectRoot, 'package.json')

const component = fs.readFileSync(componentPath, 'utf8')
const bookingCard = fs.readFileSync(bookingCardPath, 'utf8')
const bookingForm = fs.readFileSync(bookingFormPath, 'utf8')
const domain = fs.readFileSync(domainPath, 'utf8')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const requiredDomainExports = [
  'export function createBookingDraft',
  'export function updateBookingDraftField',
  'export function validateBookingDraft',
  'export function summarizeBookingDraftChanges'
]

const requiredComponentMarkers = [
  'bookingDrafts'
]

const requiredBookingCardMarkers = [
  'BookingDraftForm'
]

const requiredBookingFormMarkers = [
  'data-testid="react-booking-draft-form"',
  'data-testid="react-validate-booking-draft"',
  'data-testid="react-save-booking-draft"'
]

for (const marker of requiredDomainExports) {
  if (!domain.includes(marker)) {
    throw new Error(`Stage 6 audit failed: missing booking draft domain marker: ${marker}`)
  }
}

for (const marker of requiredComponentMarkers) {
  if (!component.includes(marker)) {
    throw new Error(`Stage 6 audit failed: missing component marker: ${marker}`)
  }
}

for (const marker of requiredBookingCardMarkers) {
  if (!bookingCard.includes(marker)) {
    throw new Error(`Stage 6 audit failed: missing booking card marker: ${marker}`)
  }
}

for (const marker of requiredBookingFormMarkers) {
  if (!bookingForm.includes(marker)) {
    throw new Error(`Stage 6 audit failed: missing booking form marker: ${marker}`)
  }
}

if (packageJson.scripts['react:stage6:audit'] !== 'node scripts/verify-react-stage-6.js') {
  throw new Error('Stage 6 audit failed: package script react:stage6:audit is missing or incorrect.')
}

console.log('React Stage 6 booking draft state audit passed.')
