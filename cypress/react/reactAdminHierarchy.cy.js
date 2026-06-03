const { reactBookings, reactCustomers, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React admin hierarchy coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  function openWorkflowTable() {
    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-customer-workflow-table').should('be.visible')
  }

  it('keeps customer workflows hidden until explicitly opened', () => {
    cy.getByTestId('react-admin-hierarchy').should('be.visible')
    cy.getByTestId('react-hierarchy-summary').should('contain.text', 'Open customer workflows')
    cy.getByTestId('react-customer-workflow-table').should('not.exist')
  })

  it('opens and hides the customer workflow table with summary updates', () => {
    openWorkflowTable()
    cy.getByTestId('react-hierarchy-summary').should('contain.text', 'Customer records are visible')
    cy.getByTestId('react-toggle-customer-workflows').click()
    cy.getByTestId('react-customer-workflow-table').should('not.exist')
  })

  it('filters customer workflows by name, email, loyalty, and booking metadata', () => {
    openWorkflowTable()
    cy.getByTestId('react-hierarchy-search-input').type('alisa')
    cy.getByTestId('react-customer-workflow-table').should('contain.text', 'Alisa')
    cy.getByTestId('react-customer-workflow-table').should('not.contain.text', 'Morgan')
    cy.getByTestId('react-hierarchy-search-input').clear().type('jay.react@example.com')
    cy.getByTestId('react-customer-workflow-table').should('contain.text', 'jay.react@example.com')
    cy.getByTestId('react-hierarchy-search-input').clear().type('RG-100')
    cy.getByTestId('react-customer-workflow-table').should('contain.text', 'RG-100')
    cy.getByTestId('react-hierarchy-search-input').clear().type('G202')
    cy.getByTestId('react-expand-visible-customers').click()
    cy.getByTestId('react-customer-bookings-row').should('contain.text', 'G202')
  })

  it('shows an empty workflow state for unmatched admin searches', () => {
    openWorkflowTable()
    cy.getByTestId('react-hierarchy-search-input').type('zzzz-no-match')
    cy.getByTestId('react-customer-workflow-table').should('contain.text', 'No customer or linked booking records match')
  })

  it('expands and collapses all visible customer rows', () => {
    openWorkflowTable()
    cy.getByTestId('react-expand-visible-customers').click()
    cy.getByTestId('react-customer-bookings-row').should('have.length.at.least', 1)
    cy.getByTestId('react-collapse-visible-customers').click()
    cy.getByTestId('react-customer-bookings-row').should('not.exist')
  })

  it('opens a customer edit draft, validates, and cancels without saving', () => {
    openWorkflowTable()
    cy.getByTestId('react-customer-row').first().within(() => {
      cy.getByTestId('react-edit-customer-button').click()
    })
    cy.getByTestId('react-customer-draft-form').should('be.visible')
    cy.getByTestId('react-validate-customer-draft').click()
    cy.getByTestId('react-customer-draft-form').should('contain.text', 'Draft is valid')
    cy.getByTestId('react-cancel-customer-draft').click()
    cy.getByTestId('react-customer-draft-form').should('not.exist')
  })

  it('saves a customer edit through the React admin table', () => {
    const firstSortedCustomer = reactCustomers[1]

    cy.intercept('PATCH', `/cruise/customers/${firstSortedCustomer.id}`, req => {
      expect(req.body).to.include({ phone: '555-9191' })
      req.reply({ statusCode: 200, body: { ...firstSortedCustomer, ...req.body } })
    }).as('saveReactCustomerDraft')
    cy.intercept('GET', '/cruise/customers', reactCustomers.map(customer => (
      customer.id === firstSortedCustomer.id ? { ...customer, phone: '555-9191' } : customer
    ))).as('reloadCustomersAfterDraft')

    openWorkflowTable()
    cy.getByTestId('react-customer-row').first().within(() => {
      cy.getByTestId('react-edit-customer-button').click()
    })
    cy.getByTestId('react-customer-draft-form').within(() => {
      cy.get('input').eq(3).clear().type('555-9191')
      cy.getByTestId('react-save-customer-draft').click()
    })
    cy.wait('@saveReactCustomerDraft')
    cy.wait('@reloadCustomersAfterDraft')
  })

  it('expands a booking row, shows details, and cancels booking edit', () => {
    openWorkflowTable()
    cy.getByTestId('react-toggle-customer-bookings').first().click()
    cy.getByTestId('react-booking-card').first().within(() => {
      cy.getByTestId('react-toggle-booking-details').click()
      cy.getByTestId('react-booking-details').should('contain.text', 'Fare code')
      cy.getByTestId('react-edit-booking-button').click()
    })
    cy.getByTestId('react-booking-draft-form').should('be.visible')
    cy.getByTestId('react-cancel-booking-draft').click()
    cy.getByTestId('react-booking-draft-form').should('not.exist')
  })

  it('saves a booking edit through the child booking context', () => {
    cy.intercept('PATCH', `/cruise/bookings/${reactBookings[0].id}`, req => {
      expect(req.body).to.include({ cabinNumber: 'P202' })
      req.reply({ statusCode: 200, body: { ...reactBookings[0], ...req.body } })
    }).as('saveReactBookingDraft')
    cy.intercept('GET', '/cruise/bookings', [{ ...reactBookings[0], cabinNumber: 'P202' }, reactBookings[1]]).as('reloadBookingsAfterDraft')

    openWorkflowTable()
    cy.getByTestId('react-toggle-customer-bookings').first().click()
    cy.getByTestId('react-booking-card').first().within(() => {
      cy.getByTestId('react-edit-booking-button').click()
    })
    cy.getByTestId('react-booking-draft-form').within(() => {
      cy.get('input').eq(1).clear().type('P202')
      cy.getByTestId('react-save-booking-draft').click()
    })
    cy.wait('@saveReactBookingDraft')
    cy.wait('@reloadBookingsAfterDraft')
  })

  it('shows native React confirmation when deleting from a customer row and supports cancel', () => {
    openWorkflowTable()
    cy.getByTestId('react-customer-row').first().within(() => {
      cy.getByTestId('react-delete-customer-row-button').click()
    })
    cy.getByTestId('react-admin-delete-confirmation').should('be.visible')
    cy.getByTestId('react-admin-delete-confirmation-cancel').click()
    cy.getByTestId('react-admin-delete-confirmation').should('not.exist')
  })

  it('creates customer and booking records through admin mutation forms', () => {
    cy.intercept('POST', '/cruise/customers', req => {
      expect(req.body).to.include({ firstName: 'React', lastName: 'Tester', email: 'react.tester@example.com' })
      req.reply({ statusCode: 201, body: { id: 'react-customer-new', ...req.body } })
    }).as('createReactAdminCustomer')
    cy.intercept('POST', '/cruise/bookings', req => {
      expect(req.body).to.include({ customerId: 'react-customer-new', cabinNumber: 'N101' })
      req.reply({ statusCode: 201, body: { id: 'react-booking-new', ...req.body } })
    }).as('createReactAdminBooking')
    cy.intercept('GET', '/cruise/customers', reactCustomers).as('reloadCustomersAfterAdminCreate')
    cy.intercept('GET', '/cruise/bookings', reactBookings).as('reloadBookingsAfterAdminCreate')

    cy.getByTestId('react-admin-create-customer-first-name').type('React')
    cy.getByTestId('react-admin-create-customer-last-name').type('Tester')
    cy.getByTestId('react-admin-create-customer-email').type('react.tester@example.com')
    cy.getByTestId('react-admin-create-customer-submit').click()
    cy.wait('@createReactAdminCustomer')

    cy.getByTestId('react-admin-create-booking-customer-id').type('react-customer-new')
    cy.getByTestId('react-admin-create-booking-status').type('CONFIRMED')
    cy.getByTestId('react-admin-create-booking-cabin').type('N101')
    cy.getByTestId('react-admin-create-booking-fare').type('TEST')
    cy.getByTestId('react-admin-create-booking-submit').click()
    cy.wait('@createReactAdminBooking')
  })
})
