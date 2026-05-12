import { selectors } from '../support/selectors'

const cruiseLines = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Royal Caribbean International',
    country: 'United States',
    website: 'https://www.royalcaribbean.com'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Carnival Cruise Line',
    country: 'United States',
    website: 'https://www.carnival.com'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'MSC Cruises',
    country: 'Switzerland',
    website: 'https://www.msccruises.com'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Disney Cruise Line',
    country: 'United States',
    website: 'https://disneycruise.disney.go.com'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Margaritaville at Sea',
    country: 'United States',
    website: 'https://margaritavilleatsea.com'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'AIDA Cruises',
    country: 'Germany',
    website: 'https://www.aida.de'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'No Country Cruise Line',
    country: null,
    website: null
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'Test & Demo Cruises',
    country: 'Curaçao',
    website: null
  }
]

function visitSearchPage(cruiseLineList = cruiseLines) {
  cy.intercept('GET', '/cruise', {
    statusCode: 200,
    body: cruiseLineList
  }).as('getCruiseLines')

  cy.visit('/')
  cy.wait('@getCruiseLines')
  cy.get(selectors.cruiseLines.card).should('have.length', cruiseLineList.length)
}

function visibleCruiseCards() {
  return cy.get(selectors.cruiseLines.card)
}

describe('Cruise Explorer search UI', () => {
  beforeEach(() => {
    visitSearchPage()
  })

  it('starts with an empty search input and all cruise lines visible', () => {
    cy.get(selectors.cruiseLines.searchInput).should('have.value', '')
    visibleCruiseCards().should('have.length', cruiseLines.length)
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', `Showing ${cruiseLines.length} of ${cruiseLines.length}`)
  })

  it('filters cruise lines by exact full cruise line name', () => {
    cy.get(selectors.cruiseLines.searchInput).type('MSC Cruises')

    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'MSC Cruises')
    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'Carnival Cruise Line')
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', `Showing 1 of ${cruiseLines.length}`)
  })

  it('filters cruise lines by partial cruise line name', () => {
    cy.get(selectors.cruiseLines.searchInput).type('Royal')

    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
  })

  it('filters cruise lines case-insensitively', () => {
    cy.get(selectors.cruiseLines.searchInput).type('mSc cRuIsEs')

    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'MSC Cruises')
  })

  it('filters cruise lines by country', () => {
    cy.get(selectors.cruiseLines.searchInput).type('Germany')

    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'AIDA Cruises')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Germany')
  })

  it('filters country values case-insensitively', () => {
    cy.get(selectors.cruiseLines.searchInput).type('switzerland')

    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'MSC Cruises')
  })

  it('trims leading and trailing spaces before filtering', () => {
    cy.get(selectors.cruiseLines.searchInput).type('   Carnival   ')

    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Carnival Cruise Line')
  })

  it('updates the visible result count after filtering to multiple matches', () => {
    cy.get(selectors.cruiseLines.searchInput).type('United States')

    visibleCruiseCards().should('have.length', 4)
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', `Showing 4 of ${cruiseLines.length}`)
  })

  it('shows an empty state when no cruise lines match', () => {
    cy.get(selectors.cruiseLines.searchInput).type('ZZZ_NO_MATCH_TEST')

    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', `Showing 0 of ${cruiseLines.length}`)
    cy.get(selectors.cruiseLines.card).should('not.exist')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'No cruise lines match your search.')
  })

  it('restores all cruise lines when search is cleared', () => {
    cy.get(selectors.cruiseLines.searchInput).type('Margaritaville')
    visibleCruiseCards().should('have.length', 1)

    cy.get(selectors.cruiseLines.searchInput).clear()

    visibleCruiseCards().should('have.length', cruiseLines.length)
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', `Showing ${cruiseLines.length} of ${cruiseLines.length}`)
  })

  it('keeps the typed search value visible while filtering', () => {
    cy.get(selectors.cruiseLines.searchInput).type('Disney')
    cy.get(selectors.cruiseLines.searchInput).should('have.value', 'Disney')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Disney Cruise Line')
  })

  it('does not match against website values', () => {
    cy.get(selectors.cruiseLines.searchInput).type('royalcaribbean.com')

    cy.get(selectors.cruiseLines.card).should('not.exist')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'No cruise lines match your search.')
  })

  it('handles cruise lines with missing country values without throwing an error', () => {
    cy.get(selectors.cruiseLines.searchInput).type('No Country')

    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'No Country Cruise Line')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Country: Not listed')
  })

  it('handles special characters in the search term', () => {
    cy.get(selectors.cruiseLines.searchInput).type('Test & Demo')

    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Test & Demo Cruises')
  })

  it('handles accented country characters in the search term', () => {
    cy.get(selectors.cruiseLines.searchInput).type('Curaçao')

    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Test & Demo Cruises')
  })

  it('updates results as the user changes the search value', () => {
    cy.get(selectors.cruiseLines.searchInput).type('MSC')
    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'MSC Cruises')

    cy.get(selectors.cruiseLines.searchInput).clear().type('Disney')
    visibleCruiseCards().should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Disney Cruise Line')
    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'MSC Cruises')
  })

  it('does not make another cruise API request when filtering locally', () => {
    cy.get('@getCruiseLines.all').should('have.length', 1)

    cy.get(selectors.cruiseLines.searchInput).type('Carnival')
    cy.get(selectors.cruiseLines.searchInput).clear().type('MSC')
    cy.get(selectors.cruiseLines.searchInput).clear()

    cy.get('@getCruiseLines.all').should('have.length', 1)
  })

  it('preserves card actions after filtering', () => {
    cy.get(selectors.cruiseLines.searchInput).type('Royal')

    cy.contains(selectors.cruiseLines.card, 'Royal Caribbean International').within(() => {
      cy.get(selectors.cruiseLines.viewShipsButton).should('be.visible')
      cy.get(selectors.cruiseLines.websiteLink).should('be.visible')
    })
  })

  it('supports a single-record cruise list', () => {
    visitSearchPage([cruiseLines[0]])

    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Showing 1 of 1 cruise line.')
    cy.get(selectors.cruiseLines.searchInput).type('ZZZ')
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', 'Showing 0 of 1 cruise line.')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'No cruise lines match your search.')
  })
})

