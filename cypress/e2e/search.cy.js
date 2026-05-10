describe('Cruise Explorer search UI tests', () => {
  let cruiseLines = []

  beforeEach(() => {
    cy.request('/cruise').then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.length).to.be.greaterThan(0)

      cruiseLines = res.body
    })

    cy.visit('/')

    cy.get('#cruise-grid .data-card', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
  })

  it('filters cruise lines by full cruise line name using API data', () => {
    const cruiseLineName = cruiseLines[0].name

    cy.get('#search-input').type(cruiseLineName)

    cy.get('#status-message')
      .should('contain.text', 'Showing')
      .and('contain.text', 'of')

    cy.get('#cruise-grid')
      .should('contain.text', cruiseLineName)
  })

  it('filters cruise lines by partial cruise line name using API data', () => {
    const cruiseLineName = cruiseLines[0].name
    const partialName = cruiseLineName.slice(0, 4)

    cy.get('#search-input').type(partialName)

    cy.get('#cruise-grid')
      .should('contain.text', cruiseLineName)
  })

  it('filters cruise lines case-insensitively', () => {
    const cruiseLineName = cruiseLines[0].name
    const lowerCaseSearch = cruiseLineName.slice(0, 4).toLowerCase()

    cy.get('#search-input').type(lowerCaseSearch)

    cy.get('#cruise-grid')
      .should('contain.text', cruiseLineName)
  })

  it('filters cruise lines by country using API data', () => {
    const cruiseLineWithCountry = cruiseLines.find(line => line.country)

    expect(cruiseLineWithCountry).to.exist

    const country = cruiseLineWithCountry.country

    cy.get('#search-input').type(country)

    cy.get('#status-message')
      .should('contain.text', 'Showing')

    cy.get('#cruise-grid .data-card')
      .should('have.length.greaterThan', 0)

    cy.get('#cruise-grid')
      .should('contain.text', country)
  })

  it('trims leading and trailing spaces in search input', () => {
    const cruiseLineName = cruiseLines[0].name
    const partialName = cruiseLineName.slice(0, 4)

    cy.get('#search-input').type(`   ${partialName}   `)

    cy.get('#cruise-grid')
      .should('contain.text', cruiseLineName)
  })

  it('updates the result count after filtering', () => {
    const cruiseLineName = cruiseLines[0].name
    const partialName = cruiseLineName.slice(0, 4)

    cy.get('#search-input').type(partialName)

    cy.get('#cruise-grid .data-card')
      .its('length')
      .then((shownCount) => {
        cy.get('#status-message')
          .should('contain.text', `Showing ${shownCount} of ${cruiseLines.length}`)
      })
  })

  it('shows an empty message when no cruise lines match', () => {
    cy.get('#search-input').type('ZZZ_NO_MATCH_TEST')

    cy.get('#status-message')
      .should('contain.text', 'Showing 0')

    cy.get('#cruise-grid')
      .should('contain.text', 'No cruise lines match your search.')
  })

  it('restores cruise lines when search is cleared', () => {
    const cruiseLineName = cruiseLines[0].name
    const searchTerm = cruiseLineName.split(' ')[0]

    cy.get('#cruise-grid .data-card')
      .should('have.length', cruiseLines.length)

    cy.get('#search-input').type(searchTerm)

    cy.get('#cruise-grid .data-card')
      .should('have.length.lessThan', cruiseLines.length)

    cy.get('#search-input').clear()

    cy.get('#cruise-grid .data-card')
      .should('have.length', cruiseLines.length)
  })

  it('keeps the search input value visible while filtering', () => {
    const cruiseLineName = cruiseLines[0].name
    const searchTerm = cruiseLineName.split(' ')[0]

    cy.get('#search-input').type(searchTerm)

    cy.get('#search-input')
      .should('have.value', searchTerm)
  })
})