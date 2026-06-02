const { test, expect } = require('@playwright/test')

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => {
    const documentElement = document.documentElement
    const body = document.body
    const viewportWidth = documentElement.clientWidth
    const documentScrollWidth = documentElement.scrollWidth
    const bodyScrollWidth = body ? body.scrollWidth : 0

    const overflowingElements = Array.from(document.querySelectorAll('body *'))
      .map(element => {
        const rect = element.getBoundingClientRect()

        return {
          tagName: element.tagName,
          testId: element.getAttribute('data-testid'),
          className: typeof element.className === 'string' ? element.className : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        }
      })
      .filter(element => element.right > viewportWidth + 8 || element.left < -8)
      .slice(0, 8)

    return {
      viewportWidth,
      documentScrollWidth,
      bodyScrollWidth,
      overflowAmount: Math.max(documentScrollWidth, bodyScrollWidth) - viewportWidth,
      overflowingElements
    }
  })

  expect(metrics, JSON.stringify(metrics, null, 2)).toEqual(
    expect.objectContaining({
      overflowAmount: expect.any(Number)
    })
  )

  expect(metrics.overflowAmount, JSON.stringify(metrics, null, 2)).toBeLessThanOrEqual(8)
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


async function openBookingDetailsPanel(bookingCard) {
  const detailsButton = bookingCard.getByTestId('role-booking-details-button')
  const detailsPanel = bookingCard.getByTestId('inline-booking-details')

  await detailsButton.scrollIntoViewIfNeeded()
  await expect(detailsButton).toBeVisible()
  await detailsButton.click()
  await expect(detailsButton).toContainText('Hide Details')
  await expect(detailsPanel).toBeVisible()
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

async function searchAdminRecords(page, searchTerm) {
  await page.getByTestId('admin-data-search-input').fill(searchTerm)
}

async function openAdminCustomerWorkflows(page) {
  await page.getByTestId('admin-show-customers-button').click()
  await expect(page.getByTestId('admin-show-customers-button')).toContainText('Hide Customer Workflows')
  await expect(page.getByTestId('admin-customers-panel')).toBeVisible()
}

async function hideAdminCustomerWorkflows(page) {
  await page.getByTestId('admin-show-customers-button').click()
  await expect(page.getByTestId('admin-show-customers-button')).toContainText('Show Customer Workflows')
  await expect(page.getByTestId('admin-customers-panel')).toBeHidden()
}

async function getCustomerWorkflowByName(page, customerName) {
  return page.getByTestId('admin-customer-row').filter({ hasText: customerName }).first()
}

async function expandCustomerBookingsFor(page, customerName) {
  const customerWorkflow = await getCustomerWorkflowByName(page, customerName)
  await customerWorkflow.getByTestId('admin-toggle-customer-bookings-button').click()
  await expect(customerWorkflow.getByTestId('admin-toggle-customer-bookings-button')).toHaveAttribute('aria-expanded', 'true')

  return customerWorkflow
}

test.describe('Cruise Explorer mobile role and passenger dashboard quality checks', () => {
  test('renders the role selector and booking dashboard as mobile-first content', async ({ page }) => {
    await openRoleDashboard(page)

    await expect(page.getByTestId('demo-role-summary')).toContainText('Admin Demo User')
    await expect(page.getByTestId('role-booking-dashboard-title')).toContainText('Admin workspace')
    await expect(page.getByTestId('role-booking-dashboard-description')).toContainText('expand linked bookings inline')
    await expect(page.getByTestId('role-admin-visibility-card')).toHaveCount(0)
    await expect(page.getByTestId('admin-data-management-panel')).toBeVisible()

    await expectTouchTargetIsUsable(page.getByTestId('demo-user-selector'))
    await expectElementWithinViewport(page, page.getByTestId('demo-role-panel'))
    await expectElementWithinViewport(page, page.getByTestId('role-booking-dashboard'))
    await expectNoHorizontalOverflow(page)
  })


  test('keeps admin customer workflows collapsed behind mobile show and hide controls', async ({ page }) => {
    await openRoleDashboard(page)

    await expect(page.getByTestId('admin-data-search-input')).toBeVisible()
    await expect(page.getByTestId('admin-customers-panel')).toBeHidden()
    await expect(page.getByTestId('admin-bookings-panel')).toHaveCount(0)
    await expect(page.getByTestId('admin-show-customers-button')).toContainText('Show Customer Workflows')
    await expect(page.getByTestId('admin-show-bookings-button')).toHaveCount(0)

    await searchAdminRecords(page, 'Alisa')
    await expect(page.getByTestId('admin-data-message')).toContainText('Search found')
    await expect(page.getByTestId('admin-customer-row')).toHaveCount(0)
    await expect(page.getByTestId('admin-booking-row')).toHaveCount(0)

    await openAdminCustomerWorkflows(page)
    const matchingCustomerWorkflow = await getCustomerWorkflowByName(page, 'Alisa Gallagher')
    await expect(matchingCustomerWorkflow).toContainText('Alisa Gallagher')
    await expect(matchingCustomerWorkflow).toContainText('2 bookings')
    await expect(matchingCustomerWorkflow.getByTestId('admin-toggle-customer-bookings-button')).toHaveAttribute('aria-expanded', 'false')

    await expandCustomerBookingsFor(page, 'Alisa Gallagher')

    const visibleBookingTable = page.locator('[data-testid="admin-booking-child-table"]:visible').first()
    await expect(visibleBookingTable).toBeVisible()

    const visibleBookingRow = page.locator('[data-testid="admin-booking-row"]:visible').first()
    await expect(visibleBookingRow).toBeVisible()
    await expect(visibleBookingRow).toContainText('Alisa Gallagher')

    await visibleBookingRow.getByTestId('admin-toggle-booking-details-button').click()

    const visibleBookingDetailsRow = page.locator('[data-testid^="admin-booking-details-row-"]:visible').first()
    await expect(visibleBookingDetailsRow).toBeVisible()
    await expect(visibleBookingDetailsRow.getByTestId('admin-booking-details-panel')).toContainText('Fare code')

    await hideAdminCustomerWorkflows(page)

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

    await expect(page.getByTestId('role-admin-visibility-card')).toHaveCount(0)
    await expect(page.getByTestId('admin-data-management-panel')).toBeVisible()
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
  test('resets selected cruise workflow panels after switching demo roles on mobile', async ({ page }) => {
    await openFirstFleetWorkflow(page)

    await expect(page.getByTestId('ships-panel')).toBeVisible()
    await expect(page.getByTestId('sailings-panel')).toBeVisible()
    await expect(page.getByTestId('itinerary-panel')).toBeVisible()

    await page.getByTestId('demo-user-selector').selectOption('UPASS00001')

    await expect(page.getByTestId('ships-panel')).toBeHidden()
    await expect(page.getByTestId('sailings-panel')).toBeHidden()
    await expect(page.getByTestId('itinerary-panel')).toBeHidden()
    await expect(page.getByTestId('cruise-card').first()).toBeVisible()
  })

  test('opens booked cruise details directly below the selected passenger booking card on mobile', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Jay Gallagher Passenger View')

    const firstBookingCard = page.getByTestId('role-booking-card').first()
    await expect(firstBookingCard).toBeVisible()

    await expect(firstBookingCard.getByTestId('role-booking-details-button')).toContainText('View Details')
    await firstBookingCard.getByTestId('role-booking-details-button').click()
    await expect(firstBookingCard.getByTestId('role-booking-details-button')).toContainText('Hide Details')

    await expect(firstBookingCard.getByTestId('inline-booking-details')).toBeVisible()
    await expect(firstBookingCard.getByTestId('inline-itinerary-day').first()).toBeVisible()
    await expect(page.getByTestId('itinerary-panel')).toBeHidden()
    await expectNoHorizontalOverflow(page)
  })


  test('keeps expanded passenger booking details anchored to the booking card before cruise line browsing on mobile', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Jay Gallagher Passenger View')

    const firstBookingCard = page.getByTestId('role-booking-card').first()
    const cruiseLineSection = page.getByTestId('cruise-lines-section')

    await firstBookingCard.getByTestId('role-booking-details-button').click()

    const detailsBox = await firstBookingCard.getByTestId('inline-booking-details').boundingBox()
    const cruiseLinesBox = await cruiseLineSection.boundingBox()

    expect(detailsBox).not.toBeNull()
    expect(cruiseLinesBox).not.toBeNull()
    expect(detailsBox.y).toBeLessThan(cruiseLinesBox.y)
  })

  test('exposes a broad set of selectable demo personas on mobile', async ({ page }) => {
    await openRoleDashboard(page)

    const options = await page.getByTestId('demo-user-selector').locator('option').allTextContents()

    expect(options.length).toBeGreaterThanOrEqual(10)
    expect(options.join(' ')).toContain('Alisa Gallagher')
    expect(options.join(' ')).toContain('Parker Family')
    expect(options.join(' ')).toContain('Kim Couple')
    expect(options.join(' ')).toContain('Grace Thompson')
  })


  test('keeps multiple booked cruise detail panels open and supports hide details on mobile', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Jay Gallagher Passenger View')

    const firstBookingCard = page.getByTestId('role-booking-card').nth(0)
    const secondBookingCard = page.getByTestId('role-booking-card').nth(1)

    await expect(firstBookingCard).toBeVisible()
    await expect(secondBookingCard).toBeVisible()

    await openBookingDetailsPanel(firstBookingCard)
    await openBookingDetailsPanel(secondBookingCard)

    await firstBookingCard.getByTestId('role-booking-details-button').scrollIntoViewIfNeeded()
    await firstBookingCard.getByTestId('role-booking-details-button').click()

    await expect(firstBookingCard.getByTestId('inline-booking-details')).toBeHidden()
    await expect(firstBookingCard.getByTestId('role-booking-details-button')).toContainText('View Details')
    await expect(secondBookingCard.getByTestId('inline-booking-details')).toBeVisible()
    await expect(secondBookingCard.getByTestId('role-booking-details-button')).toContainText('Hide Details')
    await expectNoHorizontalOverflow(page)
  })

  test('renders passenger dining preference as a mobile-friendly dropdown with compact save control', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Jay Gallagher Passenger View')

    const profileForm = page.getByTestId('passenger-profile-form')
    const diningPreference = page.getByTestId('dining-preference-select')
    const saveButton = page.getByTestId('passenger-profile-submit-button')

    await expect(profileForm).toBeVisible()
    await expect(diningPreference).toBeVisible()
    await expect(diningPreference.locator('option')).toHaveCount(9)

    await diningPreference.selectOption('Late seating')
    await expect(diningPreference).toHaveValue('Late seating')

    const box = await saveButton.boundingBox()
    expect(box).not.toBeNull()
    expect(box.height).toBeGreaterThanOrEqual(36)
    expect(box.width).toBeLessThanOrEqual(220)

    await expectNoHorizontalOverflow(page)
  })


  test('keeps passenger dashboard accessibility semantics available on mobile', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Jay Gallagher Passenger View')

    await expect(page.getByTestId('skip-link')).toHaveAttribute('href', '#main-content')
    await expect(page.getByTestId('primary-navigation')).toHaveAttribute('aria-label', 'Primary navigation')
    await expect(page.getByTestId('role-booking-dashboard')).toHaveAttribute('aria-labelledby', 'role-booking-dashboard-heading')

    const firstBookingCard = page.getByTestId('role-booking-card').first()
    const detailsButton = firstBookingCard.getByTestId('role-booking-details-button')

    await expect(detailsButton).toHaveAttribute('aria-expanded', 'false')
    await expect(detailsButton).toHaveAttribute('aria-label', /View details for booking/)
    await detailsButton.click()
    await expect(detailsButton).toHaveAttribute('aria-expanded', 'true')
    await expect(detailsButton).toHaveAttribute('aria-label', /Hide details for booking/)

    const firstFavorite = firstBookingCard.getByTestId('favorite-toggle-button').first()
    await expect(firstFavorite).toHaveAttribute('role', 'checkbox')
    await expect(firstFavorite).toHaveAttribute('aria-label', /favorite/i)
    await expectNoHorizontalOverflow(page)
  })


  test('renders itinerary favorites as star checkbox controls on mobile', async ({ page }) => {
    await openRoleDashboard(page)
    await selectDemoRole(page, 'UPASS00001', 'Jay Gallagher Passenger View')

    const firstBookingCard = page.getByTestId('role-booking-card').first()
    await firstBookingCard.getByTestId('role-booking-details-button').click()

    const firstFavorite = firstBookingCard.getByTestId('favorite-toggle-button').first()

    await expect(firstFavorite).toHaveAttribute('role', 'checkbox')

    const initialFavoriteState = await firstFavorite.getAttribute('aria-checked')

    if (initialFavoriteState === 'true') {
      await firstFavorite.click()
      await expect(firstFavorite).toHaveAttribute('aria-checked', 'false')
    }

    await firstFavorite.click()

    await firstBookingCard.getByTestId('show-favorite-itinerary-button').click()

    const savedFavorite = firstBookingCard.getByTestId('favorite-toggle-button').first()
    await expect(savedFavorite).toHaveAttribute('aria-checked', 'true')
    await expect(savedFavorite).toContainText('★')
    await expectNoHorizontalOverflow(page)
  })


})
