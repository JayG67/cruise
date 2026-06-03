const { reactCruiseLines, reactShips, visitReactAppAsAdmin, openFirstReactFleetShips } = require('./support/reactTestHelpers.js')

describe('React fleet error and confirmation coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('handles cruise line update validation without leaving edit mode', () => {
    cy.getByTestId('react-fleet-card').first().within(() => {
      cy.getByTestId('react-update-cruise-line-button').click()
      cy.getByTestId('react-edit-cruise-line-name').clear()
      cy.getByTestId('react-save-cruise-line-edit').click()
      cy.getByTestId('react-cruise-line-edit-form').should('be.visible')
    })
    cy.getByTestId('react-fleet-action-message').should('contain.text', 'Cruise line name is required')
  })

  it('cancels cruise line editing and preserves original card content', () => {
    cy.getByTestId('react-fleet-card').first().within(() => {
      cy.getByTestId('react-update-cruise-line-button').click()
      cy.getByTestId('react-edit-cruise-line-name').clear().type('Temporary React Line')
      cy.getByTestId('react-cancel-cruise-line-edit').click()
      cy.getByTestId('react-cruise-line-edit-form').should('not.exist')
    })
    cy.getByTestId('react-fleet-card').first().should('contain.text', reactCruiseLines[0].name)
    cy.getByTestId('react-fleet-action-message').should('contain.text', 'Cruise line update was cancelled')
  })

  it('surfaces cruise line update API failures', () => {
    cy.intercept('PATCH', `/cruise/cruise-line/${reactCruiseLines[0].id}`, { statusCode: 409, body: { message: 'Duplicate React line' } }).as('reactLineUpdateFailure')
    cy.getByTestId('react-fleet-card').first().within(() => {
      cy.getByTestId('react-update-cruise-line-button').click()
      cy.getByTestId('react-edit-cruise-line-name').clear().type('Duplicate React')
      cy.getByTestId('react-save-cruise-line-edit').click()
    })
    cy.wait('@reactLineUpdateFailure')
    cy.getByTestId('react-fleet-action-message').should('contain.text', 'Duplicate React line')
  })

  it('cancels fleet delete through the native React confirmation panel', () => {
    cy.getByTestId('react-fleet-card').first().within(() => {
      cy.getByTestId('react-delete-cruise-line-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', reactCruiseLines[0].name)
    cy.getByTestId('react-fleet-delete-confirmation-cancel').click()
    cy.getByTestId('react-fleet-delete-confirmation').should('not.exist')
    cy.getByTestId('react-fleet-action-message').should('contain.text', 'Delete action was cancelled')
  })

  it('surfaces fleet delete API failures without removing the card', () => {
    cy.intercept('DELETE', `/cruise/cruise-line/${reactCruiseLines[0].id}`, { statusCode: 500, body: { message: 'Delete blocked' } }).as('reactLineDeleteFailure')
    cy.getByTestId('react-fleet-card').first().within(() => {
      cy.getByTestId('react-delete-cruise-line-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation-confirm').click()
    cy.wait('@reactLineDeleteFailure')
    cy.getByTestId('react-fleet-action-message').should('contain.text', 'Delete blocked')
    cy.getByTestId('react-fleet-card').first().should('contain.text', reactCruiseLines[0].name)
  })

  it('blocks blank ship creation before API submission', () => {
    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship').as('blankShipShouldNotSave')
    cy.getByTestId('react-create-ship-submit-button').click()
    cy.getByTestId('react-ship-action-message').should('contain.text', 'Ship name is required')
    cy.get('@blankShipShouldNotSave.all').should('have.length', 0)
  })

  it('shows ship create API failures and keeps the selected fleet panel visible', () => {
    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship', { statusCode: 500, body: { message: 'Ship create failed' } }).as('reactShipCreateFailure')
    cy.getByTestId('react-create-ship-name-input').type('React Broken Ship')
    cy.getByTestId('react-create-ship-submit-button').click()
    cy.wait('@reactShipCreateFailure')
    cy.getByTestId('react-ship-action-message').should('contain.text', 'Ship create failed')
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'Royal Caribbean International ships')
  })

  it('cancels and confirms ship delete using React confirmation controls', () => {
    openFirstReactFleetShips()
    cy.getByTestId('react-ship-card').first().within(() => {
      cy.getByTestId('react-delete-ship-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation-cancel').click()
    cy.getByTestId('react-fleet-action-message').should('contain.text', 'Delete action was cancelled')

    cy.intercept('DELETE', `/cruise/ship/${reactShips[0].id}`, { statusCode: 200, body: { deleted: true } }).as('deleteReactShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [reactShips[1]]).as('reloadShipsAfterDelete')
    cy.getByTestId('react-ship-card').first().within(() => {
      cy.getByTestId('react-delete-ship-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation-confirm').click()
    cy.wait('@deleteReactShip')
    cy.wait('@reloadShipsAfterDelete')
    cy.getByTestId('react-ship-action-message').should('contain.text', 'deleted')
  })
})
