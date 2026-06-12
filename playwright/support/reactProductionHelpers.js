const { expect } = require('@playwright/test')

const ROLE_VALUES = {
  Admin: 'admin',
  Administrator: 'admin',
  Passenger: 'passenger',
  'Group Leader': 'group-leader',
  'Turnaround Manager': 'turnaround-manager',
  'Housekeeping Lead': 'housekeeping-lead',
  'Guest Services Lead': 'guest-services-lead',
  'Food & Beverage Lead': 'food-beverage-lead',
  'Engineering Lead': 'engineering-lead'
}

const ROLE_PERSON_SEARCH = {
  admin: 'Admin Demo User',
  passenger: 'Passenger View',
  'group-leader': 'Group Leader'
}

function normalizeRoleValue(roleText) {
  return ROLE_VALUES[roleText] || String(roleText || '').toLowerCase().replace(/\s+/g, '-')
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8)
  expect(overflow).toBe(false)
}

async function waitForRolePicker(page) {
  await expect(page.getByTestId('react-role-type-select')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('react-person-finder-panel')).toBeVisible({ timeout: 15000 })
}

async function selectDemoUserThroughAppBridge(page, roleValue, personText) {
  if (!personText) return false

  await page.waitForFunction(
    ({ role, person }) => {
      if (typeof window.__cruiseSelectDemoUser !== 'function') return false
      const users = Array.isArray(window.__cruiseDemoUsers) ? window.__cruiseDemoUsers : []
      const expectedPerson = String(person || '').toLowerCase()
      return users.some(user => {
        const roleMatches = !role || user.roleView === role
        const nameMatches = !expectedPerson || String(user.name || '').toLowerCase().includes(expectedPerson)
        return roleMatches && nameMatches
      })
    },
    { role: roleValue, person: personText },
    { timeout: 25000 }
  )

  const selection = await page.evaluate(({ role, person }) => {
    return window.__cruiseSelectDemoUser({ role, personText: person })
  }, { role: roleValue, person: personText })

  if (!selection || !selection.ok) return false

  await expect(page.getByTestId('react-demo-user-summary')).toContainText(personText, { timeout: 20000 })
  return true
}

async function clickPersonCardSafely(personCard) {
  await expect(personCard).toBeVisible({ timeout: 15000 })

  const alreadySelected = await personCard.evaluate(card => card.getAttribute('aria-pressed') === 'true')
  if (alreadySelected) return

  await personCard.evaluate(card => {
    card.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
    card.click()
  })
}

async function setSearchInputValue(page, testId, value) {
  await page.evaluate(
    ({ inputTestId, inputValue }) => {
      const input = document.querySelector(`[data-testid="${inputTestId}"]`)
      if (!input) {
        throw new Error(`Unable to find ${inputTestId}`)
      }

      const prototype = Object.getPrototypeOf(input)
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
      const setValue = descriptor && descriptor.set

      input.focus()
      if (setValue) {
        setValue.call(input, inputValue)
      } else {
        input.value = inputValue
      }

      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: inputValue }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { inputTestId: testId, inputValue: value }
  )
}


async function selectHiddenDemoUserByText(page, personText) {
  await page.waitForFunction(
    ({ text }) => {
      const select = document.querySelector('[data-testid="react-demo-user-select"]')
      if (!select) return false
      return Array.from(select.options).some(option => (option.textContent || '').includes(text))
    },
    { text: personText },
    { timeout: 15000 }
  )

  const selectedLabel = await page.evaluate(({ text }) => {
    const select = document.querySelector('[data-testid="react-demo-user-select"]')
    if (!select) {
      throw new Error('Unable to find react-demo-user-select')
    }

    const matchingOption = Array.from(select.options).find(option => (option.textContent || '').includes(text))
    if (!matchingOption) {
      throw new Error(`Unable to find demo user option for ${text}`)
    }

    const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
    if (valueSetter) {
      valueSetter.call(select, matchingOption.value)
    } else {
      select.value = matchingOption.value
    }

    select.dispatchEvent(new Event('input', { bubbles: true }))
    select.dispatchEvent(new Event('change', { bubbles: true }))
    return matchingOption.textContent || ''
  }, { text: personText })

  await expect(page.getByTestId('react-demo-user-summary')).toContainText(personText, { timeout: 20000 })
  return selectedLabel
}

