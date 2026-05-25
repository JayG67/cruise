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

    expect(state).toContain('export function toggleExpandedId')
    expect(state).toContain('export function expandVisibleCustomers')
    expect(state).toContain('export function collapseVisibleCustomers')
    expect(state).toContain('export function createBookingExpansionKey')
    expect(component).toContain("from '../domain/hierarchyExpansionState.js'")
    expect(component).toContain('createBookingExpansionKey(customer.id, booking.id)')
    expect(component).not.toContain('function toggleSetValue')
    expect(packageJson.scripts['react:stage3:audit']).toBe('node scripts/verify-react-stage-3.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage3:audit')
  })

  it('adds Stage 4 customer draft state before wiring React mutations', () => {
    const drafts = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/customerDrafts.js'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const customerForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerDraftForm.jsx'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'), 'utf8')

    expect(drafts).toContain('export function createCustomerDraft')
    expect(drafts).toContain('export function validateCustomerDraft')
    expect(drafts).toContain('export function summarizeCustomerDraftChanges')
    expect(component).toContain('customerDrafts')
    expect(component).toContain('CustomerDraftForm')
    expect(component).toContain('data-testid="react-customer-draft-row"')
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
    expect(component).toContain('Use Save draft to exercise the React mutation boundary')
    expect(styles).toContain('.primary-button')
    expect(packageJson.scripts['react:stage5:audit']).toBe('node scripts/verify-react-stage-5.js')
    expect(packageJson.scripts['react:migration:audit']).toContain('react:stage5:audit')
  })


  it('adds Stage 6 booking draft state before wiring live booking mutations', () => {
    const bookingDrafts = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/bookingDrafts.js'), 'utf8')
    const component = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerBookingHierarchy.jsx'), 'utf8')
    const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'), 'utf8')

    expect(bookingDrafts).toContain('export function createBookingDraft')
    expect(bookingDrafts).toContain('export function validateBookingDraft')
    expect(bookingDrafts).toContain('export function summarizeBookingDraftChanges')
    expect(component).toContain('bookingDrafts')
    expect(component).toContain('BookingDraftForm')
    expect(bookingForm).toContain('data-testid="react-booking-draft-form"')
    expect(bookingForm).toContain('data-testid="react-validate-booking-draft"')
    expect(bookingForm).toContain('data-testid="react-save-booking-draft"')
    expect(component).toContain('Booking draft is valid with')
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
    const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')

    expect(client).toContain('export async function updateBookingDetails')
    expect(hook).toContain('useBookingDetailsMutation')
    expect(hook).toContain('passengers: (booking.passengers || []).map(getPassengerPayload)')
    expect(app).toContain('onSaveBookingDraft={saveBookingDetails}')
    expect(component).toContain('async function saveBookingDraftFor')
    expect(component).toContain('Booking draft saved through the React mutation boundary.')
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
    const customerForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/CustomerDraftForm.jsx'), 'utf8')
    const bookingForm = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/components/BookingDraftForm.jsx'), 'utf8')

    expect(hierarchy).toContain("import CustomerDraftForm from './CustomerDraftForm.jsx'")
    expect(hierarchy).toContain("import BookingDraftForm from './BookingDraftForm.jsx'")
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
