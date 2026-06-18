const {
  buildArchitectureGate,
  buildLaunchAssetsGate,
  buildNarrativeGate,
  buildPortfolioShowcase,
  buildQualityEvidenceGate,
  buildRecruiterWalkthroughGate,
  buildResumeBullets,
  buildScreenshotPlan,
  getStatusForScore
} = require('../../services/portfolioShowcase.service')

describe('portfolio showcase service', () => {
  const packageJson = {
    scripts: {
      'test:all': 'npm run test:inventory:audit && npm run react:production:complete && npm run jest:coverage:all && npm run browserTests:react && npm run perf:smoke:local && npm run lighthouse:ci:local',
      'browserTests:react': 'npm run uiTests:react && npm run playwright:mobile:react && npm run playwright:responsive:react',
      'perf:smoke:local': 'start-server-and-test start http://localhost:8000 perf:smoke',
      'lighthouse:ci:local': 'npm run react:build && start-server-and-test start http://localhost:8000/health lighthouse:ci'
    }
  }

  const files = {
    'render.yaml': true,
    'docs/deployment.md': true,
    'docs/portfolio.md': true,
    'docs/screenshots': true,
    'lhci-report': true,
    'services/dataArchitectureReadiness.service.js': true,
    'services/productionHardeningReadiness.service.js': true,
    'services/deploymentReadiness.service.js': true
  }

  const readme = 'Cruise portfolio recruiter walkthrough turnaround operations multi-cruise-line multi-tenant production deployment hardening architecture data architecture normalization screenshot screenshots resume talking points interview architecture diagram public URL live demo deployed'
  const componentIndex = 'EmployerDemoCommandCenter ReactRoleDashboard ReactTurnaroundAdminSetup ReactDataArchitectureReadinessCenter ReactProductionHardeningCenter ReactDeploymentReadinessCenter'

  it('builds a portfolio polish package with gates, screenshots, resume bullets, and interview talking points', () => {
    const showcase = buildPortfolioShowcase({ packageJson, files, readme, componentIndex, testSummary: 'Jest Cypress Playwright Lighthouse' })

    expect(showcase.title).toBe('Portfolio Polish Center')
    expect(showcase.overallScore).toBeGreaterThanOrEqual(85)
    expect(showcase.gates.map(gate => gate.id)).toEqual([
      'portfolio-narrative',
      'architecture-story',
      'quality-evidence',
      'recruiter-walkthrough',
      'launch-assets'
    ])
    expect(showcase.screenshotPlan).toHaveLength(5)
    expect(showcase.resumeBullets).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'resume-1', confidence: 'strong' })
    ]))
    expect(showcase.interviewTalkingPoints.map(item => item.id)).toContain('architecture-evolution')
    expect(showcase.launchChecklist[0]).toEqual(expect.objectContaining({ sequence: 1 }))
  })

  it('surfaces gaps when the portfolio launch package is incomplete', () => {
    const showcase = buildPortfolioShowcase({ packageJson: { scripts: {} }, files: {}, readme: '', componentIndex: '' })

    expect(showcase.status).toBe('needs-polish')
    expect(showcase.summary).toContain('portfolio launch area')
    expect(showcase.gates.some(gate => gate.status === 'needs-polish')).toBe(true)
    expect(showcase.launchChecklist[0].action).toBeTruthy()
  })

  it('scores each portfolio polish gate independently', () => {
    expect(getStatusForScore(90)).toBe('strong')
    expect(getStatusForScore(70)).toBe('watch')
    expect(getStatusForScore(30)).toBe('needs-polish')

    expect(buildNarrativeGate({ readme, componentIndex }).status).toBe('strong')
    expect(buildArchitectureGate({ files, readme, componentIndex }).status).toBe('strong')
    expect(buildQualityEvidenceGate({ packageJson, files, testSummary: 'Jest Cypress Playwright Lighthouse' }).status).toBe('strong')
    expect(buildRecruiterWalkthroughGate({ files, readme, componentIndex }).status).toBe('strong')
    expect(buildLaunchAssetsGate({ files, readme }).status).toBe('strong')
  })

  it('builds reusable screenshot and resume assets for the launch package', () => {
    const screenshotPlan = buildScreenshotPlan()
    const resumeBullets = buildResumeBullets({ overallScore: 90 })

    expect(screenshotPlan.map(item => item.id)).toEqual([
      'turnaround-command-center',
      'team-workspace',
      'role-aware-execution',
      'architecture-hardening',
      'quality-evidence'
    ])
    expect(resumeBullets).toHaveLength(4)
    expect(resumeBullets.every(item => item.confidence === 'strong')).toBe(true)
  })
})
