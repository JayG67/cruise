const fs = require('fs')
const path = require('path')

describe('React migration scaffold', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('keeps the React migration shell separate from the production DOM app', () => {
    expect(fs.existsSync(path.join(projectRoot, 'frontend/react/src/App.jsx'))).toBe(true)
    expect(fs.existsSync(path.join(projectRoot, 'public/app.js'))).toBe(true)
    expect(fs.readFileSync(path.join(projectRoot, 'docs/react-migration-plan.md'), 'utf8'))
      .toContain('Do not rewrite the production UI all at once')
  })

  it('documents a long-lived dev branch strategy for staged migration work', () => {
    const strategy = fs.readFileSync(path.join(projectRoot, 'docs/branching-strategy.md'), 'utf8')

    expect(strategy).toContain('long-lived `dev` branch')
    expect(strategy).toContain('main` as the stable release branch')
    expect(strategy).toContain('feature/react-migration-stage-0')
  })

  it('adds React and Vite scripts without changing the existing production start script', () => {
    expect(packageJson.scripts.start).toContain('node --watch index.js')
    expect(packageJson.scripts['react:dev']).toContain('vite --config frontend/react/vite.config.js')
    expect(packageJson.scripts['react:build']).toContain('vite build --config frontend/react/vite.config.js')
    expect(packageJson.scripts['react:scaffold:audit']).toBe('node scripts/verify-react-migration-scaffold.js')
  })

  it('uses React state for the first migration candidate instead of direct DOM selectors', () => {
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')

    expect(component).toContain('useState')
    expect(component).toContain('expandedCustomerIds')
    expect(component).toContain('expandedBookingIds')
    expect(component).toContain('buildCustomerBookingRows')
    expect(component).not.toContain('document.querySelector')
  })
  it('extracts React hierarchy domain logic away from component rendering', () => {
    const domain = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/adminHierarchy.js'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')

    expect(domain).toContain('export function buildCustomerBookingRows')
    expect(domain).toContain('export function filterCustomerBookingRows')
    expect(domain).toContain('export function summarizeHierarchyRows')
    expect(domain).toContain('bookingMatchesCustomer')
    expect(component).toContain('buildCustomerBookingRows')
    expect(component).toContain('filterCustomerBookingRows')
    expect(component).toContain('Expand visible customers')
    expect(component).toContain('Collapse visible customers')
  })

  it('adds a Stage 1 React migration audit script for hierarchy guardrails', () => {
    expect(packageJson.scripts['react:stage1:audit']).toBe('node scripts/verify-react-stage-1.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:scaffold:audit')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage1:audit')
    expect(fs.existsSync(path.join(projectRoot, 'scripts/verify-react-stage-1.js'))).toBe(true)
  })

  it('adds a Stage 2 React API boundary with cancellable loading and retry UX', () => {
    const client = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/api/client.js'), 'utf8')
    const hook = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useAdminHierarchySnapshot.js'), 'utf8')
    const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')

    expect(client).toContain('export async function getAdminHierarchySnapshot')
    expect(client).toContain('Promise.all')
    expect(hook).toContain('AbortController')
    expect(hook).toContain('reload')
    expect(app).toContain('useAdminHierarchySnapshot')
    expect(component).toContain('Retry loading snapshot')
    expect(component).toContain('data-testid="react-admin-hierarchy"')
    expect(packageJson.scripts['react:stage2:audit']).toBe('node scripts/verify-react-stage-2.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage2:audit')
  })

  it('extracts Stage 3 React expansion state transitions from the hierarchy component', () => {
    const state = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/hierarchyExpansionState.js'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const customerRow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerHierarchyRow.jsx'), 'utf8')

    expect(state).toContain('export function toggleExpandedId')
    expect(state).toContain('export function expandVisibleCustomers')
    expect(state).toContain('export function collapseVisibleCustomers')
    expect(state).toContain('export function createBookingExpansionKey')
    expect(component).toContain("from '../domain/hierarchyExpansionState.js'")
    expect(component).toContain('createBookingExpansionKey(customer.id, bookingId)')
    expect(customerRow).toContain('createBookingExpansionKey(customer.id, booking.id)')
    expect(component).not.toContain('function toggleSetValue')
    expect(packageJson.scripts['react:stage3:audit']).toBe('node scripts/verify-react-stage-3.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage3:audit')
  })

  it('adds Stage 4 customer draft state before wiring React mutations', () => {
    const drafts = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/customerDrafts.js'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const customerWorkflow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useCustomerDraftWorkflow.js'), 'utf8')
    const customerRow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerHierarchyRow.jsx'), 'utf8')
    const customerForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerDraftForm.jsx'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'), 'utf8')

    expect(drafts).toContain('export function createCustomerDraft')
    expect(drafts).toContain('export function validateCustomerDraft')
    expect(drafts).toContain('export function summarizeCustomerDraftChanges')
    expect(component).toContain('customerDrafts')
    expect(customerRow).toContain('CustomerDraftForm')
    expect(customerRow).toContain('data-testid="react-customer-draft-row"')
    expect(customerForm).toContain('data-testid="react-validate-customer-draft"')
    expect(styles).toContain('.draft-editor')
    expect(packageJson.scripts['react:stage4:audit']).toBe('node scripts/verify-react-stage-4.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage4:audit')
  })


  it('adds Stage 5 customer mutation boundary while preserving React draft validation', () => {
    const client = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/api/client.js'), 'utf8')
    const hook = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useCustomerProfileMutation.js'), 'utf8')
    const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const customerWorkflow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useCustomerDraftWorkflow.js'), 'utf8')
    const customerRow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerHierarchyRow.jsx'), 'utf8')
    const customerForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerDraftForm.jsx'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'), 'utf8')

    expect(client).toContain('export async function updateCustomerProfile')
    expect(client).toContain("method: 'PATCH'")
    expect(hook).toContain('useCustomerProfileMutation')
    expect(hook).toContain('savingCustomerId')
    expect(hook).toContain('onSaved')
    expect(app).toContain('useCustomerProfileMutation')
    expect(app).toContain('onSaveCustomerDraft={saveCustomerProfile}')
    expect(component).toContain('saveCustomerDraftFor')
    expect(customerForm).toContain('data-testid="react-save-customer-draft"')
    expect(customerWorkflow).toContain('Use Save draft to exercise the React mutation boundary')
    expect(styles).toContain('.primary-button')
    expect(packageJson.scripts['react:stage5:audit']).toBe('node scripts/verify-react-stage-5.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage5:audit')
  })


  it('adds Stage 6 booking draft state before wiring live booking mutations', () => {
    const bookingDrafts = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/bookingDrafts.js'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const bookingWorkflow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useBookingDraftWorkflow.js'), 'utf8')
    const bookingCard = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingCard.jsx'), 'utf8')
    const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'), 'utf8')

    expect(bookingDrafts).toContain('export function createBookingDraft')
    expect(bookingDrafts).toContain('export function validateBookingDraft')
    expect(bookingDrafts).toContain('export function summarizeBookingDraftChanges')
    expect(component).toContain('bookingDrafts')
    expect(bookingCard).toContain('BookingDraftForm')
    expect(bookingForm).toContain('data-testid="react-booking-draft-form"')
    expect(bookingForm).toContain('data-testid="react-validate-booking-draft"')
    expect(bookingForm).toContain('data-testid="react-save-booking-draft"')
    expect(bookingWorkflow).toContain('Booking draft is valid with')
    expect(styles).toContain('.booking-draft-editor')
    expect(packageJson.scripts['react:stage6:audit']).toBe('node scripts/verify-react-stage-6.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage6:audit')
  })

})


