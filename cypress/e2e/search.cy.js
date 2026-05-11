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
  cy.get('#cruise-grid .data-card').should('have.length', cruiseLineList.length)
}

function visibleCruiseCards() {
  return cy.get('#cruise-grid .data-card')
}

describe('Cruise Explorer search UI', () => {
  beforeEach(() => {
    visitSearchPage()
  })

  it('starts with an empty search input and all cruise lines visible', () => {
    cy.get('#search-input').should('have.value', '')
    visibleCruiseCards().should('have.length', cruiseLines.length)
    cy.get('#status-message').should('contain.text', `Showing ${cruiseLines.length} of ${cruiseLines.length}`)
  })

  it('filters cruise lines by exact full cruise line name', () => {
    cy.get('#search-input').type('MSC Cruises')

    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'MSC Cruises')
    cy.get('#cruise-grid').should('not.contain.text', 'Carnival Cruise Line')
    cy.get('#status-message').should('contain.text', `Showing 1 of ${cruiseLines.length}`)
  })

  it('filters cruise lines by partial cruise line name', () => {
    cy.get('#search-input').type('Royal')

    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'Royal Caribbean International')
  })

  it('filters cruise lines case-insensitively', () => {
    cy.get('#search-input').type('mSc cRuIsEs')

    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'MSC Cruises')
  })

  it('filters cruise lines by country', () => {
    cy.get('#search-input').type('Germany')

    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'AIDA Cruises')
    cy.get('#cruise-grid').should('contain.text', 'Germany')
  })

  it('filters country values case-insensitively', () => {
    cy.get('#search-input').type('switzerland')

    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'MSC Cruises')
  })

  it('trims leading and trailing spaces before filtering', () => {
    cy.get('#search-input').type('   Carnival   ')

    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'Carnival Cruise Line')
  })

  it('updates the visible result count after filtering to multiple matches', () => {
    cy.get('#search-input').type('United States')

    visibleCruiseCards().should('have.length', 4)
    cy.get('#status-message').should('contain.text', `Showing 4 of ${cruiseLines.length}`)
  })

  it('shows an empty state when no cruise lines match', () => {
    cy.get('#search-input').type('ZZZ_NO_MATCH_TEST')

    cy.get('#status-message').should('contain.text', `Showing 0 of ${cruiseLines.length}`)
    cy.get('#cruise-grid .data-card').should('not.exist')
    cy.get('#cruise-grid').should('contain.text', 'No cruise lines match your search.')
  })

  it('restores all cruise lines when search is cleared', () => {
    cy.get('#search-input').type('Margaritaville')
    visibleCruiseCards().should('have.length', 1)

    cy.get('#search-input').clear()

    visibleCruiseCards().should('have.length', cruiseLines.length)
    cy.get('#status-message').should('contain.text', `Showing ${cruiseLines.length} of ${cruiseLines.length}`)
  })

  it('keeps the typed search value visible while filtering', () => {
    cy.get('#search-input').type('Disney')
    cy.get('#search-input').should('have.value', 'Disney')
    cy.get('#cruise-grid').should('contain.text', 'Disney Cruise Line')
  })

  it('does not match against website values', () => {
    cy.get('#search-input').type('royalcaribbean.com')

    cy.get('#cruise-grid .data-card').should('not.exist')
    cy.get('#cruise-grid').should('contain.text', 'No cruise lines match your search.')
  })

  it('handles cruise lines with missing country values without throwing an error', () => {
    cy.get('#search-input').type('No Country')

    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'No Country Cruise Line')
    cy.get('#cruise-grid').should('contain.text', 'Country: Not listed')
  })

  it('handles special characters in the search term', () => {
    cy.get('#search-input').type('Test & Demo')

    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'Test & Demo Cruises')
  })

  it('handles accented country characters in the search term', () => {
    cy.get('#search-input').type('Curaçao')

    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'Test & Demo Cruises')
  })

  it('updates results as the user changes the search value', () => {
    cy.get('#search-input').type('MSC')
    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'MSC Cruises')

    cy.get('#search-input').clear().type('Disney')
    visibleCruiseCards().should('have.length', 1)
    cy.get('#cruise-grid').should('contain.text', 'Disney Cruise Line')
    cy.get('#cruise-grid').should('not.contain.text', 'MSC Cruises')
  })

  it('does not make another cruise API request when filtering locally', () => {
    cy.get('@getCruiseLines.all').should('have.length', 1)

    cy.get('#search-input').type('Carnival')
    cy.get('#search-input').clear().type('MSC')
    cy.get('#search-input').clear()

    cy.get('@getCruiseLines.all').should('have.length', 1)
  })

  it('preserves card actions after filtering', () => {
    cy.get('#search-input').type('Royal')

    cy.contains('#cruise-grid .data-card', 'Royal Caribbean International').within(() => {
      cy.contains('button', 'View Ships').should('be.visible')
      cy.contains('a', 'Visit website').should('be.visible')
    })
  })

  it('supports a single-record cruise list', () => {
    visitSearchPage([cruiseLines[0]])

    cy.get('#status-message').should('contain.text', 'Showing 1 of 1 cruise line.')
    cy.get('#search-input').type('ZZZ')
    cy.get('#status-message').should('contain.text', 'Showing 0 of 1 cruise line.')
    cy.get('#cruise-grid').should('contain.text', 'No cruise lines match your search.')
  })
})
