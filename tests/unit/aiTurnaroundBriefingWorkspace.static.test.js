const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('AI turnaround briefing React workspace', () => {
  const workspace = read('frontend/react/src/components/operations/AiTurnaroundBriefingWorkspace.jsx')
  const hook = read('frontend/react/src/hooks/useAiTurnaroundBriefing.js')
  const client = read('frontend/react/src/api/platformClient.js')
  const dashboard = read('frontend/react/src/components/operations/OperationalTurnaroundDashboard.jsx')
  const dashboardNavigation = read('frontend/react/src/components/operations/operationalDashboardNavigation.js')
  const styles = read('frontend/react/src/styles/components/operations-ai-briefing.css')

  it('provides generation, regeneration, history, findings, evidence, and human review UX', () => {
    expect(workspace).toContain('Generate briefing')
    expect(workspace).toContain('Regenerate briefing')
    expect(workspace).toContain('Briefing history')
    expect(workspace).toContain('Evidence-backed findings')
    expect(workspace).toContain('Evidence included')
    expect(workspace).toContain('Human review')
    expect(workspace).toContain('NEEDS_REVISION')
    expect(workspace).toContain('react-ai-briefing-generate')
    expect(workspace).toContain('react-ai-briefing-save-review')
  })

  it('uses operation-scoped server APIs and demo-user authorization headers', () => {
    expect(client).toContain('generateOperationalAiBriefing')
    expect(client).toContain('getOperationalAiBriefingHistory')
    expect(client).toContain('reviewOperationalAiBriefing')
    expect(client).toContain('getScopedRequestOptions(options)')
    expect(hook).toContain('selectedDemoUser')
    expect(hook).toContain('loadHistory')
  })

  it('integrates the workspace into operational navigation with responsive styles', () => {
    expect(dashboard).toContain("from './operationalDashboardNavigation.js'")
    expect(dashboardNavigation).toContain("id: 'ai-briefing'")
    expect(dashboard).toContain('<AiTurnaroundBriefingWorkspace')
    expect(styles).toContain('@media (max-width: 800px)')
    expect(styles).toContain('.ai-briefing-layout')
    const browserSpec = read('cypress/react/reactAiTurnaroundBriefing.cy.js')
    expect(browserSpec).toContain('generates, displays, and reviews an evidence-grounded briefing')
    expect(browserSpec).toContain('surfaces provider-disabled failures')
  })
})
