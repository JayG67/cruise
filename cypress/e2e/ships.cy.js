describe('Cruise Explorer ship lookup UI tests', () => {
  let cruiseLines = []

  beforeEach(() => {
    cy.request('/cruise').then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.length).to.be.greaterThan(1)

      cruiseLines = res.body
    })

    cy.visit('/')

    cy.get('#cruise-grid .data-card', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
  })

  it('loads ships when View Ships is clicked', () => {
    const cruiseLine = cruiseLines[0]

    cy.request(`/cruise/ships/${cruiseLine.id}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.length).to.be.greaterThan(0)

      const ships = res.body
      const expectedShip = ships[0].name

      cy.contains('#cruise-grid .data-card', cruiseLine.name)
        .contains('button', 'View Ships')
        .click()

      cy.get('#ships-panel').should('be.visible')

      cy.get('#ships-title')
        .should('contain.text', `${cruiseLine.name} Ships`)

      cy.get('#ships-grid .data-card', { timeout: 10000 })
        .should('have.length', ships.length)

      cy.get('#ships-grid')
        .should('contain.text', expectedShip)
    })
  })

  it('renders ship cards with expected API data', () => {
    const cruiseLine = cruiseLines[0]

    cy.request(`/cruise/ships/${cruiseLine.id}`).then((res) => {
      const ships = res.body

      cy.contains('#cruise-grid .data-card', cruiseLine.name)
        .contains('button', 'View Ships')
        .click()

      ships.forEach((ship) => {
        cy.get('#ships-grid')
          .should('contain.text', ship.name)
      })
    })
  })

  it('updates the ships panel when a different cruise line is selected', () => {
    const firstCruiseLine = cruiseLines[0]
    const secondCruiseLine = cruiseLines[1]

    cy.contains('#cruise-grid .data-card', firstCruiseLine.name)
      .contains('button', 'View Ships')
      .click()

    cy.get('#ships-title')
      .should('contain.text', `${firstCruiseLine.name} Ships`)

    cy.contains('#cruise-grid .data-card', secondCruiseLine.name)
      .contains('button', 'View Ships')
      .click()

    cy.get('#ships-title')
      .should('contain.text', `${secondCruiseLine.name} Ships`)
  })

  it('updates ship count when a cruise line is selected', () => {
    const cruiseLine = cruiseLines[0]

    cy.request(`/cruise/ships/${cruiseLine.id}`).then((res) => {
      const ships = res.body

      cy.contains('#cruise-grid .data-card', cruiseLine.name)
        .contains('button', 'View Ships')
        .click()

      cy.get('#ships-grid .data-card', { timeout: 10000 })
        .should('have.length', ships.length)
    })
  })

  it('keeps cruise line results visible after loading ships', () => {
    const cruiseLine = cruiseLines[0]

    cy.contains('#cruise-grid .data-card', cruiseLine.name)
      .contains('button', 'View Ships')
      .click()

    cy.get('#ships-panel')
      .should('be.visible')

    cy.get('#cruise-grid .data-card')
      .should('have.length', cruiseLines.length)
  })

  it('loads ships after filtering to a cruise line', () => {
    const cruiseLine = cruiseLines[0]
    const searchTerm = cruiseLine.name.split(' ')[0]

    cy.get('#search-input').type(searchTerm)

    cy.contains('#cruise-grid .data-card', cruiseLine.name)
      .contains('button', 'View Ships')
      .click()

    cy.get('#ships-title')
      .should('contain.text', `${cruiseLine.name} Ships`)

    cy.get('#ships-grid .data-card', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
  })

  it('loads ships correctly after a case-insensitive cruise line search', () => {
    const cruiseLine = cruiseLines[0]
    const searchTerm = cruiseLine.name.split(' ')[0].toLowerCase()

    cy.get('#search-input').type(searchTerm)

    cy.contains('#cruise-grid .data-card', cruiseLine.name)
      .contains('button', 'View Ships')
      .click()

    cy.get('#ships-title')
      .should('contain.text', `${cruiseLine.name} Ships`)

    cy.get('#ships-grid .data-card')
      .should('have.length.greaterThan', 0)
  })

  it('does not clear ships when search input is changed after ships are loaded', () => {
    const cruiseLine = cruiseLines[0]

    cy.contains('#cruise-grid .data-card', cruiseLine.name)
      .contains('button', 'View Ships')
      .click()

    cy.get('#ships-grid .data-card')
      .should('have.length.greaterThan', 0)

    cy.get('#search-input').type('ZZZ_NO_MATCH_TEST')

    cy.get('#ships-panel')
      .should('be.visible')

    cy.get('#ships-title')
      .should('contain.text', `${cruiseLine.name} Ships`)
  })
})