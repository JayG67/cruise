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

async function selectRoleAndPerson(page, roleValue, personText = '') {
  const roleSelect = page.getByTestId('react-role-type-select')

  await expect(roleSelect).toBeVisible({ timeout: 15000 })
  await roleSelect.selectOption(roleValue)

  const personFinder = page.getByTestId('react-person-finder-panel')
  await expect(personFinder).toBeVisible({ timeout: 15000 })

  if (personText) {
    const personSearch = page.getByTestId('react-person-search-input')
    await expect(personSearch).toBeVisible({ timeout: 15000 })
    await personSearch.fill(personText)

    const matchingCard = page.getByTestId('react-person-finder-result-card').filter({ hasText: personText }).first()
    await expect(matchingCard).toBeVisible({ timeout: 15000 })
    await matchingCard.click()
    return
  }

  const firstPersonCard = page.getByTestId('react-person-finder-result-card').first()
  await expect(firstPersonCard).toBeVisible({ timeout: 15000 })
  await firstPersonCard.click()
}

async function selectDemoUserByRole(page, roleText) {
  const normalizedRole = normalizeRoleValue(roleText)
  await selectRoleAndPerson(page, normalizedRole, ROLE_PERSON_SEARCH[normalizedRole] || '')

  if (normalizedRole === 'passenger') {
    await expect(page.getByTestId('react-demo-user-summary')).toContainText('Passenger', { timeout: 15000 })
  }
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

module.exports = {
  expectNoHorizontalOverflow,
  expectOperationalDashboardReady,
  normalizeRoleValue,
  openFleetShipsBySearch,
  openFleetSailingsBySearch,
  selectDemoUserByRole,
  selectRoleAndPerson,
  waitForRolePicker
}
