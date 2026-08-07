const { reactSelectorKeys: rs } = require('./support/reactSelectors')
const { visitReactAppAsAdmin, selectDemoUserByVisibleRole } = require('./support/reactTestHelpers.js')

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
    cy.getByTestId(rs.platformOverviewCommandCenter).should('be.visible')
  })



  it('shows the operations overview only for admin users', () => {
    cy.getByTestId(rs.platformOverviewCommandCenter).should('be.visible')
    selectDemoUserByVisibleRole('Turnaround Manager')
    cy.getByTestId(rs.turnaroundManagerDashboard).should('be.visible')
    cy.getByTestId(rs.platformOverviewCommandCenter).should('not.exist')
  })

  it('keeps product shortcuts focused on real application sections', () => {
    cy.getByTestId(rs.productionHero).within(() => {
      cy.getByTestId(rs.heroDemoButton).should('contain.text', 'Explore Platform')
      cy.getByTestId(rs.heroOperationsButton).should('contain.text', 'Review Operations')
      cy.getByTestId(rs.heroIntelligenceButton).should('contain.text', 'Review Operations Intelligence')
      cy.get('a[href="/retired"]').should('not.exist')
    })
  })

  it('scrolls workspace controls to live application sections', () => {
    cy.getByTestId(rs.heroDemoButton).click()
    cy.getByTestId(rs.platformOverviewCommandCenter).should('be.visible')
    cy.getByTestId(rs.workspaceRoleButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.workspaceOperationsButton).click()
    cy.getByTestId(rs.activeRouteOperations).should('be.visible')
    cy.getByTestId(rs.workspaceFleetButton).click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.workspaceIntelligenceButton).click()
    cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')
  })

  it('keeps self-guided overview controls wired to application sections', () => {
    cy.getByTestId(rs.platformOverviewRolesButton).click()
    cy.getByTestId(rs.roleSelector).should('be.visible')
    cy.getByTestId(rs.platformOverviewFleetButton).click()
    cy.getByTestId(rs.fleetDirectory).should('be.visible')
    cy.getByTestId(rs.platformOverviewIntelligenceButton).click()
    cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')
  })

  it('keeps role selector, operations, fleet, and operational risk in product order', () => {
    cy.getByTestId(rs.platformOverviewCommandCenter).then($demo => {
      cy.getByTestId(rs.roleSelector).then($roleSelector => {
      cy.getByTestId(rs.activeRouteOperations).then($operations => {
        cy.getByTestId(rs.fleetDirectory).then($fleet => {
          cy.getByTestId(rs.operationsIntelligenceCenter).then($intelligence => {
            const demo = $demo[0]
            const roleSelector = $roleSelector[0]
            const operations = $operations[0]
            const fleet = $fleet[0]
            const intelligence = $intelligence[0]

            expect(Boolean(demo.compareDocumentPosition(roleSelector) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
            expect(Boolean(roleSelector.compareDocumentPosition(operations) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
            expect(Boolean(operations.compareDocumentPosition(fleet) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
            expect(Boolean(fleet.compareDocumentPosition(intelligence) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
          })
        })
      })
    })
    })
  })

  it('keeps admin create/delete controls focused on customer creation and scoped destructive corrections', () => {
    cy.getByTestId(rs.adminMutationPanel).within(() => {
      cy.getByTestId(rs.adminCreateCustomerForm).should('be.visible')
      cy.getByTestId(rs.adminCreateBookingForm).should('not.exist')
      cy.getByTestId(rs.adminDeleteCustomerForm).should('be.visible')
      cy.getByTestId(rs.adminDeleteBookingForm).should('be.visible')
      cy.getByTestId(rs.adminCreateCustomerForm).then($createCustomer => {
        cy.getByTestId(rs.adminDeleteCustomerForm).then($deleteCustomer => {
          expect(Boolean($createCustomer[0].compareDocumentPosition($deleteCustomer[0]) & Node.DOCUMENT_POSITION_FOLLOWING)).to.equal(true)
        })
      })
    })
  })

  it('keeps operational intelligence focused on live turnaround action', () => {
    cy.getByTestId(rs.operationsIntelligenceCenter)
      .should('contain.text', 'Priority actions')
      .and('contain.text', 'staffing')
      .and('not.contain.text', 'Release policy controls')
  })

  it('keeps API refresh controls scoped to workspaces instead of a separate footer panel', () => {
    cy.getByTestId(rs.queryStatusPanel).should('not.exist')
    cy.getByTestId(rs.refreshQuery).should('not.exist')
    cy.getByTestId(rs.operationsIntelligenceCenter).should('be.visible')
    cy.getByTestId(rs.operationsIntelligenceRefreshButton).should('be.visible')
    cy.getByTestId(rs.fleetRefreshButton).should('be.visible')
  })

  it('keeps the hero free of retired rollback links', () => {
    cy.getByTestId(rs.productionHero).within(() => {
      cy.get('a[href="/retired"]').should('not.exist')
      cy.getByTestId(rs.heroIntelligenceButton).should('contain.text', 'Review Operations Intelligence')
    })
  })

  it('keeps the application footer free of redundant API status chrome and review artifacts', () => {
    cy.getByTestId(rs.queryStatusPanel).should('not.exist')
    cy.getByTestId(rs.releaseReadinessSection).should('not.exist')
    cy.getByTestId(rs.retiredHandoffPanel).should('not.exist')
  })
})
