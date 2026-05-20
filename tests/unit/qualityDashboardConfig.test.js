const fs = require('fs')
const path = require('path')

describe('quality dashboard and CI reporting configuration', () => {
  const workflowPath = path.resolve(__dirname, '../../.github/workflows/ci.yml')
  const dashboardScriptPath = path.resolve(__dirname, '../../scripts/prepare-quality-dashboard.js')

  it('uses broad Mobile Quality & UX wording in the GitHub Actions job and summary', () => {
    const workflow = fs.readFileSync(workflowPath, 'utf8')

    expect(workflow).toContain('Mobile Quality & UX Gate')
    expect(workflow).toContain('Mobile Quality & UX Report')
    expect(workflow).not.toContain('Lighthouse Mobile Quality Report')
    expect(workflow).not.toContain('Lighthouse Mobile Quality Gate')
  })

  it('keeps the generated dashboard wording broader than Lighthouse alone', () => {
    const dashboardScript = fs.readFileSync(dashboardScriptPath, 'utf8')

    expect(dashboardScript).toContain('Mobile Quality & UX')
    expect(dashboardScript).not.toContain('Lighthouse Mobile Quality Report')
  })
})
