const { openFirstReactFleetShips,  openFirstReactSailingItinerary,  openFirstReactShipSailings,  reactItinerary,  reactSailings,  reactShips,  visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React sailings and itinerary parity', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
    openFirstReactFleetShips()
  })

  it('loads sailings for a selected ship', () => {
    openFirstReactShipSailings()
    cy.getByTestId('react-sailings-panel').should('contain.text', 'React Icon Sailings')
    cy.getByTestId('react-sailing-card').first().should('contain.text', 'Miami').and('contain.text', 'Nassau')
    cy.getByTestId('react-sailing-card').eq(1).should('contain.text', 'Repositioning')
  })

  it('creates a sailing and reloads the selected ship sailings', () => {
    openFirstReactShipSailings()
    cy.intercept('POST', `/cruise/ship/${reactShips[0].id}/sailings`, req => {
      expect(req.body).to.include({
        departureDate: '2027-02-14',
        departurePort: 'Miami',
        arrivalPort: 'Key West',
        days: 3,
        isRepositioning: true
      })
      req.reply({ statusCode: 201, body: { id: 'sailing-react-new', ...req.body } })
    }).as('createReactSailing')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [...reactSailings, { id: 'sailing-react-new', departureDate: '2027-02-14', departurePort: 'Miami', arrivalPort: 'Key West', days: 3, isRepositioning: true }]).as('reloadReactSailingsAfterCreate')

    cy.getByTestId('react-create-sailing-departure-date').type('2027-02-14')
    cy.getByTestId('react-create-sailing-departure-port').type('Miami')
    cy.getByTestId('react-create-sailing-arrival-port').type('Key West')
    cy.getByTestId('react-create-sailing-days').type('3')
    cy.getByTestId('react-create-sailing-repositioning').check()
    cy.getByTestId('react-create-sailing-submit-button').click()
    cy.wait('@createReactSailing')
    cy.wait('@reloadReactSailingsAfterCreate')
    cy.getByTestId('react-sailing-action-message').should('contain.text', 'sailing was created')
  })

  it('updates sailing details with a controlled edit form', () => {
    openFirstReactShipSailings()
    cy.intercept('PATCH', `/cruise/sailings/${reactSailings[0].id}`, req => {
      expect(req.body).to.include({ departurePort: 'Updated Miami', arrivalPort: 'Updated Nassau', days: 5 })
      req.reply({ statusCode: 200, body: { ...reactSailings[0], ...req.body } })
    }).as('updateReactSailing')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [{ ...reactSailings[0], departurePort: 'Updated Miami', arrivalPort: 'Updated Nassau', days: 5 }, reactSailings[1]]).as('reloadReactSailingsAfterUpdate')

    cy.getByTestId('react-sailing-card').first().within(() => {
      cy.getByTestId('react-update-sailing-button').click()
      cy.getByTestId('react-sailing-edit-form').should('be.visible')
      cy.getByTestId('react-edit-sailing-departure-port').clear().type('Updated Miami')
      cy.getByTestId('react-edit-sailing-arrival-port').clear().type('Updated Nassau')
      cy.getByTestId('react-edit-sailing-days').clear().type('5')
      cy.getByTestId('react-save-sailing-edit').click()
    })
    cy.wait('@updateReactSailing')
    cy.wait('@reloadReactSailingsAfterUpdate')
  })

  it('loads itinerary details and activity rows', () => {
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    cy.getByTestId('react-itinerary-panel').should('contain.text', 'Embarkation Day')
    cy.getByTestId('react-itinerary-activity').should('have.length', 3)
  })

  it('creates itinerary days and activities', () => {
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    cy.intercept('POST', `/cruise/sailings/${reactSailings[0].id}/itinerary`, req => {
      expect(req.body).to.include({ day: 3, title: 'React Sea Day', port: 'At Sea' })
      req.reply({ statusCode: 201, body: { id: 'itinerary-react-day-3', ...req.body, activities: [] } })
    }).as('createReactItineraryDay')
    cy.intercept('POST', `/cruise/itinerary-days/${reactItinerary[0].id}/activities`, req => {
      expect(req.body).to.include({ time: '02:00 PM', activity: 'React trivia' })
      req.reply({ statusCode: 201, body: { id: 'activity-react-new', ...req.body } })
    }).as('createReactActivity')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, reactItinerary).as('reloadReactItinerary')

    cy.getByTestId('react-create-itinerary-day-number').type('3')
    cy.getByTestId('react-create-itinerary-day-title').type('React Sea Day')
    cy.getByTestId('react-create-itinerary-day-port').type('At Sea')
    cy.getByTestId('react-create-itinerary-day-submit-button').click()
    cy.wait('@createReactItineraryDay')

    cy.getByTestId('react-create-itinerary-activity-day-select').select(reactItinerary[0].id)
    cy.getByTestId('react-create-itinerary-activity-time').type('02:00 PM')
    cy.getByTestId('react-create-itinerary-activity-name').type('React trivia')
    cy.getByTestId('react-create-itinerary-activity-submit-button').click()
    cy.wait('@createReactActivity')
  })


  it('blocks blank sailing creation before sending a network request', () => {
    openFirstReactShipSailings()
    cy.intercept('POST', `/cruise/ship/${reactShips[0].id}/sailings`).as('sailingCreateShouldNotRun')
    cy.getByTestId('react-create-sailing-submit-button').click()
    cy.getByTestId('react-sailing-action-message').should('contain.text', 'Departure date, ports, and a valid day count are required')
    cy.get('@sailingCreateShouldNotRun.all').should('have.length', 0)
  })

  it('cancels sailing edits without sending a patch request', () => {
    openFirstReactShipSailings()
    cy.intercept('PATCH', `/cruise/sailings/${reactSailings[0].id}`).as('sailingPatchShouldNotRun')
    cy.getByTestId('react-sailing-card').first().within(() => {
      cy.getByTestId('react-update-sailing-button').click()
      cy.getByTestId('react-edit-sailing-arrival-port').clear().type('Cancelled Port')
      cy.getByTestId('react-cancel-sailing-edit').click()
      cy.getByTestId('react-sailing-edit-form').should('not.exist')
    })
    cy.get('@sailingPatchShouldNotRun.all').should('have.length', 0)
  })

  it('includes repositioning changes in the sailing edit payload', () => {
    openFirstReactShipSailings()
    cy.intercept('PATCH', `/cruise/sailings/${reactSailings[0].id}`, req => {
      expect(req.body).to.include({ isRepositioning: true })
      req.reply({ statusCode: 200, body: { ...reactSailings[0], ...req.body } })
    }).as('updateRepositioningSailing')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [{ ...reactSailings[0], isRepositioning: true }, reactSailings[1]]).as('reloadRepositioningSailings')

    cy.getByTestId('react-sailing-card').first().within(() => {
      cy.getByTestId('react-update-sailing-button').click()
      cy.getByTestId('react-edit-sailing-repositioning').check()
      cy.getByTestId('react-save-sailing-edit').click()
    })
    cy.wait('@updateRepositioningSailing')
    cy.wait('@reloadRepositioningSailings')
  })

  it('cancels sailing deletion without sending a delete request', () => {
    openFirstReactShipSailings()
    cy.intercept('DELETE', `/cruise/sailings/${reactSailings[0].id}`).as('sailingDeleteShouldNotRun')
    cy.getByTestId('react-sailing-card').first().within(() => {
      cy.getByTestId('react-delete-sailing-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation').should('contain.text', `Delete sailing ${reactSailings[0].departureDate}`)
    cy.getByTestId('react-fleet-delete-confirmation-cancel').click()
    cy.get('@sailingDeleteShouldNotRun.all').should('have.length', 0)
    cy.getByTestId('react-sailing-card').first().should('contain.text', reactSailings[0].departurePort)
  })

  it('confirms sailing deletion and reloads the remaining sailings', () => {
    openFirstReactShipSailings()
    cy.intercept('DELETE', `/cruise/sailings/${reactSailings[0].id}`, {
      statusCode: 200,
      body: { message: 'Sailing deleted successfully' }
    }).as('deleteReactSailing')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [reactSailings[1]]).as('reloadSailingsAfterDelete')

    cy.getByTestId('react-sailing-card').first().within(() => {
      cy.getByTestId('react-delete-sailing-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation-confirm').click()
    cy.wait('@deleteReactSailing')
    cy.wait('@reloadSailingsAfterDelete')
    cy.getByTestId('react-sailing-action-message').should('contain.text', 'sailing was deleted')
    cy.getByTestId('react-sailing-card').should('have.length', 1).and('contain.text', reactSailings[1].departurePort)
  })
})
