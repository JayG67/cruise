const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactCruiseLines, visitReactAppAsAdmin, selectDemoUserByVisibleRole, openFirstReactFleetShips } = require('./support/reactTestHelpers.js')

describe('React lifecycle and state isolation coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('keeps data refresh behavior inside active workflow actions without leaving the root route', () => {
    cy.intercept('GET', '/cruise/customers').as('refreshCustomers')
    cy.intercept('GET', '/cruise/bookings').as('refreshBookings')

    cy.getByTestId(rs.sqaResetDemoDataButton).click()
    cy.getByTestId(rs.sqaResetConfirmationCancel).click()
    cy.location('pathname').should('eq', '/')
    cy.getByTestId(rs.queryStatusPanel).should('not.exist')
  })

  it('keeps admin fleet search independent from hierarchy search', () => {
    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.hierarchySearchInput).type('Alisa')
    cy.getByTestId(rs.fleetSearch).type('Royal')

    cy.getByTestId(rs.customerWorkflowTable).should('contain.text', 'Alisa')
    cy.getByTestId(rs.fleetCard).should('have.length', 1)
    cy.getByTestId(rs.fleetCard).first().should('contain.text', 'Royal Caribbean International')
  })

  it('keeps create workflow state independent from fleet edit state', () => {
    cy.getByTestId(rs.createCruiseLineName).type('Unsaved Create Line')
    cy.getByTestId(rs.updateCruiseLineButton).first().click()
    cy.getByTestId(rs.cruiseLineEditForm).should('be.visible')
    cy.getByTestId(rs.createCruiseLineName).should('have.value', 'Unsaved Create Line')
    cy.getByTestId(rs.cancelCruiseLineEdit).click()
    cy.getByTestId(rs.createCruiseLineName).should('have.value', 'Unsaved Create Line')
  })

  it('resets create workflow without clearing loaded fleet records', () => {
    cy.getByTestId(rs.createCruiseLineName).type('Temporary Create Line')
    cy.getByTestId(rs.createCruiseLineCountry).type('United States')
    cy.getByTestId(rs.resetCruiseLine).click()
    cy.getByTestId(rs.createCruiseLineName).should('have.value', '')
    cy.getByTestId(rs.fleetCard).should('have.length', reactCruiseLines.length)
  })

  it('removes admin-only panels when passenger mode is selected and restores them on admin', () => {
    openFirstReactFleetShips()
    cy.getByTestId(rs.selectedShipsPanel).should('be.visible')

    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.selectedShipsPanel).should('not.exist')
    cy.getByTestId(rs.createCruiseLineWorkflow).should('not.exist')

    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId(rs.createCruiseLineWorkflow).should('be.visible')
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
  })

  it('does not preserve destructive confirmation when switching roles', () => {
    cy.getByTestId(rs.fleetCard).first().within(() => {
      cy.getByTestId(rs.deleteCruiseLineButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmation).should('be.visible')
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.fleetDeleteConfirmation).should('not.exist')
  })

  it('keeps role details independent across passenger and group leader selections', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Passenger')
    cy.getByTestId(rs.passengerDashboard).should('contain.text', 'Jay Gallagher')

    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId(rs.demoUserSummary).should('contain.text', 'Group Leader')
    cy.getByTestId(rs.groupLeaderDashboard).should('contain.text', 'Morgan Leader')
    cy.getByTestId(rs.groupLeaderDashboard).should('contain.text', 'Jay Gallagher')
  })

  it('keeps favorites-only state scoped to the selected role session', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.roleBookingDetailsToggle).first().click()
    cy.getByTestId(rs.roleFavoritesOnlyToggle).first().click()
    cy.getByTestId(rs.roleNoFavoriteItinerary).should('be.visible')

    selectDemoUserByVisibleRole('Admin')
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId(rs.roleBookingDetailsToggle).first().click()
    cy.getByTestId(rs.roleItineraryDay).should('have.length.at.least', 1)
  })

  it('keeps quality console available after admin data refreshes', () => {
    cy.getByTestId(rs.workspaceQualityButton).click()
    cy.getByTestId(rs.sqaConsole).should('be.visible')
    cy.getByTestId(rs.sqaHealthButton).click()
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('keeps retired rollback and implementation-history panels out of the product hero', () => {
    cy.get('a[href="/retired"]').should('not.exist')
    cy.getByTestId(rs.releaseReadinessSection).should('not.exist')
    cy.getByTestId(rs.retiredRouteNav).should('not.exist')
  })
})
