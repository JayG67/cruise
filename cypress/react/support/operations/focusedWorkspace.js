const { reactSelectorKeys: rs } = require('../reactSelectors')

function resolveSelectorKey(selectorKey) {
  const selector = rs[selectorKey]
  if (!selector) {
    throw new Error(`Unknown React selector key: ${selectorKey}`)
  }
  return selector
}

function getBySelectorKey(selectorKey) {
  return cy.getByTestId(resolveSelectorKey(selectorKey))
}

function assertContainsAll(selectorKey, expectedTerms = []) {
  expectedTerms.forEach(term => {
    getBySelectorKey(selectorKey).should('contain.text', term)
  })
}

function openFocusedOperationsWorkspace({
  buttonKey,
  workspaceKey,
  summaryKey,
  listKey,
  listItemKey,
  detailPanelKey,
  summaryTerms = [],
  detailTerms = []
}) {
  getBySelectorKey(buttonKey).click()
  getBySelectorKey(workspaceKey).should('be.visible')

  if (summaryKey) {
    getBySelectorKey(summaryKey).should('be.visible')
    assertContainsAll(summaryKey, summaryTerms)
  }

  getBySelectorKey(listKey).should('be.visible')
  getBySelectorKey(listItemKey)
    .its('length')
    .should('be.gte', 1)
  getBySelectorKey(listItemKey).first().should('have.attr', 'aria-pressed', 'true')
  getBySelectorKey(detailPanelKey).should('be.visible')
  assertContainsAll(detailPanelKey, detailTerms)
}

function selectQueueItemWhenPresent(listItemSelectorKey, itemText) {
  const listItemSelector = resolveSelectorKey(listItemSelectorKey)

  cy.get('body').then($body => {
    const matchingItems = $body.find(`[data-testid="${listItemSelector}"]`).filter((_, element) => {
      return element.innerText.includes(itemText)
    })

    if (matchingItems.length > 0) {
      cy.wrap(matchingItems.first()).click()
    }
  })
}

function verifyFocusedDetailListTerms(detailListKey, terms = []) {
  getBySelectorKey(detailListKey).within(() => {
    terms.forEach(term => {
      cy.contains('dt', term).should('be.visible')
    })
  })
}

function verifyReadableWorkspaceTextarea(detailPanelKey, ariaLabelSuffix) {
  getBySelectorKey(detailPanelKey).within(() => {
    cy.get(`textarea[aria-label$="${ariaLabelSuffix}"]`)
      .should('be.visible')
      .and($textarea => {
        expect($textarea[0].getBoundingClientRect().height).to.be.greaterThan(70)
      })
  })
}

module.exports = {
  openFocusedOperationsWorkspace,
  selectQueueItemWhenPresent,
  verifyFocusedDetailListTerms,
  verifyReadableWorkspaceTextarea
}
