const fs = require('fs')
const path = require('path')

function countPlaywrightTests(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')
  return (source.match(/\btest\(/g) || []).length
}

describe('Playwright React coverage inventory', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const mobileReactSpecPath = path.join(projectRoot, 'playwright/mobile/react-production-mobile.spec.js')
  const responsiveReactSpecPath = path.join(projectRoot, 'playwright/responsive/react-production-responsive.spec.js')
  const mobileConfigPath = path.join(projectRoot, 'playwright.mobile.config.js')
  const responsiveConfigPath = path.join(projectRoot, 'playwright.responsive.config.js')

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
    expect(config).toContain('Tablet Safari - iPad Mini')
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

    expect(mobileReactSpec).toContain('async function selectDemoUserByRole')
    expect(mobileReactSpec).toContain("selectDemoUserByRole(page, 'Passenger')")
    expect(mobileReactSpec).toContain("selectDemoUserByRole(page, 'Admin')")
    expect(mobileReactSpec).not.toContain("selectOption('UPASS0001')")
    expect(responsiveReactSpec).toContain('async function selectDemoUserByRole')
    expect(responsiveReactSpec).not.toContain("selectOption('UPASS0001')")
  })

  it('protects React workspace mobile touch-target coverage', () => {
    const mobileReactSpec = fs.readFileSync(mobileReactSpecPath, 'utf8')
    const styles = fs.readFileSync(path.join(projectRoot, 'frontend/react/src/styles/app.css'), 'utf8')

    expect(mobileReactSpec).toContain('react-workspace-card-grid')
    expect(mobileReactSpec).toContain('react-workspace-quality-button')
    expect(styles).toContain('min-height')
    expect(styles).toContain('.workflow-step-button')
  })
})
