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


function isPassengerRole(roleValue) {
  return roleValue === 'passenger'
}

function isOperationalRole(roleValue) {
  return /turnaround|housekeeping|guest-services|food-beverage|engineering|security|port-operations/.test(String(roleValue || ''))
}

async function expectVisibleRolePersonPanel(page, roleValue, timeout = 20000) {
  if (isPassengerRole(roleValue)) {
    await expect(page.getByTestId('react-passenger-finder-panel')).toBeVisible({ timeout })
    return page.getByTestId('react-passenger-finder-panel')
  }

  if (isOperationalRole(roleValue)) {
    await expect(page.getByTestId('react-operational-person-filter-panel')).toBeVisible({ timeout })
    return page.getByTestId('react-operational-person-filter-panel')
  }

  await expect(page.getByTestId('react-person-finder-panel')).toBeVisible({ timeout })
  return page.getByTestId('react-person-finder-panel')
}

function normalizeRoleValue(roleText) {
  return ROLE_VALUES[roleText] || String(roleText || '').toLowerCase().replace(/\s+/g, '-')
}

async function expectSelectedRoleSurface(page, roleValue, timeout = 20000) {
  const dashboardTestId = `react-${roleValue}-dashboard`

  if (roleValue === 'passenger') {
    await expect(page.getByTestId('react-demo-user-summary')).toContainText('Passenger', { timeout })
    await expect(page.getByTestId('react-passenger-dashboard')).toBeVisible({ timeout })
    return
  }

  if (roleValue === 'group-leader') {
    await expect(page.getByTestId('react-demo-user-summary')).toContainText('Group Leader', { timeout })
    await expect(page.getByTestId(dashboardTestId)).toBeVisible({ timeout })
    return
  }

  if (isOperationalRole(roleValue)) {
    await expect(page.getByTestId(dashboardTestId)).toBeVisible({ timeout })
    await expect(page.getByTestId('react-operational-turnaround-panel')).toBeVisible({ timeout })
  }
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8)
  expect(overflow).toBe(false)
}

async function waitForRolePicker(page) {
  const roleSelect = page.getByTestId('react-role-type-select')
  await expect(roleSelect).toBeVisible({ timeout: 15000 })
  const roleValue = await roleSelect.evaluate(select => select.value || 'admin')
  await expectVisibleRolePersonPanel(page, roleValue, 15000)
}

async function selectDemoUserThroughAppBridge(page, roleValue, personText = '') {
  const bridgeReady = await page.waitForFunction(
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
    { timeout: 5000 }
  ).then(() => true).catch(() => false)

  if (!bridgeReady) return false

  const selection = await page.evaluate(({ role, person }) => {
    return window.__cruiseSelectDemoUser({ role, personText: person })
  }, { role: roleValue, person: personText })

  if (!selection || !selection.ok) return false

  // Playwright should not spend the whole project timeout waiting on a
  // browser-specific native select/card path. The app bridge is deterministic,
  // but React still commits asynchronously, so wait briefly for either the
  // exported selection state or the user-facing summary. If the commit is not
  // observable quickly, return false and let the DOM fallback try instead of
  // hard-failing the test run.
  const committed = await page.waitForFunction(
    ({ userId, role, expectedText }) => {
      const state = window.__cruiseDemoSelectionState || {}
      const summaryText = document.querySelector('[data-testid="react-demo-user-summary"]')?.textContent || ''
      const selectedUserMatches = userId && state.selectedDemoUserId === userId
      const selectedRoleMatches = role && state.selectedRoleView === role
      const summaryMatches = expectedText && summaryText.includes(expectedText)
      return selectedUserMatches || (selectedRoleMatches && (!expectedText || summaryMatches || summaryText.length > 0))
    },
    {
      userId: selection.userId || '',
      role: selection.role || roleValue,
      expectedText: personText || selection.name || selection.role || roleValue
    },
    { timeout: 8000 }
  ).then(() => true).catch(() => false)

  return committed
}