describe('React migration Stage 7 booking mutation boundary', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('adds a Stage 7 React booking mutation boundary with full booking payload preservation', () => {
    const client = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/api/client.js'), 'utf8')
    const hook = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useBookingDetailsMutation.js'), 'utf8')
    const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const bookingWorkflow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useBookingDraftWorkflow.js'), 'utf8')
    const bookingCard = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingCard.jsx'), 'utf8')
    const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')

    expect(client).toContain('export async function updateBookingDetails')
    expect(hook).toContain('useBookingDetailsMutation')
    expect(hook).toContain('passengers: (booking.passengers || []).map(getPassengerPayload)')
    expect(app).toContain('onSaveBookingDraft={saveBookingDetails}')
    expect(bookingWorkflow).toContain('async function saveBookingDraftFor')
    expect(bookingWorkflow).toContain('Booking draft saved through the React mutation boundary.')
    expect(bookingForm).toContain('data-testid="react-save-booking-draft"')
    expect(packageJson.scripts['react:stage7:audit']).toBe('node scripts/verify-react-stage-7.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage7:audit')
  })
})


describe('React migration Stage 8 draft editor extraction', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('extracts reusable draft editor components without losing mutation guardrails', () => {
    const hierarchy = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const customerRow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerHierarchyRow.jsx'), 'utf8')
    const bookingCard = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingCard.jsx'), 'utf8')
    const customerForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerDraftForm.jsx'), 'utf8')
    const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')

    expect(customerRow).toContain("import CustomerDraftForm from './CustomerDraftForm.jsx'")
    expect(bookingCard).toContain("import BookingDraftForm from './BookingDraftForm.jsx'")
    expect(hierarchy).not.toContain('function CustomerDraftForm(')
    expect(hierarchy).not.toContain('function BookingDraftForm(')
    expect(customerForm).toContain('data-testid="react-save-customer-draft"')
    expect(bookingForm).toContain('data-testid="react-booking-draft-form"')
    expect(bookingForm).toContain('data-testid="react-save-booking-draft"')
    expect(packageJson.scripts['react:stage8:audit']).toBe('node scripts/verify-react-stage-8.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage8:audit')
  })
})


