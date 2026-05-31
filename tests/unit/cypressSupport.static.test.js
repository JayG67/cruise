const fs = require('fs')
const path = require('path')

describe('browser test helper inventory', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const adminWorkflowsPath = path.join(projectRoot, 'cypress/support/adminWorkflows.js')
  const demoRolesPath = path.join(projectRoot, 'cypress/e2e/demoRoles.cy.js')
  const mobileRoleDashboardPath = path.join(projectRoot, 'playwright/mobile/role-dashboard-mobile.spec.js')

  it('keeps repeated admin customer workflow actions consolidated in Cypress support helpers', () => {
    const helpers = fs.readFileSync(adminWorkflowsPath, 'utf8')

    expect(helpers).toContain('export function openAdminCustomerWorkflows')
    expect(helpers).toContain('export function openAdminCustomerWorkflowsFor')
    expect(helpers).toContain('export function expandCustomerBookings')
    expect(helpers).toContain('export function collapseCustomerBookings')
    expect(helpers).toContain('export function openFirstBookingEditor')
    expect(helpers).toContain('export function saveOpenBookingCabin')
    expect(helpers).toContain(".filter(':visible')")
    expect(helpers).toContain('admin-customer-bookings-row-${customerId}')
    expect(helpers).toContain("cy.wrap($button).should('have.attr', 'aria-expanded', 'true')")
    expect(helpers).toContain("if ($button.attr('aria-expanded') !== 'true')")
  })

  it('uses admin workflow helpers in the role dashboard Cypress suite', () => {
    const spec = fs.readFileSync(demoRolesPath, 'utf8')

    expect(spec).toContain("../support/adminWorkflows")
    expect(spec).toContain('openAdminCustomerWorkflowsFor')
    expect(spec).toContain('expandCustomerBookings')
    expect(spec).toContain('openFirstBookingEditor')
    expect(spec).toContain('saveOpenBookingCabin')
  })

  it('keeps repeated Playwright mobile role-dashboard actions consolidated in local helpers', () => {
    const spec = fs.readFileSync(mobileRoleDashboardPath, 'utf8')

    expect(spec).toContain('async function openAdminCustomerWorkflows')
    expect(spec).toContain('async function hideAdminCustomerWorkflows')
    expect(spec).toContain('async function searchAdminRecords')
    expect(spec).toContain('async function expandCustomerBookingsFor')
  })

  it('opens duplicate booking editors from the clicked row context instead of a hidden duplicate', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'public/app.js'), 'utf8')
    const helpers = fs.readFileSync(adminWorkflowsPath, 'utf8')

    expect(app).toContain('showAdminBookingEditForm(button.dataset.bookingId, button)')
    expect(app).toContain(`triggerButton?.closest('[data-cy="admin-booking-row"]')`)
    expect(helpers).toContain(".filter(':visible')")
  })

  it('toggles duplicate booking detail rows from the clicked row context', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'public/app.js'), 'utf8')

    expect(app).toContain('toggleAdminBookingDetails(button.dataset.bookingId, button)')
    expect(app).toContain(`button?.closest('[data-cy="admin-booking-row"]')`)
    expect(app).toContain('bookingRow?.nextElementSibling')
    expect(app).toContain(`row?.querySelector('[data-cy="admin-booking-details-panel"]')`)
  })


  it('keeps React /app-next Cypress replacement coverage present', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(fs.existsSync(specPath)).toBe(true)
    expect(spec).toContain("cy.visit('/app-next')")
    expect(spec).toContain("selectDemoUserByVisibleRole('Passenger')")
    expect(spec).toContain("selectDemoUserByVisibleRole('Admin')")
    expect(spec).toContain('react-sqa-health-button')
  })


  it('keeps React Cypress spec self-contained without testing-library commands', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain("Cypress.Commands.add('getByTestId'")
    expect(spec).toContain('cy.getByTestId')
    expect(spec).not.toContain('cy.findByTestId')
    expect(spec).not.toContain('cy.findByText')
  })


  it('keeps React Cypress spec isolated from legacy DOM discovery', () => {
    const legacySpecPath = path.join(projectRoot, 'cypress/e2e/reactApp.cy.js')
    const reactSpecPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')

    expect(fs.existsSync(legacySpecPath)).toBe(false)
    expect(fs.existsSync(reactSpecPath)).toBe(true)
  })


  it('keeps React Cypress script simple because config includes React specs', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

    expect(packageJson.scripts['cypress:run:react']).toContain('cypress/react/**/*.cy.js')
    expect(packageJson.scripts['cypress:run:react']).not.toContain('specPattern=')
  })


  it('keeps React Cypress role selection using supported Cypress select values', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain('function selectDemoUserByVisibleRole')
    expect(spec).toContain(".contains(roleText)")
    expect(spec).toContain(".invoke('val')")
    expect(spec).toContain('.select(value)')
    expect(spec).not.toContain('select(/Passenger/)')
    expect(spec).not.toContain('select(/Admin/)')
  })


  it('keeps React Cypress delete confirmation deterministic through React panels', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain("cy.getByTestId('react-fleet-delete-confirmation-cancel')")
    expect(spec).toContain("cy.getByTestId('react-fleet-delete-confirmation-confirm')")
    expect(spec).toContain("cy.getByTestId('react-admin-delete-confirmation-confirm')")
    expect(spec).not.toContain("cy.on('window:confirm', () => true)")
  })


  it('keeps React Cypress specs starting from an admin baseline', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain('function visitReactAppAsAdmin')
    expect(spec).toContain('visitReactAppAsAdmin()')
    expect(spec).toContain("selectDemoUserByVisibleRole('Admin')")
    expect(spec).toContain("cy.getByTestId('react-active-route-operations').should('be.visible')")
  })


  it('keeps React Cypress delete test safe and deterministic', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain("cy.intercept('DELETE', '/cruise/cruise-line/*',")
    expect(spec).toContain('statusCode: 200')
    expect(spec).toContain("cy.getByTestId('react-fleet-delete-confirmation-cancel')")
    expect(spec).toContain("cy.getByTestId('react-fleet-delete-confirmation-confirm')")
    expect(spec).not.toContain("cy.stub(win, 'confirm')")
  })


  it('keeps React role switching test targeting the select control', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain('switches through React role dashboards using the actual demo user select')
    expect(spec).toContain("selectDemoUserByVisibleRole('Passenger')")
    expect(spec).toContain("selectDemoUserByVisibleRole('Group Leader')")
    expect(spec).toContain("selectDemoUserByVisibleRole('Admin')")
    expect(spec).not.toContain("cy.get('[data-testid=\"react-role-selector\"]').select")
  })


  it('keeps React static tests parse-safe when checking quoted selectors', () => {
    const reactContractPath = path.join(projectRoot, 'tests/unit/reactComponentContracts.static.test.js')
    const reactContract = fs.readFileSync(reactContractPath, 'utf8')

    expect(reactContract).toContain("not.toContain(`cy.get('[data-testid=\"react-role-selector\"]').select`)")
    expect(reactContract).not.toContain('not.toContain("cy.get(\'[data-testid="react-role-selector"]\').select")')
  })


  it('keeps React group leader dashboard assertion aligned with normalized role view', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')
    const roleView = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/roleView.js'), 'utf8')

    expect(roleView).toContain("return 'group-leader'")
    expect(spec).toContain("cy.getByTestId('react-group-leader-dashboard').should('be.visible')")
    expect(spec).not.toContain("cy.getByTestId('react-group-dashboard')")
  })


  it('keeps React cruise line update Cypress edit form deterministic', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain("it('updates a React cruise line from the fleet directory'")
    expect(spec).toContain('react-cruise-line-edit-form')
    expect(spec).toContain('react-edit-cruise-line-name')
    expect(spec).toContain('react-save-cruise-line-edit')
    expect(spec).toContain("cy.intercept('PATCH', '/cruise/cruise-line/*'")
    expect(spec).toContain('expect(req.url).to.match')
    expect(spec).toContain('cruise-line\\/[0-9a-f-]{36}')
    expect(spec).not.toContain("cy.get('@cruiseLinePrompt')")
  })


  it('keeps React cruise line update Cypress test compatible with seeded UUID ids', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain("cy.intercept('PATCH', '/cruise/cruise-line/*'")
    expect(spec).toContain('expect(req.url).to.match(/\\/cruise\\/cruise-line\\/[0-9a-f-]{36}$/)')
    expect(spec).toContain("const cruiseLineId = req.url.split('/').pop()")
    expect(spec).toContain('id: cruiseLineId')
    expect(spec).not.toContain("expect(req.url).to.contain('/cruise/cruise-line/royal-caribbean')")
  })


  it('keeps React sailing and itinerary edits covered by controlled forms instead of prompts', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')
    const testStart = spec.indexOf("manages React ship CRUD and sailing lookup from the selected fleet panel")
    const testEnd = spec.indexOf("runs a React SQA health check and writes output", testStart)
    const testBlock = spec.slice(testStart, testEnd)

    expect(testBlock).toContain("cy.getByTestId('react-sailing-edit-form').should('be.visible')")
    expect(testBlock).toContain("cy.getByTestId('react-itinerary-day-edit-form').should('be.visible')")
    expect(testBlock).toContain("cy.getByTestId('react-itinerary-activity-edit-form').should('be.visible')")
    expect(testBlock).toContain("cy.getByTestId('react-fleet-delete-confirmation-confirm')")
    expect(testBlock).not.toContain('const promptResponses = [')
    expect(testBlock.match(/cy\.stub\(win, 'prompt'\)/g) || []).toHaveLength(0)
    expect(testBlock.match(/cy\.stub\(win, 'confirm'\)/g) || []).toHaveLength(0)
  })


  it('keeps React itinerary activity delete targeting the created day-one activity', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')
    const testStart = spec.indexOf("manages React ship CRUD and sailing lookup from the selected fleet panel")
    const testEnd = spec.indexOf("runs a React SQA health check and writes output", testStart)
    const testBlock = spec.slice(testStart, testEnd)

    expect(testBlock).toContain("cy.getByTestId('react-itinerary-day-card')")
    expect(testBlock).toContain(".first()")
    expect(testBlock).toContain(".find('[data-testid=\"react-delete-itinerary-activity-button\"]')")
    expect(testBlock).toContain("cy.wait('@deleteReactItineraryActivity')")
    expect(testBlock).not.toContain("cy.getByTestId('react-delete-itinerary-activity-button').last().click()")
  })

})
