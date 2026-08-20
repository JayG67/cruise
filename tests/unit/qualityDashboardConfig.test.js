const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

describe('quality dashboard and CI reporting configuration', () => {
  it('publishes a broad engineering evidence dashboard rather than a Lighthouse-only summary', () => {
    const dashboard = read('scripts/prepare-quality-dashboard.js')

    expect(dashboard).toContain('Production-grade cruise operations, AI quality, and security engineering')
    expect(dashboard).toContain('Six phases of AI quality engineering')
    expect(dashboard).toContain('Defense-in-depth release posture')
    expect(dashboard).toContain('What this portfolio actually demonstrates')
    expect(dashboard).toContain('Engineering scale')
    expect(dashboard).toContain('Jest suites')
    expect(dashboard).toContain('Cypress specs')
    expect(dashboard).not.toContain('Live project quality summary')
  })

  it('uses machine-readable AI and security artifacts in the published dashboard', () => {
    const dashboard = read('scripts/prepare-quality-dashboard.js')
    const workflow = read('.github/workflows/ci.yml')

    expect(dashboard).toContain("'ai-quality-evidence', 'phase6-ci-evidence.json'")
    expect(dashboard).toContain("'ai-quality-evidence', 'phase6-ci-comparison.json'")
    expect(dashboard).toContain("'security-quality-evidence', 'release-matrix.json'")
    expect(dashboard).toContain('/evidence/ai-quality-evidence.json')
    expect(dashboard).toContain('/evidence/security-release-matrix.json')

    expect(workflow).toContain('Download AI quality evidence for GitHub Pages')
    expect(workflow).toContain('Download security release evidence for GitHub Pages')
    expect(workflow).toContain('github-pages/evidence/security-release-matrix.json')
    expect(workflow).toContain('github-pages/evidence/ai-quality-evidence.json')
  })

  it('makes the dashboard publication depend on every major quality gate it reports as passing', () => {
    const workflow = read('.github/workflows/ci.yml')
    const lighthouseJob = workflow.slice(workflow.indexOf('  lighthouse-mobile-audit:'), workflow.indexOf('  deploy-lighthouse-report:'))

    for (const dependency of [
      'unit-tests',
      'ai-quality-gate',
      'integration-tests',
      'ui-tests',
      'coverage-report',
      'playwright-mobile-tests',
      'performance-smoke'
    ]) {
      expect(lighthouseJob).toContain(`- ${dependency}`)
    }
  })

  it('publishes machine-readable final security release evidence as a CI artifact', () => {
    const matrix = read('scripts/verify-security-release-matrix.js')
    const workflow = read('.github/workflows/ci.yml')

    expect(matrix).toContain("path.join(root, 'security-quality-evidence')")
    expect(matrix).toContain("path.join(evidenceDirectory, 'release-matrix.json')")
    expect(matrix).toContain('totalControls: controls.length')
    expect(matrix).toContain("releaseDecision: failedControls.length === 0 ? 'APPROVED' : 'BLOCKED'")
    expect(workflow).toContain('name: security-quality-evidence')
    expect(workflow).toContain('security-quality-evidence/release-matrix.json')
  })


  it('uses the pinned Playwright image instead of reinstalling browser OS dependencies in CI', () => {
    const workflow = read('.github/workflows/ci.yml')
    const mobileJob = workflow.slice(workflow.indexOf('  playwright-mobile-tests:'), workflow.indexOf('  performance-smoke:'))

    expect(mobileJob).toContain('image: mcr.microsoft.com/playwright:v1.60.0-noble')
    expect(mobileJob).toContain('timeout-minutes: 30')
    expect(mobileJob).toContain('postgres://postgres:password@postgres:5432/cruise')
    expect(mobileJob).not.toContain('playwright install --with-deps')
  })

  it('keeps broad Mobile Quality & UX wording in GitHub Actions reporting', () => {
    const workflow = read('.github/workflows/ci.yml')

    expect(workflow).toContain('Mobile Quality & UX Gate')
    expect(workflow).toContain('Mobile Quality & UX Report')
    expect(workflow).not.toContain('Lighthouse Mobile Quality Report')
    expect(workflow).not.toContain('Lighthouse Mobile Quality Gate')
  })
})
