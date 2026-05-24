export function openAdminCustomerWorkflows() {
  cy.get('[data-cy="admin-show-customers-button"]').click()
  cy.get('[data-cy="admin-show-customers-button"]')
    .should('contain.text', 'Hide Customer Workflows')
    .and('have.attr', 'aria-expanded', 'true')
  cy.get('[data-cy="admin-customers-panel"]').should('be.visible')
}

export function hideAdminCustomerWorkflows() {
  cy.get('[data-cy="admin-show-customers-button"]').click()
  cy.get('[data-cy="admin-show-customers-button"]')
    .should('contain.text', 'Show Customer Workflows')
    .and('have.attr', 'aria-expanded', 'false')
  cy.get('[data-cy="admin-customers-panel"]').should('not.be.visible')
}

export function searchAdminRecords(searchTerm) {
  cy.get('[data-cy="admin-data-search-input"]').clear().type(searchTerm)
}

export function openAdminCustomerWorkflowsFor(searchTerm) {
  openAdminCustomerWorkflows()
  searchAdminRecords(searchTerm)
}

export function getAdminCustomerRowByName(customerName) {
  return cy.contains('[data-cy="admin-customer-row"]', customerName)
}

export function expandCustomerBookings(customerName) {
  getAdminCustomerRowByName(customerName)
    .find('[data-cy="admin-toggle-customer-bookings-button"]')
    .then($button => {
      const customerId = $button.attr('data-customer-id')

      if ($button.attr('aria-expanded') !== 'true') {
        cy.wrap($button).click()
      }

      cy.wrap($button).should('have.attr', 'aria-expanded', 'true')
      cy.get(`[data-cy="admin-customer-bookings-row-${customerId}"]`)
        .should('be.visible')
    })

  return getAdminCustomerRowByName(customerName)
}

export function collapseCustomerBookings(customerName) {
  getAdminCustomerRowByName(customerName)
    .find('[data-cy="admin-toggle-customer-bookings-button"]')
    .then($button => {
      const customerId = $button.attr('data-customer-id')

      if ($button.attr('aria-expanded') !== 'false') {
        cy.wrap($button).click()
      }

      cy.wrap($button).should('have.attr', 'aria-expanded', 'false')
      cy.get(`[data-cy="admin-customer-bookings-row-${customerId}"]`)
        .should('not.be.visible')
    })
}

export function expandFirstBookingDetails() {
  cy.get('[data-cy="admin-booking-row"]').first().within(() => {
    cy.get('[data-cy="admin-toggle-booking-details-button"]')
      .click()
      .should('have.attr', 'aria-expanded', 'true')
  })
}

export function openFirstBookingEditor() {
  cy.get('[data-cy="admin-booking-row"]')
    .filter(':visible')
    .first()
    .should('be.visible')
    .then($row => {
      const bookingId = $row.attr('data-booking-id')
      cy.wrap(bookingId).as('activeAdminBookingId')

      cy.wrap($row)
        .find('[data-cy="admin-edit-booking-button"]')
        .should('be.visible')
        .scrollIntoView()
        .click()
    })

  cy.get('@activeAdminBookingId').then(bookingId => {
    cy.get(`[data-cy="admin-booking-editor-${bookingId}"]`)
      .filter(':visible')
      .should('have.length', 1)
  })

  cy.get('[data-cy="admin-booking-edit-form"]')
    .should('exist')
    .then($form => {
      $form[0].scrollIntoView({ block: 'center', inline: 'nearest' })
    })
  cy.window().then(win => {
    win.scrollBy(0, -120)
  })
  cy.get('[data-cy="admin-booking-edit-form"] input[name="cabinNumber"]')
    .should('be.visible')
}

export function saveOpenBookingCabin(cabinNumber) {
  cy.get('[data-cy="admin-booking-edit-form"] input[name="cabinNumber"]')
    .clear()
    .type(cabinNumber)
  cy.get('[data-cy="admin-save-booking-button"]').click()
}

export function assertAdminExplanationCardRemoved() {
  cy.get('[data-cy="role-admin-visibility-card"]').should('not.exist')
}

