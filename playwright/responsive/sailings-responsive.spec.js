const { test, expect } = require('@playwright/test')

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement
    return documentElement.scrollWidth > documentElement.clientWidth + 1
  })

  expect(overflow).toBe(false)
}

async function waitForCruiseCards(page) {
  await page.goto('/')
  await expect(page.getByTestId('cruise-grid')).toBeVisible()
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="cruise-card"]').length > 0)

  return page.getByTestId('cruise-card')
}

async function openFirstSailing(page) {
  const cards = await waitForCruiseCards(page)
  const firstCard = cards.first()

  await expect(firstCard).toBeVisible()
  await firstCard.getByTestId('view-ships-button').click()

  await expect(page.getByTestId('ships-panel')).toBeVisible()
  await expect(page.getByTestId('ship-card').first()).toBeVisible()

  await page.getByTestId('view-sailings-button').first().click()

  await expect(page.getByTestId('sailings-panel')).toBeVisible()
  await expect(page.getByTestId('sailing-card').first()).toBeVisible()
}

test.describe('Cruise Explorer desktop and tablet responsive quality checks', () => {
  test('keeps the admin dashboard usable in a desktop browser viewport', async ({ page }) => {
    await waitForCruiseCards(page)

    await expect(page.getByTestId('primary-navigation')).toBeVisible()
    await expect(page.getByTestId('dashboard-hero')).toBeVisible()
    await expect(page.getByTestId('cruise-card').first()).toBeVisible()
    await expect(page.getByTestId('create-cruise-line-panel')).toBeVisible()
    await expect(page.getByTestId('sqa-test-panel')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('keeps ship, sailing, and itinerary panels readable in a desktop browser viewport', async ({ page }) => {
    await openFirstSailing(page)

    await expect(page.getByTestId('create-sailing-form')).toBeVisible()
    await expect(page.getByTestId('view-itinerary-button').first()).toBeVisible()
    await expect(page.getByTestId('update-sailing-button').first()).toBeVisible()
    await expect(page.getByTestId('delete-sailing-button').first()).toBeVisible()

    await page.getByTestId('view-itinerary-button').first().click()

    await expect(page.getByTestId('itinerary-panel')).toBeVisible()
    await expect(page.getByTestId('create-itinerary-day-form')).toBeVisible()
    await expect(page.getByTestId('itinerary-day').first()).toBeVisible()

    await page.getByTestId('itinerary-day-summary').first().click()

    await expect(page.getByTestId('itinerary-port').first()).toBeVisible()
    await expect(page.getByTestId('activity-schedule').first()).toBeVisible()
    await expect(page.getByTestId('create-activity-form').first()).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('supports keyboard tab navigation through the primary desktop workflow', async ({ page }) => {
    await page.goto('/')

    const visitedFocusableElements = []

    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press('Tab')

      const focusedElement = await page.evaluate(() => {
        const activeElement = document.activeElement

        return {
          testId: activeElement?.getAttribute('data-testid'),
          tagName: activeElement?.tagName,
          disabled: activeElement?.hasAttribute('disabled')
        }
      })

      expect(focusedElement).toBeTruthy()

      if (focusedElement.tagName !== 'BODY') {
        const allowedTags = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']

        expect(allowedTags).toContain(focusedElement.tagName)
        expect(focusedElement.disabled).toBeFalsy()

        if (focusedElement.testId) {
          visitedFocusableElements.push(focusedElement.testId)
        }
      }
    }

    expect(new Set(visitedFocusableElements).size).toBeGreaterThan(4)

    await expectNoHorizontalOverflow(page)
  })

  test('keeps the create and update forms stable on tablet-sized browser layouts', async ({ page }) => {
    const cards = await waitForCruiseCards(page)
    const firstCard = cards.first()

    await page.getByTestId('hero-add-cruise-line-link').click()
    await expect(page.getByTestId('create-cruise-line-panel')).toBeVisible()
    await page.getByTestId('create-cruise-line-name-input').fill('Responsive QA Cruise Line')
    await page.getByTestId('create-cruise-line-country-input').fill('United States')
    await page.getByTestId('create-cruise-line-website-input').fill('https://example.com')

    await expect(page.getByTestId('create-cruise-line-name-input')).toHaveValue('Responsive QA Cruise Line')

    await firstCard.getByTestId('update-cruise-line-button').click()

    await expect(page.getByTestId('update-cruise-line-panel')).toBeVisible()
    await expect(page.getByTestId('update-cruise-line-name-input')).toBeVisible()
    await expect(page.getByTestId('update-cruise-line-submit-button')).toBeVisible()
    await expect(page.getByTestId('update-cruise-line-cancel-button')).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })
})
