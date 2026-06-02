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
})