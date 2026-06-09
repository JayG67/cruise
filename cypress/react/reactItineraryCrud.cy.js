const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { openFirstReactFleetShips, openFirstReactSailingItinerary, openFirstReactShipSailings, reactItinerary, reactSailings, reactShips, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React itinerary admin CRUD coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
  })

  it('renders itinerary create forms and existing day cards', () => {
    cy.getByTestId(rs.createItineraryDayForm).should('be.visible')
    cy.getByTestId(rs.createItineraryActivityForm).should('be.visible')
    cy.getByTestId(rs.itineraryCount).should('contain.text', '2 days')
    cy.getByTestId(rs.itineraryDayCard).should('have.length', 2)
    cy.getByTestId(rs.itineraryActivity).should('have.length', 3)
  })

  it('blocks blank itinerary day creation before API submission', () => {
    cy.intercept('POST', `/cruise/sailings/${reactSailings[0].id}/itinerary`).as('blankDayShouldNotSave')
    cy.getByTestId(rs.createItineraryDaySubmitButton).click()
    cy.getByTestId(rs.itineraryActionMessage).should('contain.text', 'Day number and title are required')
    cy.get('@blankDayShouldNotSave.all').should('have.length', 0)
  })

  it('opens, edits, saves, and reloads an itinerary day', () => {
    cy.intercept('PATCH', `/cruise/itinerary-days/${reactItinerary[0].id}`, req => {
      expect(req.body).to.include({ day: 1, title: 'Updated Embarkation', port: 'Updated Miami' })
      req.reply({ statusCode: 200, body: { ...reactItinerary[0], ...req.body } })
    }).as('saveItineraryDay')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, [{ ...reactItinerary[0], title: 'Updated Embarkation', port: 'Updated Miami' }, reactItinerary[1]]).as('reloadAfterDayUpdate')

    cy.getByTestId(rs.itineraryDayCard).first().within(() => {
      cy.getByTestId(rs.updateItineraryDayButton).click()
      cy.getByTestId(rs.editItineraryDayTitle).clear().type('Updated Embarkation')
      cy.getByTestId(rs.editItineraryDayPort).clear().type('Updated Miami')
      cy.getByTestId(rs.saveItineraryDayEdit).click()
    })
    cy.wait('@saveItineraryDay')
    cy.wait('@reloadAfterDayUpdate')
  })

  it('cancels itinerary day editing without saving', () => {
    cy.getByTestId(rs.itineraryDayCard).first().within(() => {
      cy.getByTestId(rs.updateItineraryDayButton).click()
      cy.getByTestId(rs.editItineraryDayTitle).clear().type('Cancelled title')
      cy.getByTestId(rs.cancelItineraryDayEdit).click()
      cy.getByTestId(rs.itineraryDayEditForm).should('not.exist')
    })
  })

  it('opens, edits, saves, and reloads an itinerary activity', () => {
    cy.intercept('PATCH', `/cruise/activities/${reactItinerary[0].activitySchedule[0].id}`, req => {
      expect(req.body).to.include({ time: '01:15 PM', activity: 'Updated terminal arrival' })
      req.reply({ statusCode: 200, body: { id: reactItinerary[0].activitySchedule[0].id, ...req.body } })
    }).as('saveItineraryActivity')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, reactItinerary).as('reloadAfterActivityUpdate')

    cy.getByTestId(rs.itineraryActivity).first().within(() => {
      cy.getByTestId(rs.updateItineraryActivityButton).click()
      cy.getByTestId(rs.editItineraryActivityTime).clear().type('01:15 PM')
      cy.getByTestId(rs.editItineraryActivityName).clear().type('Updated terminal arrival')
      cy.getByTestId(rs.saveItineraryActivityEdit).click()
    })
    cy.wait('@saveItineraryActivity')
    cy.wait('@reloadAfterActivityUpdate')
  })

  it('cancels itinerary activity editing without saving', () => {
    cy.getByTestId(rs.itineraryActivity).first().within(() => {
      cy.getByTestId(rs.updateItineraryActivityButton).click()
      cy.getByTestId(rs.editItineraryActivityName).clear().type('Cancelled activity')
      cy.getByTestId(rs.cancelItineraryActivityEdit).click()
      cy.getByTestId(rs.itineraryActivityEditForm).should('not.exist')
    })
  })

  it('confirms itinerary day and activity deletes through native React panels', () => {
    cy.intercept('DELETE', `/cruise/itinerary-days/${reactItinerary[1].id}`, { statusCode: 200, body: { deleted: true } }).as('deleteItineraryDay')
    cy.intercept('DELETE', `/cruise/activities/${reactItinerary[0].activitySchedule[0].id}`, { statusCode: 200, body: { deleted: true } }).as('deleteItineraryActivity')
    cy.intercept('GET', `/cruise/sailings/${reactSailings[0].id}/itinerary`, reactItinerary).as('reloadAfterItineraryDelete')

    cy.getByTestId(rs.itineraryDayCard).eq(1).within(() => {
      cy.getByTestId(rs.deleteItineraryDayButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).click()
    cy.wait('@deleteItineraryDay')

    cy.getByTestId(rs.itineraryActivity).first().within(() => {
      cy.getByTestId(rs.deleteItineraryActivityButton).click()
    })
    cy.getByTestId(rs.fleetDeleteConfirmationConfirm).click()
    cy.wait('@deleteItineraryActivity')
  })
})
