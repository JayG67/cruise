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
      .should('have.length.at.least', 10)

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

  it('resets selected cruise workflow panels when switching demo roles', () => {
    cy.get(selectors.cruiseLines.viewShipsButton).first().click()
    cy.get(selectors.ships.panel).should('be.visible')
    cy.get(selectors.ships.viewSailingsButton).first().click()
    cy.get(selectors.sailings.panel).should('be.visible')
    cy.get(selectors.sailings.viewDetailsButton).first().click()
    cy.get(selectors.itinerary.panel).should('be.visible')

    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get(selectors.ships.panel).should('not.be.visible')
    cy.get(selectors.sailings.panel).should('not.be.visible')
    cy.get(selectors.itinerary.panel).should('not.be.visible')
    cy.get(selectors.cruiseLines.card).should('have.length.greaterThan', 0)
    cy.get(selectors.cruiseLines.viewShipsButton).first().should('be.visible')
  })

  it('opens cruise details directly under the selected passenger booked cruise card', () => {
    cy.get(selectors.demoRole.selector).find('option').should('have.length.at.least', 10)
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get(selectors.roleDashboard.bookingCard).first().as('selectedBookingCard')

    cy.get('@selectedBookingCard').within(() => {
      cy.get(selectors.roleDashboard.detailsButton)
        .should('be.visible')
        .and('contain.text', 'View Details')
        .click()
    })

    cy.get('@selectedBookingCard').within(() => {
      cy.get(selectors.roleDashboard.inlineDetails)
        .should('be.visible')
        .and('contain.text', 'Details')

      cy.get(selectors.roleDashboard.inlineItineraryDay)
        .should('have.length.greaterThan', 0)
    })

    cy.get(selectors.itinerary.panel).should('not.be.visible')
  })


  it('labels sailing itinerary actions as future-ready cruise details', () => {
    cy.get(selectors.cruiseLines.viewShipsButton).first().click()
    cy.get(selectors.ships.viewSailingsButton).first().click()

    cy.get(selectors.sailings.viewDetailsButton).first()
      .should('be.visible')
      .and('contain.text', 'View Details')
  })

  it('keeps Jay Gallagher booked only with Alisa Gallagher in passenger booking cards', () => {
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get(selectors.roleDashboard.bookingCard).each($card => {
      cy.wrap($card).should('contain.text', 'Jay Gallagher')
      cy.wrap($card).should('contain.text', 'Alisa Gallagher')
      cy.wrap($card).within(() => {
        cy.get(selectors.roleDashboard.passenger).should('have.length', 2)
      })
    })
  })

  it('shows diverse demo personas beyond the original three role selections', () => {
    cy.get(selectors.demoRole.selector).find('option').should('have.length.at.least', 10)

    cy.get(selectors.demoRole.selector).then($selector => {
      const optionText = [...$selector[0].options].map(option => option.textContent).join(' ')

      expect(optionText).to.include('Alisa Gallagher')
      expect(optionText).to.include('Parker Family')
      expect(optionText).to.include('Kim Couple')
      expect(optionText).to.include('Grace Thompson')
    })
  })

  it('lets a passenger update limited profile and booking preference information', () => {
    cy.intercept('PATCH', '/cruise/customers/*/passenger-profile').as('savePassengerProfile')

    cy.get(selectors.demoRole.selector).find('option').should('have.length.at.least', 10)
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get('[data-testid="passenger-profile-form"]').should('be.visible').within(() => {
      cy.get('input[name="phone"]').clear().type('555-0101')
      cy.get('[data-testid="dining-preference-select"]').select('Late seating')
      cy.get('[data-testid="passenger-profile-submit-button"]').click()
    })

    cy.wait('@savePassengerProfile')
      .its('response.statusCode')
      .should('eq', 200)

    cy.get('[data-testid="passenger-profile-form"]', { timeout: 10000 }).within(() => {
      cy.get('input[name="phone"]').should('have.value', '555-0101')
      cy.get('[data-testid="dining-preference-select"]').should('have.value', 'Late seating')
    })
  })


  it('keeps the passenger profile save button compact while remaining usable', () => {
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get('[data-testid="passenger-profile-submit-button"]').then($button => {
      const rect = $button[0].getBoundingClientRect()

      expect(rect.height).to.be.greaterThan(36)
      expect(rect.width).to.be.lessThan(220)
    })
  })


  it('lets a passenger save itinerary favorites and filter to favorite items', () => {
    cy.get(selectors.demoRole.selector).find('option').should('have.length.at.least', 10)
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get(selectors.roleDashboard.bookingCard).first().within(() => {
      cy.get(selectors.roleDashboard.detailsButton).click()
      cy.get('[data-cy="inline-itinerary-activity"]').should('have.length.at.least', 10)
      cy.get('[data-cy="favorite-toggle-button"]')
        .first()
        .should('have.attr', 'role', 'checkbox')
        .and('have.attr', 'aria-checked', 'false')
        .click()

      cy.get('[data-cy="show-favorite-itinerary-button"]').click()
      cy.get('[data-cy="inline-itinerary-activity"]').should('have.length.at.least', 1)
      cy.get('[data-cy="favorite-toggle-button"]')
        .first()
        .should('have.attr', 'aria-checked', 'true')
        .and('have.class', 'is-favorite')
        .and('contain.text', '★')
    })
  })

  it('keeps multiple booking detail panels open and lets passengers hide each panel', () => {
    cy.get(selectors.demoRole.selector).find('option').should('have.length.at.least', 10)
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get(selectors.roleDashboard.bookingCard).should('have.length.at.least', 2)

    cy.get(selectors.roleDashboard.bookingCard).eq(0).as('firstBooking')
    cy.get(selectors.roleDashboard.bookingCard).eq(1).as('secondBooking')

    cy.get('@firstBooking').within(() => {
      cy.get(selectors.roleDashboard.detailsButton)
        .should('contain.text', 'View Details')
        .and('have.attr', 'aria-expanded', 'false')
        .click()
        .should('contain.text', 'Hide Details')
        .and('have.attr', 'aria-expanded', 'true')

      cy.get(selectors.roleDashboard.inlineDetails).should('be.visible')
    })

    cy.get('@secondBooking').within(() => {
      cy.get(selectors.roleDashboard.detailsButton)
        .should('contain.text', 'View Details')
        .click()
        .should('contain.text', 'Hide Details')

      cy.get(selectors.roleDashboard.inlineDetails).should('be.visible')
    })

    cy.get('@firstBooking').within(() => {
      cy.get(selectors.roleDashboard.inlineDetails).should('be.visible')
      cy.get(selectors.roleDashboard.detailsButton)
        .click()
        .should('contain.text', 'View Details')
        .and('have.attr', 'aria-expanded', 'false')

      cy.get(selectors.roleDashboard.inlineDetails).should('not.be.visible')
    })

    cy.get('@secondBooking').within(() => {
      cy.get(selectors.roleDashboard.inlineDetails).should('be.visible')
    })
  })


})
