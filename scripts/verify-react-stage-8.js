const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

const requiredFiles = [
  'frontend/react/src/components/CustomerDraftForm.jsx',
  'frontend/react/src/components/BookingDraftForm.jsx',
  'frontend/react/src/components/CustomerBookingHierarchy.jsx',
  'docs/react-migration-plan.md'
]

for (const filePath of requiredFiles) {
  const absolutePath = path.join(projectRoot, filePath)

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing Stage 8 React migration file: ${filePath}`)
  }
}

const hierarchy = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
const customerForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerDraftForm.jsx'), 'utf8')
const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')
const migrationPlan = fs.readFileSync(path.join(projectRoot, 'docs/react-migration-plan.md'), 'utf8')

const expectations = [
  [hierarchy.includes("import CustomerDraftForm from './CustomerDraftForm.jsx'"), 'Customer hierarchy must import extracted customer draft form.'],
  [hierarchy.includes("import BookingDraftForm from './BookingDraftForm.jsx'"), 'Customer hierarchy must import extracted booking draft form.'],
  [!hierarchy.includes('function CustomerDraftForm('), 'Customer draft form should not remain inline in the hierarchy component.'],
  [!hierarchy.includes('function BookingDraftForm('), 'Booking draft form should not remain inline in the hierarchy component.'],
  [customerForm.includes('data-testid="react-save-customer-draft"'), 'Customer draft form must preserve save test id.'],
  [bookingForm.includes('data-testid="react-booking-draft-form"'), 'Booking draft form must preserve booking draft form test id.'],
  [bookingForm.includes('data-testid="react-save-booking-draft"'), 'Booking draft form must preserve save test id.'],
  [migrationPlan.includes('Stage 8: Draft editor component extraction'), 'Migration plan must document Stage 8.']
]

const failed = expectations.filter(([passes]) => !passes)

if (failed.length > 0) {
  for (const [, message] of failed) {
    console.error(`- ${message}`)
  }
  throw new Error('React Stage 8 audit failed.')
}

console.log('React Stage 8 draft editor extraction audit passed.')
