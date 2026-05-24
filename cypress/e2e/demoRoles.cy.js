import { selectors } from '../support/selectors'
import {
  collapseCustomerBookings,
  expandCustomerBookings,
  getAdminCustomerRowByName,
  hideAdminCustomerWorkflows,
  openAdminCustomerWorkflows,
  openAdminCustomerWorkflowsFor,
  openFirstBookingEditor,
  saveOpenBookingCabin,
  searchAdminRecords
} from '../support/adminWorkflows'

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

  it('renders a compact admin workspace without explanatory role cards taking application space', () => {
    cy.get(selectors.roleDashboard.panel).should('be.visible')
    cy.get(selectors.roleDashboard.title).should('contain.text', 'Admin workspace')
    cy.get(selectors.roleDashboard.description)
      .should('contain.text', 'expand linked bookings inline')
      .and('contain.text', 'edit records from the same workflow table')
    cy.get(selectors.roleDashboard.adminCard).should('not.exist')
    cy.get('[data-cy="admin-data-management-panel"]').should('be.visible')
    cy.get(selectors.roleDashboard.bookingCard).should('not.exist')
  })

  it('keeps admin customer workflows hidden by default while search remains available', () => {
    cy.get('[data-cy="admin-data-management-panel"]').should('be.visible')
    cy.get('[data-cy="admin-data-search-input"]')
      .should('be.visible')
      .and('have.attr', 'placeholder')
      .and('include', 'Search customers, linked bookings')

    cy.get('[data-cy="admin-customers-panel"]')
      .should('not.be.visible')
      .and('have.attr', 'aria-hidden', 'true')
    cy.get('[data-cy="admin-bookings-panel"]').should('not.exist')
    cy.get('[data-cy="admin-customer-row"]').should('not.exist')
    cy.get('[data-cy="admin-booking-row"]').should('not.exist')

    cy.get('[data-cy="admin-show-customers-button"]')
      .should('contain.text', 'Show Customer Workflows')
      .and('have.attr', 'aria-expanded', 'false')
    cy.get('[data-cy="admin-show-bookings-button"]').should('not.exist')
  })

  it('searches customer and linked booking records before the workflow table is opened', () => {
    cy.get('[data-cy="admin-data-search-input"]').clear().type('Alisa')

    cy.get('[data-cy="admin-data-message"]')
      .should('contain.text', 'Search found')
      .and('contain.text', 'customer workflow')
      .and('contain.text', 'linked booking')

    cy.get('[data-cy="admin-customer-row"]').should('not.exist')
    cy.get('[data-cy="admin-booking-row"]').should('not.exist')
  })

  it('lets admin show, search, and hide customer-centered workflows from the role dashboard', () => {
    openAdminCustomerWorkflows()

    cy.get('[data-cy="admin-customer-table-wrap"]').should('be.visible')
    cy.get('[data-cy="admin-customer-row"]').should('have.length.at.least', 20)

    searchAdminRecords('Alisa')
    cy.get('[data-cy="admin-customer-results-summary"]').should('contain.text', 'customer workflow')
    getAdminCustomerRowByName('Alisa Gallagher')
      .should('contain.text', 'Alisa Gallagher')
      .and('contain.text', '2 bookings')

    expandCustomerBookings('Alisa Gallagher')
    cy.get('[data-cy="admin-booking-row"]')
      .first()
      .should('contain.text', 'Alisa Gallagher')

    hideAdminCustomerWorkflows()
    cy.get('[data-cy="admin-customer-row"]').should('not.exist')
  })

  it('expands customer rows to show linked booking child rows and collapses them again', () => {
    openAdminCustomerWorkflowsFor('Jay Gallagher')

    expandCustomerBookings('Jay Gallagher')
      .find('[data-cy="admin-toggle-customer-bookings-button"]')
      .should('have.attr', 'aria-label')
      .and('include', 'Hide bookings')

    cy.get('[data-cy^="admin-customer-bookings-row-"]')
      .filter(':visible')
      .first()
      .within(() => {
        cy.get('[data-cy="admin-booking-row"]').should('have.length.at.least', 1)
      })

    collapseCustomerBookings('Jay Gallagher')
    cy.get('[data-cy^="admin-customer-bookings-row-"]').filter(':visible').should('not.exist')
  })

  it('expands booking detail panels within a customer workflow and collapses them again', () => {
    cy.get('[data-cy="admin-show-customers-button"]').click()
    cy.get('[data-cy="admin-data-search-input"]').clear().type('Jay Gallagher')
    cy.get('[data-cy="admin-customer-row"]').first().find('[data-cy="admin-toggle-customer-bookings-button"]').click()

    cy.get('[data-cy="admin-booking-row"]').first().within(() => {
      cy.get('[data-cy="admin-toggle-booking-details-button"]')
        .should('contain.text', 'Details')
        .and('have.attr', 'aria-expanded', 'false')
        .click()
    })

    cy.get('[data-cy^="admin-booking-details-row-"]')
      .filter(':visible')
      .first()
      .within(() => {
        cy.get('[data-cy="admin-booking-details-panel"]')
          .should('be.visible')
          .and('contain.text', 'Fare code')
      })

    cy.get('[data-cy="admin-booking-row"]').first().within(() => {
      cy.get('[data-cy="admin-toggle-booking-details-button"]')
        .should('contain.text', 'Hide')
        .and('have.attr', 'aria-expanded', 'true')
        .click()
    })

    cy.get('[data-cy^="admin-booking-details-row-"]').filter(':visible').should('have.length', 0)
    cy.get('[data-cy="admin-booking-row"]').first().within(() => {
      cy.get('[data-cy="admin-toggle-booking-details-button"]').should('contain.text', 'Details')
    })
  })

  it('renders customer and child booking data in one scrollable parent-child table only when requested', () => {
    cy.get('[data-cy="admin-customer-table-wrap"]').should('not.exist')
    cy.get('[data-cy="admin-booking-table-wrap"]').should('not.exist')

    cy.get('[data-cy="admin-show-customers-button"]').click()
    cy.get('[data-cy="admin-customer-table-wrap"]')
      .should('be.visible')
      .and($wrap => {
        expect($wrap[0].scrollHeight).to.be.greaterThan($wrap[0].clientHeight)
      })
  })

  it('lets admin open and save a customer edit workflow from the parent row', () => {
    cy.intercept('PATCH', '/cruise/customers/*').as('adminCustomerUpdate')

    cy.get('[data-cy="admin-show-customers-button"]').click()
    cy.get('[data-cy="admin-data-search-input"]').clear().type('Jay Gallagher')
    getAdminCustomerRowByName('Jay Gallagher').within(() => {
      cy.get('[data-cy="admin-edit-customer-button"]').click()
    })

    cy.get('[data-cy="admin-customer-edit-form"]')
      .scrollIntoView({ block: 'center' })
      .should('be.visible')
    cy.get('[data-cy="admin-customer-edit-form"] input[name="phone"]')
      .scrollIntoView({ block: 'center' })
      .clear()
      .type('555-3434')
    cy.get('[data-cy="admin-save-customer-button"]').click()

    cy.wait('@adminCustomerUpdate').then(interception => {
      expect(interception.response.statusCode).to.eq(200)
      expect(interception.request.body.phone).to.eq('555-3434')
    })
    cy.get('[data-cy="admin-data-message"]').should('contain.text', 'Customer updated successfully')
    getAdminCustomerRowByName('Jay Gallagher').should('contain.text', 'Jay Gallagher')
  })

  it('lets admin open and save a booking edit workflow from an expanded child row', () => {
    cy.intercept('PATCH', '/cruise/bookings/*').as('adminBookingUpdate')

    openAdminCustomerWorkflowsFor('Jay Gallagher')
    expandCustomerBookings('Jay Gallagher')

    cy.get('[data-cy^="admin-customer-bookings-row-"]')
      .filter(':visible')
      .first()
      .within(() => {
        cy.get('[data-cy="admin-edit-booking-button"]')
          .first()
          .should('be.visible')
      })

    openFirstBookingEditor()
    saveOpenBookingCabin('9090')

    cy.wait('@adminBookingUpdate').then(interception => {
      expect([200, 204]).to.include(interception.response.statusCode)
    })

    cy.get('[data-cy="admin-data-message"]').should('contain.text', 'Booking updated successfully')
    cy.get('@activeAdminBookingId').then(bookingId => {
      cy.get(`[data-cy="admin-booking-row"][data-booking-id="${bookingId}"]`)
        .should('contain.text', '9090')
    })
  })

  it('hides admin search and data panels when a passenger role is selected', () => {
    cy.get('[data-cy="admin-data-search-input"]').should('be.visible')
    cy.get(selectors.demoRole.selector).select('UPASS00001')

    cy.get('[data-cy="admin-data-management-panel"]').should('not.exist')
    cy.get('[data-cy="admin-data-search-input"]').should('not.exist')
    cy.get('[data-cy="admin-customer-row"]').should('not.exist')
    cy.get('[data-cy="admin-booking-row"]').should('not.exist')
    cy.get(selectors.roleDashboard.bookingCard).should('have.length.at.least', 1)
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
    cy.get('[data-cy="admin-data-management-panel"]').should('be.visible')
    cy.get(selectors.roleDashboard.adminCard).should('not.exist')

    cy.get(selectors.demoRole.selector).select('UPASS00001')
    cy.get('[data-cy="admin-data-management-panel"]').should('not.exist')
    cy.get(selectors.roleDashboard.adminCard).should('not.exist')
    cy.get(selectors.roleDashboard.bookingCard).should('have.length.at.least', 1)

    cy.get(selectors.demoRole.selector).select('UADMIN0001')
    cy.get('[data-cy="admin-data-management-panel"]').should('be.visible')
    cy.get(selectors.roleDashboard.adminCard).should('not.exist')
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
        .then($button => {
          if ($button.attr('aria-checked') === 'true') {
            cy.wrap($button).click()
            cy.get('[data-cy="favorite-toggle-button"]')
              .first()
              .should('have.attr', 'aria-checked', 'false')
          }
        })

      cy.get('[data-cy="favorite-toggle-button"]').first().click()
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
