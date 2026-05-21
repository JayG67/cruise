describe('ADA and WCAG-oriented accessibility checks', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  function getAccessibleName($element) {
    const id = $element.attr('id')
    const ariaLabel = $element.attr('aria-label')
    const ariaLabelledBy = $element.attr('aria-labelledby')
    const title = $element.attr('title')
    const text = $element.text().trim()
    const placeholder = $element.attr('placeholder')
    const explicitLabel = id ? Cypress.$(`label[for="${id}"]`).text().trim() : ''
    const wrappingLabel = $element.closest('label').text().trim()

    if (ariaLabel) return ariaLabel
    if (ariaLabelledBy) {
      return ariaLabelledBy
        .split(/\s+/)
        .map(labelId => Cypress.$(`#${labelId}`).text().trim())
        .join(' ')
        .trim()
    }

    return title || text || explicitLabel || wrappingLabel || placeholder || ''
  }

  function expectInteractiveElementsToHaveAccessibleNames() {
    cy.get('a[href], button, input:not([type="hidden"]), select, textarea').each($element => {
      const tagName = $element.prop('tagName').toLowerCase()
      const id = $element.attr('id')
      const testId = $element.attr('data-testid')
      const accessibleName = getAccessibleName($element)

      expect(Boolean(accessibleName), `${tagName} ${id || testId || ''} has an accessible name`).to.eq(true)
    })
  }

  it('supports skip navigation and visible keyboard focus', () => {
    cy.get('[data-testid="skip-link"]')
      .focus()
      .should('be.visible')
      .and('have.attr', 'href', '#main-content')

    cy.get('[data-testid="skip-link"]').click()
    cy.get('#main-content').should('have.attr', 'tabindex', '-1')
  })

  it('keeps the document language, title, and main landmark accessible', () => {
    cy.document().its('documentElement.lang').should('eq', 'en')
    cy.title().should('match', /Cruise Explorer/)
    cy.get('main#main-content').should('exist').and('have.attr', 'tabindex', '-1')
  })

  it('labels navigation, search, live status, and quality output landmarks', () => {
    cy.get('[data-testid="primary-navigation"]').should('have.attr', 'aria-label', 'Primary navigation')
    cy.get('.fleet-toolbar').should('have.attr', 'role', 'search')
    cy.get('label[for="search-input"]').should('contain.text', 'Search cruise lines')
    cy.get('[data-testid="cruise-status-message"]')
      .should('have.attr', 'role', 'status')
      .and('have.attr', 'aria-live', 'polite')
    cy.get('[data-testid="test-output"]')
      .should('have.attr', 'role', 'status')
      .and('have.attr', 'aria-label', 'SQA test output')
  })

  it('provides accessible names for every static interactive control', () => {
    expectInteractiveElementsToHaveAccessibleNames()
  })

  it('connects visible labels to search and CRUD form fields', () => {
    cy.get('[data-testid="cruise-search-input"]').should($input => {
      expect(getAccessibleName($input)).to.match(/Search cruise lines/i)
    })

    cy.get('[data-testid="create-cruise-line-form"] input:not([type="hidden"])').each($input => {
      expect(getAccessibleName($input), `${$input.attr('name')} has an accessible name`).not.to.eq('')
    })

    cy.get('[data-testid="update-cruise-line-form"] input:not([type="hidden"])').each($input => {
      expect(getAccessibleName($input), `${$input.attr('name')} has an accessible name`).not.to.eq('')
    })
  })

  it('keeps required fields programmatically identifiable', () => {
    cy.get('[data-testid="create-cruise-line-name-input"]').should('have.attr', 'required')
    cy.get('[data-testid="update-cruise-line-name-input"]').should('have.attr', 'required')
  })

  it('keeps major dynamic panels associated with headings', () => {
    cy.get('[data-testid="create-cruise-line-panel"]').should('have.attr', 'aria-labelledby')
    cy.get('[data-testid="ships-panel"]').should('have.attr', 'aria-labelledby', 'ships-title')
    cy.get('[data-testid="sailings-panel"]').should('have.attr', 'aria-labelledby', 'sailings-title')
    cy.get('[data-testid="itinerary-panel"]').should('have.attr', 'aria-labelledby', 'itinerary-title')
    cy.get('[data-testid="role-booking-dashboard"]').should('have.attr', 'aria-labelledby', 'role-booking-dashboard-heading')
  })

  it('provides contextual accessible names for dynamic cruise, ship, sailing, and booking controls', () => {
    cy.get('[data-testid="view-ships-button"]').first()
      .should('have.attr', 'aria-label')
      .and('match', /View ships for/i)

    cy.get('[data-testid="update-cruise-line-button"]').first()
      .should('have.attr', 'aria-label')
      .and('match', /Update/i)

    cy.get('[data-testid="delete-cruise-line-button"]').first()
      .should('have.attr', 'aria-label')
      .and('match', /Delete/i)

    cy.get('[data-testid="view-ships-button"]').first().click()

    cy.get('[data-testid="view-sailings-button"]').first()
      .should('have.attr', 'aria-label')
      .and('match', /View sailings for/i)

    cy.get('[data-testid="view-sailings-button"]').first().click()

    cy.get('[data-testid="view-itinerary-button"]').first()
      .should('have.attr', 'aria-label')
      .and('match', /View details for sailing/i)

    cy.get('[data-testid="demo-user-selector"]').select('UPASS00001')
    cy.get('[data-testid="role-booking-details-button"]').first()
      .should('have.attr', 'aria-label')
      .and('match', /View details for booking/i)
  })

  it('updates details button aria-expanded when passenger booking details are opened and hidden', () => {
    cy.get('[data-testid="demo-user-selector"]').select('UPASS00001')

    cy.get('[data-testid="role-booking-details-button"]').first()
      .should('have.attr', 'aria-expanded', 'false')
      .click()
      .should('have.attr', 'aria-expanded', 'true')
      .and('contain.text', 'Hide Details')

    cy.get('[data-testid="role-booking-details-button"]').first()
      .click()
      .should('have.attr', 'aria-expanded', 'false')
      .and('contain.text', 'View Details')
  })

  it('exposes favorite itinerary stars as checkbox-style controls to assistive technology', () => {
    cy.get('[data-testid="demo-user-selector"]').select('UPASS00001')
    cy.get('[data-testid="role-booking-details-button"]').first().click()

    cy.get('[data-testid="favorite-toggle-button"]').first().as('favoriteButton')
    cy.get('@favoriteButton').should('have.attr', 'role', 'checkbox')
    cy.get('@favoriteButton').should('have.attr', 'aria-checked')
    cy.get('@favoriteButton').should('have.attr', 'aria-label')
    cy.get('@favoriteButton').invoke('attr', 'aria-label').should('match', /favorite/i)
  })

  it('can mark a favorite and expose the saved state to assistive technology', () => {
    cy.get('[data-testid="demo-user-selector"]').select('UPASS00001')
    cy.get('[data-testid="role-booking-details-button"]').first().click()

    cy.get('[data-testid="favorite-toggle-button"]').first().then($button => {
      if ($button.attr('aria-checked') === 'true') {
        cy.wrap($button).click()
        cy.get('[data-testid="favorite-toggle-button"]').first()
          .should('have.attr', 'aria-checked', 'false')
      }
    })

    cy.get('[data-testid="favorite-toggle-button"]').first().click()
    cy.get('[data-testid="show-favorite-itinerary-button"]').first().click()

    cy.get('[data-testid="favorite-toggle-button"]').first()
      .should('have.attr', 'aria-checked', 'true')
      .and('have.class', 'is-favorite')
      .and('contain.text', '★')
  })

  it('exposes passenger profile fields with accessible labels and controlled dining options', () => {
    cy.get('[data-testid="demo-user-selector"]').select('UPASS00001')

    cy.get('[data-testid="passenger-profile-form"]').within(() => {
      cy.get('input, select, button').each($control => {
        expect(getAccessibleName($control), `${$control.attr('name') || $control.attr('data-testid')} has an accessible name`).not.to.eq('')
      })

      cy.get('[data-testid="dining-preference-select"]')
        .should('be.visible')
        .find('option')
        .should('have.length.at.least', 6)

      cy.get('[data-testid="passenger-profile-message"]')
        .should('have.attr', 'role', 'status')
        .and('have.attr', 'aria-live', 'polite')
    })
  })

  it('announces passenger profile save feedback through a live region', () => {
    cy.intercept('PATCH', '/cruise/customers/*/passenger-profile', req => {
      req.on('response', res => {
        res.setDelay(350)
      })
    }).as('savePassengerProfileForA11y')

    cy.get('[data-testid="demo-user-selector"]').select('UPASS00001')

    cy.get('[data-testid="passenger-profile-form"]').within(() => {
      cy.get('input[name="phone"]').clear().type('555-1212')
      cy.get('[data-testid="passenger-profile-submit-button"]').click()
      cy.get('[data-testid="passenger-profile-message"]')
        .should('have.attr', 'role', 'status')
        .and('have.attr', 'aria-live', 'polite')
        .and('contain.text', 'Saving')
    })

    cy.wait('@savePassengerProfileForA11y')
      .its('response.statusCode')
      .should('eq', 200)
  })

  it('keeps SQA console controls named and status output announced', () => {
    cy.get('#testPanel button').each($button => {
      expect(getAccessibleName($button), `${$button.attr('id')} has an accessible name`).not.to.eq('')
    })

    cy.get('[data-testid="test-output"]')
      .should('have.attr', 'role', 'status')
      .and('have.attr', 'aria-live', 'polite')
  })

  it('keeps keyboard focus visible on representative links, buttons, inputs, and selects', () => {
    cy.get('[data-testid="brand-link"]').focus().should('be.focused')
    cy.get('[data-testid="cruise-search-input"]').focus().should('be.focused')
    cy.get('[data-testid="view-ships-button"]').first().focus().should('be.focused')
    cy.get('[data-testid="demo-user-selector"]').focus().should('be.focused')
  })

  it('keeps hidden workflow panels out of the visible accessibility workflow until opened', () => {
    cy.get('[data-testid="update-cruise-line-panel"]').should('not.be.visible')
    cy.get('[data-testid="ships-panel"]').should('not.be.visible')

    cy.get('[data-testid="view-ships-button"]').first().click()
    cy.get('[data-testid="ships-panel"]').should('be.visible')
  })

  it('announces cruise loading and error states through the status message region', () => {
    cy.intercept('GET', '/cruise', {
      statusCode: 500,
      body: { message: 'Accessibility test failure' }
    }).as('failedCruiseLoad')

    cy.reload()
    cy.wait('@failedCruiseLoad')

    cy.get('[data-testid="cruise-status-message"]')
      .should('have.attr', 'role', 'status')
      .and('contain.text', 'Could not load cruise lines')
  })

  it('preserves accessible empty search feedback for keyboard and screen-reader users', () => {
    cy.get('[data-testid="cruise-search-input"]').clear().type('zzzz-no-cruise-line')

    cy.get('[data-testid="cruise-status-message"]')
      .should('have.attr', 'role', 'status')
      .and('contain.text', 'Showing 0 of')

    cy.get('[data-testid="cruise-empty-message"]')
      .should('be.visible')
      .and('contain.text', 'No cruise lines match your search.')
  })

  it('keeps itinerary filter buttons accessible when booking details are open', () => {
    cy.get('[data-testid="demo-user-selector"]').select('UPASS00001')
    cy.get('[data-testid="role-booking-details-button"]').first().click()

    cy.get('[data-testid="show-all-itinerary-button"]')
      .should('have.attr', 'aria-label')
      .and('match', /all itinerary/i)

    cy.get('[data-testid="show-favorite-itinerary-button"]')
      .should('have.attr', 'aria-label')
      .and('match', /favorite itinerary/i)
  })

  it('keeps cruise result cards exposed as a named result list', () => {
    cy.get('[data-testid="cruise-grid"]')
      .should('have.attr', 'role', 'list')
      .and('have.attr', 'aria-label', 'Cruise line results')

    cy.get('[data-testid="cruise-card"]').first().should('be.visible')
  })

  it('does not expose decorative required asterisks as separate accessible text', () => {
    cy.get('strong[aria-hidden="true"]').should('have.length.greaterThan', 0)
  })
})
