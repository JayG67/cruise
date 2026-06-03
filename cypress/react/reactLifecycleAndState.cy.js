const { reactCruiseLines, visitReactAppAsAdmin, selectDemoUserByVisibleRole, openFirstReactFleetShips } = require('./support/reactTestHelpers.js')

describe('React lifecycle and state isolation parity expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('refreshes query data without leaving the production root route', () => {
    cy.intercept('GET', '/cruise/customers').as('refreshCustomers')
    cy.intercept('GET', '/cruise/bookings').as('refreshBookings')

    cy.getByTestId('react-refresh-query').click()
    cy.wait('@refreshCustomers')
    cy.wait('@refreshBookings')
    cy.location('pathname').should('eq', '/')
    cy.getByTestId('react-query-status-message').should('contain.text', 'Loaded')
  })

  it('keeps admin fleet search independent from hierarchy search', () => {
    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-hierarchy-search-input').type('Alisa')
    cy.getByTestId('react-fleet-search').type('Royal')

    cy.getByTestId('react-customer-workflow-table').should('contain.text', 'Alisa')
    cy.getByTestId('react-fleet-card').should('have.length', 1)
    cy.getByTestId('react-fleet-card').first().should('contain.text', 'Royal Caribbean International')
  })

  it('keeps create workflow state independent from fleet edit state', () => {
    cy.getByTestId('react-create-cruise-line-name').type('Unsaved Create Line')
    cy.getByTestId('react-update-cruise-line-button').first().click()
    cy.getByTestId('react-cruise-line-edit-form').should('be.visible')
    cy.getByTestId('react-create-cruise-line-name').should('have.value', 'Unsaved Create Line')
    cy.getByTestId('react-cancel-cruise-line-edit').click()
    cy.getByTestId('react-create-cruise-line-name').should('have.value', 'Unsaved Create Line')
  })

  it('resets create workflow without clearing loaded fleet records', () => {
    cy.getByTestId('react-create-cruise-line-name').type('Temporary Create Line')
    cy.getByTestId('react-create-cruise-line-country').type('United States')
    cy.getByTestId('react-reset-cruise-line').click()
    cy.getByTestId('react-create-cruise-line-name').should('have.value', '')
    cy.getByTestId('react-fleet-card').should('have.length', reactCruiseLines.length)
  })

  it('removes admin-only panels when passenger mode is selected and restores them on admin', () => {
    openFirstReactFleetShips()
    cy.getByTestId('react-selected-ships-panel').should('be.visible')

    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-selected-ships-panel').should('not.exist')
    cy.getByTestId('react-create-cruise-line-workflow').should('not.exist')

    selectDemoUserByVisibleRole('Admin')
    cy.getByTestId('react-create-cruise-line-workflow').should('be.visible')
    cy.getByTestId('react-fleet-directory').should('be.visible')
  })

  it('does not preserve destructive confirmation when switching roles', () => {
    cy.getByTestId('react-fleet-card').first().within(() => {
      cy.getByTestId('react-delete-cruise-line-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation').should('be.visible')
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-fleet-delete-confirmation').should('not.exist')
  })

  it('keeps role details independent across passenger and group leader selections', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-demo-user-summary').should('contain.text', 'Passenger')
    cy.getByTestId('react-passenger-dashboard').should('contain.text', 'Jay Gallagher')

    selectDemoUserByVisibleRole('Group Leader')
    cy.getByTestId('react-demo-user-summary').should('contain.text', 'Group Leader')
    cy.getByTestId('react-group-leader-dashboard').should('contain.text', 'Morgan Leader')
    cy.getByTestId('react-group-leader-dashboard').should('contain.text', 'Jay Gallagher')
  })

  it('keeps favorites-only state scoped to the selected role session', () => {
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-role-booking-details-toggle').first().click()
    cy.getByTestId('react-role-favorites-only-toggle').first().click()
    cy.getByTestId('react-role-no-favorite-itinerary').should('be.visible')

    selectDemoUserByVisibleRole('Admin')
    selectDemoUserByVisibleRole('Passenger')
    cy.getByTestId('react-role-booking-details-toggle').first().click()
    cy.getByTestId('react-role-itinerary-day').should('have.length.at.least', 1)
  })

  it('keeps quality console available after admin data refreshes', () => {
    cy.getByTestId('react-workspace-quality-button').click()
    cy.getByTestId('react-sqa-console').should('be.visible')
    cy.getByTestId('react-refresh-query').click()
    cy.getByTestId('react-sqa-console').should('be.visible')
  })

  it('keeps legacy rollback and migration panels out of the product hero', () => {
    cy.get('a[href="/legacy"]').should('not.exist')
    cy.getByTestId('react-release-readiness-section').should('not.exist')
    cy.getByTestId('react-migration-route-nav').should('not.exist')
  })
})
