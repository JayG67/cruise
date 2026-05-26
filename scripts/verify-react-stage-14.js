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

function assertNotContains(fileContent, unexpected, label) {
  if (fileContent.includes(unexpected)) {
    throw new Error(`Unexpected ${label}: ${unexpected}`)
  }
}

const hierarchy = readProjectFile('frontend/react/src/components/CustomerBookingHierarchy.jsx')
const customerHook = readProjectFile('frontend/react/src/hooks/useCustomerDraftWorkflow.js')
const bookingHook = readProjectFile('frontend/react/src/hooks/useBookingDraftWorkflow.js')
const packageJson = JSON.parse(readProjectFile('package.json'))

assertContains(hierarchy, "import { useCustomerDraftWorkflow } from '../hooks/useCustomerDraftWorkflow.js'", 'customer draft workflow hook import')
assertContains(hierarchy, "import { useBookingDraftWorkflow } from '../hooks/useBookingDraftWorkflow.js'", 'booking draft workflow hook import')
assertContains(hierarchy, 'draft workflow hooks for customer and booking edits', 'Stage 14 hierarchy summary copy')
assertContains(hierarchy, 'useCustomerDraftWorkflow({ onSaveCustomerDraft, mutationError })', 'customer draft workflow usage')
assertContains(hierarchy, 'useBookingDraftWorkflow({ onSaveBookingDraft, bookingMutationError })', 'booking draft workflow usage')
assertNotContains(hierarchy, 'createNoChangesFeedback', 'inline draft feedback orchestration in hierarchy component')
assertNotContains(hierarchy, 'setCustomerDrafts', 'inline customer draft state mutation in hierarchy component')
assertNotContains(hierarchy, 'setBookingDrafts', 'inline booking draft state mutation in hierarchy component')

assertContains(customerHook, 'export function useCustomerDraftWorkflow', 'customer draft workflow hook export')
assertContains(customerHook, 'createCustomerDraft(customer)', 'customer draft creation moved to hook')
assertContains(customerHook, 'createNoChangesFeedback(\'customer\')', 'customer no-change feedback moved to hook')
assertContains(customerHook, 'createSaveSuccessFeedback', 'customer save success feedback moved to hook')
assertContains(customerHook, 'cancelCustomerDraft: clearCustomerDraft', 'customer cancel draft action exposed')

assertContains(bookingHook, 'export function useBookingDraftWorkflow', 'booking draft workflow hook export')
assertContains(bookingHook, 'createBookingExpansionKey(customerId, booking.id)', 'duplicate-safe booking draft key in hook')
assertContains(bookingHook, 'createNoChangesFeedback(\'booking\')', 'booking no-change feedback moved to hook')
assertContains(bookingHook, 'createSaveSuccessFeedback', 'booking save success feedback moved to hook')
assertContains(bookingHook, 'cancelBookingDraft: clearBookingDraft', 'booking cancel draft action exposed')

assertContains(packageJson.scripts['react:migration:audit'], 'react:stage14:audit', 'Stage 14 included in aggregate audit')

console.log('React Stage 14 draft workflow hook audit passed.')
