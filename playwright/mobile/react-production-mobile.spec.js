const { test, expect } = require('@playwright/test')

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 8)
  expect(overflow).toBe(false)
}


async function selectRoleAndPerson(page, roleValue, personText) {
  const roleSelect = page.getByTestId('react-role-type-select')
  const personSelect = page.getByTestId('react-demo-user-select')

  await expect(roleSelect).toBeVisible()
  await roleSelect.selectOption(roleValue)
  await expect(personSelect).toBeVisible()

  if (personText) {
    await expect.poll(async () => {
      return personSelect.locator('option').filter({ hasText: personText }).count()
    }).toBeGreaterThan(0)

    const matchingValue = await personSelect.locator('option').filter({ hasText: personText }).first().getAttribute('value')
    expect(matchingValue).toBeTruthy()
    await personSelect.selectOption(matchingValue)
  }
}

function mobileRunSuffix(testInfo) {
  return `${testInfo.project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`
}

async function expectOperationalDashboardReady(page, roleValue, personText, dashboardTestId) {
  await selectRoleAndPerson(page, roleValue, personText)
  await expect(page.getByTestId(dashboardTestId)).toBeVisible()
  await expect(page.getByTestId('react-operational-turnaround-panel')).toBeVisible()
  await expect(page.getByTestId('react-operations-directory-panel')).toBeVisible()
  await expect(page.getByTestId('react-operations-directory-card').first()).toBeVisible()
  const readinessCards = page.getByTestId('react-operational-readiness-card')
  if (await readinessCards.count()) {
    await expect(readinessCards.first()).toBeVisible()
  }

  const progressCards = page.getByTestId('react-operational-progress-summary')
  if (await progressCards.count()) {
    await expect(progressCards.first()).toBeVisible()
  }

  const signoffCards = page.getByTestId('react-operational-signoff-summary')
  if (await signoffCards.count()) {
    await expect(signoffCards.first()).toBeVisible()
  }
  await expect(page.getByTestId('react-active-route-operations')).toHaveCount(0)
  await expect(page.getByTestId('react-admin-create-customer-form')).toHaveCount(0)
}

async function selectDemoUserByRole(page, roleText) {
  const normalizedRole = roleText.toLowerCase().replace(/\s+/g, '-')
  await selectRoleAndPerson(page, normalizedRole)
}

