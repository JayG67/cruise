const fs = require('fs')
const path = require('path')

function countPlaywrightTests(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')
  return (source.match(/\btest\(/g) || []).length
}

function readCssBundle(entrypoint, seen = new Set()) {
  const absolutePath = path.resolve(entrypoint)

  if (seen.has(absolutePath)) {
    return ''
  }

  seen.add(absolutePath)

  const source = fs.readFileSync(absolutePath, 'utf8')
  const directory = path.dirname(absolutePath)
  const imports = [...source.matchAll(/@import\s+['"]([^'"]+)['"];?/g)]

  return [
    source,
    ...imports.map(([, importPath]) => readCssBundle(path.join(directory, importPath), seen))
  ].join('\n')
}

describe('Playwright React coverage inventory', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-production-mobile.spec.js')
  const responsiveReactSpecPath = path.join(projectRoot, 'playwright/responsive/react-production-responsive.spec.js')
  const mobileConfigPath = path.join(projectRoot, 'playwright.mobile.config.js')
  const responsiveConfigPath = path.join(projectRoot, 'playwright.responsive.config.js')
  const playwrightHelperPath = path.join(projectRoot, 'playwright/support/reactProductionHelpers.js')

  it('keeps React mobile Playwright coverage broad', () => {
    expect(fs.existsSync(mobileReactSpecPath)).toBe(true)
    expect(countPlaywrightTests(mobileReactSpecPath)).toBeGreaterThanOrEqual(16)
  })

  it('keeps React responsive desktop and tablet Playwright coverage present', () => {
    expect(fs.existsSync(responsiveReactSpecPath)).toBe(true)
    expect(countPlaywrightTests(responsiveReactSpecPath)).toBeGreaterThanOrEqual(7)
  })

  it('keeps mobile browser/device project coverage broad', () => {
    const config = fs.readFileSync(mobileConfigPath, 'utf8')

    expect(config).toContain('Mobile Chrome - Pixel 7')
    expect(config).toContain('Mobile Safari - iPhone 13')
    expect(config).not.toContain('Tablet Safari - iPad Mini')
    expect(config).toContain('Tablet layout coverage already lives in playwright.responsive.config.js')
  })


  it('keeps tests serial within each mobile browser while allowing browser projects to use two workers', () => {
    const config = fs.readFileSync(mobileConfigPath, 'utf8')
    const helpers = fs.readFileSync(playwrightHelperPath, 'utf8')

    expect(config).toContain('fullyParallel: false')
    expect(config).toContain('workers: 2')
    expect(config).toContain('browser projects can execute concurrently')
    expect(helpers).toContain('if (expectedText || userId)')
    expect(helpers).toContain('return selectedUserMatches || summaryMatches')
  })

  it('keeps responsive Playwright project coverage broad', () => {
    const config = fs.readFileSync(responsiveConfigPath, 'utf8')

    expect(config).toContain('Desktop Chrome - 1440px')
    expect(config).toContain('Desktop Safari - 1280px')
    expect(config).toContain('Tablet Chrome - 900px')
  })

  it('keeps React Playwright specs on the production root route', () => {
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')
    const responsiveReactSpec = fs.readFileSync(responsiveReactSpecPath, 'utf8')

    expect(mobileReactSpec).toContain("page.goto('/')")
    expect(responsiveReactSpec).toContain("page.goto('/')")
    const retiredAliasRoute = `/${['app', 'next'].join('-')}`

    expect(mobileReactSpec).not.toContain(`page.goto('${retiredAliasRoute}')`)
    expect(responsiveReactSpec).not.toContain(`page.goto('${retiredAliasRoute}')`)
  })

  it('keeps React Playwright role selection resilient to seeded user id changes', () => {
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')
    const responsiveReactSpec = fs.readFileSync(responsiveReactSpecPath, 'utf8')

    const helperSource = fs.readFileSync(playwrightHelperPath, 'utf8')
    expect(helperSource).toContain('async function selectDemoUserByRole')
    expect(helperSource).toContain("passenger: 'Ryan Parker Passenger View'")
    expect(mobileReactSpec).toContain('selectPassengerProfileUser(page)')
    expect(mobileReactSpec).toContain('waitForPassengerBookingDetailToggles(page')
    expect(mobileReactSpec).toContain("selectDemoUserByRole(page, 'Admin')")
    expect(mobileReactSpec).not.toContain("selectOption('UPASS0001')")
    expect(responsiveReactSpec).toContain("require('../support/reactProductionHelpers')")
    expect(responsiveReactSpec).toContain('keeps React responsive role selector usable at tablet width')
    expect(responsiveReactSpec).toContain("expect(roleOptionLabels).toContain('Group Leader')")
    expect(responsiveReactSpec).not.toContain("expect(roleOptions.join(' ')).toContain('Turnaround Manager')")
    expect(responsiveReactSpec).not.toContain("selectOption('UPASS0001')")
  })

  it('protects React workspace mobile touch-target coverage', () => {
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')
    const styles = readCssBundle(path.join(projectRoot, 'frontend/react/src/styles/components/index.css'))

    expect(mobileReactSpec).toContain('react-workspace-card-grid')
    expect(mobileReactSpec).toContain('react-workspace-intelligence-button')
    expect(styles).toContain('min-height')
    expect(styles).toContain('.workflow-step-button')
  })

  it('keeps mobile Playwright coverage on turnaround operational workflows', () => {
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')

    expect(mobileReactSpec).toContain('keeps every operational role dashboard reachable and readable on mobile')
    expect(mobileReactSpec).toContain('lets the turnaround manager run command planning and task creation workflows on mobile')
    expect(mobileReactSpec).toContain('lets specialized operational leads verify status, detail, update, and signoff workflows on mobile')
    const helpers = fs.readFileSync(playwrightHelperPath, 'utf8')

    expect(helpers).toContain('react-operational-turnaround-panel')
    expect(mobileReactSpec).toContain('Save command plan')
    expect(mobileReactSpec).toContain('Add turnaround task')
    expect(mobileReactSpec).toContain('Remove task')
    expect(mobileReactSpec).toContain('Save escalation')
    expect(mobileReactSpec).toContain('Add escalation')
    expect(mobileReactSpec).toContain('Save staffing plan')
    expect(mobileReactSpec).toContain('Save readiness signoff')
  })


  it('centralizes Playwright role selection and overflow checks for GitHub stability', () => {
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')
    const responsiveReactSpec = fs.readFileSync(responsiveReactSpecPath, 'utf8')
    const helpers = fs.readFileSync(playwrightHelperPath, 'utf8')

    expect(helpers).toContain('async function selectDemoUserThroughAppBridge')
    expect(helpers).toContain('async function selectDemoUserThroughAppBridge(page, roleValue, personText =')
    expect(helpers).toContain('window.__cruiseDemoSelectionState')
    expect(helpers).toContain('React-compatible DOM value setters instead of')
    expect(helpers).toContain('const selectedThroughAppBridge = await selectDemoUserThroughAppBridge')
    expect(helpers).toContain('const selectedThroughNativeSelect = await selectHiddenDemoUserByText')
    expect(helpers).toContain('return committed')
    expect(helpers).toContain('async function waitForPassengerBookingDetailToggles')
    expect(helpers).toContain('async function selectRoleThroughDom')
    expect(helpers).toContain('async function expectVisibleRolePersonPanel')
    expect(helpers).toContain('react-passenger-finder-panel')
    expect(helpers).toContain('react-operational-person-filter-panel')
    expect(helpers).toContain('async function setSelectValueByTestId')
    expect(helpers).not.toContain('roleSelect.selectOption')
    expect(helpers).toContain('async function selectRoleAndPerson')
    expect(helpers).toContain('async function expectNoHorizontalOverflow')
    expect(helpers).toContain('async function expectOperationalDashboardReady')
    expect(mobileReactSpec).toContain("require('../support/reactProductionHelpers')")
    expect(responsiveReactSpec).toContain("require('../support/reactProductionHelpers')")
    expect(responsiveReactSpec).toContain('keeps React responsive role selector usable at tablet width')
  })

})
