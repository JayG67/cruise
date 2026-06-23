const { test, expect } = require('@playwright/test')
const {
  expectNoHorizontalOverflow,
  openFleetShipsBySearch,
  openFleetSailingsBySearch,
  openCustomerWorkflows,
  clickStableControl,
  selectDemoUserByRole
} = require('../support/reactProductionHelpers')

async function completeCreateCruiseLineDetails(page, suffix = 'Responsive') {
  await page.getByTestId('react-create-cruise-line-name').fill(`${suffix} Cruise`)
  await page.getByTestId('react-create-cruise-line-country').fill('United States')
  await page.getByTestId('react-create-cruise-line-website').fill(`https://www.${suffix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.example`)
  await page.getByTestId('react-create-cruise-line-brand-family').fill(`${suffix} Brand Group`)
  await page.getByTestId('react-create-cruise-line-brand-theme').fill('Responsive workflow')
  await page.getByTestId('react-create-cruise-line-market-positioning').fill('Responsive cruise operations test line')
}

test.describe('React default desktop and tablet replacement checks', () => {
  test('keeps React replacement sections in production order', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('react-role-selector')).toBeVisible()
    await expect(page.getByTestId('react-active-route-operations')).toBeVisible()
    await expect(page.getByTestId('react-fleet-directory')).toBeVisible()
    await expect(page.getByTestId('react-create-cruise-line-workflow')).toBeVisible()
    await expect(page.getByTestId('react-sqa-console')).toBeVisible()

    const order = await page.evaluate(() => [
      document.querySelector('[data-testid="react-role-selector"]')?.getBoundingClientRect().top,
      document.querySelector('[data-testid="react-active-route-operations"]')?.getBoundingClientRect().top,
      document.querySelector('[data-testid="react-fleet-directory"]')?.getBoundingClientRect().top,
      document.querySelector('[data-testid="react-create-cruise-line-workflow"]')?.getBoundingClientRect().top,
      document.querySelector('[data-testid="react-sqa-console"]')?.getBoundingClientRect().top
    ])

    expect(order.every(value => typeof value === 'number')).toBe(true)
    expect(order[0]).toBeLessThan(order[1])
    expect(order[1]).toBeLessThan(order[2])
    expect(order[2]).toBeLessThan(order[3])
    expect(order[3]).toBeLessThan(order[4])

    await expectNoHorizontalOverflow(page)
  })

  test('keeps React responsive role selector usable at tablet width', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 900, height: 1100 })

    const roleSelector = page.getByTestId('react-role-selector')
    await expect(roleSelector).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('react-role-type-select')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('react-person-finder-panel')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('react-demo-user-summary')).toBeVisible({ timeout: 15000 })

    const roleOptions = await page.getByTestId('react-role-type-select').locator('option').allTextContents()
    const roleOptionLabels = roleOptions.join(' ')

    expect(roleOptionLabels).toContain('All roles')
    expect(roleOptionLabels).toContain('Administrator')
    expect(roleOptionLabels).toContain('Passenger')
    expect(roleOptionLabels).toContain('Group Leader')

    await expectNoHorizontalOverflow(page)
  })
  test('loads React fleet ships from the fleet directory at desktop width', async ({ page }) => {
    await page.goto('/')

    await openFleetShipsBySearch(page, 'Royal')
    await expect(page.getByTestId('react-ship-card').first()).toContainText('Current port:')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React fleet delete guarded by a native React confirmation panel', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('react-fleet-search').fill('Norwegian')
    const norwegianFleetCard = page
      .getByTestId('react-fleet-card')
      .filter({ hasText: 'Norwegian' })
      .first()
    await expect(norwegianFleetCard).toBeVisible()

    const fleetDeleteButton = norwegianFleetCard.getByTestId('react-delete-cruise-line-button')
    await clickStableControl(fleetDeleteButton)
    const fleetDeleteConfirmation = page.getByTestId('react-fleet-delete-confirmation')

    if (!(await fleetDeleteConfirmation.isVisible({ timeout: 2500 }).catch(() => false))) {
      await fleetDeleteButton.evaluate(button => button.click())
    }

    await expect(fleetDeleteConfirmation).toBeVisible({ timeout: 15000 })
    await expect(fleetDeleteConfirmation).toContainText('Delete Norwegian', { timeout: 15000 })
    await clickStableControl(page.getByTestId('react-fleet-delete-confirmation-cancel'))
    await expect(page.getByTestId('react-fleet-delete-confirmation')).toHaveCount(0)
    await expect(norwegianFleetCard).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React create workflow usable at desktop width', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('react-add-ship-row')).toBeDisabled()
    await completeCreateCruiseLineDetails(page, 'Responsive React')
    await expect(page.getByTestId('react-add-ship-row')).toBeEnabled()
    await page.getByTestId('react-create-ship-name').first().fill('Responsive React Ship')
    await page.getByTestId('react-add-ship-row').click()
    await expect(page.getByTestId('react-create-ship-name')).toHaveCount(2)
    await page.getByTestId('react-remove-ship-row').last().click()
    await expect(page.getByTestId('react-create-ship-name')).toHaveCount(1)
    await page.getByTestId('react-reset-cruise-line').click()
    await expect(page.getByTestId('react-create-cruise-line-name')).toHaveValue('')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React ship CRUD and sailings readable at desktop width', async ({ page }) => {
    await page.goto('/')

    await openFleetShipsBySearch(page, 'Royal')
    await expect(page.getByTestId('react-create-ship-form')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('react-update-ship-button').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('react-delete-ship-button').first()).toBeVisible({ timeout: 15000 })
    await openFleetSailingsBySearch(page, 'Royal')
    await expect(page.getByTestId('react-view-itinerary-button').first()).toBeVisible()
    await page.getByTestId('react-view-itinerary-button').first().click()
    await expect(page.getByTestId('react-itinerary-panel')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React cruise line update form guarded by controlled cancellation', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-fleet-search').fill('Royal')
    await expect(page.getByTestId('react-update-cruise-line-button').first()).toBeVisible()

    await page.getByTestId('react-update-cruise-line-button').first().click()
    await expect(page.getByTestId('react-cruise-line-edit-form')).toBeVisible()
    await expect(page.getByTestId('react-edit-cruise-line-name')).toBeVisible()
    await page.getByTestId('react-cancel-cruise-line-edit').click()
    await expect(page.getByTestId('react-cruise-line-edit-form')).toHaveCount(0)
    await expect(page.getByTestId('react-fleet-card').first()).toContainText('Royal')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React sailing CRUD controls readable at desktop width', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await openFleetSailingsBySearch(page, 'Royal')
    await expect(page.getByTestId('react-create-sailing-form')).toBeVisible()
    await expect(page.getByTestId('react-create-sailing-submit-button')).toBeVisible()
    await expect(page.getByTestId('react-update-sailing-button').first()).toBeVisible()
    await expect(page.getByTestId('react-delete-sailing-button').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React itinerary CRUD controls readable at desktop width', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await openFleetSailingsBySearch(page, 'Royal')
    await page.getByTestId('react-view-itinerary-button').first().click()
    await expect(page.getByTestId('react-itinerary-panel')).toBeVisible()
    await expect(page.getByTestId('react-create-itinerary-day-form')).toBeVisible()
    await expect(page.getByTestId('react-create-itinerary-activity-form')).toBeVisible()
    await expect(page.getByTestId('react-update-itinerary-day-button').first()).toBeVisible()
    await expect(page.getByTestId('react-delete-itinerary-day-button').first()).toBeVisible()
    await expect(page.getByTestId('react-update-itinerary-activity-button').first()).toBeVisible()
    await expect(page.getByTestId('react-delete-itinerary-activity-button').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React customer hierarchy table usable at desktop width', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await openCustomerWorkflows(page)
    await clickStableControl(page.getByTestId('react-expand-visible-customers'))
    await expect(page.getByTestId('react-customer-bookings-row').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React admin draft forms stable at tablet width', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 900, height: 1100 })
    await selectDemoUserByRole(page, 'Admin')

    await openCustomerWorkflows(page)
    await clickStableControl(page.getByTestId('react-edit-customer-button').first())
    await expect(page.getByTestId('react-customer-draft-form')).toBeVisible()
    await clickStableControl(page.getByTestId('react-cancel-customer-draft'))
    await expect(page.getByTestId('react-customer-draft-form')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps product workspace sections stable at desktop and tablet widths', async ({ page }) => {
    await page.goto('/')

    for (const [width, height] of [[1440, 1000], [900, 1100]]) {
      await page.setViewportSize({ width, height })
      await expect(page.getByTestId('react-retired-route-nav')).toHaveCount(0)
      await page.getByTestId('react-workspace-fleet-button').click()
      await expect(page.getByTestId('react-fleet-directory')).toBeVisible()
      await page.getByTestId('react-workspace-quality-button').click()
      await expect(page.getByTestId('react-sqa-console')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
  })

  test('keeps React quality output panels readable without layout overflow', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-sqa-console').scrollIntoViewIfNeeded()
    await page.getByTestId('react-sqa-data-button').click()
    await expect(page.getByTestId('react-sqa-output')).toContainText('Data Verification Result')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React create workflow grid stable at desktop and tablet widths', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    for (const [width, height] of [[1280, 900], [900, 1100]]) {
      await page.setViewportSize({ width, height })
      await expect(page.getByTestId('react-add-ship-row')).toBeDisabled()
      await completeCreateCruiseLineDetails(page, `Responsive ${width}`)
      await expect(page.getByTestId('react-add-ship-row')).toBeEnabled()
      await page.getByTestId('react-add-ship-row').click()
      await expect(page.getByTestId('react-create-ship-name').first()).toBeVisible()
      await expectNoHorizontalOverflow(page)
      await page.getByTestId('react-reset-cruise-line').click()
    }
  })

  test('keeps React passenger details cards stable across desktop and tablet widths', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Passenger')

    for (const [width, height] of [[1280, 900], [900, 1100]]) {
      await page.setViewportSize({ width, height })
      await page.getByTestId('react-role-booking-details-toggle').first().click()
      await expect(page.getByTestId('react-role-booking-details').first()).toBeVisible()
      await expect(page.getByTestId('react-role-detail-passenger-row').first()).toBeVisible()
      await page.getByTestId('react-role-booking-details-toggle').first().click()
      await expectNoHorizontalOverflow(page)
    }
  })

  test('keeps React fleet filtering and selected ship panels stable at wide desktop width', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await selectDemoUserByRole(page, 'Admin')

    await openFleetShipsBySearch(page, 'Royal')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React itinerary admin cards stable at tablet width', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 900, height: 1100 })
    await selectDemoUserByRole(page, 'Admin')

    await openFleetSailingsBySearch(page, 'Royal')
    await page.getByTestId('react-view-itinerary-button').first().click()
    await expect(page.getByTestId('react-itinerary-panel')).toBeVisible()
    await expect(page.getByTestId('react-itinerary-day-card').first()).toBeVisible()
    await expect(page.getByTestId('react-create-itinerary-day-form')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })


})
