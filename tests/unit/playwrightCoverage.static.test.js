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

  it('keeps mobile SQA checks waiting for updated output instead of a stale placeholder', () => {
    const spec = fs.readFileSync(mobileSpecPath, 'utf8')

    expect(spec).toContain('async function clickSqaButtonAndWaitForOutput')
    expect(spec).toContain("await expect(output).not.toContainText('Test output will appear here...')")
    expect(spec).toContain("await clickSqaButtonAndWaitForOutput(page, 'ui-smoke-test-button', 'UI Smoke Check Result')")
    expect(spec).toContain("await clickSqaButtonAndWaitForOutput(page, 'health-check-button', 'Health Check Result')")
  })

  it('keeps mobile admin hierarchy checks scoped to visible child rows', () => {
    const spec = fs.readFileSync(roleDashboardSpecPath, 'utf8')

    expect(spec).toContain("const visibleBookingRow = page.locator('[data-testid=\"admin-booking-row\"]:visible').first()")
    expect(spec).toContain("await visibleBookingRow.getByTestId('admin-toggle-booking-details-button').click()")
    expect(spec).toContain("page.locator('[data-testid^=\"admin-booking-details-row-\"]:visible').first()")
  })

})

describe('inline booking detail scoping guardrails', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  it('scopes role booking detail toggles to the clicked booking card', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'public/app.js'), 'utf8')

    expect(app).toContain('function getScopedInlineBookingDetails')
    expect(app).toContain("triggerElement?.closest?.('[data-cy=\"role-booking-card\"]')")
    expect(app).toContain('loadBookingCruiseDetails(booking, false, detailsButton)')
    expect(app).toContain('loadBookingCruiseDetails(booking, favoritesOnly, button)')
  })

  it('keeps passenger booking detail containers uniquely scoped per rendered booking card', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'public/app.js'), 'utf8')

    expect(app).toContain('bookings.forEach((booking, bookingIndex)')
    expect(app).toContain('const bookingCardKey = `${booking.bookingId || booking.id || booking.sailing?.id || \'booking\'}-${bookingIndex}`')
    expect(app).toContain('card.dataset.bookingCardKey = bookingCardKey')
    expect(app).toContain('bookingCard?.dataset?.bookingCardKey')
    expect(app).toContain('function setBookingDetailsButtonState')
  })

  it('does not leak passenger booking card keys into non-booking result cards', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'public/app.js'), 'utf8')
    const renderCruiseLinesStart = app.indexOf('function renderCruiseLines')
    const renderShipsStart = app.indexOf('async function loadShips', renderCruiseLinesStart)
    const renderCruiseLinesBlock = app.slice(renderCruiseLinesStart, renderShipsStart)
    const renderShipsFunctionStart = app.indexOf('function renderShips')
    const renderShipsFunctionEnd = app.indexOf('async function loadSailings', renderShipsFunctionStart)
    const renderShipsBlock = app.slice(renderShipsFunctionStart, renderShipsFunctionEnd)

    expect(renderCruiseLinesBlock).toContain('lines.forEach(line =>')
    expect(renderCruiseLinesBlock).not.toContain('bookingCardKey')
    expect(renderShipsBlock).not.toContain('bookingCardKey')
    expect(app).toContain('card.dataset.bookingCardKey = bookingCardKey')
  })


  it('keeps React /app-next Playwright replacement coverage present', () => {
    const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-app-next-mobile.spec.js')
    const responsiveReactSpecPath = path.join(projectRoot, 'playwright/responsive/react-app-next-responsive.spec.js')
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')
    const responsiveReactSpec = fs.readFileSync(responsiveReactSpecPath, 'utf8')

    expect(fs.existsSync(mobileReactSpecPath)).toBe(true)
    expect(fs.existsSync(responsiveReactSpecPath)).toBe(true)
    expect(mobileReactSpec).toContain("page.goto('/app-next')")
    expect(mobileReactSpec).toContain('selectDemoUserByRole')
    expect(mobileReactSpec).toContain("selectDemoUserByRole(page, 'Admin')")
    expect(responsiveReactSpec).toContain("page.goto('/app-next')")
    expect(responsiveReactSpec).toContain('react-sqa-console')
  })


  it('keeps React Playwright role selection resilient to seeded user id changes', () => {
    const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-app-next-mobile.spec.js')
    const responsiveReactSpecPath = path.join(projectRoot, 'playwright/responsive/react-app-next-responsive.spec.js')
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')
    const responsiveReactSpec = fs.readFileSync(responsiveReactSpecPath, 'utf8')

    expect(mobileReactSpec).toContain('async function selectDemoUserByRole')
    expect(mobileReactSpec).toContain("selectDemoUserByRole(page, 'Passenger')")
    expect(mobileReactSpec).toContain("selectDemoUserByRole(page, 'Admin')")
    expect(mobileReactSpec).not.toContain("selectOption('UPASS0001')")
    expect(responsiveReactSpec).toContain('async function selectDemoUserByRole')
    expect(responsiveReactSpec).not.toContain("selectOption('UPASS0001')")
  })


  it('protects React workspace mobile touch-target coverage', () => {
    const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-app-next-mobile.spec.js')
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'), 'utf8')

    expect(mobileReactSpec).toContain('react-workspace-role-button')
    expect(styles).toContain('button.react-workspace-card')
    expect(styles).toContain('min-height: 72px')
  })


  it('keeps local Playwright commands rebuilding React assets before app next coverage', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'), 'utf8')

    expect(packageJson.scripts['playwright:mobile:local']).toContain('npm run react:build &&')
    expect(packageJson.scripts['playwright:responsive:local']).toContain('npm run react:build &&')
    expect(styles).toContain('React workspace mobile touch target stabilization')
    expect(styles).toContain('min-height: 72px')
  })


  it('keeps React mobile workspace target test measuring stable button styling', () => {
    const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')
    const mobileReactSpec = fs.readFileSync(path.join(projectRoot, 'playwright/mobile/react-app-next-mobile.spec.js'), 'utf8')

    expect(app).toContain('workspaceTouchTargetStyle')
    expect(app).toContain('style={workspaceTouchTargetStyle}')
    expect(mobileReactSpec).toContain('react-workspace-role-button')
  })


  it('keeps React mobile workspace touch target measuring the button box', () => {
    const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-app-next-mobile.spec.js')
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')
    const app = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/App.jsx'), 'utf8')

    expect(mobileReactSpec).toContain("page.getByTestId('react-workspace-role-button')")
    expect(app).toContain("height: '72px'")
    expect(app).toContain("minHeight: '72px'")
  })


  it('keeps React mobile smoke checks WebKit-stable', () => {
    const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-app-next-mobile.spec.js')
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')

    expect(mobileReactSpec).toContain("const demoUserSelect = page.getByTestId('react-demo-user-select')")
    expect(mobileReactSpec).toContain('await expect(demoUserSelect).toBeEnabled()')
    expect(mobileReactSpec).toContain("await expect(roleWorkspaceButton).toContainText('Role Simulation')")
    expect(mobileReactSpec).toContain('await roleWorkspaceButton.click()')
    expect(mobileReactSpec).not.toContain('expectTouchTargetIsUsable')
    expect(mobileReactSpec).not.toContain('getBoundingClientRect()')
  })


  it('keeps React mobile smoke test focused on visible workspace behavior', () => {
    const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-app-next-mobile.spec.js')
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')

    expect(mobileReactSpec).toContain("await expect(roleWorkspaceButton).toContainText('Role Simulation')")
    expect(mobileReactSpec).toContain('await roleWorkspaceButton.click()')
    expect(mobileReactSpec).toContain("await expect(page.getByTestId('react-role-selector')).toBeVisible()")
    expect(mobileReactSpec).not.toContain("expectTouchTargetIsUsable(page.getByTestId('react-workspace-role-button'))")
  })


  it('keeps React mobile replacement smoke test free of fragile Safari height assertions', () => {
    const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-app-next-mobile.spec.js')
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')

    expect(mobileReactSpec).toContain("await expect(demoUserSelect).toBeEnabled()")
    expect(mobileReactSpec).toContain('await roleWorkspaceButton.click()')
    expect(mobileReactSpec).not.toContain('expectTouchTargetIsUsable')
    expect(mobileReactSpec).not.toContain('touchTarget.height')
  })


  it('keeps legacy responsive Playwright from double-running React replacement specs', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))

    expect(packageJson.scripts['playwright:responsive:dom']).toContain('playwright/responsive/sailings-responsive.spec.js')
    expect(packageJson.scripts['playwright:responsive:dom']).not.toContain('react-app-next-responsive.spec.js')
    expect(packageJson.scripts['playwright:responsive:legacy']).toContain('playwright:responsive:dom')
    expect(packageJson.scripts['playwright:responsive:react']).toContain('react-app-next-responsive.spec.js')
  })


  it('keeps React mobile View Ships test synchronized with the selected fleet panel', () => {
    const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-app-next-mobile.spec.js')
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')

    expect(mobileReactSpec).toContain("await selectDemoUserByRole(page, 'Admin')")
    expect(mobileReactSpec).toContain('const viewShipsButton = page.getByTestId')
    expect(mobileReactSpec).toContain('await viewShipsButton.scrollIntoViewIfNeeded()')
    expect(mobileReactSpec).toContain('await expect(selectedShipsPanel).toContainText(/Royal.*ships/)')
    expect(mobileReactSpec).toContain('const viewSailingsButton = page.getByTestId')
    expect(mobileReactSpec).toContain('await viewSailingsButton.scrollIntoViewIfNeeded()')
  })

})