describe('Cruise Explorer search additional regression coverage', () => {
  const additionalSearchLines = [
    {
      id: 'bbbbbbbb-0000-4000-8000-000000000001',
      name: 'Royal Caribbean International',
      country: 'United States',
      website: 'https://www.royalcaribbean.com'
    },
    {
      id: 'bbbbbbbb-0000-4000-8000-000000000002',
      name: 'MSC Cruises',
      country: 'Switzerland',
      website: 'https://www.msccruises.com'
    },
    {
      id: 'bbbbbbbb-0000-4000-8000-000000000003',
      name: 'Princess Cruises',
      country: 'United States',
      website: 'https://www.princess.com'
    },
    {
      id: 'bbbbbbbb-0000-4000-8000-000000000004',
      name: 'Cunard Line',
      country: 'United Kingdom',
      website: 'https://www.cunard.com'
    }
  ]

  function visitAdditionalSearchPage() {
    cy.intercept('GET', '/cruise', {
      statusCode: 200,
      body: additionalSearchLines
    }).as('additionalSearchGetCruiseLines')

    cy.visit('/')
    cy.wait('@additionalSearchGetCruiseLines')
  }

  beforeEach(() => {
    visitAdditionalSearchPage()
  })

  it('filters cruise lines by country', () => {
    cy.get(selectors.cruiseLines.searchInput).type('United States')

    cy.get(selectors.cruiseLines.card).should('have.length', 2)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Royal Caribbean International')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'Princess Cruises')
    cy.get(selectors.cruiseLines.grid).should('not.contain.text', 'MSC Cruises')
  })

  it('trims leading and trailing whitespace in search terms', () => {
    cy.get(selectors.cruiseLines.searchInput).type('   msc   ')

    cy.get(selectors.cruiseLines.card).should('have.length', 1)
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'MSC Cruises')
  })

  it('does not match website text when filtering cruise lines', () => {
    cy.get(selectors.cruiseLines.searchInput).type('princess.com')

    cy.get(selectors.cruiseLines.card).should('not.exist')
    cy.get(selectors.cruiseLines.emptyMessage).should('be.visible')
  })

  it('handles punctuation-heavy search input safely', () => {
    cy.get(selectors.cruiseLines.searchInput).type('@@@###***')

    cy.get(selectors.cruiseLines.card).should('not.exist')
    cy.get(selectors.cruiseLines.grid).should('contain.text', 'No cruise lines match your search.')
  })

  it('restores all cards after search is cleared from a no-results state', () => {
    cy.get(selectors.cruiseLines.searchInput).type('No Matching Cruise Line')
    cy.get(selectors.cruiseLines.card).should('not.exist')

    cy.get(selectors.cruiseLines.searchInput).clear()

    cy.get(selectors.cruiseLines.card).should('have.length', additionalSearchLines.length)
    cy.get(selectors.cruiseLines.statusMessage).should('contain.text', `Showing ${additionalSearchLines.length} of ${additionalSearchLines.length}`)
  })

  it('keeps update buttons available after filtering by country', () => {
    cy.get(selectors.cruiseLines.searchInput).type('United Kingdom')

    cy.contains(selectors.cruiseLines.card, 'Cunard Line').within(() => {
      cy.get(selectors.cruiseLines.updateButton).should('be.visible')
      cy.get(selectors.cruiseLines.viewShipsButton).should('be.visible')
    })
  })
})
