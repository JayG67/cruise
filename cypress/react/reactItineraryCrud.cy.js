const { openFirstReactFleetShips, openFirstReactSailingItinerary, openFirstReactShipSailings, reactItinerary, reactSailings, reactShips, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React itinerary admin CRUD parity expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
  })

  it('renders itinerary create forms and existing day cards', () => {
    cy.getByTestId('react-create-itinerary-day-form').should('be.visible')
    cy.getByTestId('react-create-itinerary-activity-form').should('be.visible')
    cy.getByTestId('react-itinerary-count').should('contain.text', '2 days')
    cy.getByTestId('react-itinerary-day-card').should('have.length', 2)
    cy.getByTestId('react-itinerary-activity').should('have.length', 3)
  })

  it('blocks blank itinerary day creation before API submission', () => {
    cy.intercept('POST', `/cruise/sailings/${reactSailings[0].id}/itinerary`).as('blankDayShouldNotSave')
    cy.getByTestId('react-create-itinerary-day-submit-button').click()
    cy.getByTestId('react-itinerary-action-message').should('contain.text', 'Day number and title are required')
    cy.get('@blankDayShouldNotSave.all').should('have.length', 0)
  })

  it('opens, edits, saves, and reloads an itinerary day', () => {
    cy.intercept('PATCH', `/cruise/itinerary-days/${reactItinerary[0].id}`, req => {
      expect(req.body).to.include({ day: 1, title: 'Updated Embarkation', port: 'Updated Miami' })
      req.reply({ statusCode: 200, body: { ...reactItinerary[0], ...req.body } })
    }).as('saveItineraryDay')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, [{ ...reactItinerary[0], title: 'Updated Embarkation', port: 'Updated Miami' }, reactItinerary[1]]).as('reloadAfterDayUpdate')

    cy.getByTestId('react-itinerary-day-card').first().within(() => {
      cy.getByTestId('react-update-itinerary-day-button').click()
      cy.getByTestId('react-edit-itinerary-day-title').clear().type('Updated Embarkation')
      cy.getByTestId('react-edit-itinerary-day-port').clear().type('Updated Miami')
      cy.getByTestId('react-save-itinerary-day-edit').click()
    })
    cy.wait('@saveItineraryDay')
    cy.wait('@reloadAfterDayUpdate')
  })

  it('cancels itinerary day editing without saving', () => {
    cy.getByTestId('react-itinerary-day-card').first().within(() => {
      cy.getByTestId('react-update-itinerary-day-button').click()
      cy.getByTestId('react-edit-itinerary-day-title').clear().type('Cancelled title')
      cy.getByTestId('react-cancel-itinerary-day-edit').click()
      cy.getByTestId('react-itinerary-day-edit-form').should('not.exist')
    })
  })

  it('opens, edits, saves, and reloads an itinerary activity', () => {
    cy.intercept('PATCH', `/cruise/activities/${reactItinerary[0].activitySchedule[0].id}`, req => {
      expect(req.body).to.include({ time: '01:15 PM', activity: 'Updated terminal arrival' })
      req.reply({ statusCode: 200, body: { id: reactItinerary[0].activitySchedule[0].id, ...req.body } })
    }).as('saveItineraryActivity')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, reactItinerary).as('reloadAfterActivityUpdate')

    cy.getByTestId('react-itinerary-activity').first().within(() => {
      cy.getByTestId('react-update-itinerary-activity-button').click()
      cy.getByTestId('react-edit-itinerary-activity-time').clear().type('01:15 PM')
      cy.getByTestId('react-edit-itinerary-activity-name').clear().type('Updated terminal arrival')
      cy.getByTestId('react-save-itinerary-activity-edit').click()
    })
    cy.wait('@saveItineraryActivity')
    cy.wait('@reloadAfterActivityUpdate')
  })

  it('cancels itinerary activity editing without saving', () => {
    cy.getByTestId('react-itinerary-activity').first().within(() => {
      cy.getByTestId('react-update-itinerary-activity-button').click()
      cy.getByTestId('react-edit-itinerary-activity-name').clear().type('Cancelled activity')
      cy.getByTestId('react-cancel-itinerary-activity-edit').click()
      cy.getByTestId('react-itinerary-activity-edit-form').should('not.exist')
    })
  })

  it('confirms itinerary day and activity deletes through native React panels', () => {
    cy.intercept('DELETE', `/cruise/itinerary-days/${reactItinerary[1].id}`, { statusCode: 200, body: { deleted: true } }).as('deleteItineraryDay')
    cy.intercept('DELETE', `/cruise/activities/${reactItinerary[0].activitySchedule[0].id}`, { statusCode: 200, body: { deleted: true } }).as('deleteItineraryActivity')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, reactItinerary).as('reloadAfterItineraryDelete')

    cy.getByTestId('react-itinerary-day-card').eq(1).within(() => {
      cy.getByTestId('react-delete-itinerary-day-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation-confirm').click()
    cy.wait('@deleteItineraryDay')

    cy.getByTestId('react-itinerary-activity').first().within(() => {
      cy.getByTestId('react-delete-itinerary-activity-button').click()
    })
    cy.getByTestId('react-fleet-delete-confirmation-confirm').click()
    cy.wait('@deleteItineraryActivity')
  })
})