test.describe('React default mobile replacement checks', () => {
  test('loads React shell and workspace controls on mobile', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('react-production-shell')).toBeVisible()
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

  test('keeps product workspace shortcuts readable on mobile', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('react-retired-route-nav')).toHaveCount(0)
    await page.getByTestId('react-workspace-quality-button').scrollIntoViewIfNeeded()
    await page.getByTestId('react-workspace-quality-button').click()
    await expect(page.getByTestId('react-sqa-console')).toBeVisible()
    await page.getByTestId('react-workspace-fleet-button').click()
    await expect(page.getByTestId('react-fleet-directory')).toBeVisible()
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


  test('keeps every operational role dashboard reachable and readable on mobile', async ({ page }) => {
    await page.goto('/')

    const operationalRoles = [
      ['turnaround-manager', 'Alex Turner', 'react-turnaround-manager-dashboard'],
      ['housekeeping-lead', 'Maria Rodriguez', 'react-housekeeping-lead-dashboard'],
      ['guest-services-lead', 'Angela Brooks', 'react-guest-services-lead-dashboard'],
      ['food-beverage-lead', 'Michael Chen', 'react-food-beverage-lead-dashboard'],
      ['engineering-lead', 'David Torres', 'react-engineering-lead-dashboard']
    ]

    for (const [roleValue, personText, dashboardTestId] of operationalRoles) {
      await expectOperationalDashboardReady(page, roleValue, personText, dashboardTestId)
      await expect(page.getByTestId('react-demo-user-summary')).toContainText(personText)
      await expectNoHorizontalOverflow(page)
    }
  })

  test('lets the turnaround manager run command planning and task creation workflows on mobile', async ({ page }, testInfo) => {
    await page.goto('/')
    await expectOperationalDashboardReady(page, 'turnaround-manager', 'Alex Turner', 'react-turnaround-manager-dashboard')

    const suffix = mobileRunSuffix(testInfo)
    const firstCard = page.getByTestId('react-operational-readiness-card').first()
    await firstCard.scrollIntoViewIfNeeded()

    await firstCard.locator('select[aria-label$="command status"]').selectOption('IN_PROGRESS')
    await firstCard.locator('select[aria-label$="command readiness"]').selectOption('Department handoff watch')
    await firstCard.locator('input[aria-label$="turnaround port"]').fill(`Mobile Terminal ${suffix}`)
    await firstCard.locator('textarea[aria-label$="command notes"]').fill(`Mobile command plan verified from ${suffix}`)
    await firstCard.getByRole('button', { name: 'Save command plan' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround command plan updated successfully')

    const taskName = `Mobile command verification ${suffix}`
    await firstCard.locator('select[aria-label$="new task department"]').selectOption('turnaround-manager')
    await firstCard.locator('input[aria-label$="new task name"]').fill(taskName)
    await firstCard.locator('input[aria-label$="new task owner"]').fill('Alex Turner')
    await firstCard.locator('input[aria-label$="new task due time"]').fill('11:45')
    await firstCard.locator('input[aria-label$="new task location"]').fill(`Mobile terminal desk ${suffix}`)
    await firstCard.locator('input[aria-label$="new task blocker reason"]').fill(`Mobile staffing watch ${suffix}`)
    await firstCard.getByRole('button', { name: 'Add turnaround task' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround task created successfully')
    await expect(page.getByTestId('react-operational-readiness-card').first()).toContainText(taskName)

    const createdTask = firstCard.getByTestId('react-operational-role-checklist').locator('li').filter({ hasText: taskName }).first()
    await expect(createdTask).toBeVisible()
    await createdTask.getByRole('button', { name: 'Remove task' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround task removed successfully')
    await expect(firstCard).not.toContainText(taskName)

    await expect(firstCard.getByTestId('react-operational-dependency-summary')).toContainText(/active|clear/i)
    await expect(firstCard.getByTestId('react-operational-handoff-list')).toContainText(/handoff/i)
    await expect(firstCard.getByTestId('react-operational-handoff-form').first()).toBeVisible()
    const handoffForm = firstCard.getByTestId('react-operational-handoff-form').first()
    await handoffForm.locator('select[aria-label$="handoff status"]').selectOption('COMPLETE')
    await handoffForm.locator('input[aria-label$="handoff owner"]').fill(`Alex Turner ${suffix}`)
    await handoffForm.locator('input[aria-label$="handoff due time"]').fill('10:50')
    await handoffForm.locator('input[aria-label$="handoff notes"]').fill(`Mobile handoff completed ${suffix}`)
    await handoffForm.getByRole('button', { name: 'Save handoff' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround handoff updated successfully')
    await expect(firstCard).toContainText(`Mobile handoff completed ${suffix}`)
    await expectNoHorizontalOverflow(page)
  })

  test('lets specialized operational leads verify status, detail, update, and signoff workflows on mobile', async ({ page }, testInfo) => {
    await page.goto('/')
    await expectOperationalDashboardReady(page, 'engineering-lead', 'David Torres', 'react-engineering-lead-dashboard')

    const suffix = mobileRunSuffix(testInfo)
    const firstCard = page.getByTestId('react-operational-readiness-card').first()
    await firstCard.scrollIntoViewIfNeeded()

    const taskItem = firstCard.getByTestId('react-operational-role-checklist').locator('li').filter({ hasText: 'Confirm shore power' }).first()
    await expect(taskItem).toBeVisible()

    const blockButton = taskItem.getByRole('button', { name: 'Block' })
    const completeButton = taskItem.getByRole('button', { name: 'Complete' })
    const startButton = taskItem.getByRole('button', { name: 'Start' })

    if (await blockButton.isEnabled()) {
      await blockButton.click()
      await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround task status updated successfully')
      await expect(firstCard).toContainText('BLOCKED')
    } else if (await completeButton.isEnabled()) {
      await completeButton.click()
      await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround task status updated successfully')
      await expect(firstCard).toContainText('COMPLETE')
    } else {
      await startButton.click()
      await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround task status updated successfully')
      await expect(firstCard).toContainText('IN_PROGRESS')
    }

    await taskItem.locator('input[aria-label$="owner"]').fill(`David Torres ${suffix}`)
    await taskItem.locator('input[aria-label$="due time"]').fill('08:35')
    await taskItem.locator('input[aria-label$="location"]').fill(`Mobile engine control ${suffix}`)
    await taskItem.locator('input[aria-label$="blocker reason"]').fill(`Mobile shore-power check ${suffix}`)
    await taskItem.getByRole('button', { name: 'Save task details' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround task details updated successfully')
    await expect(firstCard).toContainText(`Mobile engine control ${suffix}`)

    await firstCard.locator('input[aria-label$="planned staff"]').fill('13')
    await firstCard.locator('input[aria-label$="checked in staff"]').fill('12')
    await firstCard.locator('input[aria-label$="staffing lead"]').fill(`David Torres ${suffix}`)
    await firstCard.locator('input[aria-label$="staffing muster location"]').fill(`Mobile engine muster ${suffix}`)
    await firstCard.locator('input[aria-label$="staffing notes"]').fill(`Mobile staffing verified ${suffix}`)
    await firstCard.getByRole('button', { name: 'Save staffing plan' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround staffing plan updated successfully')
    await expect(firstCard).toContainText(`Mobile engine muster ${suffix}`)

    await taskItem.locator('input[aria-label$="shift update"]').fill(`Mobile technical update ${suffix}`)
    await taskItem.getByRole('button', { name: 'Add shift update' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround task update added successfully')
    await expect(firstCard).toContainText(`Mobile technical update ${suffix}`)

    const escalationTitle = `Mobile engineering escalation ${suffix}`
    await firstCard.locator('select[aria-label$="escalation department"]').selectOption('engineering-lead')
    await firstCard.locator('select[aria-label$="escalation severity"]').selectOption('HIGH')
    await firstCard.locator('input[aria-label$="escalation title"]').fill(escalationTitle)
    await firstCard.locator('input[aria-label$="escalation owner"]').fill(`David Torres ${suffix}`)
    await firstCard.locator('input[aria-label$="escalation notes"]').fill(`Mobile escalation opened ${suffix}`)
    await firstCard.getByRole('button', { name: 'Add escalation' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround escalation created successfully')
    await expect(firstCard).toContainText(escalationTitle)

    const escalationItem = firstCard.getByTestId('react-operational-escalation-list').locator('li').filter({ hasText: escalationTitle }).first()
    await escalationItem.locator('select[aria-label$="escalation status"]').selectOption('RESOLVED')
    await escalationItem.locator('input[aria-label$="escalation resolution notes"]').fill(`Mobile escalation resolved ${suffix}`)
    await escalationItem.getByRole('button', { name: 'Save escalation' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround escalation updated successfully')
    await expect(firstCard).toContainText(`Mobile escalation resolved ${suffix}`)

    await firstCard.locator('select[aria-label$="readiness signoff status"]').selectOption('APPROVED')
    await firstCard.locator('input[aria-label$="readiness approver"]').fill(`David Torres ${suffix}`)
    await firstCard.locator('input[aria-label$="readiness notes"]').fill(`Mobile engineering signoff ${suffix}`)
    await firstCard.getByRole('button', { name: 'Save readiness signoff' }).click()
    await expect(page.getByTestId('react-operational-mutation-status')).toContainText('Turnaround readiness signoff updated successfully')
    await expect(firstCard).toContainText(`David Torres ${suffix}`)
    await expectNoHorizontalOverflow(page)
  })


})