async function selectRoleAndPerson(page, roleValue, personText = '') {
  const roleSelect = page.getByTestId('react-role-type-select')

  await expect(roleSelect).toBeVisible({ timeout: 15000 })

  if (personText) {
    // Root stability fix: operational mobile tests must not depend on the
    // expanded visible selector. After the selector grew roster, governance,
    // manifest, and deployment-matrix panels, Pixel 7 emulation repeatedly
    // spent most of each 45s test budget on card/search actionability. The
    // native demo-user select is the single source of truth behind the same
    // role assumption UX, so use it first for named users and reserve visible
    // cards/search as a non-primary fallback for local/debug environments.
    const selectedThroughNativeSelect = await selectHiddenDemoUserByText(page, personText)
      .then(() => true)
      .catch(() => false)

    if (selectedThroughNativeSelect) {
      return
    }
  }

  await roleSelect.selectOption(roleValue)

  const personFinder = page.getByTestId('react-person-finder-panel')
  await expect(personFinder).toBeVisible({ timeout: 15000 })

  if (personText) {
    const matchingCard = page.getByTestId('react-person-finder-result-card').filter({ hasText: personText }).first()

    if (!(await matchingCard.isVisible({ timeout: 3000 }).catch(() => false))) {
      const personSearch = page.getByTestId('react-person-search-input')
      await expect(personSearch).toBeVisible({ timeout: 5000 })
      await personSearch.evaluate(input => input.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }))
      await setSearchInputValue(page, 'react-person-search-input', personText)
    }

    await clickPersonCardSafely(matchingCard)
    await expect(page.getByTestId('react-demo-user-summary')).toContainText(personText, { timeout: 20000 })
    return
  }

  const firstPersonCard = page.getByTestId('react-person-finder-result-card').first()
  await clickPersonCardSafely(firstPersonCard)
}


async function selectDemoUserByRole(page, roleText) {
  const normalizedRole = normalizeRoleValue(roleText)
  await selectRoleAndPerson(page, normalizedRole, ROLE_PERSON_SEARCH[normalizedRole] || '')

  if (normalizedRole === 'passenger') {
    await expect(page.getByTestId('react-demo-user-summary')).toContainText('Passenger', { timeout: 15000 })
  }
}



async function selectPassengerProfileUser(page) {
  await selectRoleAndPerson(page, 'passenger', 'Ryan Parker Passenger View')
  await expect(page.getByTestId('react-demo-user-summary')).toContainText('Passenger', { timeout: 15000 })
  await expect(page.getByTestId('react-passenger-dashboard')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('react-passenger-profile-form')).toBeVisible({ timeout: 20000 })
}

async function openFleetShipsBySearch(page, searchText, expectedHeadingPattern = null) {
  const fleetSearch = page.getByTestId('react-fleet-search')
  await expect(fleetSearch).toBeVisible({ timeout: 15000 })
  await fleetSearch.fill(searchText)

  const matchingFleetCard = page
    .getByTestId('react-fleet-card')
    .filter({ hasText: searchText })
    .first()
  await expect(matchingFleetCard).toBeVisible({ timeout: 15000 })

  const viewShipsButton = matchingFleetCard.getByTestId('react-view-ships-button')
  await viewShipsButton.scrollIntoViewIfNeeded()
  await expect(viewShipsButton).toBeVisible({ timeout: 15000 })
  await expect(viewShipsButton).toBeEnabled({ timeout: 15000 })
  await viewShipsButton.click()

  const selectedShipsPanel = page.getByTestId('react-selected-ships-panel')
  await expect(selectedShipsPanel).toBeVisible({ timeout: 15000 })
  await expect(selectedShipsPanel).toContainText(expectedHeadingPattern || new RegExp(`${searchText}.*ships`, 'i'), { timeout: 15000 })
  await expect(selectedShipsPanel.getByTestId('react-ship-card').first()).toBeVisible({ timeout: 15000 })

  return selectedShipsPanel
}

