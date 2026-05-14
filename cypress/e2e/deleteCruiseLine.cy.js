import { selectors } from '../support/selectors'
import {
  royalCruiseLineId,
  mscCruiseLineId,
  norwegianCruiseLineId,
  disneyCruiseLineId,
  deleteCruiseLines as cruiseLines,
  afterRoyalDelete,
  afterMscDelete,
  royalShips,
  mscShips
} from '../support/testData'
import {
  visitWithCruiseLines,
  visitWithCruiseLineReload,
  stubSuccessfulRoyalDelete
} from '../support/apiMocks'
import {
  stubConfirm,
  clickDeleteForCruiseLine,
  clickRoyalDelete
} from '../support/workflows'

describe('Delete Cruise Line UI', () => {
  it('renders a delete action for every cruise line card', () => {
    visitWithCruiseLines()

    cy.get(selectors.cruiseLines.card).should('have.length', cruiseLines.length)
    cy.get(selectors.cruiseLines.deleteButton).should('have.length', cruiseLines.length)

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International').within(() => {
      cy.get(selectors.cruiseLines.viewShipsButton).should('be.visible')
      cy.get(selectors.cruiseLines.updateButton).should('be.visible')
      cy.get(selectors.cruiseLines.deleteButton)
        .should('be.visible')
        .and('contain.text', 'Delete')
    })
  })

  it('uses a confirmation dialog that includes the selected cruise line name', () => {
    visitWithCruiseLines()

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    }).as('deleteRoyalCruiseLine')

    stubConfirm(false)
    clickRoyalDelete()

    cy.get('@confirmDialog').should(
      'have.been.calledWith',
      'Delete Royal Caribbean International? This will also delete all related ships.'
    )
    cy.get('@deleteRoyalCruiseLine.all').should('have.length', 0)
  })

  it('does not call the delete API when the user cancels confirmation', () => {
    visitWithCruiseLines()

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    }).as('deleteRoyalCruiseLine')

    stubConfirm(false)
    clickRoyalDelete()

    cy.get('@deleteRoyalCruiseLine.all').should('have.length', 0)
    cy.get(selectors.cruiseLines.card).should('have.length', cruiseLines.length)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Showing 3 of 3 cruise lines.')
  })

  it('deletes a cruise line after confirmation and refreshes the grid', () => {
    visitWithCruiseLineReload(cruiseLines, afterRoyalDelete)
    stubSuccessfulRoyalDelete()

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'Royal Caribbean International')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'MSC Cruises')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Norwegian Cruise Line')
    cy.get(selectors.cruiseLines.statusMessage).should(
      'contain.text',
      'Royal Caribbean International was deleted successfully.'
    )
  })

  it('sends the DELETE request to the selected cruise line endpoint only', () => {
    visitWithCruiseLineReload(cruiseLines, afterMscDelete)

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 500,
      body: { message: 'Wrong cruise line was deleted' }
    }).as('deleteRoyalCruiseLine')

    cy.intercept('DELETE', `/cruise/cruise-line/${mscCruiseLineId}`, (req) => {
      expect(req.method).to.equal('DELETE')
      expect(req.url).to.include(`/cruise/cruise-line/${mscCruiseLineId}`)
      req.reply({
        statusCode: 200,
        body: { message: 'Cruise line deleted successfully' }
      })
    }).as('deleteMscCruiseLine')

    stubConfirm(true)
    clickDeleteForCruiseLine('MSC Cruises')

    cy.wait('@deleteMscCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get('@deleteRoyalCruiseLine.all').should('have.length', 0)
    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'MSC Cruises')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
  })

  it('shows a deleting status while the delete request is in progress', () => {
    visitWithCruiseLineReload(cruiseLines, afterRoyalDelete)

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, (req) => {
      req.reply({
        delay: 500,
        statusCode: 200,
        body: { message: 'Cruise line deleted successfully' }
      })
    }).as('deleteRoyalCruiseLine')

    stubConfirm(true)
    clickRoyalDelete()

    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Deleting Royal Caribbean International...')

    cy.wait('@deleteRoyalCruiseLine')
    cy.wait('@getCruiseLines')
    cy.get(selectors.cruiseLines.statusMessage).should(
      'contain.text',
      'Royal Caribbean International was deleted successfully.'
    )
  })

  it('shows the API error message when delete fails', () => {
    visitWithCruiseLines()

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 500,
      body: { message: 'Delete service unavailable' }
    }).as('deleteRoyalCruiseLine')

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')

    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Delete service unavailable')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
  })

  it('shows a fallback error when delete fails without a response message', () => {
    visitWithCruiseLines()

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 404,
      body: {}
    }).as('deleteRoyalCruiseLine')

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')

    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Delete failed with status 404')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
  })

  it('shows a fallback error when the delete response is not valid JSON', () => {
    visitWithCruiseLines()

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 500,
      body: 'not-json',
      headers: { 'content-type': 'text/plain' }
    }).as('deleteRoyalCruiseLine')

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')

    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Delete failed with status 500')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
  })

  it('keeps the cruise line visible when the delete API rejects the request with validation status', () => {
    visitWithCruiseLines()

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 400,
      body: { message: 'Invalid cruise line id' }
    }).as('deleteRoyalCruiseLine')

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')

    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Invalid cruise line id')
    cy.get(selectors.cruiseLines.card).should('have.length', cruiseLines.length)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
  })

  it('handles a network failure without removing the cruise line from the grid', () => {
    visitWithCruiseLines()

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      forceNetworkError: true
    }).as('deleteRoyalCruiseLine')

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')

    cy.get(selectors.cruiseLines.statusMessage).should('not.contain.text', 'was deleted successfully')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
  })

  it('does not refresh the cruise line grid after a failed delete', () => {
    let getCruiseRequestCount = 0

    cy.intercept('GET', '/cruise', (req) => {
      getCruiseRequestCount += 1
      req.reply({ statusCode: 200, body: cruiseLines })
    }).as('getCruiseLines')

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 500,
      body: { message: 'Delete failed before refresh' }
    }).as('deleteRoyalCruiseLine')

    cy.visit('/')
    cy.wait('@getCruiseLines')

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')

    cy.then(() => {
      expect(getCruiseRequestCount).to.equal(1)
    })
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Delete failed before refresh')
  })

  it('hides the selected ships panel when the selected cruise line is deleted', () => {
    visitWithCruiseLineReload(cruiseLines, afterRoyalDelete)

    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
      statusCode: 200,
      body: royalShips
    }).as('getRoyalShips')

    stubSuccessfulRoyalDelete()

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()

    cy.wait('@getRoyalShips')
    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.grid).should('contain.text', 'Icon of the Seas')

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get(selectors.ships.panel).should('not.be.visible')
    cy.get(selectors.ships.grid).should('be.empty')
  })

  it('does not hide the ships panel when a different cruise line is deleted', () => {
    visitWithCruiseLineReload(cruiseLines, afterMscDelete)

    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
      statusCode: 200,
      body: royalShips
    }).as('getRoyalShips')

    cy.intercept('DELETE', `/cruise/cruise-line/${mscCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    }).as('deleteMscCruiseLine')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()

    cy.wait('@getRoyalShips')
    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.grid).should('contain.text', 'Icon of the Seas')

    stubConfirm(true)
    clickDeleteForCruiseLine('MSC Cruises')

    cy.wait('@deleteMscCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.grid).should('contain.text', 'Icon of the Seas')
  })

  it('hides the active update panel when the cruise line being edited is deleted', () => {
    visitWithCruiseLineReload(cruiseLines, afterRoyalDelete)

    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
      statusCode: 200,
      body: royalShips
    }).as('getRoyalShips')

    stubSuccessfulRoyalDelete()

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.updateButton)
      .click()

    cy.wait('@getRoyalShips')
    cy.get(selectors.updateCruiseLine.panel).should('be.visible')

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')
    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'Royal Caribbean International')
    cy.get(selectors.cruiseLines.statusMessage).should(
      'contain.text',
      'Royal Caribbean International was deleted successfully.'
    )
  })

  it('does not hide the active update panel when a different cruise line is deleted', () => {
    visitWithCruiseLineReload(cruiseLines, afterMscDelete)

    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
      statusCode: 200,
      body: royalShips
    }).as('getRoyalShips')

    cy.intercept('DELETE', `/cruise/cruise-line/${mscCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    }).as('deleteMscCruiseLine')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.updateButton)
      .click()

    cy.wait('@getRoyalShips')
    cy.get(selectors.updateCruiseLine.panel).should('be.visible')
    cy.get(selectors.updateCruiseLine.nameInput).should('have.value', 'Royal Caribbean International')

    stubConfirm(true)
    clickDeleteForCruiseLine('MSC Cruises')

    cy.wait('@deleteMscCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get(selectors.updateCruiseLine.panel).should('be.visible')
    cy.get(selectors.updateCruiseLine.nameInput).should('have.value', 'Royal Caribbean International')
    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'MSC Cruises')
  })

  it('deletes the correct cruise line after search filtering', () => {
    visitWithCruiseLineReload(cruiseLines, afterMscDelete)

    cy.intercept('DELETE', `/cruise/cruise-line/${mscCruiseLineId}`, (req) => {
      expect(req.method).to.equal('DELETE')
      req.reply({
        statusCode: 200,
        body: { message: 'Cruise line deleted successfully' }
      })
    }).as('deleteMscCruiseLine')

    cy.get(selectors.cruiseLines.searchInput).type('msc')
    cy.get(selectors.cruiseLines.card).should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'MSC Cruises')

    stubConfirm(true)
    clickDeleteForCruiseLine('MSC Cruises')

    cy.wait('@deleteMscCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'MSC Cruises')
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'MSC Cruises was deleted successfully.')
  })

  it('does not delete hidden cruise lines while search filtering is active', () => {
    visitWithCruiseLines()

    cy.intercept('DELETE', `/cruise/cruise-line/${royalCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Royal should not be deleted from filtered view' }
    }).as('deleteRoyalCruiseLine')

    cy.intercept('DELETE', `/cruise/cruise-line/${mscCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    }).as('deleteMscCruiseLine')

    cy.get(selectors.cruiseLines.searchInput).type('msc')
    cy.get(selectors.cruiseLines.card).should('have.length', 1)

    stubConfirm(true)
    clickDeleteForCruiseLine('MSC Cruises')

    cy.wait('@deleteMscCruiseLine')
    cy.get('@deleteRoyalCruiseLine.all').should('have.length', 0)
  })

  it('preserves escaped cruise line names when confirming delete', () => {
    const unsafeCruiseLine = {
      id: disneyCruiseLineId,
      name: '<img src=x onerror=alert(1)> Cruise',
      country: 'United States',
      website: 'https://www.example.com'
    }

    visitWithCruiseLines([unsafeCruiseLine])

    cy.intercept('DELETE', `/cruise/cruise-line/${disneyCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    }).as('deleteUnsafeCruiseLine')

    cy.get(selectors.cruiseLines.grid).should('contain.text', '<img src=x onerror=alert(1)> Cruise')
    cy.get(selectors.cruiseLines.grid).find('img').should('not.exist')

    stubConfirm(false)
    clickDeleteForCruiseLine('<img src=x onerror=alert(1)> Cruise')

    cy.get('@confirmDialog').should(
      'have.been.calledWith',
      'Delete <img src=x onerror=alert(1)> Cruise? This will also delete all related ships.'
    )
    cy.get('@deleteUnsafeCruiseLine.all').should('have.length', 0)
  })

  it('handles cruise line names with apostrophes in the delete confirmation', () => {
    const apostropheCruiseLine = {
      id: disneyCruiseLineId,
      name: "Jay's Cruise Line",
      country: 'United States',
      website: 'https://www.example.com'
    }

    visitWithCruiseLines([apostropheCruiseLine])

    cy.intercept('DELETE', `/cruise/cruise-line/${disneyCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    }).as('deleteApostropheCruiseLine')

    stubConfirm(false)
    clickDeleteForCruiseLine("Jay's Cruise Line")

    cy.get('@confirmDialog').should(
      'have.been.calledWith',
      "Delete Jay's Cruise Line? This will also delete all related ships."
    )
    cy.get('@deleteApostropheCruiseLine.all').should('have.length', 0)
  })

  it('works for a cruise line that has no website field', () => {
    const noWebsiteCruiseLine = {
      id: disneyCruiseLineId,
      name: 'Disney Cruise Line',
      country: 'United States'
    }

    visitWithCruiseLineReload([noWebsiteCruiseLine], [])

    cy.intercept('DELETE', `/cruise/cruise-line/${disneyCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    }).as('deleteDisneyCruiseLine')

    cy.contains(selectors.cruiseLines.card, 'Disney Cruise Line').within(() => {
      cy.get(selectors.cruiseLines.websiteLink).should('not.exist')
      cy.get(selectors.cruiseLines.deleteButton).should('be.visible')
    })

    stubConfirm(true)
    clickDeleteForCruiseLine('Disney Cruise Line')

    cy.wait('@deleteDisneyCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'Disney Cruise Line')
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Disney Cruise Line was deleted successfully.')
  })

  it('renders an empty-state message after the last cruise line is deleted', () => {
    const singleCruiseLine = [cruiseLines[0]]

    visitWithCruiseLineReload(singleCruiseLine, [])
    stubSuccessfulRoyalDelete()

    stubConfirm(true)
    clickRoyalDelete()

    cy.wait('@deleteRoyalCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get(selectors.cruiseLines.emptyMessage).should('be.visible')
    cy.get(selectors.cruiseLines.emptyMessage).should('contain.text', 'No cruise lines match your search.')
    cy.get(selectors.cruiseLines.statusMessage).should(
      'contain.text',
      'Royal Caribbean International was deleted successfully.'
    )
  })

  it('keeps the delete action available after opening and cancelling update mode', () => {
    visitWithCruiseLines()

    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
      statusCode: 200,
      body: royalShips
    }).as('getRoyalShips')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.updateButton)
      .click()

    cy.wait('@getRoyalShips')
    cy.get(selectors.updateCruiseLine.panel).should('be.visible')
    cy.get(selectors.updateCruiseLine.cancelButton).click()
    cy.get(selectors.updateCruiseLine.panel).should('not.be.visible')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.deleteButton)
      .should('be.visible')
  })

  it('keeps the delete action available after viewing ships', () => {
    visitWithCruiseLines()

    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
      statusCode: 200,
      body: royalShips
    }).as('getRoyalShips')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()

    cy.wait('@getRoyalShips')
    cy.get(selectors.ships.panel).should('be.visible')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.deleteButton)
      .should('be.visible')
  })

  it('handles delete after switching selected ships between cruise lines', () => {
    visitWithCruiseLineReload(cruiseLines, afterMscDelete)

    cy.intercept('GET', `/cruise/ships/${royalCruiseLineId}`, {
      statusCode: 200,
      body: royalShips
    }).as('getRoyalShips')

    cy.intercept('GET', `/cruise/ships/${mscCruiseLineId}`, {
      statusCode: 200,
      body: mscShips
    }).as('getMscShips')

    cy.intercept('DELETE', `/cruise/cruise-line/${mscCruiseLineId}`, {
      statusCode: 200,
      body: { message: 'Cruise line deleted successfully' }
    }).as('deleteMscCruiseLine')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()
    cy.wait('@getRoyalShips')

    cy.contains(selectors.cruiseLines.card, 'MSC Cruises')
      .find(selectors.cruiseLines.viewShipsButton)
      .click()
    cy.wait('@getMscShips')

    cy.get(selectors.ships.title).should('contain.text', 'MSC Cruises Ships')
    cy.get(selectors.ships.grid).should('contain.text', 'MSC Seaside')

    stubConfirm(true)
    clickDeleteForCruiseLine('MSC Cruises')

    cy.wait('@deleteMscCruiseLine')
    cy.wait('@getCruiseLines')

    cy.get(selectors.ships.panel).should('not.be.visible')
    cy.get(selectors.ships.grid).should('be.empty')
  })

  it('does not call any delete endpoint when no confirmation is accepted across multiple attempts', () => {
    visitWithCruiseLines()

    cy.intercept('DELETE', '/cruise/cruise-line/*', {
      statusCode: 200,
      body: { message: 'Delete should not run' }
    }).as('anyDeleteCruiseLine')

    stubConfirm(false)
    clickRoyalDelete()
    clickDeleteForCruiseLine('MSC Cruises')

    cy.get('@anyDeleteCruiseLine.all').should('have.length', 0)
    cy.get(selectors.cruiseLines.card).should('have.length', cruiseLines.length)
  })
})
