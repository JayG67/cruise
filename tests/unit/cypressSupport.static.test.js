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

    expect(reactSpecs).toContain('rs.toggleCustomerWorkflows')
    expect(reactSpecs).toContain('rs.toggleCustomerBookings')
    expect(reactSpecs).toContain('rs.editBookingButton')
    expect(reactSpecs).toContain('rs.saveBookingDraft')
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
    expect(spec).toContain('rs.sqaHealthButton')
  })

  it('keeps React Cypress spec self-contained without testing-library commands', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain("cy.getByTestId(rs.")
    expect(spec).toContain('reactSelectorKeys: rs')
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

    expect(spec).toContain('rs.fleetDeleteConfirmationCancel')
    expect(spec).toContain('rs.fleetDeleteConfirmationConfirm')
    expect(spec).toContain('rs.adminDeleteConfirmationConfirm')
    expect(spec).toContain('rs.sqaResetConfirmationConfirm')
    expect(spec).not.toContain("cy.on('window:confirm', () => true)")
  })

  it('keeps React Cypress specs starting from an admin baseline', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain('function visitReactAppAsAdmin')
    expect(spec).toContain('visitReactAppAsAdmin()')
    expect(spec).toContain("selectDemoUserByVisibleRole('Admin')")
    expect(spec).toContain("cy.getByTestId(rs.activeRouteOperations).should('be.visible')")
  })

  it('keeps React role switching test targeting the select control', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain('switches through React role dashboards using the actual demo user select')
    expect(spec).toContain("selectDemoUserByVisibleRole('Passenger')")
    expect(spec).toContain("selectDemoUserByVisibleRole('Group Leader')")
    expect(spec).toContain("selectDemoUserByVisibleRole('Admin')")
    expect(spec).not.toContain("cy.get('[data-testid=")
  })

  it('keeps React group leader dashboard assertion aligned with normalized role view', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')
    const roleView = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/roleView.js'), 'utf8')

    expect(roleView).toContain("return 'group-leader'")
    expect(spec).toContain("cy.getByTestId(rs.groupLeaderDashboard).should('be.visible')")
    expect(spec).not.toContain('react-group-dashboard')
  })


  it('keeps React Cypress selectors centralized behind one authoritative selector map', () => {
    const selectorMapPath = path.join(projectRoot, 'cypress/react/support/reactSelectors.js')
    const duplicateSelectorMapPath = path.join(projectRoot, 'cypress/react/reactSelectors.js')
    const helperPath = path.join(projectRoot, 'cypress/react/support/reactTestHelpers.js')
    const selectorMap = fs.readFileSync(selectorMapPath, 'utf8')
    const helper = fs.readFileSync(helperPath, 'utf8')

    expect(fs.existsSync(selectorMapPath)).toBe(true)
    expect(fs.existsSync(duplicateSelectorMapPath)).toBe(false)
    expect(selectorMap).toContain('const reactSelectors = Object.freeze')
    expect(selectorMap).toContain('const reactSelectorKeys = Object.freeze')
    expect(helper).toContain("Cypress.Commands.add('getByTestId', selectorKey => cy.get(byTestId(selectorKey)))")
  })

  it('keeps React Cypress specs free of hard-coded data-testid selectors', () => {
    const reactSpecDir = path.join(projectRoot, 'cypress/react')
    const specFiles = fs.readdirSync(reactSpecDir)
      .filter(file => file.endsWith('.cy.js'))
      .map(file => path.join(reactSpecDir, file))

    for (const specPath of specFiles) {
      const spec = fs.readFileSync(specPath, 'utf8')

      expect(spec).not.toMatch(/cy\.getByTestId\(['"]/)
      expect(spec).not.toContain('[data-testid')
      expect(spec).toContain('reactSelectorKeys: rs')
    }
  })

  it('keeps long-form Cypress lifecycle architecture in place for soup-to-nuts turnaround testing', () => {
    const lifecycleSpecPath = path.join(projectRoot, 'cypress/react/reactTurnaroundLifecycleGoal.cy.js')
    const lifecycleSpec = fs.readFileSync(lifecycleSpecPath, 'utf8')
    const testingArchitecture = fs.readFileSync(path.join(projectRoot, 'docs/testing-architecture.md'), 'utf8')

    expect(fs.existsSync(lifecycleSpecPath)).toBe(true)
    expect(lifecycleSpec).toContain('Turnaround lifecycle soup-to-nuts Cypress architecture')
    expect(lifecycleSpec).toContain('walks the deepest current admin-to-turnaround role lifecycle')
    expect(lifecycleSpec).toContain("selectDemoUserByVisibleRole('Turnaround Manager')")
    expect(lifecycleSpec).toContain("selectDemoUserByVisibleRole('Engineering Lead', 'David Torres')")
    expect(lifecycleSpec).toContain('Turnaround task created successfully')
    expect(lifecycleSpec).toContain('Turnaround staffing plan updated successfully')
    expect(testingArchitecture).toContain('Full lifecycle workflows')
    expect(testingArchitecture).toContain('Branch workflows')
    expect(testingArchitecture).toContain('Do not use mobile Playwright as the primary owner of long CRUD lifecycle coverage')
  })

})
