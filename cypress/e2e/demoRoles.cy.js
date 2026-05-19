import { selectors } from '../support/selectors'

describe('Demo role selector UI', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('loads demo role choices and defaults to admin mode', () => {
    cy.get(selectors.demoRole.panel).should('be.visible')
    cy.get(selectors.demoRole.selector).should('be.visible')
    cy.get(selectors.demoRole.summary)
      .should('contain.text', 'Admin Demo User')
      .and('contain.text', 'Admin mode')

    cy.get(selectors.createCruiseLine.panel).should('be.visible')
    cy.get(selectors.cruiseLines.updateButton).first().should('be.visible')
    cy.get(selectors.cruiseLines.deleteButton).first().should('be.visible')
  })

  it('switches to passenger mode and hides admin-only cruise management controls', () => {
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get(selectors.demoRole.summary)
      .should('contain.text', 'Jay Gallagher Passenger View')
      .and('contain.text', 'Passenger')
      .and('contain.text', 'booking')

    cy.get(selectors.createCruiseLine.panel).should('not.be.visible')
    cy.get(selectors.cruiseLines.updateButton).should('not.be.visible')
    cy.get(selectors.cruiseLines.deleteButton).should('not.be.visible')
    cy.get(selectors.cruiseLines.viewShipsButton).first().should('be.visible')
  })

  it('switches back to admin mode and restores admin-only controls', () => {
    cy.get(selectors.demoRole.selector).select('UPASS00001')
    cy.get(selectors.createCruiseLine.panel).should('not.be.visible')

    cy.get(selectors.demoRole.selector).select('UADMIN0001')

    cy.get(selectors.demoRole.summary)
      .should('contain.text', 'Admin Demo User')
      .and('contain.text', 'full cruise data management enabled')

    cy.get(selectors.createCruiseLine.panel).should('be.visible')
    cy.get(selectors.cruiseLines.updateButton).first().should('be.visible')
    cy.get(selectors.cruiseLines.deleteButton).first().should('be.visible')
  })

  it('switches to group leader mode and reports group visibility context', () => {
    cy.get(selectors.demoRole.selector).select('UGROUP0001')

    cy.get(selectors.demoRole.summary)
      .should('contain.text', 'Gallagher Group Leader View')
      .and('contain.text', 'Group Leader')
      .and('contain.text', 'visible customer')
  })
  it('loads every expected role option with descriptive labels', () => {
    cy.get(selectors.demoRole.selector)
      .find('option')
      .should('have.length.at.least', 3)

    cy.get(selectors.demoRole.selector).find('option[value="UADMIN0001"]')
      .should('contain.text', 'Admin')
    cy.get(selectors.demoRole.selector).find('option[value="UPASS00001"]')
      .should('contain.text', 'Passenger')
    cy.get(selectors.demoRole.selector).find('option[value="UGROUP0001"]')
      .should('contain.text', 'Group Leader')
  })

  it('keeps passenger mode read-only across all currently loaded admin controls', () => {
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get('[data-admin-only="true"]').each(($element) => {
      cy.wrap($element).should('not.be.visible')
    })

    cy.get(selectors.cruiseLines.viewShipsButton).first().should('be.visible')
  })

  it('does not lose selected role context after reloading cruise data', () => {
    cy.get(selectors.demoRole.selector).select('UPASS00001')
    cy.get(selectors.demoRole.summary).should('contain.text', 'Passenger')

    cy.get(selectors.testPanel.reloadDataButton).click()

    cy.get(selectors.demoRole.selector).should('have.value', 'UPASS00001')
    cy.get(selectors.demoRole.summary).should('contain.text', 'Passenger')
    cy.get(selectors.createCruiseLine.panel).should('not.be.visible')
  })

  it('restores admin management controls after switching from group leader to admin', () => {
    cy.get(selectors.demoRole.selector).select('UGROUP0001')
    cy.get(selectors.createCruiseLine.panel).should('not.be.visible')

    cy.get(selectors.demoRole.selector).select('UADMIN0001')

    cy.get(selectors.createCruiseLine.panel).should('be.visible')
    cy.get(selectors.cruiseLines.updateButton).first().should('be.visible')
    cy.get(selectors.cruiseLines.deleteButton).first().should('be.visible')
  })

  it('keeps role selector available after switching between all seeded demo personas', () => {
    cy.get(selectors.demoRole.selector).select('UPASS00001')
    cy.get(selectors.demoRole.summary).should('contain.text', 'Jay Gallagher Passenger View')

    cy.get(selectors.demoRole.selector).select('UGROUP0001')
    cy.get(selectors.demoRole.summary).should('contain.text', 'Gallagher Group Leader View')

    cy.get(selectors.demoRole.selector).select('UADMIN0001')
    cy.get(selectors.demoRole.summary).should('contain.text', 'Admin Demo User')
  })

  it('renders admin operations visibility in the role-aware booking dashboard', () => {
    cy.get(selectors.roleDashboard.panel).should('be.visible')
    cy.get(selectors.roleDashboard.title).should('contain.text', 'Admin operations visibility')
    cy.get(selectors.roleDashboard.adminCard)
      .should('contain.text', 'Administrative access')
      .and('contain.text', 'Customers visible')
      .and('contain.text', 'Bookings visible')
    cy.get(selectors.roleDashboard.bookingCard).should('not.exist')
  })

  it('renders passenger booking cards with cabin, route, and visible passenger details', () => {
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get(selectors.roleDashboard.title).should('contain.text', 'Passenger booking dashboard')
    cy.get(selectors.roleDashboard.bookingCard).should('have.length.at.least', 2)
    cy.get(selectors.roleDashboard.bookingCard).first()
      .should('contain.text', 'Booking B')
      .and('contain.text', 'Cabin')
      .and('contain.text', 'Route')
      .and('contain.text', 'Visible passengers')
    cy.get(selectors.roleDashboard.passenger).should('contain.text', 'Jay')
  })

  it('renders group leader booking cards with multiple visible passengers', () => {
    cy.get(selectors.demoRole.selector).select('UGROUP0001')

    cy.get(selectors.roleDashboard.title).should('contain.text', 'Group Leader booking dashboard')
    cy.get(selectors.roleDashboard.bookingCard).should('have.length.at.least', 1)
    cy.get(selectors.roleDashboard.passenger).should('have.length.at.least', 2)
  })

  it('updates the role-aware booking dashboard when switching between admin and passenger roles', () => {
    cy.get(selectors.roleDashboard.adminCard).should('be.visible')

    cy.get(selectors.demoRole.selector).select('UPASS00001')
    cy.get(selectors.roleDashboard.adminCard).should('not.exist')
    cy.get(selectors.roleDashboard.bookingCard).should('have.length.at.least', 1)

    cy.get(selectors.demoRole.selector).select('UADMIN0001')
    cy.get(selectors.roleDashboard.adminCard).should('be.visible')
    cy.get(selectors.roleDashboard.bookingCard).should('not.exist')
  })

})