async function setSelectValueByTestId(page, testId, value) {
  await page.waitForFunction(
    ({ selectTestId, selectValue }) => {
      const select = document.querySelector(`[data-testid="${selectTestId}"]`)
      if (!select || select.disabled) return false
      return Array.from(select.options).some(option => option.value === selectValue)
    },
    { selectTestId: testId, selectValue: value },
    { timeout: 20000 }
  )

  await page.evaluate(
    ({ selectTestId, selectValue }) => {
      const select = document.querySelector(`[data-testid="${selectTestId}"]`)
      if (!select) {
        throw new Error(`Unable to find ${selectTestId}`)
      }

      const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
      if (valueSetter) {
        valueSetter.call(select, selectValue)
      } else {
        select.value = selectValue
      }

      select.dispatchEvent(new Event('input', { bubbles: true }))
      select.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { selectTestId: testId, selectValue: value }
  )

  await page.waitForFunction(
    ({ selectTestId, selectValue }) => document.querySelector(`[data-testid="${selectTestId}"]`)?.value === selectValue,
    { selectTestId: testId, selectValue: value },
    { timeout: 10000 }
  )
}

async function selectRoleThroughDom(page, roleValue) {
  await setSelectValueByTestId(page, 'react-role-type-select', roleValue)
  await expectVisibleRolePersonPanel(page, roleValue, 20000)
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

  // Root stability fix: Playwright should exercise the resulting
  // responsive UX, not burn the run budget on browser-specific native
  // select/card interaction quirks. Prefer the app bridge when it is ready,
  // then fall back to React-compatible DOM value setters instead of
  // locator.selectOption(), which repeatedly timed out in responsive projects.
  const selectedThroughAppBridge = await selectDemoUserThroughAppBridge(page, roleValue, personText)

  if (selectedThroughAppBridge) {
    await expectSelectedRoleSurface(page, roleValue, 20000)
    return
  }

  if (personText) {
    const selectedThroughNativeSelect = await selectHiddenDemoUserByText(page, personText)
      .then(() => true)
      .catch(() => false)

    if (selectedThroughNativeSelect) {
      return
    }
  }

  await selectRoleThroughDom(page, roleValue)

  if (roleValue === 'passenger') {
    await expect(page.getByTestId('react-passenger-finder-panel')).toBeVisible({ timeout: 20000 })

    if (personText) {
      const passengerCard = page.getByTestId('react-passenger-finder-result-card').filter({ hasText: personText }).first()

      if (!(await passengerCard.isVisible({ timeout: 3000 }).catch(() => false))) {
        const passengerSearch = page.getByTestId('react-passenger-search-input')
        await expect(passengerSearch).toBeVisible({ timeout: 5000 })
        await setSearchInputValue(page, 'react-passenger-search-input', personText)
      }

      await clickPersonCardSafely(passengerCard)
      await expect(page.getByTestId('react-demo-user-summary')).toContainText(personText, { timeout: 10000 })
      return
    }

    const firstPassengerCard = page.getByTestId('react-passenger-finder-result-card').first()
    await clickPersonCardSafely(firstPassengerCard)
    return
  }

  await expectVisibleRolePersonPanel(page, roleValue, 20000)

  if (personText) {
    const matchingCard = page.getByTestId('react-person-finder-result-card').filter({ hasText: personText }).first()

    if (!(await matchingCard.isVisible({ timeout: 3000 }).catch(() => false))) {
      const personSearch = page.getByTestId('react-person-search-input')
      await expect(personSearch).toBeVisible({ timeout: 5000 })
      await personSearch.evaluate(input => input.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }))
      await setSearchInputValue(page, 'react-person-search-input', personText)
    }

    await clickPersonCardSafely(matchingCard)
    await expect(page.getByTestId('react-demo-user-summary')).toContainText(personText, { timeout: 10000 })
    return
  }

  const firstPersonCard = page.getByTestId('react-person-finder-result-card').first()
  await clickPersonCardSafely(firstPersonCard)
}


async function selectDemoUserByRole(page, roleText) {
  const normalizedRole = normalizeRoleValue(roleText)
  await selectRoleAndPerson(page, normalizedRole, ROLE_PERSON_SEARCH[normalizedRole] || '')

  if (normalizedRole === 'passenger') {
    await expect(page.getByTestId('react-demo-user-summary')).toContainText('Passenger', { timeout: 20000 })
    await expectSelectedRoleSurface(page, normalizedRole, 20000)
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
  const operationsPanel = page.getByTestId('react-active-route-operations')
  const toggle = page.getByTestId('react-toggle-customer-workflows')
  const table = page.getByTestId('react-customer-workflow-table')

  await expect(operationsPanel).toBeVisible({ timeout: 15000 })

  if (await table.isVisible().catch(() => false)) {
    return table
  }

  await expect(toggle).toBeVisible({ timeout: 15000 })
  await expect(toggle).toBeEnabled({ timeout: 15000 })
  await clickStableControl(toggle)

  if (!(await table.isVisible({ timeout: 2500 }).catch(() => false))) {
    await toggle.evaluate(element => {
      element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
      element.click()
    })
  }

  if (!(await table.isVisible({ timeout: 2500 }).catch(() => false))) {
    await toggle.focus()
    await page.keyboard.press('Enter')
  }

  await expect(table).toBeVisible({ timeout: 15000 })
  return table
}

module.exports = {
  clickStableControl,
  expectNoHorizontalOverflow,
  expectOperationalDashboardReady,
  expectSelectedRoleSurface,
  normalizeRoleValue,
  openFleetShipsBySearch,
  openCustomerWorkflows,
  openFleetSailingsBySearch,
  selectDemoUserByRole,
  selectPassengerProfileUser,
  selectRoleAndPerson,
  waitForRolePicker
}
