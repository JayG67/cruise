const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { openFirstReactFleetShips, reactCruiseLines, reactShips, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React ship lookup and CRUD coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('keeps the selected ships panel in its initial empty guidance state', () => {
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'Select a cruise line to view ships')
    cy.getByTestId(rs.shipCard).should('not.exist')
  })

  it('loads ships for the selected cruise line', () => {
    openFirstReactFleetShips()
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'Royal Caribbean International ships')
    cy.getByTestId(rs.selectedShipsCount).should('contain.text', '2 ships')
    cy.getByTestId(rs.shipCard).first().should('contain.text', 'React Icon').and('contain.text', 'Miami')
  })

  it('renders an empty state when a cruise line has no ships', () => {
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[1].id}`, []).as('reactEmptyShips')
    cy.getByTestId(rs.fleetCard).eq(1).within(() => {
      cy.getByTestId(rs.viewShipsButton).click()
    })
    cy.wait('@reactEmptyShips')
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'No ships are currently listed')
  })

  it('surfaces ship API failures without clearing the selected fleet title', () => {
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, {
      statusCode: 500,
      body: { message: 'React ships unavailable' }
    }).as('reactShipsFailure')
    cy.getByTestId(rs.fleetCard).first().within(() => {
      cy.getByTestId(rs.viewShipsButton).click()
    })
    cy.wait('@reactShipsFailure')
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'Royal Caribbean International ships')
    cy.contains('React ships unavailable').should('be.visible')
  })

  it('creates a ship from the selected fleet panel', () => {
    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body).to.include({
        cruiseLineId: reactCruiseLines[0].id,
        name: 'React Wonder',
        currentPort: 'Tampa, Florida'
      })
      req.reply({ statusCode: 201, body: { id: 'ship-react-wonder', ...req.body } })
    }).as('createReactShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [...reactShips, { id: 'ship-react-wonder', name: 'React Wonder', currentPort: 'Tampa, Florida' }]).as('reloadReactShips')

    cy.getByTestId(rs.createShipNameInput).type('React Wonder')
    cy.getByTestId(rs.createShipCurrentPortInput).type('Tampa, Florida')
    cy.getByTestId(rs.createShipSubmitButton).click()
    cy.wait('@createReactShip')
    cy.wait('@reloadReactShips')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'React Wonder')
  })

  it('updates and cancels ship edits through controlled React forms', () => {
    openFirstReactFleetShips()
    cy.getByTestId(rs.shipCard).first().within(() => {
      cy.getByTestId(rs.updateShipButton).click()
      cy.getByTestId(rs.shipEditForm).should('be.visible')
      cy.getByTestId(rs.editShipCurrentPort).clear().type('Updated Port')
      cy.getByTestId(rs.cancelShipEdit).click()
      cy.getByTestId(rs.shipEditForm).should('not.exist')
    })

    cy.intercept('PATCH', `/cruise/ship/${reactShips[0].id}`, req => {
      expect(req.body).to.include({ name: 'React Icon Plus', currentPort: 'Updated Port' })
      req.reply({ statusCode: 200, body: { ...reactShips[0], ...req.body } })
    }).as('updateReactShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [{ ...reactShips[0], name: 'React Icon Plus', currentPort: 'Updated Port' }, reactShips[1]]).as('reloadUpdatedReactShips')

    cy.getByTestId(rs.shipCard).first().within(() => {
      cy.getByTestId(rs.updateShipButton).click()
      cy.getByTestId(rs.editShipName).clear().type('React Icon Plus')
      cy.getByTestId(rs.editShipCurrentPort).clear().type('Updated Port')
      cy.getByTestId(rs.saveShipEdit).click()
    })
    cy.wait('@updateReactShip')
    cy.wait('@reloadUpdatedReactShips')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'React Icon Plus')
  })


  it('blocks blank ship creation before sending a network request', () => {
    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship').as('shipCreateShouldNotRun')
    cy.getByTestId(rs.createShipSubmitButton).click()
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'Ship name is required')
    cy.get('@shipCreateShouldNotRun.all').should('have.length', 0)
  })

  it('trims ship create values before submitting the API payload', () => {
    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship', req => {
      expect(req.body).to.include({
        cruiseLineId: reactCruiseLines[0].id,
        name: 'Trimmed Ship',
        currentPort: 'Seattle, Washington'
      })
      req.reply({ statusCode: 201, body: { id: 'ship-trimmed', ...req.body } })
    }).as('createTrimmedShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [...reactShips, {
      id: 'ship-trimmed',
      cruiseLineId: reactCruiseLines[0].id,
      name: 'Trimmed Ship',
      currentPort: 'Seattle, Washington'
    }]).as('reloadTrimmedShips')

    cy.getByTestId(rs.createShipNameInput).type('  Trimmed Ship  ')
    cy.getByTestId(rs.createShipCurrentPortInput).type('  Seattle, Washington  ')
    cy.getByTestId(rs.createShipSubmitButton).click()
    cy.wait('@createTrimmedShip')
    cy.wait('@reloadTrimmedShips')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', 'Trimmed Ship was added')
  })

  it('cancels ship deletion without calling the API', () => {
    openFirstReactFleetShips()
    cy.intercept('DELETE', `/cruise/ship/${reactShips[0].id}`).as('shipDeleteShouldNotRun')
    cy.getByTestId(rs.shipCard).first().within(() => {
      cy.getByTestId(rs.deleteShipButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', reactShips[0].name)
    cy.getByTestId(rs.fleetDeleteConfirmationCancel).click()
    cy.get('@shipDeleteShouldNotRun.all').should('have.length', 0)
    cy.getByTestId(rs.shipCard).first().should('contain.text', reactShips[0].name)
  })

  it('confirms ship deletion and refreshes the selected fleet panel', () => {
    openFirstReactFleetShips()
    cy.intercept('DELETE', `/cruise/ship/${reactShips[0].id}`, {
      statusCode: 200,
      body: { message: 'Ship deleted successfully' }
    }).as('deleteReactShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [reactShips[1]]).as('reloadShipsAfterDelete')

    cy.getByTestId(rs.shipCard).first().within(() => {
      cy.getByTestId(rs.deleteShipButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).click()
    cy.wait('@deleteReactShip')
    cy.wait('@reloadShipsAfterDelete')
    cy.getByTestId(rs.shipActionMessage).should('contain.text', `${reactShips[0].name} was deleted`)
    cy.getByTestId(rs.shipCard).should('have.length', 1).and('contain.text', reactShips[1].name)
  })
})
