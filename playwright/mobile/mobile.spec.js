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

async function waitForCruiseCards(page) {
  await page.goto('/')

  await expect(page.getByTestId('cruise-grid')).toBeVisible()

  await page.waitForFunction(() => {
    return document.querySelectorAll('[data-testid="cruise-card"]').length > 0
  })

  return page.getByTestId('cruise-card')
}

async function getFirstCruiseCard(page) {
  const cards = await waitForCruiseCards(page)
  const firstCard = cards.first()

  await expect(firstCard).toBeVisible()

  return firstCard
}

test.describe('Cruise Explorer mobile quality checks', () => {
  test('renders the hero, navigation, and primary calls to action on mobile devices', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('primary-navigation')).toBeVisible()
    await expect(page.getByTestId('brand-link')).toContainText('Cruise Explorer')
    await expect(page.getByTestId('dashboard-hero')).toBeVisible()
    await expect(page.getByRole('heading', { name: /manage cruise line and fleet operations/i })).toBeVisible()
    await expect(page.getByTestId('hero-view-cruise-lines-link')).toBeVisible()
    await expect(page.getByTestId('hero-add-cruise-line-link')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('keeps primary navigation links reachable on mobile devices', async ({ page }) => {
    await page.goto('/')

    await expectTouchTargetIsUsable(page.getByTestId('brand-link'))
    await expectTouchTargetIsUsable(page.getByTestId('nav-dashboard-link'))
    await expectTouchTargetIsUsable(page.getByTestId('nav-cruise-lines-link'))
    await expectTouchTargetIsUsable(page.getByTestId('nav-sqa-controls-link'))
    await expectTouchTargetIsUsable(page.getByTestId('nav-about-link'))

    await expectNoHorizontalOverflow(page)
  })

  test('anchors from hero CTAs move to the correct mobile workflow areas', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('hero-add-cruise-line-link').click()
    await expect(page.getByTestId('create-cruise-line-panel')).toBeVisible()

    await page.getByTestId('hero-view-cruise-lines-link').click()
    await expect(page.getByTestId('cruise-lines-section')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('renders cruise cards and keeps key card actions usable on mobile devices', async ({ page }) => {
    const firstCard = await getFirstCruiseCard(page)

    await expectTouchTargetIsUsable(firstCard.getByTestId('view-ships-button'))
    await expectTouchTargetIsUsable(firstCard.getByTestId('update-cruise-line-button'))
    await expectTouchTargetIsUsable(firstCard.getByTestId('delete-cruise-line-button'))

    await expectNoHorizontalOverflow(page)
  })

  test('shows the ship panel after opening ships from a cruise card on mobile devices', async ({ page }) => {
    const firstCard = await getFirstCruiseCard(page)

    await firstCard.getByTestId('view-ships-button').click()

    await expect(page.getByTestId('ships-panel')).toBeVisible()
    await expect(page.getByTestId('ships-title')).toBeVisible()
    await expect(page.getByTestId('ships-grid')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('opens the update workflow from a cruise card without breaking mobile layout', async ({ page }) => {
    const firstCard = await getFirstCruiseCard(page)

    await firstCard.getByTestId('update-cruise-line-button').click()

    await expect(page.getByTestId('update-cruise-line-panel')).toBeVisible()
    await expect(page.getByTestId('update-cruise-line-name-input')).toBeVisible()
    await expect(page.getByTestId('update-cruise-line-country-input')).toBeVisible()
    await expect(page.getByTestId('update-cruise-line-website-input')).toBeVisible()
    await expect(page.getByTestId('update-cruise-line-submit-button')).toBeVisible()
    await expect(page.getByTestId('update-cruise-line-cancel-button')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('cancels the update workflow cleanly on mobile devices', async ({ page }) => {
    const firstCard = await getFirstCruiseCard(page)

    await firstCard.getByTestId('update-cruise-line-button').click()
    await expect(page.getByTestId('update-cruise-line-panel')).toBeVisible()

    await page.getByTestId('update-cruise-line-cancel-button').click()

    await expect(page.getByTestId('update-cruise-line-panel')).toBeHidden()

    await expectNoHorizontalOverflow(page)
  })

  test('keeps the create cruise line workflow reachable and usable on mobile devices', async ({ page }) => {
    await page.goto('/#add-cruise-line-heading')

    await expect(page.getByTestId('create-cruise-line-panel')).toBeVisible()
    await expect(page.getByTestId('create-cruise-line-name-input')).toBeVisible()
    await expect(page.getByTestId('create-cruise-line-country-input')).toBeVisible()
    await expect(page.getByTestId('create-cruise-line-website-input')).toBeVisible()
    await expect(page.getByTestId('add-ship-input-button')).toBeVisible()
    await expect(page.getByTestId('create-cruise-line-submit-button')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('allows mobile users to add and remove a create-ship input row', async ({ page }) => {
    await page.goto('/#add-cruise-line-heading')

    const shipInputs = page.getByTestId('create-cruise-line-ship-name-input')
    const initialCount = await shipInputs.count()

    await page.getByTestId('add-ship-input-button').click()
    await expect(shipInputs).toHaveCount(initialCount + 1)

    await page.getByTestId('remove-ship-input-button').last().click()
    await expect(shipInputs).toHaveCount(initialCount)

    await expectNoHorizontalOverflow(page)
  })

  test('validates required create cruise line fields on mobile devices', async ({ page }) => {
    await page.goto('/#add-cruise-line-heading')

    await page.getByTestId('create-cruise-line-submit-button').click()

    await expect(page.getByTestId('create-cruise-line-name-input')).toBeFocused()
    await expect(page.getByTestId('create-cruise-line-panel')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('filters cruise lines from a mobile viewport', async ({ page }) => {
    await waitForCruiseCards(page)

    await page.getByTestId('cruise-search-input').fill('Disney')

    await expect(page.getByTestId('cruise-card')).toHaveCount(1)
    await expect(page.getByTestId('cruise-card').first()).toContainText('Disney')

    await expectNoHorizontalOverflow(page)
  })

  test('shows the empty search state from a mobile viewport', async ({ page }) => {
    await waitForCruiseCards(page)

    await page.getByTestId('cruise-search-input').fill('zzzz-not-a-cruise-line')

    await expect(page.getByTestId('cruise-empty-message')).toBeVisible()
    await expect(page.getByTestId('cruise-empty-message')).toContainText('No cruise lines match your search')

    await expectNoHorizontalOverflow(page)
  })

  test('clears search text and restores mobile cruise card results', async ({ page }) => {
    await waitForCruiseCards(page)

    await page.getByTestId('cruise-search-input').fill('Disney')
    await expect(page.getByTestId('cruise-card')).toHaveCount(1)

    await page.getByTestId('cruise-search-input').fill('')
    await expect(page.getByTestId('cruise-card').first()).toBeVisible()

    const restoredCount = await page.getByTestId('cruise-card').count()
    expect(restoredCount).toBeGreaterThan(1)

    await expectNoHorizontalOverflow(page)
  })

  test('shows SQA quality links and validation controls on mobile devices', async ({ page }) => {
    await page.goto('/#testPanel')

    await expect(page.getByTestId('sqa-test-panel')).toBeVisible()
    await expect(page.getByTestId('health-check-button')).toBeVisible()
    await expect(page.getByTestId('ui-smoke-test-button')).toBeVisible()
    await expect(page.getByTestId('latest-quality-dashboard-link')).toBeVisible()
    await expect(page.getByTestId('latest-lighthouse-report-link')).toBeVisible()
    await expect(page.getByTestId('latest-coverage-report-link')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('keeps SQA action buttons usable as mobile touch targets', async ({ page }) => {
    await page.goto('/#testPanel')

    await expectTouchTargetIsUsable(page.getByTestId('health-check-button'))
    await expectTouchTargetIsUsable(page.getByTestId('reload-data-button'))
    await expectTouchTargetIsUsable(page.getByTestId('ui-smoke-test-button'))
    await expectTouchTargetIsUsable(page.getByTestId('api-contract-check-button'))
    await expectTouchTargetIsUsable(page.getByTestId('crud-workflow-check-button'))
    await expectTouchTargetIsUsable(page.getByTestId('performance-smoke-check-button'))
    await expectTouchTargetIsUsable(page.getByTestId('seed-integrity-check-button'))
    await expectTouchTargetIsUsable(page.getByTestId('rendering-consistency-check-button'))
    await expectTouchTargetIsUsable(page.getByTestId('deployment-diagnostics-button'))
    await expectTouchTargetIsUsable(page.getByTestId('reset-demo-data-button'))
    await expectTouchTargetIsUsable(page.getByTestId('clear-test-output-button'))

    await expectNoHorizontalOverflow(page)
  })

  test('runs the mobile API health check from the SQA panel', async ({ page }) => {
    await page.goto('/#testPanel')

    await page.getByTestId('health-check-button').click()

    await expect(page.getByTestId('test-output')).toContainText('Health Check Result')
    await expect(page.getByTestId('test-output')).toContainText('"passed": true')

    await expectNoHorizontalOverflow(page)
  })

  test('runs the mobile UI smoke check from the SQA panel', async ({ page }) => {
    await page.goto('/#testPanel')

    await page.getByTestId('ui-smoke-test-button').click()

    await expect(page.getByTestId('test-output')).toContainText('UI Smoke Check Result')
    await expect(page.getByTestId('test-output')).toContainText('"passed": true')

    await expectNoHorizontalOverflow(page)
  })

  test('runs deployment diagnostics from the mobile SQA panel', async ({ page }) => {
    await page.goto('/#testPanel')

    await page.getByTestId('deployment-diagnostics-button').click()

    await expect(page.getByTestId('test-output')).toContainText('Deployment Diagnostics Result')
    await expect(page.getByTestId('test-output')).toContainText('"passed": true')

    await expectNoHorizontalOverflow(page)
  })

  test('keeps external quality report links configured for mobile users', async ({ page }) => {
    await page.goto('/#testPanel')

    await expect(page.getByTestId('latest-quality-dashboard-link'))
      .toHaveAttribute('href', 'https://jayg67.github.io/cruise/')
    await expect(page.getByTestId('latest-lighthouse-report-link'))
      .toHaveAttribute('href', 'https://jayg67.github.io/cruise/lighthouse/')
    await expect(page.getByTestId('latest-coverage-report-link'))
      .toHaveAttribute('href', 'https://jayg67.github.io/cruise/coverage/')

    await expectNoHorizontalOverflow(page)
  })

  test('opens ship sailings and keeps sailing admin controls usable on mobile devices', async ({ page }) => {
    const firstCard = await getFirstCruiseCard(page)

    await firstCard.getByTestId('view-ships-button').click()
    await expect(page.getByTestId('ships-panel')).toBeVisible()
    await expect(page.getByTestId('ship-card').first()).toBeVisible()

    await page.getByTestId('view-sailings-button').first().click()

    await expect(page.getByTestId('sailings-panel')).toBeVisible()
    await expect(page.getByTestId('create-sailing-form')).toBeVisible()
    await expect(page.getByTestId('sailing-card').first()).toBeVisible()
    await expectTouchTargetIsUsable(page.getByTestId('create-sailing-submit-button'))
    await expectTouchTargetIsUsable(page.getByTestId('view-itinerary-button').first())
    await expectTouchTargetIsUsable(page.getByTestId('update-sailing-button').first())
    await expectTouchTargetIsUsable(page.getByTestId('delete-sailing-button').first())

    await page.getByTestId('create-sailing-departure-date-input').fill('2026-10-01')
    await page.getByTestId('create-sailing-departure-port-input').fill('Miami, Florida')
    await page.getByTestId('create-sailing-arrival-port-input').fill('Nassau, Bahamas')
    await page.getByTestId('create-sailing-days-input').fill('4')

    await expect(page.getByTestId('create-sailing-departure-port-input')).toHaveValue('Miami, Florida')
    await expect(page.getByTestId('create-sailing-arrival-port-input')).toHaveValue('Nassau, Bahamas')

    await expectNoHorizontalOverflow(page)
  })

  test('opens itinerary details and keeps activity controls usable on mobile devices', async ({ page }) => {
    const firstCard = await getFirstCruiseCard(page)

    await firstCard.getByTestId('view-ships-button').click()
    await expect(page.getByTestId('ship-card').first()).toBeVisible()

    await page.getByTestId('view-sailings-button').first().click()
    await expect(page.getByTestId('sailing-card').first()).toBeVisible()

    await page.getByTestId('view-itinerary-button').first().click()

    await expect(page.getByTestId('itinerary-panel')).toBeVisible()
    await expect(page.getByTestId('create-itinerary-day-form')).toBeVisible()
    await expect(page.getByTestId('itinerary-day').first()).toBeVisible()
    await expectTouchTargetIsUsable(page.getByTestId('create-itinerary-day-submit-button'))

    await page.getByTestId('itinerary-day-summary').first().click()

    await expect(page.getByTestId('itinerary-port').first()).toBeVisible()
    await expect(page.getByTestId('activity-schedule').first()).toBeVisible()
    await expectTouchTargetIsUsable(page.getByTestId('update-itinerary-day-button').first())
    await expectTouchTargetIsUsable(page.getByTestId('delete-itinerary-day-button').first())
    await expectTouchTargetIsUsable(page.getByTestId('create-activity-submit-button').first())

    await page.getByTestId('create-itinerary-day-number-input').fill('2')
    await page.getByTestId('create-itinerary-day-title-input').fill('Mobile QA Sea Day')
    await page.getByTestId('create-itinerary-day-port-input').fill('At Sea')
    await page.getByTestId('create-itinerary-activity-time-input').fill('9:00 AM')
    await page.getByTestId('create-itinerary-activity-text-input').fill('Mobile itinerary briefing')

    await expect(page.getByTestId('create-itinerary-day-title-input')).toHaveValue('Mobile QA Sea Day')
    await expect(page.getByTestId('create-itinerary-activity-text-input')).toHaveValue('Mobile itinerary briefing')

    await expectNoHorizontalOverflow(page)
  })

})
