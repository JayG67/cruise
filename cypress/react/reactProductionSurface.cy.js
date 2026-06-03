const { visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('Cruise operations product surface coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('keeps the product surface free of development command-center panels', () => {
    cy.getByTestId('react-production-shell').should('be.visible')
    cy.getByTestId('react-retired-route-nav').should('not.exist')
    cy.getByTestId('react-release-readiness-section').should('not.exist')
    cy.getByTestId('react-active-route-evidence-panel').should('not.exist')
    cy.contains('Portfolio evidence for cruise-line software engineering roles').should('not.exist')
    cy.contains('Cruise operations command center').should('not.exist')
  })

  it('keeps product shortcuts focused on real application sections', () => {
    cy.getByTestId('react-production-hero').within(() => {
      cy.contains('Review Operations').should('have.attr', 'href', '#react-hierarchy')
      cy.contains('Open SQA Console').should('have.attr', 'href', '#react-quality')
      cy.get('a[href="/retired"]').should('not.exist')
    })
  })

  it('scrolls workspace controls to live application sections', () => {
    cy.getByTestId('react-workspace-role-button').click()
    cy.getByTestId('react-role-selector').should('be.visible')
    cy.getByTestId('react-workspace-operations-button').click()
    cy.getByTestId('react-active-route-operations').should('be.visible')
    cy.getByTestId('react-workspace-fleet-button').click()
    cy.getByTestId('react-fleet-directory').should('be.visible')
    cy.getByTestId('react-workspace-quality-button').click()
    cy.getByTestId('react-sqa-console').should('be.visible')
  })

  it('keeps recommended workflow controls wired to application sections', () => {
    cy.getByTestId('react-workflow-role-button').click()
    cy.getByTestId('react-role-selector').should('be.visible')
    cy.getByTestId('react-workflow-operations-button').click()
    cy.getByTestId('react-active-route-operations').should('be.visible')
    cy.getByTestId('react-workflow-fleet-button').click()
    cy.getByTestId('react-fleet-directory').should('be.visible')
    cy.getByTestId('react-workflow-quality-button').click()
    cy.getByTestId('react-sqa-console').should('be.visible')
  })

  it('keeps role selector, operations, fleet, and SQA in product order', () => {
    cy.getByTestId('react-role-selector').then($roleSelector => {
      cy.getByTestId('react-active-route-operations').then($operations => {
        cy.getByTestId('react-fleet-directory').then($fleet => {
          cy.getByTestId('react-sqa-console').then($sqa => {
            const roleSelector = $roleSelector[0]
            const operations = $operations[0]
            const fleet = $fleet[0]
            const sqa = $sqa[0]

            expect(Boolean(roleSelector.compareDocumentPosition(operations) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
            expect(Boolean(operations.compareDocumentPosition(fleet) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
            expect(Boolean(fleet.compareDocumentPosition(sqa) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
          })
        })
      })
    })
  })

  it('keeps admin create/delete controls paired by customer and booking columns', () => {
    cy.getByTestId('react-admin-mutation-panel').within(() => {
      cy.getByTestId('react-admin-create-customer-form').then($createCustomer => {
        cy.getByTestId('react-admin-delete-customer-form').then($deleteCustomer => {
          cy.getByTestId('react-admin-create-booking-form').then($createBooking => {
            cy.getByTestId('react-admin-delete-booking-form').then($deleteBooking => {
              expect(Boolean($createCustomer[0].compareDocumentPosition($deleteCustomer[0]) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
              expect(Boolean($createBooking[0].compareDocumentPosition($deleteBooking[0]) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
            })
          })
        })
      })
    })
  })

  it('keeps quality console reports reachable without implementation-history language', () => {
    cy.getByTestId('react-sqa-console').within(() => {
      cy.contains('View Quality Dashboard').should('be.visible')
      cy.contains('View Latest Lighthouse Mobile Report').should('be.visible')
      cy.contains('View Latest Jest Coverage Report').should('be.visible')
    })
    cy.contains('production release').should('not.exist')
  })

  it('keeps live API status visible after the SQA console', () => {
    cy.getByTestId('react-query-status-panel').should('be.visible')
    cy.getByTestId('react-query-status-message').should('contain.text', 'Loaded')
    cy.getByTestId('react-refresh-query').should('be.enabled')
  })

  it('keeps the hero free of retired rollback links', () => {
    cy.getByTestId('react-production-hero').within(() => {
      cy.get('a[href="/retired"]').should('not.exist')
      cy.contains('Open SQA Console').should('have.attr', 'href', '#react-quality')
    })
  })

  it('keeps the application footer area focused on API status instead of review artifacts', () => {
    cy.getByTestId('react-query-status-panel').scrollIntoView().should('be.visible')
    cy.getByTestId('react-release-readiness-section').should('not.exist')
    cy.getByTestId('react-retired-handoff-panel').should('not.exist')
  })
})