describe('React migration Stage 9 draft editor field contracts', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('extracts draft editor field metadata so form structure is centralized and guarded', () => {
    const customerFields = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/customerDraftFormFields.js'), 'utf8')
    const bookingFields = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/bookingDraftFormFields.js'), 'utf8')
    const customerForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerDraftForm.jsx'), 'utf8')
    const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')

    expect(customerFields).toContain('customerDraftFields')
    expect(customerFields).toContain('loyaltyNumber')
    expect(bookingFields).toContain('bookingDraftFields')
    expect(bookingFields).toContain('debarkationPort')
    expect(customerForm).toContain('customerDraftFields.map')
    expect(customerForm).toContain('data-testid={`react-customer-draft-${field.name}`}')
    expect(customerForm).toContain('data-testid="react-cancel-customer-draft"')
    expect(bookingForm).toContain('bookingDraftFields.map')
    expect(bookingForm).toContain('data-testid={`react-booking-draft-${field.name}`}')
    expect(bookingForm).toContain('data-testid="react-cancel-booking-draft"')
    expect(packageJson.scripts['react:stage9:audit']).toBe('node scripts/verify-react-stage-9.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage9:audit')
  })
})


describe('React migration Stage 10 accessible draft feedback contracts', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('centralizes draft feedback messaging and exposes accessible status/error contracts', () => {
    const feedbackDomain = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/draftFeedback.js'), 'utf8')
    const feedbackComponent = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/DraftFeedback.jsx'), 'utf8')
    const customerForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerDraftForm.jsx'), 'utf8')
    const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')
    const customerWorkflow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useCustomerDraftWorkflow.js'), 'utf8')
    const bookingWorkflow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useBookingDraftWorkflow.js'), 'utf8')

    expect(feedbackDomain).toContain('export function createValidationFeedback')
    expect(feedbackDomain).toContain('export function createMutationErrorFeedback')
    expect(feedbackComponent).toContain("tone === 'error' ? 'alert' : 'status'")
    expect(feedbackComponent).toContain('data-testid={testId}')
    expect(customerForm).toContain("import DraftFeedback from './DraftFeedback.jsx'")
    expect(customerForm).toContain('testId="react-customer-draft-feedback"')
    expect(bookingForm).toContain("import DraftFeedback from './DraftFeedback.jsx'")
    expect(bookingForm).toContain('testId="react-booking-draft-feedback"')
    expect(customerWorkflow).toContain('createValidationFeedback(')
    expect(customerWorkflow).toContain('createNoChangesFeedback(')
    expect(customerWorkflow).toContain('createMutationErrorFeedback(')
    expect(bookingWorkflow).toContain('createValidationFeedback(')
    expect(bookingWorkflow).toContain('createNoChangesFeedback(')
    expect(bookingWorkflow).toContain('createMutationErrorFeedback(')
    expect(packageJson.scripts['react:stage10:audit']).toBe('node scripts/verify-react-stage-10.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage10:audit')
  })
})