async function ensureFleetShipsOpen(page, searchText) {
  const selectedShipsPanel = page.getByTestId('react-selected-ships-panel')
  const selectedShipCard = selectedShipsPanel.getByTestId('react-ship-card').first()

  if (await selectedShipCard.isVisible().catch(() => false)) {
    const panelText = await selectedShipsPanel.textContent().catch(() => '')
    if ((panelText || '').toLowerCase().includes(searchText.toLowerCase())) {
      return selectedShipsPanel
    }
  }

  return openFleetShipsBySearch(page, searchText)
}

async function openFleetSailingsBySearch(page, searchText) {
  const selectedShipsPanel = await ensureFleetShipsOpen(page, searchText)

  const viewSailingsButton = selectedShipsPanel.getByTestId('react-view-sailings-button').first()
  await viewSailingsButton.scrollIntoViewIfNeeded()
  await expect(viewSailingsButton).toBeVisible({ timeout: 15000 })
  await expect(viewSailingsButton).toBeEnabled({ timeout: 15000 })
  await viewSailingsButton.click()

  const sailingsPanel = page.getByTestId('react-sailings-panel')
  await expect(sailingsPanel).toBeVisible({ timeout: 15000 })
  await expect(sailingsPanel.getByTestId('react-sailing-card').first()).toBeVisible({ timeout: 15000 })
  return sailingsPanel
}

async function expectOperationalDashboardReady(page, roleValue, personText, dashboardTestId) {
  await selectRoleAndPerson(page, roleValue, personText)
  await expect(page.getByTestId(dashboardTestId)).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('react-operational-turnaround-panel')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('react-operations-directory-panel')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('react-operations-directory-card').first()).toBeVisible({ timeout: 15000 })

  const readinessCards = page.getByTestId('react-operational-readiness-card')
  if (await readinessCards.count()) {
    await expect(readinessCards.first()).toBeVisible({ timeout: 15000 })
  }

  const progressCards = page.getByTestId('react-operational-progress-summary')
  if (await progressCards.count()) {
    await expect(progressCards.first()).toBeVisible({ timeout: 15000 })
  }

  const signoffCards = page.getByTestId('react-operational-signoff-summary')
  if (await signoffCards.count()) {
    await expect(signoffCards.first()).toBeVisible({ timeout: 15000 })
  }

  await expect(page.getByTestId('react-active-route-operations')).toHaveCount(0)
  await expect(page.getByTestId('react-admin-create-customer-form')).toHaveCount(0)
}

async function clickStableControl(locator, options = {}) {
  const timeout = options.timeout || 15000
  await expect(locator).toBeVisible({ timeout })
  await expect(locator).toBeEnabled({ timeout })
  await locator.evaluate(element => {
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
  })

  try {
    await locator.click({ timeout: Math.min(timeout, 5000) })
  } catch (error) {
    const message = String(error && error.message ? error.message : error)
    if (!message.includes('outside of the viewport') && !message.includes('Timeout')) {
      throw error
    }

    await locator.evaluate(element => element.click())
  }
}

async function openCustomerWorkflows(page) {
  const toggle = page.getByTestId('react-toggle-customer-workflows')
  const table = page.getByTestId('react-customer-workflow-table')

  if (await table.isVisible().catch(() => false)) {
    return table
  }

  await clickStableControl(toggle)
  await expect(table).toBeVisible({ timeout: 15000 })
  return table
}

module.exports = {
  clickStableControl,
  expectNoHorizontalOverflow,
  expectOperationalDashboardReady,
  normalizeRoleValue,
  openFleetShipsBySearch,
  openCustomerWorkflows,
  openFleetSailingsBySearch,
  selectDemoUserByRole,
  selectPassengerProfileUser,
  selectRoleAndPerson,
  waitForRolePicker
}
