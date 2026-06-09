const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactBookings, reactCustomers, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('React admin hierarchy coverage expansion', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  function openWorkflowTable() {
    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.customerWorkflowTable).should('be.visible')
  }

  it('keeps customer workflows hidden until explicitly opened', () => {
    cy.getByTestId(rs.adminHierarchy).should('be.visible')
    cy.getByTestId(rs.hierarchySummary).should('contain.text', 'Open customer workflows')
    cy.getByTestId(rs.customerWorkflowTable).should('not.exist')
  })

  it('opens and hides the customer workflow table with summary updates', () => {
    openWorkflowTable()
    cy.getByTestId(rs.hierarchySummary).should('contain.text', 'Customer records are visible')
    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.customerWorkflowTable).should('not.exist')
  })

  it('filters customer workflows by name, email, loyalty, and booking metadata', () => {
    openWorkflowTable()
    cy.getByTestId(rs.hierarchySearchInput).type('alisa')
    cy.getByTestId(rs.customerWorkflowTable).should('contain.text', 'Alisa')
    cy.getByTestId(rs.customerWorkflowTable).should('not.contain.text', 'Morgan')
    cy.getByTestId(rs.hierarchySearchInput).clear().type('jay.react@example.com')
    cy.getByTestId(rs.customerWorkflowTable).should('contain.text', 'jay.react@example.com')
    cy.getByTestId(rs.hierarchySearchInput).clear().type('RG-100')
    cy.getByTestId(rs.customerWorkflowTable).should('contain.text', 'RG-100')
    cy.getByTestId(rs.hierarchySearchInput).clear().type('G202')
    cy.getByTestId(rs.expandVisibleCustomers).click()
    cy.getByTestId(rs.customerBookingsRow).should('contain.text', 'G202')
  })

  it('shows an empty workflow state for unmatched admin searches', () => {
    openWorkflowTable()
    cy.getByTestId(rs.hierarchySearchInput).type('zzzz-no-match')
    cy.getByTestId(rs.customerWorkflowTable).should('contain.text', 'No customer or linked booking records match')
  })

  it('expands and collapses all visible customer rows', () => {
    openWorkflowTable()
    cy.getByTestId(rs.expandVisibleCustomers).click()
    cy.getByTestId(rs.customerBookingsRow).should('have.length.at.least', 1)
    cy.getByTestId(rs.collapseVisibleCustomers).click()
    cy.getByTestId(rs.customerBookingsRow).should('not.exist')
  })

  it('opens a customer edit draft, validates, and cancels without saving', () => {
    openWorkflowTable()
    cy.getByTestId(rs.customerRow).first().within(() => {
      cy.getByTestId(rs.editCustomerButton).click()
    })
    cy.getByTestId(rs.customerDraftForm).should('be.visible')
    cy.getByTestId(rs.validateCustomerDraft).click()
    cy.getByTestId(rs.customerDraftForm).should('contain.text', 'Draft is valid')
    cy.getByTestId(rs.cancelCustomerDraft).click()
    cy.getByTestId(rs.customerDraftForm).should('not.exist')
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
    cy.getByTestId(rs.customerRow).first().within(() => {
      cy.getByTestId(rs.editCustomerButton).click()
    })
    cy.getByTestId(rs.customerDraftForm).within(() => {
      cy.get('input').eq(3).clear().type('555-9191')
      cy.getByTestId(rs.saveCustomerDraft).click()
    })
    cy.wait('@saveReactCustomerDraft')
    cy.wait('@reloadCustomersAfterDraft')
  })

  it('expands a booking row, shows details, and cancels booking edit', () => {
    openWorkflowTable()
    cy.getByTestId(rs.toggleCustomerBookings).first().click()
    cy.getByTestId(rs.bookingCard).first().within(() => {
      cy.getByTestId(rs.toggleBookingDetails).click()
      cy.getByTestId(rs.bookingDetails).should('contain.text', 'Fare code')
      cy.getByTestId(rs.editBookingButton).click()
    })
    cy.getByTestId(rs.bookingDraftForm).should('be.visible')
    cy.getByTestId(rs.cancelBookingDraft).click()
    cy.getByTestId(rs.bookingDraftForm).should('not.exist')
  })

  it('saves a booking edit through the child booking context', () => {
    cy.intercept('PATCH', `/cruise/bookings/${reactBookings[0].id}`, req => {
      expect(req.body).to.include({ cabinNumber: 'P202' })
      req.reply({ statusCode: 200, body: { ...reactBookings[0], ...req.body } })
    }).as('saveReactBookingDraft')
    cy.intercept('GET', '/cruise/bookings', [{ ...reactBookings[0], cabinNumber: 'P202' }, reactBookings[1]]).as('reloadBookingsAfterDraft')

    openWorkflowTable()
    cy.getByTestId(rs.toggleCustomerBookings).first().click()
    cy.getByTestId(rs.bookingCard).first().within(() => {
      cy.getByTestId(rs.editBookingButton).click()
    })
    cy.getByTestId(rs.bookingDraftForm).within(() => {
      cy.get('input').eq(1).clear().type('P202')
      cy.getByTestId(rs.saveBookingDraft).click()
    })
    cy.wait('@saveReactBookingDraft')
    cy.wait('@reloadBookingsAfterDraft')
  })

  it('shows native React confirmation when deleting from a customer row and supports cancel', () => {
    openWorkflowTable()
    cy.getByTestId(rs.customerRow).first().within(() => {
      cy.getByTestId(rs.deleteCustomerRowButton).click()
    })
    cy.getByTestId(rs.adminDeleteConfirmationOverlay).should('be.visible')
    cy.getByTestId(rs.adminDeleteConfirmation).should('be.visible')
    cy.getByTestId(rs.adminDeleteConfirmationCancel).click()
    cy.getByTestId(rs.adminDeleteConfirmation).should('not.exist')
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

    cy.getByTestId(rs.adminCreateCustomerFirstName).type('React')
    cy.getByTestId(rs.adminCreateCustomerLastName).type('Tester')
    cy.getByTestId(rs.adminCreateCustomerEmail).type('react.tester@example.com')
    cy.getByTestId(rs.adminCreateCustomerSubmit).click()
    cy.wait('@createReactAdminCustomer')

    cy.getByTestId(rs.adminCreateBookingCustomerId).type('react-customer-new')
    cy.getByTestId(rs.adminCreateBookingStatus).type('CONFIRMED')
    cy.getByTestId(rs.adminCreateBookingCabin).type('N101')
    cy.getByTestId(rs.adminCreateBookingFare).type('TEST')
    cy.getByTestId(rs.adminCreateBookingSubmit).click()
    cy.wait('@createReactAdminBooking')
  })
})
