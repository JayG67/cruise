const { reactBookings, reactCustomers, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React admin mutation validation parity expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  function openWorkflowTable() {
    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-customer-workflow-table').should('be.visible')
  }

  it('keeps create customer validation client-side when required fields are missing', () => {
    cy.intercept('POST', '/cruise/customers').as('unexpectedCustomerCreate')
    cy.getByTestId('react-admin-create-customer-submit').click()
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'First name, last name, and email are required')
    cy.get('@unexpectedCustomerCreate.all').should('have.length', 0)
  })

  it('keeps create booking validation client-side when required fields are missing', () => {
    cy.intercept('POST', '/cruise/bookings').as('unexpectedBookingCreate')
    cy.getByTestId('react-admin-create-booking-submit').click()
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'Customer ID, booking status, and cabin number are required')
    cy.get('@unexpectedBookingCreate.all').should('have.length', 0)
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

    cy.getByTestId('react-admin-create-customer-first-name').type('  Trimmed  ')
    cy.getByTestId('react-admin-create-customer-last-name').type('  Customer  ')
    cy.getByTestId('react-admin-create-customer-email').type('  trimmed.react@example.com  ')
    cy.getByTestId('react-admin-create-customer-phone').type('  555-2222  ')
    cy.getByTestId('react-admin-create-customer-loyalty').type('  TRIM-1  ')
    cy.getByTestId('react-admin-create-customer-submit').click()

    cy.wait('@createTrimmedCustomer')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'Trimmed Customer was created through the React admin workspace.')
  })

  it('trims create booking values before sending the API payload', () => {
    cy.intercept('POST', '/cruise/bookings', req => {
      expect(req.body).to.include({
        customerId: reactCustomers[0].id,
        bookingStatus: 'CONFIRMED',
        cabinNumber: 'T505',
        fareCode: 'SUITE',
        embarkationPort: 'Miami',
        debarkationPort: 'Nassau'
      })
      req.reply({ statusCode: 201, body: { id: 'react-booking-trimmed', ...req.body } })
    }).as('createTrimmedBooking')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reloadBookingsAfterTrimmedCreate')

    cy.getByTestId('react-admin-create-booking-customer-id').type(`  ${reactCustomers[0].id}  `)
    cy.getByTestId('react-admin-create-booking-status').clear().type('  CONFIRMED  ')
    cy.getByTestId('react-admin-create-booking-cabin').type('  T505  ')
    cy.getByTestId('react-admin-create-booking-fare').type('  SUITE  ')
    cy.getByTestId('react-admin-create-booking-embarkation').type('  Miami  ')
    cy.getByTestId('react-admin-create-booking-debarkation').type('  Nassau  ')
    cy.getByTestId('react-admin-create-booking-submit').click()

    cy.wait('@createTrimmedBooking')
    cy.getByTestId('react-admin-mutation-message')
      .invoke('text')
      .should('match', /Booking react-booking-trimmed was created|react-booking-trimmed booking was created/)
  })

  it('surfaces customer create API failures without clearing draft inputs', () => {
    cy.intercept('POST', '/cruise/customers', {
      statusCode: 500,
      body: { message: 'Customer create failed from test' }
    }).as('createCustomerFailure')

    cy.getByTestId('react-admin-create-customer-first-name').type('Failure')
    cy.getByTestId('react-admin-create-customer-last-name').type('Case')
    cy.getByTestId('react-admin-create-customer-email').type('failure.case@example.com')
    cy.getByTestId('react-admin-create-customer-submit').click()

    cy.wait('@createCustomerFailure')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'Customer create failed from test')
    cy.getByTestId('react-admin-create-customer-email').should('have.value', 'failure.case@example.com')
  })

  it('surfaces booking create API failures without clearing draft inputs', () => {
    cy.intercept('POST', '/cruise/bookings', {
      statusCode: 500,
      body: { message: 'Booking create failed from test' }
    }).as('createBookingFailure')

    cy.getByTestId('react-admin-create-booking-customer-id').type(reactCustomers[0].id)
    cy.getByTestId('react-admin-create-booking-status').type('PENDING')
    cy.getByTestId('react-admin-create-booking-cabin').type('ERR1')
    cy.getByTestId('react-admin-create-booking-fare').type('TEST')
    cy.getByTestId('react-admin-create-booking-submit').click()

    cy.wait('@createBookingFailure')
    cy.getByTestId('react-admin-mutation-message').should('contain.text', 'Booking create failed from test')
    cy.getByTestId('react-admin-create-booking-cabin').should('have.value', 'ERR1')
  })

  it('validates direct customer delete form before API submission', () => {
    cy.intercept('DELETE', '/cruise/customers/*').as('unexpectedCustomerDelete')
    cy.getByTestId('react-admin-delete-customer-submit').click()
    cy.getByTestId('react-admin-mutation-message')
      .invoke('text')
      .should('match', /Customer id is required|Customer ID is required/)
    cy.get('@unexpectedCustomerDelete.all').should('have.length', 0)
  })

  it('validates direct booking delete form before API submission', () => {
    cy.intercept('DELETE', '/cruise/bookings/*').as('unexpectedBookingDelete')
    cy.getByTestId('react-admin-delete-booking-submit').click()
    cy.getByTestId('react-admin-mutation-message')
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

    cy.getByTestId('react-admin-delete-booking-id').type(reactBookings[0].id)
    cy.getByTestId('react-admin-delete-booking-submit').click()
    cy.getByTestId('react-admin-delete-confirmation').should('contain.text', reactBookings[0].id)
    cy.getByTestId('react-admin-delete-confirmation-confirm').click()

    cy.wait('@deleteBookingById')
    cy.getByTestId('react-admin-mutation-message')
      .invoke('text')
      .should('match', new RegExp(`Booking ${reactBookings[0].id} was deleted|${reactBookings[0].id} booking was deleted`))
  })

  it('keeps customer delete cancellation scoped to the explicit id form', () => {
    cy.intercept('DELETE', `/cruise/customers/${reactCustomers[0].id}`).as('unexpectedCustomerDeleteAfterCancel')

    cy.getByTestId('react-admin-delete-customer-id').type(reactCustomers[0].id)
    cy.getByTestId('react-admin-delete-customer-submit').click()
    cy.getByTestId('react-admin-delete-confirmation').should('contain.text', reactCustomers[0].id)
    cy.getByTestId('react-admin-delete-confirmation-cancel').click()
    cy.getByTestId('react-admin-delete-confirmation').should('not.exist')
    cy.get('@unexpectedCustomerDeleteAfterCancel.all').should('have.length', 0)
  })

  it('keeps edit validation isolated inside the expanded customer workflow', () => {
    openWorkflowTable()
    cy.getByTestId('react-customer-row').first().within(() => {
      cy.getByTestId('react-edit-customer-button').click()
    })
    cy.getByTestId('react-customer-draft-form').within(() => {
      cy.get('input').first().clear()
      cy.getByTestId('react-validate-customer-draft').click()
      cy.root().should('contain.text', 'First name is required')
    })
    cy.get('body').then($body => {
      const adminMessage = $body.find('[data-testid="react-admin-mutation-message"]')
      if (adminMessage.length) {
        cy.wrap(adminMessage).should('not.contain.text', 'First name is required')
      }
    })
  })
})
