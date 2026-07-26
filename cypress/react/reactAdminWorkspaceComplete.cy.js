const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { reactBookings, reactCustomers, visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

function optionLabels(selectorKey) {
  return cy.getByTestId(selectorKey).find('option').then($options => [...$options].map(option => option.text.trim()))
}

function expectOptionLabels(selectorKey, expected) {
  cy.getByTestId(selectorKey).find('option').should($options => {
    const labels = [...$options].map(option => option.text.trim())
    expect(labels).to.deep.equal(expected)
  })
}

describe('React admin workspace complete selector and safeguard coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('renders the complete admin data-management surface and keeps booking creation passenger-led', () => {
    cy.getByTestId(rs.adminHierarchy)
      .should('be.visible')
      .and('contain.text', 'Customer-centered operations')
      .and('contain.text', '3 customers')
      .and('contain.text', '2 linked bookings')

    cy.getByTestId(rs.adminMutationPanel)
      .should('be.visible')
      .and('contain.text', 'Customer records and booking safeguards')

    cy.getByTestId(rs.adminCreateCustomerForm).should('be.visible')
    cy.getByTestId(rs.adminDeleteCustomerForm).should('be.visible')
    cy.getByTestId(rs.adminDeleteBookingForm).should('be.visible')
    cy.getByTestId(rs.adminCreateBookingForm).should('not.exist')

    cy.getByTestId(rs.adminCreateCustomerFirstName).should('be.enabled')
    cy.getByTestId(rs.adminCreateCustomerLastName).should('be.enabled')
    cy.getByTestId(rs.adminCreateCustomerEmail).should('be.enabled')
    cy.getByTestId(rs.adminCreateCustomerPhone).should('be.enabled')
    cy.getByTestId(rs.adminCreateCustomerLoyalty).should('be.enabled')
    cy.getByTestId(rs.adminCreateCustomerSubmit).should('be.enabled')
  })

  it('builds complete sorted customer delete choices from linked booking context', () => {
    expectOptionLabels(rs.adminDeleteCustomerLine, ['All cruise lines', 'Royal Caribbean International'])
    expectOptionLabels(rs.adminDeleteCustomerShip, ['All ships', 'React Icon', 'React Utopia'])
    expectOptionLabels(rs.adminDeleteCustomerLastName, ['All last names', 'Gallagher', 'Leader'])
    expectOptionLabels(rs.adminDeleteCustomerFirstInitial, ['All initials', 'A', 'J', 'M'])

    cy.getByTestId(rs.adminDeleteCustomerId).should('be.enabled')
    optionLabels(rs.adminDeleteCustomerId).should(labels => {
      expect(labels[0]).to.equal('Select a customer')
      expect(labels).to.have.length(reactCustomers.length + 1)
      expect(labels.join(' ')).to.include('Gallagher, Alisa')
      expect(labels.join(' ')).to.include('Gallagher, Jay')
      expect(labels.join(' ')).to.include('Leader, Morgan')
    })
  })

  it('cascades customer delete filters and clears downstream selections when an upstream filter changes', () => {
    cy.getByTestId(rs.adminDeleteCustomerLastName).select('Gallagher')
    expectOptionLabels(rs.adminDeleteCustomerFirstInitial, ['All initials', 'A', 'J'])
    cy.getByTestId(rs.adminDeleteCustomerFirstInitial).select('A')
    cy.getByTestId(rs.adminDeleteCustomerId).select('react-customer-2').should('have.value', 'react-customer-2')

    cy.getByTestId(rs.adminDeleteCustomerShip).select('React Utopia')
    cy.getByTestId(rs.adminDeleteCustomerLastName).should('have.value', '')
    cy.getByTestId(rs.adminDeleteCustomerFirstInitial).should('have.value', '')
    cy.getByTestId(rs.adminDeleteCustomerId).should('have.value', '')
    expectOptionLabels(rs.adminDeleteCustomerLastName, ['All last names', 'Gallagher', 'Leader'])

    cy.getByTestId(rs.adminDeleteCustomerFirstInitial).select('M')
    cy.getByTestId(rs.adminDeleteCustomerId).find('option').should($options => {
      const labels = [...$options].map(option => option.text.trim())
      expect(labels).to.have.length(2)
      expect(labels.join(' ')).to.include('Leader, Morgan')
    })
  })

  it('builds and cascades booking delete choices by ship and primary passenger identity', () => {
    expectOptionLabels(rs.adminDeleteBookingLine, ['All cruise lines', 'Royal Caribbean International'])
    expectOptionLabels(rs.adminDeleteBookingShip, ['All ships', 'React Icon', 'React Utopia'])
    expectOptionLabels(rs.adminDeleteBookingPassengerLastName, ['All last names', 'Gallagher', 'Leader'])
    expectOptionLabels(rs.adminDeleteBookingPassengerFirstInitial, ['All initials', 'J', 'M'])

    cy.getByTestId(rs.adminDeleteBookingShip).select('React Utopia')
    expectOptionLabels(rs.adminDeleteBookingPassengerLastName, ['All last names', 'Leader'])
    cy.getByTestId(rs.adminDeleteBookingPassengerLastName).select('Leader')
    expectOptionLabels(rs.adminDeleteBookingPassengerFirstInitial, ['All initials', 'M'])
    cy.getByTestId(rs.adminDeleteBookingPassengerFirstInitial).select('M')

    optionLabels(rs.adminDeleteBookingId).should(labels => {
      expect(labels).to.have.length(2)
      expect(labels.join(' ')).to.include(reactBookings[1].id)
      expect(labels.join(' ')).to.include('Leader, Morgan')
      expect(labels.join(' ')).to.include('React Utopia')
    })

    cy.getByTestId(rs.adminDeleteBookingId).select(reactBookings[1].id)
    cy.getByTestId(rs.adminDeleteBookingLine).select('Royal Caribbean International')
    cy.getByTestId(rs.adminDeleteBookingShip).should('have.value', '')
    cy.getByTestId(rs.adminDeleteBookingPassengerLastName).should('have.value', '')
    cy.getByTestId(rs.adminDeleteBookingPassengerFirstInitial).should('have.value', '')
    cy.getByTestId(rs.adminDeleteBookingId).should('have.value', '')
  })

  it('opens accurate customer and booking delete confirmations and cancels without a destructive request', () => {
    cy.intercept('DELETE', '/cruise/customers/*').as('unexpectedCustomerDelete')
    cy.intercept('DELETE', '/cruise/bookings/*').as('unexpectedBookingDelete')

    cy.getByTestId(rs.adminDeleteCustomerLastName).select('Leader')
    cy.getByTestId(rs.adminDeleteCustomerId).select('react-customer-3')
    cy.getByTestId(rs.adminDeleteCustomerSubmit).click()
    cy.getByTestId(rs.adminDeleteConfirmation)
      .should('be.visible')
      .and('contain.text', 'react-customer-3')
    cy.getByTestId(rs.adminDeleteConfirmationCancel).click()

    cy.getByTestId(rs.adminDeleteBookingShip).select('React Icon')
    cy.getByTestId(rs.adminDeleteBookingId).select('react-booking-1')
    cy.getByTestId(rs.adminDeleteBookingSubmit).click()
    cy.getByTestId(rs.adminDeleteConfirmation)
      .should('be.visible')
      .and('contain.text', 'react-booking-1')
    cy.getByTestId(rs.adminDeleteConfirmationCancel).click()

    cy.get('@unexpectedCustomerDelete.all').should('have.length', 0)
    cy.get('@unexpectedBookingDelete.all').should('have.length', 0)
  })

  it('keeps the customer workflow selector synchronized with progressive filters', () => {
    expectOptionLabels(rs.hierarchyLineFilter, ['All cruise lines', 'Royal Caribbean International'])
    expectOptionLabels(rs.hierarchyShipFilter, ['All ships', 'React Icon', 'React Utopia'])
    expectOptionLabels(rs.hierarchyCustomerLastNameFilter, ['All last names', 'Gallagher', 'Leader'])
    expectOptionLabels(rs.hierarchyCustomerFirstInitialFilter, ['All initials', 'A', 'J', 'M'])

    cy.getByTestId(rs.hierarchyShipFilter).select('React Icon')
    cy.getByTestId(rs.hierarchyCustomerLastNameFilter).select('Gallagher')
    cy.getByTestId(rs.hierarchyCustomerFirstInitialFilter).select('A')
    cy.getByTestId(rs.hierarchyCustomerFilter).select('react-customer-2')

    cy.getByTestId(rs.hierarchySearchInput).should('have.value', 'Gallagher, Alisa')
    cy.getByTestId(rs.toggleCustomerWorkflows).click()
    cy.getByTestId(rs.customerWorkflowTable)
      .should('be.visible')
      .and('contain.text', 'Alisa')
      .and('not.contain.text', 'Morgan')

    cy.getByTestId(rs.hierarchyLineFilter).select('Royal Caribbean International')
    cy.getByTestId(rs.hierarchyShipFilter).should('have.value', '')
    cy.getByTestId(rs.hierarchyCustomerLastNameFilter).should('have.value', '')
    cy.getByTestId(rs.hierarchyCustomerFirstInitialFilter).should('have.value', '')
    cy.getByTestId(rs.hierarchyCustomerFilter).should('have.value', '')
  })

  it('requires progressive narrowing when a selector exceeds the seventy-five-record safety limit', () => {
    const manyCustomers = Array.from({ length: 80 }, (_, index) => ({
      id: `bulk-customer-${index + 1}`,
      firstName: `Guest${String(index + 1).padStart(2, '0')}`,
      lastName: index < 40 ? 'Alpha' : 'Beta',
      email: `guest${index + 1}@example.com`,
      phone: '',
      loyaltyNumber: ''
    }))

    visitReactAppAsAdmin({ customers: manyCustomers, bookings: [] })

    cy.getByTestId(rs.adminDeleteCustomerId)
      .should('be.disabled')
      .find('option')
      .first()
      .should('have.text', 'Narrow the customer list first')
    cy.getByTestId(rs.hierarchyCustomerFilter).should('be.disabled')

    cy.getByTestId(rs.adminDeleteCustomerLastName).select('Alpha')
    cy.getByTestId(rs.adminDeleteCustomerId).should('be.enabled')
    optionLabels(rs.adminDeleteCustomerId).should('have.length', 41)

    cy.getByTestId(rs.hierarchyCustomerLastNameFilter).select('Beta')
    cy.getByTestId(rs.hierarchyCustomerFilter).should('be.enabled')
    optionLabels(rs.hierarchyCustomerFilter).should('have.length', 41)
  })
})