describe('React migration Stage 11 draft field accessibility contracts', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('marks required React draft fields through shared metadata and accessible input attributes', () => {
    const customerFields = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/customerDraftFormFields.js'), 'utf8')
    const bookingFields = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/bookingDraftFormFields.js'), 'utf8')
    const customerForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerDraftForm.jsx'), 'utf8')
    const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')

    expect(customerFields).toContain('getRequiredCustomerDraftFieldNames')
    expect(customerFields).toContain("type: 'email'")
    expect(bookingFields).toContain('getRequiredBookingDraftFieldNames')
    expect(bookingFields).toContain('required: true')
    expect(customerForm).toContain("type={field.type || 'text'}")
    expect(customerForm).toContain("aria-required={field.required ? 'true' : undefined}")
    expect(bookingForm).toContain("autoComplete={field.autoComplete || 'off'}")
    expect(bookingForm).toContain("aria-required={field.required ? 'true' : undefined}")
    expect(packageJson.scripts['react:stage11:audit']).toBe('node scripts/verify-react-stage-11.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage11:audit')
  })
})


describe('React migration Stage 12 presentation component decomposition', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('extracts hierarchy presentation into reviewable customer row and booking card components', () => {
    const hierarchy = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const customerRow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerHierarchyRow.jsx'), 'utf8')
    const bookingCard = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingCard.jsx'), 'utf8')

    expect(hierarchy).toContain("import CustomerHierarchyRow from './CustomerHierarchyRow.jsx'")
    expect(hierarchy).not.toContain('function CustomerHierarchyRow')
    expect(customerRow).toContain("import BookingCard from './BookingCard.jsx'")
    expect(customerRow).toContain('data-testid="react-toggle-customer-bookings"')
    expect(customerRow).toContain('data-testid="react-customer-bookings-row"')
    expect(bookingCard).toContain('export default function BookingCard')
    expect(bookingCard).toContain('data-testid="react-toggle-booking-details"')
    expect(bookingCard).toContain('data-testid="react-booking-details"')
    expect(packageJson.scripts['react:stage12:audit']).toBe('node scripts/verify-react-stage-12.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage12:audit')
  })
})


describe('React migration Stage 13 presentation accessibility contracts', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('adds explicit aria-controls contracts for extracted hierarchy presentation components', () => {
    const hierarchy = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const customerRow = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerHierarchyRow.jsx'), 'utf8')
    const bookingCard = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingCard.jsx'), 'utf8')

    expect(hierarchy).toContain('aria-controls contracts')
    expect(customerRow).toContain('aria-controls={bookingsRowId}')
    expect(customerRow).toContain('id={bookingsRowId}')
    expect(bookingCard).toContain('aria-controls={detailsId}')
    expect(bookingCard).toContain('id={detailsId}')
    expect(bookingCard).toContain('aria-label={`Booking ${booking.id} for ${passengerSummary}`}')
    expect(packageJson.scripts['react:stage13:audit']).toBe('node scripts/verify-react-stage-13.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage13:audit')
  })
})



describe('React migration Stage 14 draft workflow hook extraction', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

  it('extracts customer and booking draft workflow orchestration out of the hierarchy component', () => {
    const hierarchy = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const customerHook = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useCustomerDraftWorkflow.js'), 'utf8')
    const bookingHook = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/hooks/useBookingDraftWorkflow.js'), 'utf8')

    expect(hierarchy).toContain("import { useCustomerDraftWorkflow } from '../hooks/useCustomerDraftWorkflow.js'")
    expect(hierarchy).toContain("import { useBookingDraftWorkflow } from '../hooks/useBookingDraftWorkflow.js'")
    expect(hierarchy).toContain('Stage 14 migration slice')
    expect(hierarchy).toContain('useCustomerDraftWorkflow({ onSaveCustomerDraft, mutationError })')
    expect(hierarchy).toContain('useBookingDraftWorkflow({ onSaveBookingDraft, bookingMutationError })')
    expect(hierarchy).not.toContain('setCustomerDrafts')
    expect(hierarchy).not.toContain('setBookingDrafts')
    expect(customerHook).toContain('export function useCustomerDraftWorkflow')
    expect(customerHook).toContain('createCustomerDraft(customer)')
    expect(customerHook).toContain("createNoChangesFeedback('customer')")
    expect(bookingHook).toContain('export function useBookingDraftWorkflow')
    expect(bookingHook).toContain('createBookingExpansionKey(customerId, booking.id)')
    expect(bookingHook).toContain("createNoChangesFeedback('booking')")
    expect(packageJson.scripts['react:stage14:audit']).toBe('node scripts/verify-react-stage-14.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage14:audit')
  })
})
