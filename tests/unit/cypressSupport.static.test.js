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
    expect(spec).toContain('rs.operationsIntelligenceRefreshButton')
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


  it('keeps the umbrella React app journey isolated from CI database timing', () => {
    const specPath = path.join(projectRoot, 'cypress/react/reactApp.cy.js')
    const spec = fs.readFileSync(specPath, 'utf8')

    expect(spec).toContain('interceptReactCoreApis({')
    expect(spec).toContain('...reactCruiseLines')
    expect(spec).toContain("cy.intercept('GET', '/cruise/ships/*', reactShips).as('reactAppShips')")
    expect(spec).toContain("cy.wait('@reactAppShips')")
    expect(spec).toContain("cy.intercept('GET', '/cruise', req => {")
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
    const roleView = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/domain/roleIdentity.js'), 'utf8')

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
    expect(reactSelectors.platformOverviewCommandCenter).toBe('react-platform-overview-command-center')
  })

  it('resolves registered React selectors and rejects unknown selector keys', () => {
    const selectorMapPath = path.join(projectRoot, 'cypress/react/support/reactSelectors.js')
    const { reactSelectors, reactSelectorKeys, testId, byTestId } = require(selectorMapPath)

    expect(testId('platformOverviewCommandCenter')).toBe(reactSelectors.platformOverviewCommandCenter)
    expect(byTestId('platformOverviewCommandCenter')).toBe(`[data-testid="${reactSelectors.platformOverviewCommandCenter}"]`)
    expect(reactSelectorKeys.platformOverviewCommandCenter).toBe('platformOverviewCommandCenter')
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
    expect(helper).not.toContain('function buildReactTurnaroundPresentationGuide')
    expect(helper).toContain('function buildReactTurnaroundCommandCenter')
    expect(helper).toContain('function buildReactTurnaroundContinuityCenter')
    expect(helper).toContain('function buildReactTurnaroundShiftBriefing')
    expect(helper).toContain('hydrateReactTurnaroundOperations')
    expect(helper).toContain('lifecycleState')
    expect(helper).toContain('lifecycleState: buildReactTurnaroundLifecycleState(operation)')
    expect(helper).not.toContain('presentationGuide: buildReactTurnaroundPresentationGuide(operation)')
    expect(helper).toContain('commandCenter: operation.commandCenter || buildReactTurnaroundCommandCenter(operation)')
    expect(helper).toContain('continuityCenter: operation.continuityCenter || buildReactTurnaroundContinuityCenter(operation)')
    expect(helper).toContain('shiftBriefing: operation.shiftBriefing || buildReactTurnaroundShiftBriefing(operation)')
    expect(helper).not.toMatch(/five-minute employer demo|reviewer-ready proof|Close with employer value|portfolio-close/)
    expect(helper).not.toContain('lifecycleState: operation.lifecycleState || buildReactTurnaroundLifecycleState(operation)')
    expect(lifecycleSpec).toContain('operationsCommandCenter')
    expect(lifecycleSpec).toContain('operationsCommandCenterKpis')
    expect(lifecycleSpec).toContain('operationsCommandCenterCriticalPath')
    expect(lifecycleSpec).toContain('operationsShiftBriefing')
    expect(lifecycleSpec).toContain('operationsShiftBriefingCriticalItems')
    expect(lifecycleSpec).toContain('operationsLifecyclePhaseAction')
    expect(lifecycleSpec).toContain('operationsLifecycleNextActionButton')
  })


  it('keeps platform end-to-end Cypress coverage present for platform-workspace workflows', () => {
    const workflowSpecPath = path.join(projectRoot, 'cypress/react/reactPlatformWorkflows.cy.js')
    const workflowSpec = fs.readFileSync(workflowSpecPath, 'utf8')

    expect(fs.existsSync(workflowSpecPath)).toBe(true)
    expect(workflowSpec).toContain('Platform end-to-end workflow journeys')
    expect(workflowSpec).toContain('walks the platform workspace navigator through every live application workspace')
    expect(workflowSpec).toContain('completes an admin data setup journey from cruise line to ship, sailing, and itinerary proof')
    expect(workflowSpec).toContain('completes passenger self-service booking from search to verified booking card, then proves group visibility')
    expect(workflowSpec).toContain('drives turnaround operations from admin setup through role execution and readiness evidence')
    expect(workflowSpec).toContain('finishes with actionable intelligence and continues into the operational workflow')
    expect(workflowSpec).toContain("selectDemoUserByVisibleRole('Passenger')")
    expect(workflowSpec).toContain("selectDemoUserByVisibleRole('Group Leader')")
    expect(workflowSpec).toContain("selectDemoUserByVisibleRole('Turnaround Manager')")
    expect(workflowSpec).toContain("selectDemoUserByVisibleRole('Housekeeping Lead', 'Maria Rodriguez')")
    expect(workflowSpec).toContain("selectDemoUserByVisibleRole('Engineering Lead', 'David Torres')")
    expect(workflowSpec).toContain('cy.intercept')
    expect(workflowSpec).toContain('cy.wait')
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
