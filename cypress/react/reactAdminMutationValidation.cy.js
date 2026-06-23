const { byTestId, reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactBookings, reactCustomers, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React admin mutation validation coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  function openWorkflowTable() {
    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.customerWorkflowTable).should('be.visible')
  }

  it('keeps create customer validation client-side when required fields are missing', () => {
    cy.intercept('POST', '/cruise/customers').as('unexpectedCustomerCreate')
    cy.getByTestId(rs.adminCreateCustomerSubmit).click()
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'First name, last name, and email are required')
    cy.get('@unexpectedCustomerCreate.all').should('have.length', 0)
  })

  it('trims create customer values before sending the API payload', () => {
    cy.intercept('POST', '/cruise/customers', req => {
      expect(req.body).to.include({
        firstName: 'Trimmed',
        lastName: 'Customer',
        email: 'trimmed.react@example.com',
        phone: '555-2222',
        loyaltyNumber: 'TRIM-1'
      })
      req.reply({ statusCode: 201, body: { id: 'react-trimmed-customer', ...req.body } })
    }).as('createTrimmedCustomer')
    cy.intercept('GET', '/cruise/customers', [...reactCustomers, {
      id: 'react-trimmed-customer',
      firstName: 'Trimmed',
      lastName: 'Customer',
      email: 'trimmed.react@example.com',
      phone: '555-2222',
      loyaltyNumber: 'TRIM-1'
    }]).as('reloadAfterTrimmedCustomer')

    cy.getByTestId(rs.adminCreateCustomerFirstName).type('  Trimmed  ')
    cy.getByTestId(rs.adminCreateCustomerLastName).type('  Customer  ')
    cy.getByTestId(rs.adminCreateCustomerEmail).type('  trimmed.react@example.com  ')
    cy.getByTestId(rs.adminCreateCustomerPhone).type('  555-2222  ')
    cy.getByTestId(rs.adminCreateCustomerLoyalty).type('  TRIM-1  ')
    cy.getByTestId(rs.adminCreateCustomerSubmit).click()

    cy.wait('@createTrimmedCustomer')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Trimmed Customer was created through the React admin workspace.')
  })

  it('surfaces customer create API failures without clearing draft inputs', () => {
    cy.intercept('POST', '/cruise/customers', {
      statusCode: 500,
      body: { message: 'Customer create failed from test' }
    }).as('createCustomerFailure')

    cy.getByTestId(rs.adminCreateCustomerFirstName).type('Failure')
    cy.getByTestId(rs.adminCreateCustomerLastName).type('Case')
    cy.getByTestId(rs.adminCreateCustomerEmail).type('failure.case@example.com')
    cy.getByTestId(rs.adminCreateCustomerSubmit).click()

    cy.wait('@createCustomerFailure')
    cy.getByTestId(rs.adminMutationMessage).should('contain.text', 'Customer create failed from test')
    cy.getByTestId(rs.adminCreateCustomerEmail).should('have.value', 'failure.case@example.com')
  })

  it('validates direct customer delete form before API submission', () => {
    cy.intercept('DELETE', '/cruise/customers/*').as('unexpectedCustomerDelete')
    cy.getByTestId(rs.adminDeleteCustomerSubmit).click()
    cy.getByTestId(rs.adminMutationMessage)
      .invoke('text')
      .should('match', /Customer id is required|Customer ID is required/)
    cy.get('@unexpectedCustomerDelete.all').should('have.length', 0)
  })

  it('validates direct booking delete form before API submission', () => {
    cy.intercept('DELETE', '/cruise/bookings/*').as('unexpectedBookingDelete')
    cy.getByTestId(rs.adminDeleteBookingSubmit).click()
    cy.getByTestId(rs.adminMutationMessage)
      .invoke('text')
      .should('match', /Booking id is required|Booking ID is required/)
    cy.get('@unexpectedBookingDelete.all').should('have.length', 0)
  })

  it('deletes a booking by explicit id through the admin mutation form', () => {
    cy.intercept('DELETE', `/cruise/bookings/${reactBookings[0].id}`, {
      statusCode: 200,
      body: { id: reactBookings[0].id, deleted: true }
    }).as('deleteBookingById')
    cy.intercept('GET', '/cruise/bookings', [reactBookings[1]]).as('reloadBookingsAfterDeleteById')

    cy.getByTestId(rs.adminDeleteBookingId).select(reactBookings[0].id)
    cy.getByTestId(rs.adminDeleteBookingSubmit).click()
    cy.getByTestId(rs.adminDeleteConfirmation).should('contain.text', reactBookings[0].id)
    cy.getByTestId(rs.adminDeleteConfirmationConfirm).click()

    cy.wait('@deleteBookingById')
    cy.getByTestId(rs.adminMutationMessage)
      .invoke('text')
      .should('match', new RegExp(`Booking ${reactBookings[0].id} was deleted|${reactBookings[0].id} booking was deleted`))
  })

  it('keeps customer delete cancellation scoped to the explicit id form', () => {
    cy.intercept('DELETE', `/cruise/customers/${reactCustomers[0].id}`).as('unexpectedCustomerDeleteAfterCancel')

    cy.getByTestId(rs.adminDeleteCustomerId).select(reactCustomers[0].id)
    cy.getByTestId(rs.adminDeleteCustomerSubmit).click()
    cy.getByTestId(rs.adminDeleteConfirmation).should('contain.text', reactCustomers[0].id)
    cy.getByTestId(rs.adminDeleteConfirmationCancel).click()
    cy.getByTestId(rs.adminDeleteConfirmation).should('not.exist')
    cy.get('@unexpectedCustomerDeleteAfterCancel.all').should('have.length', 0)
  })

  it('keeps edit validation isolated inside the expanded customer workflow', () => {
    openWorkflowTable()
    cy.getByTestId(rs.customerRow).first().within(() => {
      cy.getByTestId(rs.editCustomerButton).click()
    })
    cy.getByTestId(rs.customerDraftForm).within(() => {
      cy.get('input').first().clear()
      cy.getByTestId(rs.validateCustomerDraft).click()
      cy.root().should('contain.text', 'First name is required')
    })
    cy.get('body').then($body => {
      const adminMessage = $body.find(byTestId(rs.adminMutationMessage))
      if (adminMessage.length) {
        cy.wrap(adminMessage).should('not.contain.text', 'First name is required')
      }
    })
  })
})
