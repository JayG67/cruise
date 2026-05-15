const { test, expect } = require('@playwright/test')

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement
    return documentElement.scrollWidth > documentElement.clientWidth + 1
  })

  expect(overflow).toBe(false)
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

  test('renders cruise cards and keeps key card actions usable on mobile devices', async ({ page }) => {
    await page.goto('/')

    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-testid="cruise-card"]').length > 0
    })

    const cards = page.getByTestId('cruise-card')

    await expect(cards.first()).toBeVisible()

    const firstCard = cards.first()

    await expect(firstCard.getByTestId('view-ships-button')).toBeVisible()
    await expect(firstCard.getByTestId('update-cruise-line-button')).toBeVisible()
    await expect(firstCard.getByTestId('delete-cruise-line-button')).toBeVisible()

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

  test('filters cruise lines from a mobile viewport', async ({ page }) => {
    await page.goto('/')

    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-testid="cruise-card"]').length > 0
    })

    await page.getByTestId('cruise-search-input').fill('Disney')

    await expect(page.getByTestId('cruise-card')).toHaveCount(1)

    await expect(page.getByTestId('cruise-card').first()).toContainText('Disney')

    await expectNoHorizontalOverflow(page)
  })
})