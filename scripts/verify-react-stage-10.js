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

const packageJson = JSON.parse(read('package.json'))
const feedbackDomain = read('frontend/react/src/domain/draftFeedback.js')
const feedbackComponent = read('frontend/react/src/components/DraftFeedback.jsx')
const customerForm = read('frontend/react/src/components/CustomerDraftForm.jsx')
const bookingForm = read('frontend/react/src/components/BookingDraftForm.jsx')
const hierarchy = read('frontend/react/src/components/CustomerBookingHierarchy.jsx')
const customerWorkflow = read('frontend/react/src/hooks/useCustomerDraftWorkflow.js')
const bookingWorkflow = read('frontend/react/src/hooks/useBookingDraftWorkflow.js')
const plan = read('docs/react-migration-plan.md')

;[
  'export function createValidationFeedback',
  'export function createNoChangesFeedback',
  'export function createSaveUnavailableFeedback',
  'export function createSaveSuccessFeedback',
  'export function createMutationErrorFeedback',
  'export function getDraftFeedbackTone'
].forEach(expected => assertContains(feedbackDomain, expected, 'Stage 10 feedback domain'))

assertContains(feedbackComponent, 'role={role}', 'Stage 10 feedback component')
assertContains(feedbackComponent, 'data-testid={testId}', 'Stage 10 feedback component')
assertContains(feedbackComponent, "tone === 'error' ? 'alert' : 'status'", 'Stage 10 feedback component')

assertContains(customerForm, "import DraftFeedback from './DraftFeedback.jsx'", 'Stage 10 customer form')
assertContains(customerForm, 'testId="react-customer-draft-feedback"', 'Stage 10 customer form')
assertContains(bookingForm, "import DraftFeedback from './DraftFeedback.jsx'", 'Stage 10 booking form')
assertContains(bookingForm, 'testId="react-booking-draft-feedback"', 'Stage 10 booking form')

assertContains(customerWorkflow, 'createValidationFeedback(', 'Stage 10 customer draft workflow hook')
assertContains(customerWorkflow, 'createNoChangesFeedback(', 'Stage 10 customer draft workflow hook')
assertContains(customerWorkflow, 'createMutationErrorFeedback(', 'Stage 10 customer draft workflow hook')
assertContains(bookingWorkflow, 'createValidationFeedback(', 'Stage 10 booking draft workflow hook')
assertContains(bookingWorkflow, 'createNoChangesFeedback(', 'Stage 10 booking draft workflow hook')
assertContains(bookingWorkflow, 'createMutationErrorFeedback(', 'Stage 10 booking draft workflow hook')
assertContains(hierarchy, 'migration slice', 'Stage 10 hierarchy still represented in current migration summary')

assertContains(plan, 'Stage 10', 'React migration plan')
assertContains(plan, 'accessible draft feedback contract', 'React migration plan')

if (packageJson.scripts['react:stage10:audit'] !== 'node scripts/verify-react-stage-10.js') {
  throw new Error('package.json must expose react:stage10:audit')
}

if (!packageJson.scripts['react:migration:audit'].includes('react:stage10:audit')) {
  throw new Error('react:migration:audit must include react:stage10:audit')
}

console.log('React Stage 10 accessible draft feedback guardrails passed.')
