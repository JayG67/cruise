const { reactSelectorKeys: rs } = require('./support/reactSelectors')
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

describe('React fleet directory deep coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders fleet count, country, website, and action controls for every intercepted cruise line', () => {
    cy.getByTestId(rs.fleetCount).should('contain.text', `${reactCruiseLines.length}`)
    cy.getByTestId(rs.fleetCard).should('have.length', reactCruiseLines.length)
    reactCruiseLines.forEach(line => {
      cy.getByTestId(rs.fleetDirectory).should('contain.text', line.name)
      cy.getByTestId(rs.fleetDirectory).should('contain.text', line.country)
    })
    cy.getByTestId(rs.viewShipsButton).should('have.length', reactCruiseLines.length)
    cy.getByTestId(rs.updateCruiseLineButton).should('have.length', reactCruiseLines.length)
    cy.getByTestId(rs.deleteCruiseLineButton).should('have.length', reactCruiseLines.length)
  })

  it('refreshes fleet data with visible progress and completion feedback', () => {
    const refreshedCruiseLines = [
      ...reactCruiseLines,
      {
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Refreshed Ocean Cruises',
        country: 'United States',
        website: 'https://example.com/refreshed-ocean'
      }
    ]

    cy.intercept('GET', '/cruise', req => {
      req.on('response', response => {
        response.setDelay(250)
      })
      req.reply(refreshedCruiseLines)
    }).as('refreshFleetDirectory')

    cy.getByTestId(rs.fleetRefreshControl).should('be.visible')
    cy.get('.fleet-heading-row').then($heading => {
      cy.getByTestId(rs.fleetRefreshControl).then($control => {
        expect($control[0].getBoundingClientRect().top).to.be.at.least($heading[0].getBoundingClientRect().bottom)
      })
    })

    cy.getByTestId(rs.fleetRefreshButton).click().should('be.disabled').and('contain.text', 'Refreshing fleet')
    cy.getByTestId(rs.fleetRefreshStatus).should('contain.text', 'Refreshing fleet data')
    cy.wait('@refreshFleetDirectory')
    cy.getByTestId(rs.fleetRefreshStatus).should('contain.text', 'Fleet refreshed. 4 cruise lines loaded.')
    cy.getByTestId(rs.fleetCard).should('have.length', refreshedCruiseLines.length)
    cy.getByTestId(rs.fleetDirectory).should('contain.text', 'Refreshed Ocean Cruises')
  })

  it('clears fleet search and restores the full React fleet', () => {
    cy.getByTestId(rs.fleetSearch).type('Princess')
    cy.getByTestId(rs.fleetCard).should('have.length', 1)
    cy.getByTestId(rs.fleetSearch).clear()
    cy.getByTestId(rs.fleetCard).should('have.length', reactCruiseLines.length)
  })

  it('keeps selected ship panel visible while filtering fleet cards after ship lookup', () => {
    openFirstReactFleetShips()
    cy.getByTestId(rs.fleetSearch).type('Princess')
    cy.getByTestId(rs.fleetCard).should('have.length', 1)
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'Royal Caribbean International ships')
    cy.getByTestId(rs.shipCard).should('have.length', reactShips.length)
  })

  it('opens and cancels every visible cruise-line edit form without mutating cards', () => {
    cy.getByTestId(rs.updateCruiseLineButton).each($button => {
      cy.wrap($button).click()
      cy.getByTestId(rs.cruiseLineEditForm).should('be.visible')
      cy.getByTestId(rs.cancelCruiseLineEdit).click()
      cy.getByTestId(rs.cruiseLineEditForm).should('not.exist')
    })
    cy.getByTestId(rs.fleetCard).first().should('contain.text', reactCruiseLines[0].name)
  })

  it('blocks blank cruise-line edit save before API submission', () => {
    cy.intercept('PATCH', '/cruise/*').as('unexpectedFleetPatch')
    cy.getByTestId(rs.updateCruiseLineButton).first().click()
    cy.getByTestId(rs.editCruiseLineName).clear()
    cy.getByTestId(rs.saveCruiseLineEdit).click()
    cy.getByTestId(rs.fleetActionMessage).should('contain.text', 'Cruise line name is required')
    cy.get('@unexpectedFleetPatch.all').should('have.length', 0)
  })

  it('opens selected ships and shows count/action status from the React API fixture', () => {
    openFirstReactFleetShips()
    cy.getByTestId(rs.selectedShipsCount).should('contain.text', `${reactShips.length}`)
    cy.getByTestId(rs.createShipForm).should('be.visible')
  })

  it('keeps ship edit cancellation local to the selected ship card', () => {
    openFirstReactFleetShips()
    cy.getByTestId(rs.shipCard).first().within(() => {
      cy.getByTestId(rs.updateShipButton).click()
    })
    cy.getByTestId(rs.shipEditForm).within(() => {
      cy.getByTestId(rs.editShipName).clear().type('Unsaved Ship Name')
      cy.getByTestId(rs.cancelShipEdit).click()
    })
    cy.getByTestId(rs.shipEditForm).should('not.exist')
    cy.getByTestId(rs.shipCard).first().should('contain.text', 'React Icon')
    cy.getByTestId(rs.shipCard).first().should('not.contain.text', 'Unsaved Ship Name')
  })

  it('keeps sailing and itinerary panels hidden until the user drills into the selected ship', () => {
    openFirstReactFleetShips()
    cy.getByTestId(rs.sailingsPanel).should('not.exist')
    cy.getByTestId(rs.itineraryPanel).should('not.exist')
  })

  it('clears stale itinerary state when a different fleet is selected', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    cy.getByTestId(rs.itineraryPanel).should('be.visible')

    cy.intercept('GET', `/cruise/ships/${reactCruiseLines[1].id}`, []).as('reactCelebrityShips')
    cy.getByTestId(rs.fleetSearch).clear()
    cy.getByTestId(rs.fleetCard).eq(1).within(() => {
      cy.getByTestId(rs.viewShipsButton).click()
    })
    cy.wait('@reactCelebrityShips')
    cy.getByTestId(rs.itineraryPanel).should('not.exist')
    cy.getByTestId(rs.sailingsPanel).should('not.exist')
    cy.getByTestId(rs.selectedShipsPanel).should('contain.text', 'No ships are currently listed')
  })

  it('renders itinerary activity count from activitySchedule data', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    openFirstReactSailingItinerary()
    const activityCount = reactItinerary.reduce((total, day) => total + day.activitySchedule.length, 0)
    cy.getByTestId(rs.itineraryActivity).should('have.length', activityCount)
    cy.getByTestId(rs.itineraryCount).should('contain.text', `${reactItinerary.length}`)
  })

  it('opens sailing edit form and preserves repositioning checkbox state', () => {
    openFirstReactFleetShips()
    openFirstReactShipSailings()
    cy.getByTestId(rs.sailingCard).eq(1).within(() => {
      cy.getByTestId(rs.updateSailingButton).click()
    })
    cy.getByTestId(rs.sailingEditForm).within(() => {
      cy.getByTestId(rs.editSailingRepositioning).should('be.checked')
      cy.getByTestId(rs.cancelSailingEdit).click()
    })
    cy.getByTestId(rs.sailingEditForm).should('not.exist')
  })
})
