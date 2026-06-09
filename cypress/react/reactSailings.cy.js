const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { openFirstReactFleetShips,  openFirstReactSailingItinerary,  openFirstReactShipSailings,  reactItinerary,  reactSailings,  reactShips,  visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React sailings and itinerary coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
    openFirstReactFleetShips()
  })

  it('loads sailings for a selected ship', () => {
    openFirstReactShipSailings()
    cy.getByTestId(rs.sailingsPanel).should('contain.text', 'React Icon Sailings')
    cy.getByTestId(rs.sailingCard).first().should('contain.text', 'Miami').and('contain.text', 'Nassau')
    cy.getByTestId(rs.sailingCard).eq(1).should('contain.text', 'Repositioning')
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

    cy.getByTestId(rs.createSailingDepartureDate).type('2027-02-14')
    cy.getByTestId(rs.createSailingDeparturePort).type('Miami')
    cy.getByTestId(rs.createSailingArrivalPort).type('Key West')
    cy.getByTestId(rs.createSailingDays).type('3')
    cy.getByTestId(rs.createSailingRepositioning).check()
    cy.getByTestId(rs.createSailingSubmitButton).click()
    cy.wait('@createReactSailing')
    cy.wait('@reloadReactSailingsAfterCreate')
    cy.getByTestId(rs.sailingActionMessage).should('contain.text', 'sailing was created')
  })

  it('updates sailing details with a controlled edit form', () => {
    openFirstReactShipSailings()
    cy.intercept('PATCH', `/cruise/sailings/${reactSailings[0].id}`, req => {
      expect(req.body).to.include({ departurePort: 'Updated Miami', arrivalPort: 'Updated Nassau', days: 5 })
      req.reply({ statusCode: 200, body: { ...reactSailings[0], ...req.body } })
    }).as('updateReactSailing')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [{ ...reactSailings[0], departurePort: 'Updated Miami', arrivalPort: 'Updated Nassau', days: 5 }, reactSailings[1]]).as('reloadReactSailingsAfterUpdate')

    cy.getByTestId(rs.sailingCard).first().within(() => {
      cy.getByTestId(rs.updateSailingButton).click()
      cy.getByTestId(rs.sailingEditForm).should('be.visible')
      cy.getByTestId(rs.editSailingDeparturePort).clear().type('Updated Miami')
      cy.getByTestId(rs.editSailingArrivalPort).clear().type('Updated Nassau')
      cy.getByTestId(rs.editSailingDays).clear().type('5')
      cy.getByTestId(rs.saveSailingEdit).click()
    })
    cy.wait('@updateReactSailing')
    cy.wait('@reloadReactSailingsAfterUpdate')
  })

  it('loads itinerary details and activity rows', () => {
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    cy.getByTestId(rs.itineraryPanel).should('contain.text', 'Embarkation Day')
    cy.getByTestId(rs.itineraryActivity).should('have.length', 3)
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

    cy.getByTestId(rs.createItineraryDayNumber).type('3')
    cy.getByTestId(rs.createItineraryDayTitle).type('React Sea Day')
    cy.getByTestId(rs.createItineraryDayPort).type('At Sea')
    cy.getByTestId(rs.createItineraryDaySubmitButton).click()
    cy.wait('@createReactItineraryDay')

    cy.getByTestId(rs.createItineraryActivityDaySelect).select(reactItinerary[0].id)
    cy.getByTestId(rs.createItineraryActivityTime).type('02:00 PM')
    cy.getByTestId(rs.createItineraryActivityName).type('React trivia')
    cy.getByTestId(rs.createItineraryActivitySubmitButton).click()
    cy.wait('@createReactActivity')
  })


  it('blocks blank sailing creation before sending a network request', () => {
    openFirstReactShipSailings()
    cy.intercept('POST', `/cruise/ship/${reactShips[0].id}/sailings`).as('sailingCreateShouldNotRun')
    cy.getByTestId(rs.createSailingSubmitButton).click()
    cy.getByTestId(rs.sailingActionMessage).should('contain.text', 'Departure date, ports, and a valid day count are required')
    cy.get('@sailingCreateShouldNotRun.all').should('have.length', 0)
  })

  it('cancels sailing edits without sending a patch request', () => {
    openFirstReactShipSailings()
    cy.intercept('PATCH', `/cruise/sailings/${reactSailings[0].id}`).as('sailingPatchShouldNotRun')
    cy.getByTestId(rs.sailingCard).first().within(() => {
      cy.getByTestId(rs.updateSailingButton).click()
      cy.getByTestId(rs.editSailingArrivalPort).clear().type('Cancelled Port')
      cy.getByTestId(rs.cancelSailingEdit).click()
      cy.getByTestId(rs.sailingEditForm).should('not.exist')
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

    cy.getByTestId(rs.sailingCard).first().within(() => {
      cy.getByTestId(rs.updateSailingButton).click()
      cy.getByTestId(rs.editSailingRepositioning).check()
      cy.getByTestId(rs.saveSailingEdit).click()
    })
    cy.wait('@updateRepositioningSailing')
    cy.wait('@reloadRepositioningSailings')
  })

  it('cancels sailing deletion without sending a delete request', () => {
    openFirstReactShipSailings()
    cy.intercept('DELETE', `/cruise/sailings/${reactSailings[0].id}`).as('sailingDeleteShouldNotRun')
    cy.getByTestId(rs.sailingCard).first().within(() => {
      cy.getByTestId(rs.deleteSailingButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmation).should('contain.text', `Delete sailing ${reactSailings[0].departureDate}`)
    cy.getByTestId(rs.fleetDeleteConfirmationCancel).click()
    cy.get('@sailingDeleteShouldNotRun.all').should('have.length', 0)
    cy.getByTestId(rs.sailingCard).first().should('contain.text', reactSailings[0].departurePort)
  })

  it('confirms sailing deletion and reloads the remaining sailings', () => {
    openFirstReactShipSailings()
    cy.intercept('DELETE', `/cruise/sailings/${reactSailings[0].id}`, {
      statusCode: 200,
      body: { message: 'Sailing deleted successfully' }
    }).as('deleteReactSailing')
    cy.intercept('GET', `/cruise/ship/${reactShips[0].id}/sailings`, [reactSailings[1]]).as('reloadSailingsAfterDelete')

    cy.getByTestId(rs.sailingCard).first().within(() => {
      cy.getByTestId(rs.deleteSailingButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).click()
    cy.wait('@deleteReactSailing')
    cy.wait('@reloadSailingsAfterDelete')
    cy.getByTestId(rs.sailingActionMessage).should('contain.text', 'sailing was deleted')
    cy.getByTestId(rs.sailingCard).should('have.length', 1).and('contain.text', reactSailings[1].departurePort)
  })
})
