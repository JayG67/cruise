const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function assertContains(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} is missing expected content: ${expected}`)
  }
}

const customerFields = read('frontend/react/src/domain/customerDraftFormFields.js')
const bookingFields = read('frontend/react/src/domain/bookingDraftFormFields.js')
const customerForm = read('frontend/react/src/components/CustomerDraftForm.jsx')
const bookingForm = read('frontend/react/src/components/BookingDraftForm.jsx')
const migrationPlan = read('docs/react-migration-plan.md')

;['firstName', 'lastName', 'email', 'phone', 'loyaltyNumber'].forEach(field => {
  assertContains(customerFields, field, 'customer draft field contract')
})

;['bookingStatus', 'cabinNumber', 'fareCode', 'embarkationPort', 'debarkationPort'].forEach(field => {
  assertContains(bookingFields, field, 'booking draft field contract')
})

assertContains(customerForm, "customerDraftFields.map", 'customer draft form')
assertContains(customerForm, "react-customer-draft-${field.name}", 'customer draft form')
assertContains(customerForm, 'react-cancel-customer-draft', 'customer draft form')
assertContains(bookingForm, "bookingDraftFields.map", 'booking draft form')
assertContains(bookingForm, "react-booking-draft-${field.name}", 'booking draft form')
assertContains(bookingForm, 'react-cancel-booking-draft', 'booking draft form')
assertContains(migrationPlan, 'Stage 9', 'React migration plan')

console.log('React Stage 9 audit passed: draft editor field contracts are extracted and guarded.')
