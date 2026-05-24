const fs = require('fs')
const path = require('path')

function countPlaywrightTests(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')
  return (source.match(/\btest\(/g) || []).length
}

describe('Playwright portfolio coverage inventory', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const mobileSpecPath = path.join(projectRoot, 'playwright/mobile/mobile.spec.js')
  const roleDashboardSpecPath = path.join(projectRoot, 'playwright/mobile/role-dashboard-mobile.spec.js')
  const responsiveSpecPath = path.join(projectRoot, 'playwright/responsive/sailings-responsive.spec.js')
  const mobileConfigPath = path.join(projectRoot, 'playwright.mobile.config.js')
  const responsiveConfigPath = path.join(projectRoot, 'playwright.responsive.config.js')

  it('keeps the dedicated role dashboard mobile Playwright suite in the project', () => {
    expect(fs.existsSync(roleDashboardSpecPath)).toBe(true)
    expect(countPlaywrightTests(roleDashboardSpecPath)).toBeGreaterThanOrEqual(20)
  })

  it('keeps the core mobile Playwright suite from shrinking unexpectedly', () => {
    expect(fs.existsSync(mobileSpecPath)).toBe(true)
    expect(countPlaywrightTests(mobileSpecPath)).toBeGreaterThanOrEqual(21)
  })

  it('keeps responsive desktop and tablet Playwright coverage present', () => {
    expect(fs.existsSync(responsiveSpecPath)).toBe(true)
    expect(countPlaywrightTests(responsiveSpecPath)).toBeGreaterThanOrEqual(4)
  })

  it('keeps mobile browser/device project coverage broad', () => {
    const config = fs.readFileSync(mobileConfigPath, 'utf8')

    expect(config).toContain('Mobile Chrome - Pixel 7')
    expect(config).toContain('Mobile Safari - iPhone 13')
    expect(config).toContain('Tablet Safari - iPad Mini')
  })

  it('keeps responsive Playwright project coverage broad', () => {
    const config = fs.readFileSync(responsiveConfigPath, 'utf8')

    expect(config).toContain('Desktop Chrome - 1440px')
    expect(config).toContain('Desktop Safari - 1280px')
    expect(config).toContain('Tablet Chrome - 900px')
  })
  it('keeps mobile admin hierarchy checks scoped to visible child rows', () => {
    const spec = fs.readFileSync(roleDashboardSpecPath, 'utf8')

    expect(spec).toContain("const visibleBookingRow = page.locator('[data-testid=\"admin-booking-row\"]:visible').first()")
    expect(spec).toContain("await visibleBookingRow.getByTestId('admin-toggle-booking-details-button').click()")
    expect(spec).toContain("page.locator('[data-testid^=\"admin-booking-details-row-\"]:visible').first()")
  })

})