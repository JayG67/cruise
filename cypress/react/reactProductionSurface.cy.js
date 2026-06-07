const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { visitReactAppAsAdmin } = require('./support/reactTestHelpers.js')

describe('Cruise operations product surface coverage', () => {
  beforeEach(() => {
    visitReactAppAsAdmin()
  })

  it('keeps the product surface free of development command-center panels', () => {
    cy.getByTestId(rs.productionShell).should('be.visible')
    cy.getByTestId(rs.retiredRouteNav).should('not.exist')
    cy.getByTestId(rs.releaseReadinessSection).should('not.exist')
    cy.getByTestId(rs.activeRouteEvidencePanel).should('not.exist')
    cy.contains('Portfolio evidence for cruise-line software engineering roles').should('not.exist')
    cy.contains('Cruise operations command center').should('not.exist')
  })

  it('keeps product shortcuts focused on real application sections', () => {
    cy.getByTestId(rs.productionHero).within(() => {
      cy.getByTestId(rs.heroOperationsButton).should('contain.text', 'Review Operations')
      cy.getByTestId(rs.heroQualityButton).should('contain.text', 'Open SQA Console')
      cy.get('a[href="/retired"]').should('not.exist')
    })
  })

  it('scrolls workspace controls to live application sections', () => {
    cy.getByTestId(rs.workspaceRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.workspaceOperationsButton).click()
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.workspaceFleetButton).click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.workspaceQualityButton).click()
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('keeps recommended workflow controls wired to application sections', () => {
    cy.getByTestId(rs.workflowRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.workflowOperationsButton).click()
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.workflowFleetButton).click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.workflowQualityButton).click()
    cy.getByTestId(rs.sqaConsole).should('be.visible')
  })

  it('keeps role selector, operations, fleet, and SQA in product order', () => {
    cy.getByTestId(rs.roleSelector).then($roleSelector => {
      cy.getByTestId(rs.activeRouteOperations).then($operations => {
        cy.getByTestId(rs.fleetDirectory).then($fleet => {
          cy.getByTestId(rs.sqaConsole).then($sqa => {
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
    cy.getByTestId(rs.adminMutationPanel).within(() => {
      cy.getByTestId(rs.adminCreateCustomerForm).then($createCustomer => {
        cy.getByTestId(rs.adminDeleteCustomerForm).then($deleteCustomer => {
          cy.getByTestId(rs.adminCreateBookingForm).then($createBooking => {
            cy.getByTestId(rs.adminDeleteBookingForm).then($deleteBooking => {
              expect(Boolean($createCustomer[0].compareDocumentPosition($deleteCustomer[0]) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
              expect(Boolean($createBooking[0].compareDocumentPosition($deleteBooking[0]) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
            })
          })
        })
      })
    })
  })

  it('keeps quality console reports reachable without implementation-history language', () => {
    cy.getByTestId(rs.sqaConsole).within(() => {
      cy.contains('View Quality Dashboard').should('be.visible')
      cy.contains('View Latest Lighthouse Mobile Report').should('be.visible')
      cy.contains('View Latest Jest Coverage Report').should('be.visible')
    })
    cy.contains('production release').should('not.exist')
  })

  it('keeps API refresh controls scoped to workspaces instead of a separate footer panel', () => {
    cy.getByTestId(rs.queryStatusPanel).should('not.exist')
    cy.getByTestId(rs.refreshQuery).should('not.exist')
    cy.getByTestId(rs.sqaConsole).should('be.visible')
    cy.getByTestId(rs.sqaResetDemoDataButton).should('be.visible')
    cy.getByTestId(rs.fleetRefreshButton).should('be.visible')
  })

  it('keeps the hero free of retired rollback links', () => {
    cy.getByTestId(rs.productionHero).within(() => {
      cy.get('a[href="/retired"]').should('not.exist')
      cy.getByTestId(rs.heroQualityButton).should('contain.text', 'Open SQA Console')
    })
  })

  it('keeps the application footer free of redundant API status chrome and review artifacts', () => {
    cy.getByTestId(rs.queryStatusPanel).should('not.exist')
    cy.getByTestId(rs.releaseReadinessSection).should('not.exist')
    cy.getByTestId(rs.retiredHandoffPanel).should('not.exist')
  })
})
