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


  it('keeps every React Cypress rs selector reference registered in the selector map', () => {
    const selectorMapPath = path.join(projectRoot, 'cypress/react/support/reactSelectors.js')
    const { reactSelectors } = require(selectorMapPath)
    const reactSpecDir = path.join(projectRoot, 'cypress/react')
    const specFiles = fs.readdirSync(reactSpecDir)
      .filter(file => file.endsWith('.cy.js'))
      .map(file => path.join(reactSpecDir, file))
    const referencedKeys = new Set()

    for (const specPath of specFiles) {
      const spec = fs.readFileSync(specPath, 'utf8')
      for (const match of spec.matchAll(/(?:getByTestId|getReactSelector)\(rs\.([A-Za-z0-9_]+)/g)) {
        referencedKeys.add(match[1])
      }
    }

    const missingKeys = [...referencedKeys].filter(key => !Object.prototype.hasOwnProperty.call(reactSelectors, key)).sort()

    expect(missingKeys).toEqual([])
    expect(reactSelectors.employerDemoCommandCenter).toBe('react-employer-demo-command-center')
  })

  it('resolves registered React selectors and rejects unknown selector keys', () => {
    const selectorMapPath = path.join(projectRoot, 'cypress/react/support/reactSelectors.js')
    const { reactSelectors, reactSelectorKeys, testId, byTestId } = require(selectorMapPath)

    expect(testId('employerDemoCommandCenter')).toBe(reactSelectors.employerDemoCommandCenter)
    expect(byTestId('employerDemoCommandCenter')).toBe(`[data-testid="${reactSelectors.employerDemoCommandCenter}"]`)
    expect(reactSelectorKeys.employerDemoCommandCenter).toBe('employerDemoCommandCenter')
    expect(Object.isFrozen(reactSelectors)).toBe(true)
    expect(Object.isFrozen(reactSelectorKeys)).toBe(true)
    expect(() => testId('missingSelectorKey')).toThrow('Unknown React selector key: missingSelectorKey')
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

    expect(fs.existsSync(lifecycleSpecPath)).toBe(true)
    expect(lifecycleSpec).toContain('Turnaround lifecycle soup-to-nuts Cypress architecture')
    expect(lifecycleSpec).toContain('walks the deepest current admin-to-turnaround role lifecycle')
    expect(lifecycleSpec).toContain("selectDemoUserByVisibleRole('Turnaround Manager')")
    expect(lifecycleSpec).toContain("selectDemoUserByVisibleRole('Engineering Lead', 'David Torres')")
    expect(lifecycleSpec).toContain('Turnaround task created successfully')
    expect(lifecycleSpec).toContain('Turnaround staffing plan updated successfully')
    const helper = fs.readFileSync(path.join(projectRoot, 'cypress/react/support/reactTestHelpers.js'), 'utf8')
    expect(helper).toContain('function buildReactTurnaroundLifecycleState')
    expect(helper).toContain('function buildReactTurnaroundPresentationGuide')
    expect(helper).toContain('function buildReactTurnaroundCommandCenter')
    expect(helper).toContain('function buildReactTurnaroundContinuityCenter')
    expect(helper).toContain('function buildReactTurnaroundShiftBriefing')
    expect(helper).toContain('hydrateReactTurnaroundOperations')
    expect(helper).toContain('lifecycleState')
    expect(helper).toContain('lifecycleState: buildReactTurnaroundLifecycleState(operation)')
    expect(helper).toContain('presentationGuide: buildReactTurnaroundPresentationGuide(operation)')
    expect(helper).toContain('commandCenter: operation.commandCenter || buildReactTurnaroundCommandCenter(operation)')
    expect(helper).toContain('continuityCenter: operation.continuityCenter || buildReactTurnaroundContinuityCenter(operation)')
    expect(helper).toContain('shiftBriefing: operation.shiftBriefing || buildReactTurnaroundShiftBriefing(operation)')
    expect(helper).not.toContain('lifecycleState: operation.lifecycleState || buildReactTurnaroundLifecycleState(operation)')
    expect(lifecycleSpec).toContain('operationsCommandCenter')
    expect(lifecycleSpec).toContain('operationsCommandCenterKpis')
    expect(lifecycleSpec).toContain('operationsCommandCenterCriticalPath')
    expect(lifecycleSpec).toContain('operationsShiftBriefing')
    expect(lifecycleSpec).toContain('operationsShiftBriefingCriticalItems')
    expect(lifecycleSpec).toContain('operationsLifecyclePhaseAction')
    expect(lifecycleSpec).toContain('operationsLifecycleNextActionButton')
  })


  it('keeps portfolio soup-to-nuts Cypress coverage present for employer-demo workflows', () => {
    const portfolioSpecPath = path.join(projectRoot, 'cypress/react/reactPortfolioSoupToNuts.cy.js')
    const portfolioSpec = fs.readFileSync(portfolioSpecPath, 'utf8')

    expect(fs.existsSync(portfolioSpecPath)).toBe(true)
    expect(portfolioSpec).toContain('Portfolio soup-to-nuts workflow journeys')
    expect(portfolioSpec).toContain('walks the employer demo runway through every live application workspace')
    expect(portfolioSpec).toContain('completes an admin data setup journey from cruise line to ship, sailing, and itinerary proof')
    expect(portfolioSpec).toContain('completes passenger self-service booking from search to verified booking card, then proves group visibility')
    expect(portfolioSpec).toContain('drives turnaround operations from admin setup through role execution and readiness evidence')
    expect(portfolioSpec).toContain('finishes with quality, reset, and release-readiness evidence available from the same product surface')
    expect(portfolioSpec).toContain("selectDemoUserByVisibleRole('Passenger')")
    expect(portfolioSpec).toContain("selectDemoUserByVisibleRole('Group Leader')")
    expect(portfolioSpec).toContain("selectDemoUserByVisibleRole('Turnaround Manager')")
    expect(portfolioSpec).toContain("selectDemoUserByVisibleRole('Housekeeping Lead', 'Maria Rodriguez')")
    expect(portfolioSpec).toContain("selectDemoUserByVisibleRole('Engineering Lead', 'David Torres')")
    expect(portfolioSpec).toContain('cy.intercept')
    expect(portfolioSpec).toContain('cy.wait')
  })


  it('keeps turnaround command center selectors registered for Cypress coverage', () => {
    const selectors = fs.readFileSync(path.join(projectRoot, 'cypress/react/support/reactSelectors.js'), 'utf8')

    expect(selectors).toContain("operationsCommandCenter: 'react-operations-command-center'")
    expect(selectors).toContain("operationsCommandCenterDecisions: 'react-operations-command-center-decisions'")
    expect(selectors).toContain("operationsCommandCenterCriticalPath: 'react-operations-command-center-critical-path'")
    expect(selectors).toContain("operationsCommandCenterDepartments: 'react-operations-command-center-departments'")
    expect(selectors).toContain("operationsContinuityCenter: 'react-operations-continuity-center'")
    expect(selectors).toContain("operationsContinuityScenarios: 'react-operations-continuity-scenarios'")
    expect(selectors).toContain("operationsContinuityRunbook: 'react-operations-continuity-runbook'")
    expect(selectors).toContain("operationsContinuityDepartments: 'react-operations-continuity-departments'")
    expect(selectors).toContain("operationsContinuityWatchlist: 'react-operations-continuity-watchlist'")
    expect(selectors).toContain("operationsShiftBriefing: 'react-operations-shift-briefing'")
    expect(selectors).toContain("operationsShiftBriefingCriticalItems: 'react-operations-shift-briefing-critical-items'")
    expect(selectors).toContain("operationsShiftBriefingDepartments: 'react-operations-shift-briefing-departments'")
  })

})
