const { test, expect } = require('@playwright/test')

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement
    return documentElement.scrollWidth > documentElement.clientWidth + 1
  })

  expect(overflow).toBe(false)
}

async function expectTouchTargetIsUsable(locator) {
  await expect(locator).toBeVisible()

  const box = await locator.boundingBox()

  expect(box).not.toBeNull()
  expect(box.width).toBeGreaterThanOrEqual(32)
  expect(box.height).toBeGreaterThanOrEqual(32)
}

async function expectElementWithinViewport(page, locator) {
  await expect(locator).toBeVisible()

  const viewport = page.viewportSize()
  const box = await locator.boundingBox()

  expect(viewport).not.toBeNull()
  expect(box).not.toBeNull()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
}

async function openRoleDashboard(page) {
  await page.goto('/')

  await expect(page.getByTestId('demo-role-panel')).toBeVisible()
  await expect(page.getByTestId('demo-user-selector')).toBeVisible()
  await expect(page.getByTestId('role-booking-dashboard')).toBeVisible()
  await expect(page.getByTestId('role-booking-dashboard-grid')).toBeVisible()
}

async function selectDemoRole(page, userId, expectedSummaryText) {
  await page.getByTestId('demo-user-selector').selectOption(userId)

  await expect(page.getByTestId('demo-user-selector')).toHaveValue(userId)
  await expect(page.getByTestId('demo-role-summary')).toContainText(expectedSummaryText)
}

async function openFirstFleetWorkflow(page) {
  await page.goto('/')
  await expect(page.getByTestId('cruise-card').first()).toBeVisible()

  await page.getByTestId('view-ships-button').first().click()
  await expect(page.getByTestId('ships-panel')).toBeVisible()
  await expect(page.getByTestId('ship-card').first()).toBeVisible()

  await page.getByTestId('view-sailings-button').first().click()
  await expect(page.getByTestId('sailings-panel')).toBeVisible()
  await expect(page.getByTestId('sailing-card').first()).toBeVisible()

  await page.getByTestId('view-itinerary-button').first().click()
  await expect(page.getByTestId('itinerary-panel')).toBeVisible()
}

