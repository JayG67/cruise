const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} is missing expected content: ${expected}`)
  }
}

const customerFields = read('frontend/react/src/domain/customerDraftFormFields.js')
const bookingFields = read('frontend/react/src/domain/bookingDraftFormFields.js')
const customerForm = read('frontend/react/src/components/CustomerDraftForm.jsx')
const bookingForm = read('frontend/react/src/components/BookingDraftForm.jsx')
const packageJson = JSON.parse(read('package.json'))

assertIncludes(customerFields, 'required: true', 'customer draft field contracts')
assertIncludes(customerFields, 'type: \'email\'', 'customer draft field contracts')
assertIncludes(customerFields, 'getRequiredCustomerDraftFieldNames', 'customer draft field contracts')
assertIncludes(bookingFields, 'required: true', 'booking draft field contracts')
assertIncludes(bookingFields, 'getRequiredBookingDraftFieldNames', 'booking draft field contracts')
assertIncludes(customerForm, "type={field.type || 'text'}", 'customer draft form')
assertIncludes(customerForm, 'aria-required={field.required ? \'true\' : undefined}', 'customer draft form')
assertIncludes(bookingForm, "autoComplete={field.autoComplete || 'off'}", 'booking draft form')
assertIncludes(bookingForm, 'aria-required={field.required ? \'true\' : undefined}', 'booking draft form')

if (packageJson.scripts['react:stage11:audit'] !== 'node scripts/verify-react-stage-11.js') {
  throw new Error('package.json is missing react:stage11:audit')
}

if (!packageJson.scripts['react:migration:audit']?.includes('react:stage11:audit')) {
  throw new Error('react:migration:audit must include react:stage11:audit')
}

console.log('React Stage 11 field accessibility contract audit passed.')
