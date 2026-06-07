const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactCruiseLines, reactShips, visitReactAppAsAdmin, openFirstReactFleetShips } = require('./support/reactTestHelpers.js')

describe('React fleet error and confirmation coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('handles cruise line update validation without leaving edit mode', () => {
    cy.getByTestId(rs.fleetCard).first().within(() => {
      cy.getByTestId(rs.updateCruiseLineButton).click()
      cy.getByTestId(rs.editCruiseLineName).clear()
      cy.getByTestId(rs.saveCruiseLineEdit).click()
      cy.getByTestId(rs.cruiseLineEditForm).should('be.visible')
    })
    cy.getByTestId(rs.fleetActionMessage).should('contain.text', 'Cruise line name is required')
  })

  it('cancels cruise line editing and preserves original card content', () => {
    cy.getByTestId(rs.fleetCard).first().within(() => {
      cy.getByTestId(rs.updateCruiseLineButton).click()
      cy.getByTestId(rs.editCruiseLineName).clear().type('Temporary React Line')
      cy.getByTestId(rs.cancelCruiseLineEdit).click()
      cy.getByTestId(rs.cruiseLineEditForm).should('not.exist')
    })
    cy.getByTestId(rs.fleetCard).first().should('contain.text', reactCruiseLines[0].name)
    cy.getByTestId(rs.fleetActionMessage).should('contain.text', 'Cruise line update was cancelled')
  })

  it('surfaces cruise line update API failures', () => {
    cy.intercept('PATCH', `/cruise/cruise-line/${reactCruiseLines[0].id}`, { statusCode: 409, body: { message: 'Duplicate React line' } }).as('reactLineUpdateFailure')
    cy.getByTestId(rs.fleetCard).first().within(() => {
      cy.getByTestId(rs.updateCruiseLineButton).click()
      cy.getByTestId(rs.editCruiseLineName).clear().type('Duplicate React')
      cy.getByTestId(rs.saveCruiseLineEdit).click()
    })
    cy.wait('@reactLineUpdateFailure')
    cy.getByTestId(rs.fleetActionMessage).should('contain.text', 'Duplicate React line')
  })

  it('cancels fleet delete through the native React confirmation panel', () => {
    cy.getByTestId(rs.fleetCard).first().within(() => {
      cy.getByTestId(rs.deleteCruiseLineButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', reactCruiseLines[0].name)
    cy.getByTestId(rs.fleetDeleteConfirmationCancel).click()
    cy.getByTestId(rs.fleetDeleteConfirmation).should('not.exist')
    cy.getByTestId(rs.fleetActionMessage).should('contain.text', 'Delete action was cancelled')
  })

  it('surfaces fleet delete API failures without removing the card', () => {
    cy.intercept('DELETE', `/cruise/cruise-line/${reactCruiseLines[0].id}`, { statusCode: 500, body: { message: 'Delete blocked' } }).as('reactLineDeleteFailure')
    cy.getByTestId(rs.fleetCard).first().within(() => {
      cy.getByTestId(rs.deleteCruiseLineButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).click()
    cy.wait('@reactLineDeleteFailure')
    cy.getByTestId(rs.fleetActionMessage).should('contain.text', 'Delete blocked')
    cy.getByTestId(rs.fleetCard).first().should('contain.text', reactCruiseLines[0].name)
  })

  it('blocks blank ship creation before API submission', () => {
    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship').as('blankShipShouldNotSave')
    cy.getByTestId(rs.createShipSubmitButton).click()
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'Ship name is required')
    cy.get('@blankShipShouldNotSave.all').should('have.length', 0)
  })

  it('shows ship create API failures and keeps the selected fleet panel visible', () => {
    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship', { statusCode: 500, body: { message: 'Ship create failed' } }).as('reactShipCreateFailure')
    cy.getByTestId(rs.createShipNameInput).type('React Broken Ship')
    cy.getByTestId(rs.createShipSubmitButton).click()
    cy.wait('@reactShipCreateFailure')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'Ship create failed')
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'Royal Caribbean International ships')
  })

  it('cancels and confirms ship delete using React confirmation controls', () => {
    openFirstReactFleetShips()
    cy.getByTestId(rs.shipCard).first().within(() => {
      cy.getByTestId(rs.deleteShipButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmationCancel).click()
    cy.getByTestId(rs.fleetActionMessage).should('contain.text', 'Delete action was cancelled')

    cy.intercept('DELETE', `/cruise/ship/${reactShips[0].id}`, { statusCode: 200, body: { deleted: true } }).as('deleteReactShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [reactShips[1]]).as('reloadShipsAfterDelete')
    cy.getByTestId(rs.shipCard).first().within(() => {
      cy.getByTestId(rs.deleteShipButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).click()
    cy.wait('@deleteReactShip')
    cy.wait('@reloadShipsAfterDelete')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'deleted')
  })
})
