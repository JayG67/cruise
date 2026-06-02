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

test.describe('React default mobile replacement checks', () => {
  test('loads React shell and workspace controls on mobile', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('react-production-parity-shell')).toBeVisible()
    await expect(page.getByTestId('react-top-navigation')).toBeVisible()
    await expect(page.getByTestId('react-workspace-card-grid')).toBeVisible()
    await expect(page.getByTestId('react-demo-user-select')).toBeVisible()

    const demoUserSelect = page.getByTestId('react-demo-user-select')
    await demoUserSelect.scrollIntoViewIfNeeded()
    await expect(demoUserSelect).toBeVisible()
    await expect(demoUserSelect).toBeEnabled()

    const roleWorkspaceButton = page.getByTestId('react-workspace-role-button')
    await roleWorkspaceButton.scrollIntoViewIfNeeded()
    await expect(roleWorkspaceButton).toBeVisible()
    await expect(roleWorkspaceButton).toContainText('Role Simulation')
    await roleWorkspaceButton.click()
    await expect(page.getByTestId('react-role-selector')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('switches role views on mobile instead of leaving admin visible', async ({ page }) => {
    await page.goto('/')

    await selectDemoUserByRole(page, 'Passenger')

    await expect(page.getByTestId('react-demo-user-summary')).toContainText('Passenger')
    await expect(page.getByTestId('react-passenger-dashboard')).toBeVisible()
    await expect(page.getByText('Passenger booking dashboard')).toBeVisible()
    await expect(page.getByText('My travel profile')).toBeVisible()
    await expect(page.getByTestId('react-active-route-operations')).toHaveCount(0)

    await expectNoHorizontalOverflow(page)
  })


  test('keeps React passenger self-service profile controls reachable on mobile', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Passenger')

    const profileForm = page.getByTestId('react-passenger-profile-form')
    await expect(profileForm).toBeVisible()
    await expect(page.getByTestId('react-passenger-profile-phone')).toBeVisible()
    await expect(page.getByTestId('react-dining-preference-select')).toBeVisible()
    await expect(page.getByTestId('react-passenger-profile-accessibility-notes')).toBeVisible()
    await expect(page.getByTestId('react-passenger-profile-submit-button')).toBeVisible()
    await expect(page.getByTestId('react-passenger-profile-message')).toContainText('Profile changes will be announced here')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps admin-only React tools available when admin is selected', async ({ page }) => {
    await page.goto('/')

    await selectDemoUserByRole(page, 'Admin')

    await expect(page.getByTestId('react-active-route-operations')).toBeVisible()
    await expect(page.getByTestId('react-fleet-directory')).toBeVisible()
    await expect(page.getByTestId('react-create-cruise-line-workflow')).toBeVisible()
    await expect(page.getByTestId('react-sqa-console')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })
  test('keeps React ship and sailing controls reachable on mobile', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-fleet-search').fill('Royal')
    const viewShipsButton = page.getByTestId('react-view-ships-button').first()
    await viewShipsButton.scrollIntoViewIfNeeded()
    await expect(viewShipsButton).toBeVisible()
    await viewShipsButton.click()

    const selectedShipsPanel = page.getByTestId('react-selected-ships-panel')
    await expect(selectedShipsPanel).toBeVisible()
    await expect(selectedShipsPanel).toContainText(/Royal.*ships/)
    await expect(page.getByTestId('react-create-ship-form')).toBeVisible()
    await expect(page.getByTestId('react-create-ship-submit-button')).toBeVisible()
    await expect(page.getByTestId('react-update-ship-button').first()).toBeVisible()
    await expect(page.getByTestId('react-delete-ship-button').first()).toBeVisible()

    const viewSailingsButton = page.getByTestId('react-view-sailings-button').first()
    await viewSailingsButton.scrollIntoViewIfNeeded()
    await expect(viewSailingsButton).toBeVisible()
    await viewSailingsButton.click()

    await expect(page.getByTestId('react-sailings-panel')).toBeVisible()
    await expect(page.getByTestId('react-view-itinerary-button').first()).toBeVisible()
    await page.getByTestId('react-view-itinerary-button').first().click()
    await expect(page.getByTestId('react-itinerary-panel')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React cruise line update action reachable on mobile', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-fleet-search').fill('Royal')
    const updateButton = page.getByTestId('react-update-cruise-line-button').first()
    await updateButton.scrollIntoViewIfNeeded()
    await expect(updateButton).toBeVisible()

    await updateButton.click()
    await expect(page.getByTestId('react-cruise-line-edit-form')).toBeVisible()
    await expect(page.getByTestId('react-edit-cruise-line-name')).toBeVisible()
    await page.getByTestId('react-cancel-cruise-line-edit').click()
    await expect(page.getByTestId('react-cruise-line-edit-form')).toHaveCount(0)
    await expect(page.getByTestId('react-fleet-card').first()).toContainText('Royal')
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React sailing CRUD controls reachable on mobile', async ({ page }) => {
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

  test('keeps React itinerary CRUD controls reachable on mobile', async ({ page }) => {
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

  test('keeps React customer hierarchy workflows usable on mobile', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    const toggle = page.getByTestId('react-toggle-customer-workflows')
    await toggle.scrollIntoViewIfNeeded()
    await expect(toggle).toBeVisible()
    await toggle.click()

    await expect(page.getByTestId('react-customer-workflow-table')).toBeVisible()
    await expect(page.getByTestId('react-hierarchy-search-input')).toBeVisible()
    await page.getByTestId('react-hierarchy-search-input').fill('jay')
    await expect(page.getByTestId('react-customer-workflow-table')).toContainText(/Jay/i)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React admin mutation forms reachable on mobile', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await expect(page.getByTestId('react-admin-create-customer-form')).toBeVisible()
    await expect(page.getByTestId('react-admin-create-booking-form')).toBeVisible()
    await page.getByTestId('react-admin-create-customer-first-name').fill('Mobile')
    await page.getByTestId('react-admin-create-customer-last-name').fill('Tester')
    await page.getByTestId('react-admin-create-customer-email').fill('mobile.tester@example.com')
    await expect(page.getByTestId('react-admin-create-customer-submit')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React SQA console action grid usable on mobile', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    const consolePanel = page.getByTestId('react-sqa-console')
    await consolePanel.scrollIntoViewIfNeeded()
    await expect(consolePanel).toBeVisible()
    await expect(page.getByTestId('react-sqa-health-button')).toBeVisible()
    await expect(page.getByTestId('react-sqa-data-button')).toBeVisible()
    await expect(page.getByTestId('react-sqa-deployment-button')).toBeVisible()
    await expect(page.getByTestId('react-sqa-output')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React migration route panels readable on mobile', async ({ page }) => {
    await page.goto('/')

    const routeNav = page.getByTestId('react-migration-route-nav')
    await routeNav.scrollIntoViewIfNeeded()
    await expect(routeNav).toBeVisible()
    await routeNav.getByRole('button', { name: /Cutover/i }).click()
    await expect(page.getByTestId('react-cutover-readiness-panel')).toBeVisible()
    await routeNav.getByRole('button', { name: /Handoff/i }).click()
    await expect(page.getByTestId('react-migration-handoff-panel')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React create cruise-line dynamic ship rows usable on mobile', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    const createForm = page.getByTestId('react-create-cruise-line-workflow')
    await createForm.scrollIntoViewIfNeeded()
    await page.getByTestId('react-add-ship-row').click()
    await expect(page.getByTestId('react-create-ship-name')).toHaveCount(2)
    await page.getByTestId('react-create-ship-name').nth(1).fill('Mobile Ship')
    await page.getByTestId('react-remove-ship-row').nth(1).click()
    await expect(page.getByTestId('react-create-ship-name')).toHaveCount(1)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React favorite itinerary controls usable from a phone viewport', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Passenger')

    await page.getByTestId('react-role-booking-details-toggle').first().click()
    await expect(page.getByTestId('react-role-itinerary-day').first()).toBeVisible()
    await page.getByTestId('react-role-favorite-itinerary-toggle').first().click()
    await page.getByTestId('react-role-favorites-only-toggle').first().click()
    await expect(page.getByTestId('react-role-itinerary-day').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React group leader manifest readable on mobile', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Group Leader')

    await expect(page.getByTestId('react-passenger-dashboard')).toBeVisible()
    await expect(page.getByTestId('react-role-booking-card').first()).toContainText('Group Leader')
    await page.getByTestId('react-role-booking-details-toggle').first().click()
    await expect(page.getByTestId('react-role-detail-passenger-row').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps React confirmation panels viewport-safe on mobile', async ({ page }) => {
    await page.goto('/')
    await selectDemoUserByRole(page, 'Admin')

    await page.getByTestId('react-fleet-search').fill('Royal')
    await page.getByTestId('react-delete-cruise-line-button').first().click()
    await expect(page.getByTestId('react-fleet-delete-confirmation')).toBeVisible()
    await expect(page.getByTestId('react-fleet-delete-confirmation-confirm')).toBeVisible()
    await page.getByTestId('react-fleet-delete-confirmation-cancel').click()
    await expect(page.getByTestId('react-fleet-delete-confirmation')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })


})