test.describe('Cruise Explorer mobile role and passenger dashboard quality checks', () => {
  test('renders the role selector and booking dashboard as mobile-first content', async ({ page }) => {
    await openRoleDashboard(page)

    await expect(page.getByTestId('demo-role-summary')).toContainText('Admin Demo User')
    await expect(page.getByTestId('role-booking-dashboard-title')).toContainText('Admin operations visibility')
    await expect(page.getByTestId('role-admin-visibility-card')).toBeVisible()

    await expectTouchTargetIsUsable(page.getByTestId('demo-user-selector'))
    await expectElementWithinViewport(page, page.getByTestId('demo-role-panel'))
    await expectElementWithinViewport(page, page.getByTestId('role-booking-dashboard'))
    await expectNoHorizontalOverflow(page)
  })

  test('keeps every seeded role option selectable from a phone viewport', async ({ page }) => {
    await openRoleDashboard(page)

    const selector = page.getByTestId('demo-user-selector')

    await expect(selector.locator('option[value="UADMIN0001"]')).toContainText('Admin')
    await expect(selector.locator('option[value="UPASS00001"]')).toContainText('Passenger')
    await expect(selector.locator('option[value="UGROUP0001"]')).toContainText('Group Leader')

    await selectDemoRole(page, 'UPASS00001', 'Passenger')
    await selectDemoRole(page, 'UGROUP0001', 'Group Leader')
    await selectDemoRole(page, 'UADMIN0001', 'Admin Demo User')

    await expectNoHorizontalOverflow(page)
  })

  test('hides admin-only cruise management controls in passenger mode on mobile', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Passenger')

    await expect(page.getByTestId('create-cruise-line-panel')).toBeHidden()
    await expect(page.getByTestId('update-cruise-line-button').first()).toBeHidden()
    await expect(page.getByTestId('delete-cruise-line-button').first()).toBeHidden()
    await expect(page.getByTestId('view-ships-button').first()).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('renders passenger booking cards with readable trip details on mobile', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Passenger')

    const bookingCards = page.getByTestId('role-booking-card')

    await expect(bookingCards.first()).toBeVisible()
    expect(await bookingCards.count()).toBeGreaterThanOrEqual(2)

    await expect(bookingCards.first()).toContainText('Booking B')
    await expect(bookingCards.first()).toContainText('Cruise line')
    await expect(bookingCards.first()).toContainText('Ship')
    await expect(bookingCards.first()).toContainText('Sailing date')
    await expect(bookingCards.first()).toContainText('Cabin')
    await expect(bookingCards.first()).toContainText('Route')
    await expect(bookingCards.first()).toContainText('Visible passengers')

    await expectElementWithinViewport(page, bookingCards.first())
    await expectNoHorizontalOverflow(page)
  })

  test('renders group leader passenger lists without horizontal overflow on mobile', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UGROUP0001', 'Group Leader')

    await expect(page.getByTestId('role-booking-card').first()).toBeVisible()
    expect(await page.getByTestId('role-booking-passenger').count()).toBeGreaterThanOrEqual(2)

    await expectElementWithinViewport(page, page.getByTestId('role-booking-card').first())
    await expectElementWithinViewport(page, page.getByTestId('role-booking-passenger').first())
    await expectNoHorizontalOverflow(page)
  })

  test('restores admin dashboard and management controls after switching back from passenger mode', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Passenger')

    await expect(page.getByTestId('create-cruise-line-panel')).toBeHidden()
    await expect(page.getByTestId('role-booking-card').first()).toBeVisible()

    await selectDemoRole(page, 'UADMIN0001', 'Admin Demo User')

    await expect(page.getByTestId('role-admin-visibility-card')).toBeVisible()
    await expect(page.getByTestId('role-booking-card')).toHaveCount(0)
    await expect(page.getByTestId('create-cruise-line-panel')).toBeVisible()
    await expect(page.getByTestId('update-cruise-line-button').first()).toBeVisible()
    await expect(page.getByTestId('delete-cruise-line-button').first()).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('keeps role dashboard cards within the phone viewport while scrolling', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Passenger')

    const cards = page.getByTestId('role-booking-card')
    const count = await cards.count()

    expect(count).toBeGreaterThan(0)

    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index)
      await card.scrollIntoViewIfNeeded()
      await expectElementWithinViewport(page, card)
    }

    await expectNoHorizontalOverflow(page)
  })

  test('keeps role selector and dashboard usable after moving through all personas on mobile', async ({ page }) => {
    await openRoleDashboard(page)

    const roleSequence = [
      ['UPASS00001', 'Passenger'],
      ['UGROUP0001', 'Group Leader'],
      ['UADMIN0001', 'Admin Demo User'],
      ['UPASS00001', 'Passenger']
    ]

    for (const [userId, summaryText] of roleSequence) {
      await selectDemoRole(page, userId, summaryText)
      await expectTouchTargetIsUsable(page.getByTestId('demo-user-selector'))
      await expect(page.getByTestId('role-booking-dashboard')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
  })

  test('keeps passenger mode fleet exploration read-only while still allowing navigation to ships', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Passenger')

    await page.getByTestId('view-ships-button').first().click()

    await expect(page.getByTestId('ships-panel')).toBeVisible()
    await expect(page.getByTestId('ship-card').first()).toBeVisible()
    await expect(page.getByTestId('update-ship-button').first()).toBeHidden()
    await expect(page.getByTestId('delete-ship-button').first()).toBeHidden()
    await expect(page.getByTestId('view-sailings-button').first()).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('moves mobile users to newly opened ship, sailing, and itinerary panels', async ({ page }) => {
    await openFirstFleetWorkflow(page)

    await expect(page.getByTestId('ships-panel')).toBeVisible()
    await expect(page.getByTestId('sailings-panel')).toBeVisible()
    await expect(page.getByTestId('itinerary-panel')).toBeVisible()

    const focusedTarget = await page.evaluate(() => window.__cruiseExplorer?.getPendingFocusTarget?.())

    expect(focusedTarget).toBe('itinerary-panel')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps sailing and itinerary controls as usable mobile touch targets', async ({ page }) => {
    await openFirstFleetWorkflow(page)

    await expectTouchTargetIsUsable(page.getByTestId('view-sailings-button').first())
    await expectTouchTargetIsUsable(page.getByTestId('view-itinerary-button').first())
    await expectTouchTargetIsUsable(page.getByTestId('itinerary-day-summary').first())

    await page.getByTestId('itinerary-day-summary').first().click()

    await expectTouchTargetIsUsable(page.getByTestId('update-itinerary-day-button').first())
    await expectTouchTargetIsUsable(page.getByTestId('delete-itinerary-day-button').first())
    await expectTouchTargetIsUsable(page.getByTestId('create-activity-submit-button').first())

    await expectNoHorizontalOverflow(page)
  })

  test('keeps role dashboard readable from tablet mobile project viewport too', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UGROUP0001', 'Group Leader')

    await expect(page.getByTestId('role-booking-dashboard-title')).toContainText('Group Leader booking dashboard')
    await expect(page.getByTestId('role-booking-card').first()).toBeVisible()
    await expect(page.getByTestId('role-booking-passenger').first()).toBeVisible()

    await expectElementWithinViewport(page, page.getByTestId('role-booking-dashboard'))
    await expectNoHorizontalOverflow(page)
  })
})
