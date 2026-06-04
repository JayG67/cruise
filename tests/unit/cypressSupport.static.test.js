const fs = require('fs')
const path = require('path')

describe('browser test helper inventory', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  it('keeps retired pre-React Cypress workflow helpers removed', () => {
    const retiredAdminWorkflowsPath = path.join(projectRoot, 'cypress/support/adminWorkflows.js')

    expect(fs.existsSync(retiredAdminWorkflowsPath)).toBe(false)
  })

  it('keeps React admin journey coverage self-contained after pre-React helper retirement', () => {
    const reactSpecs = [
      fs.readFileSync(path.join(projectRoot, 'cypress/react/reactApp.cy.js'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'cypress/react/reactAdminHierarchy.cy.js'), 'utf8'),
      fs.readFileSync(path.join(projectRoot, 'cypress/react/reactRoleJourneyPermissions.cy.js'), 'utf8')
    ].join('\n')

    expect(reactSpecs).toContain('react-toggle-customer-workflows')
    expect(reactSpecs).toContain('react-toggle-customer-bookings')
    expect(reactSpecs).toContain('react-edit-booking-button')
    expect(reactSpecs).toContain('react-save-booking-draft')
    expect(reactSpecs).not.toContain('../support/adminWorkflows')
    expect(reactSpecs).not.toContain('[data-cy=')
  })

  it('keeps React default Cypress replacement coverage present', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(fs.existsSync(specPath)).toBe(true)
    expect(spec).toContain("cy.visit('/')")
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

  it('keeps React Cypress isolated from retired pre-React discovery', () => {
    const retiredSpecDir = path.join(projectRoot, 'cypress/e2e')
    const reactSpecPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')

    expect(fs.existsSync(retiredSpecDir)).toBe(false)
    expect(fs.existsSync(reactSpecPath)).toBe(true)
  })

  it('keeps React Cypress delete confirmation deterministic through React panels', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain("cy.getByTestId('react-fleet-delete-confirmation-cancel')")
    expect(spec).toContain("cy.getByTestId('react-fleet-delete-confirmation-confirm')")
    expect(spec).toContain("cy.getByTestId('react-admin-delete-confirmation-confirm')")
    expect(spec).toContain("cy.getByTestId('react-sqa-reset-confirmation-confirm')")
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

  it('keeps React role switching test targeting the select control', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain('switches through React role dashboards using the actual demo user select')
    expect(spec).toContain("selectDemoUserByVisibleRole('Passenger')")
    expect(spec).toContain("selectDemoUserByVisibleRole('Group Leader')")
    expect(spec).toContain("selectDemoUserByVisibleRole('Admin')")
    expect(spec).not.toContain("cy.get('[data-testid=\"react-role-selector\"]').select")
  })

  it('keeps React group leader dashboard assertion aligned with normalized role view', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')
    const roleView = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/roleView.js'), 'utf8')

    expect(roleView).toContain("return 'group-leader'")
    expect(spec).toContain("cy.getByTestId('react-group-leader-dashboard').should('be.visible')")
    expect(spec).not.toContain("cy.getByTestId('react-group-dashboard')")
  })
})
