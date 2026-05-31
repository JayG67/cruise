const { test, expect } = require('@playwright/test')

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8)
  expect(overflow).toBe(false)
}

async function selectDemoUserByRole(page, roleText) {
  const select = page.getByTestId('react-demo-user-select')

  await expect(select).toBeVisible()
  await expect.poll(async () => {
    return select.locator('option').filter({ hasText: roleText }).count()
  }).toBeGreaterThan(0)

  const matchingValue = await select.locator('option').filter({ hasText: roleText }).first().getAttribute('value')

  expect(matchingValue).toBeTruthy()

  await select.selectOption(matchingValue)
}

test.describe('React /app-next desktop and tablet replacement checks', () => {
  test('keeps React replacement sections in production order', async ({ page }) => {
    await page.goto('/app-next')

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

  test('keeps React responsive role switching usable at tablet width', async ({ page }) => {
    await page.goto('/app-next')
    await page.setViewportSize({ width: 900, height: 1100 })

    await selectDemoUserByRole(page, 'Passenger')
    await expect(page.getByTestId('react-passenger-dashboard')).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await selectDemoUserByRole(page, 'Admin')
    await expect(page.getByTestId('react-active-route-operations')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
  test('loads React fleet ships from the fleet directory at desktop width', async ({ page }) => {
    await page.goto('/app-next')

    await page.getByTestId('react-fleet-search').fill('Royal')
    await expect(page.getByTestId('react-fleet-card').first()).toContainText('Royal')

    await page.getByTestId('react-view-ships-button').first().click()
    await expect(page.getByTestId('react-selected-ships-panel')).toBeVisible()
    await expect(page.getByTestId('react-selected-ships-panel')).toContainText('Royal')
    await expect(page.getByTestId('react-ship-card').first()).toBeVisible()
    await expect(page.getByTestId('react-ship-card').first()).toContainText('Current port:')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React fleet delete guarded by a native React confirmation panel', async ({ page }) => {
    await page.goto('/app-next')

    await page.getByTestId('react-fleet-search').fill('Norwegian')
    await expect(page.getByTestId('react-fleet-card').first()).toContainText('Norwegian')

    await page.getByTestId('react-delete-cruise-line-button').first().click()
    await expect(page.getByTestId('react-fleet-delete-confirmation')).toContainText('Delete Norwegian')
    await page.getByTestId('react-fleet-delete-confirmation-cancel').click()
    await expect(page.getByTestId('react-fleet-delete-confirmation')).toHaveCount(0)
    await expect(page.getByTestId('react-fleet-card').first()).toContainText('Norwegian')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React create workflow usable at desktop width', async ({ page }) => {
    await page.goto('/app-next')

    await page.getByTestId('react-create-cruise-line-name').fill('Responsive React Cruise')
    await page.getByTestId('react-create-cruise-line-country').fill('United States')
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
    await page.goto('/app-next')

    await page.getByTestId('react-fleet-search').fill('Royal')
    await page.getByTestId('react-view-ships-button').first().click()
    await expect(page.getByTestId('react-selected-ships-panel')).toBeVisible()
    await expect(page.getByTestId('react-create-ship-form')).toBeVisible()
    await expect(page.getByTestId('react-ship-card').first()).toBeVisible()
    await expect(page.getByTestId('react-view-sailings-button').first()).toBeVisible()
    await expect(page.getByTestId('react-update-ship-button').first()).toBeVisible()
    await expect(page.getByTestId('react-delete-ship-button').first()).toBeVisible()
    await page.getByTestId('react-view-sailings-button').first().click()
    await expect(page.getByTestId('react-sailings-panel')).toBeVisible()
    await expect(page.getByTestId('react-view-itinerary-button').first()).toBeVisible()
    await page.getByTestId('react-view-itinerary-button').first().click()
    await expect(page.getByTestId('react-itinerary-panel')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React cruise line update form guarded by controlled cancellation', async ({ page }) => {
    await page.goto('/app-next')
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
    await page.goto('/app-next')
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-fleet-search').fill('Royal')
    await page.getByTestId('react-view-ships-button').first().click()
    await expect(page.getByTestId('react-selected-ships-panel')).toBeVisible()
    await page.getByTestId('react-view-sailings-button').first().click()
    await expect(page.getByTestId('react-sailings-panel')).toBeVisible()
    await expect(page.getByTestId('react-create-sailing-form')).toBeVisible()
    await expect(page.getByTestId('react-create-sailing-submit-button')).toBeVisible()
    await expect(page.getByTestId('react-update-sailing-button').first()).toBeVisible()
    await expect(page.getByTestId('react-delete-sailing-button').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React itinerary CRUD controls readable at desktop width', async ({ page }) => {
    await page.goto('/app-next')
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-fleet-search').fill('Royal')
    await page.getByTestId('react-view-ships-button').first().click()
    await expect(page.getByTestId('react-selected-ships-panel')).toBeVisible()
    await page.getByTestId('react-view-sailings-button').first().click()
    await expect(page.getByTestId('react-sailings-panel')).toBeVisible()
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

})
