const {
  reactCruiseLines,
  reactShips,
  reactSailings,
  reactItinerary,
  visitReactAppAsAdmin,
  openFirstReactFleetShips,
  openFirstReactShipSailings,
  openFirstReactSailingItinerary
} = require('./support/reactTestHelpers.js')

describe('React fleet directory deep parity expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders fleet count, country, website, and action controls for every intercepted cruise line', () => {
    cy.getByTestId('react-fleet-count').should('contain.text', `${reactCruiseLines.length}`)
    cy.getByTestId('react-fleet-card').should('have.length', reactCruiseLines.length)
    reactCruiseLines.forEach(line => {
      cy.getByTestId('react-fleet-directory').should('contain.text', line.name)
      cy.getByTestId('react-fleet-directory').should('contain.text', line.country)
    })
    cy.getByTestId('react-view-ships-button').should('have.length', reactCruiseLines.length)
    cy.getByTestId('react-update-cruise-line-button').should('have.length', reactCruiseLines.length)
    cy.getByTestId('react-delete-cruise-line-button').should('have.length', reactCruiseLines.length)
  })

  it('clears fleet search and restores the full React fleet', () => {
    cy.getByTestId('react-fleet-search').type('Princess')
    cy.getByTestId('react-fleet-card').should('have.length', 1)
    cy.getByTestId('react-fleet-search').clear()
    cy.getByTestId('react-fleet-card').should('have.length', reactCruiseLines.length)
  })

  it('keeps selected ship panel visible while filtering fleet cards after ship lookup', () => {
    openFirstReactFleetShips()
    cy.getByTestId('react-fleet-search').type('Princess')
    cy.getByTestId('react-fleet-card').should('have.length', 1)
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'Royal Caribbean International ships')
    cy.getByTestId('react-ship-card').should('have.length', reactShips.length)
  })

  it('opens and cancels every visible cruise-line edit form without mutating cards', () => {
    cy.getByTestId('react-update-cruise-line-button').each($button => {
      cy.wrap($button).click()
      cy.getByTestId('react-cruise-line-edit-form').should('be.visible')
      cy.getByTestId('react-cancel-cruise-line-edit').click()
      cy.getByTestId('react-cruise-line-edit-form').should('not.exist')
    })
    cy.getByTestId('react-fleet-card').first().should('contain.text', reactCruiseLines[0].name)
  })

  it('blocks blank cruise-line edit save before API submission', () => {
    cy.intercept('PATCH', '/cruise/*').as('unexpectedFleetPatch')
    cy.getByTestId('react-update-cruise-line-button').first().click()
    cy.getByTestId('react-edit-cruise-line-name').clear()
    cy.getByTestId('react-save-cruise-line-edit').click()
    cy.getByTestId('react-fleet-action-message').should('contain.text', 'Cruise line name is required')
    cy.get('@unexpectedFleetPatch.all').should('have.length', 0)
  })

  it('opens selected ships and shows count/action status from the React API fixture', () => {
    openFirstReactFleetShips()
    cy.getByTestId('react-selected-ships-count').should('contain.text', `${reactShips.length}`)
    cy.getByTestId('react-create-ship-form').should('be.visible')
  })

  it('keeps ship edit cancellation local to the selected ship card', () => {
    openFirstReactFleetShips()
    cy.getByTestId('react-ship-card').first().within(() => {
      cy.getByTestId('react-update-ship-button').click()
    })
    cy.getByTestId('react-ship-edit-form').within(() => {
      cy.getByTestId('react-edit-ship-name').clear().type('Unsaved Ship Name')
      cy.getByTestId('react-cancel-ship-edit').click()
    })
    cy.getByTestId('react-ship-edit-form').should('not.exist')
    cy.getByTestId('react-ship-card').first().should('contain.text', 'React Icon')
    cy.getByTestId('react-ship-card').first().should('not.contain.text', 'Unsaved Ship Name')
  })

  it('keeps sailing and itinerary panels hidden until the user drills into the selected ship', () => {
    openFirstReactFleetShips()
    cy.getByTestId('react-sailings-panel').should('not.exist')
    cy.getByTestId('react-itinerary-panel').should('not.exist')
  })

  it('clears stale itinerary state when a different fleet is selected', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    cy.getByTestId('react-itinerary-panel').should('be.visible')

    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[1].id}`, []).as('reactCelebrityShips')
    cy.getByTestId('react-fleet-search').clear()
    cy.getByTestId('react-fleet-card').eq(1).within(() => {
      cy.getByTestId('react-view-ships-button').click()
    })
    cy.wait('@reactCelebrityShips')
    cy.getByTestId('react-itinerary-panel').should('not.exist')
    cy.getByTestId('react-sailings-panel').should('not.exist')
    cy.getByTestId('react-selected-ships-panel').should('contain.text', 'No ships are currently listed')
  })

  it('renders itinerary activity count from activitySchedule data', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    const activityCount = reactItinerary.reduce((total, day) => total + day.activitySchedule.length, 0)
    cy.getByTestId('react-itinerary-activity').should('have.length', activityCount)
    cy.getByTestId('react-itinerary-count').should('contain.text', `${reactItinerary.length}`)
  })

  it('opens sailing edit form and preserves repositioning checkbox state', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    cy.getByTestId('react-sailing-card').eq(1).within(() => {
      cy.getByTestId('react-update-sailing-button').click()
    })
    cy.getByTestId('react-sailing-edit-form').within(() => {
      cy.getByTestId('react-edit-sailing-repositioning').should('be.checked')
      cy.getByTestId('react-cancel-sailing-edit').click()
    })
    cy.getByTestId('react-sailing-edit-form').should('not.exist')
  })
})
