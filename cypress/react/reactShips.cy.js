const { openFirstReactFleetShips, reactCruiseLines, reactShips, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React ship lookup and CRUD coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('keeps the selected ships panel in its initial empty guidance state', () => {
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'Select a cruise line to view ships')
    cy.getByTestId('react-ship-card').should('not.exist')
  })

  it('loads ships for the selected cruise line', () => {
    openFirstReactFleetShips()
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'Royal Caribbean International ships')
    cy.getByTestId('react-selected-ships-count').should('contain.text', '2 ships')
    cy.getByTestId('react-ship-card').first().should('contain.text', 'React Icon').and('contain.text', 'Miami')
  })

  it('renders an empty state when a cruise line has no ships', () => {
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[1].id}`, []).as('reactEmptyShips')
    cy.getByTestId('react-fleet-card').eq(1).within(() => {
      cy.getByTestId('react-view-ships-button').click()
    })
    cy.wait('@reactEmptyShips')
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'No ships are currently listed')
  })

  it('surfaces ship API failures without clearing the selected fleet title', () => {
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, {
      statusCode: 500,
      body: { message: 'React ships unavailable' }
    }).as('reactShipsFailure')
    cy.getByTestId('react-fleet-card').first().within(() => {
      cy.getByTestId('react-view-ships-button').click()
    })
    cy.wait('@reactShipsFailure')
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'Royal Caribbean International ships')
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

    cy.getByTestId('react-create-ship-name-input').type('React Wonder')
    cy.getByTestId('react-create-ship-current-port-input').type('Tampa, Florida')
    cy.getByTestId('react-create-ship-submit-button').click()
    cy.wait('@createReactShip')
    cy.wait('@reloadReactShips')
    cy.getByTestId('react-ship-action-message').should('contain.text', 'React Wonder')
  })

  it('updates and cancels ship edits through controlled React forms', () => {
    openFirstReactFleetShips()
    cy.getByTestId('react-ship-card').first().within(() => {
      cy.getByTestId('react-update-ship-button').click()
      cy.getByTestId('react-ship-edit-form').should('be.visible')
      cy.getByTestId('react-edit-ship-current-port').clear().type('Updated Port')
      cy.getByTestId('react-cancel-ship-edit').click()
      cy.getByTestId('react-ship-edit-form').should('not.exist')
    })

    cy.intercept('PATCH', `/cruise/ship/${reactShips[0].id}`, req => {
      expect(req.body).to.include({ name: 'React Icon Plus', currentPort: 'Updated Port' })
      req.reply({ statusCode: 200, body: { ...reactShips[0], ...req.body } })
    }).as('updateReactShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [{ ...reactShips[0], name: 'React Icon Plus', currentPort: 'Updated Port' }, reactShips[1]]).as('reloadUpdatedReactShips')

    cy.getByTestId('react-ship-card').first().within(() => {
      cy.getByTestId('react-update-ship-button').click()
      cy.getByTestId('react-edit-ship-name').clear().type('React Icon Plus')
      cy.getByTestId('react-edit-ship-current-port').clear().type('Updated Port')
      cy.getByTestId('react-save-ship-edit').click()
    })
    cy.wait('@updateReactShip')
    cy.wait('@reloadUpdatedReactShips')
    cy.getByTestId('react-ship-action-message').should('contain.text', 'React Icon Plus')
  })


  it('blocks blank ship creation before sending a network request', () => {
    openFirstReactFleetShips()
    cy.intercept('POST', '/cruise/ship').as('shipCreateShouldNotRun')
    cy.getByTestId('react-create-ship-submit-button').click()
    cy.getByTestId('react-ship-action-message').should('contain.text', 'Ship name is required')
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

    cy.getByTestId('react-create-ship-name-input').type('  Trimmed Ship  ')
    cy.getByTestId('react-create-ship-current-port-input').type('  Seattle, Washington  ')
    cy.getByTestId('react-create-ship-submit-button').click()
    cy.wait('@createTrimmedShip')
    cy.wait('@reloadTrimmedShips')
    cy.getByTestId('react-ship-action-message').should('contain.text', 'Trimmed Ship was added')
  })

  it('cancels ship deletion without calling the API', () => {
    openFirstReactFleetShips()
    cy.intercept('DELETE', `/cruise/ship/${reactShips[0].id}`).as('shipDeleteShouldNotRun')
    cy.getByTestId('react-ship-card').first().within(() => {
      cy.getByTestId('react-delete-ship-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', reactShips[0].name)
    cy.getByTestId('react-fleet-delete-confirmation-cancel').click()
    cy.get('@shipDeleteShouldNotRun.all').should('have.length', 0)
    cy.getByTestId('react-ship-card').first().should('contain.text', reactShips[0].name)
  })

  it('confirms ship deletion and refreshes the selected fleet panel', () => {
    openFirstReactFleetShips()
    cy.intercept('DELETE', `/cruise/ship/${reactShips[0].id}`, {
      statusCode: 200,
      body: { message: 'Ship deleted successfully' }
    }).as('deleteReactShip')
    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[0].id}`, [reactShips[1]]).as('reloadShipsAfterDelete')

    cy.getByTestId('react-ship-card').first().within(() => {
      cy.getByTestId('react-delete-ship-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation-confirm').click()
    cy.wait('@deleteReactShip')
    cy.wait('@reloadShipsAfterDelete')
    cy.getByTestId('react-ship-action-message').should('contain.text', `${reactShips[0].name} was deleted`)
    cy.getByTestId('react-ship-card').should('have.length', 1).and('contain.text', reactShips[1].name)
  })
})
