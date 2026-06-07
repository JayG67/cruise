const { test, expect } = require('@playwright/test')

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8)
  expect(overflow).toBe(false)
}

async function selectDemoUserByRole(page, roleText) {
  const roleSelect = page.getByTestId('react-role-type-select')
  const personSelect = page.getByTestId('react-demo-user-select')
  const roleValues = {
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
  const roleValue = roleValues[roleText] || roleText.toLowerCase().replaceAll(' ', '-')

  await expect(roleSelect).toBeVisible()
  await roleSelect.selectOption(roleValue)

  await expect(personSelect).toBeVisible()
  await expect.poll(async () => {
    return personSelect.locator('option').count()
  }).toBeGreaterThan(0)

  const matchingOption = personSelect.locator('option').filter({ hasText: roleText }).first()
  const matchingCount = await personSelect.locator('option').filter({ hasText: roleText }).count()
  const fallbackOption = personSelect.locator('option').first()
  const option = matchingCount > 0 ? matchingOption : fallbackOption
  const matchingValue = await option.getAttribute('value')

  expect(matchingValue).toBeTruthy()

  await personSelect.selectOption(matchingValue)
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

  test('keeps React responsive role switching usable at tablet width', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 900, height: 1100 })

    await selectDemoUserByRole(page, 'Passenger')
    await expect(page.getByTestId('react-passenger-dashboard')).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await selectDemoUserByRole(page, 'Admin')
    await expect(page.getByTestId('react-active-route-operations')).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await selectDemoUserByRole(page, 'Turnaround Manager')
    await expect(page.getByTestId('react-operations-directory-panel')).toBeVisible()
    await expect(page.getByTestId('react-operations-directory-card').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
  test('loads React fleet ships from the fleet directory at desktop width', async ({ page }) => {
    await page.goto('/')

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
    await page.goto('/')

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
    await page.goto('/')

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
    await page.goto('/')

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
    await page.goto('/')
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

  test('keeps React customer hierarchy table usable at desktop width', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-toggle-customer-workflows').click()
    await expect(page.getByTestId('react-customer-workflow-table')).toBeVisible()
    await page.getByTestId('react-expand-visible-customers').click()
    await expect(page.getByTestId('react-customer-bookings-row').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React admin draft forms stable at tablet width', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 900, height: 1100 })
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-toggle-customer-workflows').click()
    await page.getByTestId('react-edit-customer-button').first().click()
    await expect(page.getByTestId('react-customer-draft-form')).toBeVisible()
    await page.getByTestId('react-cancel-customer-draft').click()
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

  test('keeps React SQA output panels readable without layout overflow', async ({ page }) => {
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
      await page.getByTestId('react-create-cruise-line-name').fill('Responsive Cruise')
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

    await page.getByTestId('react-fleet-search').fill('Royal')
    await expect(page.getByTestId('react-fleet-card').first()).toContainText('Royal')
    await page.getByTestId('react-view-ships-button').first().click()
    await expect(page.getByTestId('react-selected-ships-panel')).toBeVisible()
    await expect(page.getByTestId('react-ship-card').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React itinerary admin cards stable at tablet width', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 900, height: 1100 })
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-fleet-search').fill('Royal')
    await page.getByTestId('react-view-ships-button').first().click()
    await page.getByTestId('react-view-sailings-button').first().click()
    await page.getByTestId('react-view-itinerary-button').first().click()
    await expect(page.getByTestId('react-itinerary-panel')).toBeVisible()
    await expect(page.getByTestId('react-itinerary-day-card').first()).toBeVisible()
    await expect(page.getByTestId('react-create-itinerary-day-form')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })


})
