function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asText(value) {
  return typeof value === 'string' ? value : ''
}

function hasFile(files = {}, filePath) {
  return Boolean(files[filePath])
}

function hasScript(packageJson = {}, scriptName) {
  return Boolean(asObject(packageJson.scripts)[scriptName])
}

function containsAny(source = '', terms = []) {
  const normalizedSource = asText(source).toLowerCase()
  return terms.some(term => normalizedSource.includes(String(term).toLowerCase()))
}

function asPercent(passed, total) {
  if (!total) return 0
  return Math.round((passed / total) * 100)
}

function getStatusForScore(score, strongThreshold = 85, watchThreshold = 60) {
  if (score >= strongThreshold) return 'strong'
  if (score >= watchThreshold) return 'watch'
  return 'needs-polish'
}

function buildShowcaseGate({ id, label, score, summary, evidence = [], recommendations = [], status = null }) {
  return {
    id,
    label,
    score,
    status: status || getStatusForScore(score),
    summary,
    evidence,
    recommendations
  }
}

function buildNarrativeGate({ readme = '', componentIndex = '' }) {
  const checks = [
    containsAny(readme, ['portfolio', 'recruiter', 'showcase']),
    containsAny(readme, ['turnaround', 'operations', 'command center']),
    containsAny(readme, ['multi-cruise-line', 'multi cruise line', 'multi-tenant', 'tenant']),
    containsAny(readme, ['production', 'deployment', 'hardening']),
    containsAny(componentIndex, ['ReactRoleDashboard', 'ReactTurnaroundAdminSetup', 'ReactDeploymentReadinessCenter'])
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildShowcaseGate({
    id: 'portfolio-narrative',
    label: 'Portfolio narrative',
    score,
    summary: `${checks.filter(Boolean).length} of ${checks.length} narrative signals are represented.`,
    evidence: [
      checks[0] ? 'Portfolio or recruiter positioning is represented.' : 'Portfolio and recruiter positioning need to be explicit.',
      checks[1] ? 'Turnaround operations are included in the narrative.' : 'Turnaround operations should be the lead story.',
      checks[2] ? 'Multi-cruise-line or tenant direction is represented.' : 'Multi-cruise-line platform direction needs a clear callout.',
      checks[3] ? 'Production/deployment hardening is represented.' : 'Production hardening should be part of the showcase story.',
      checks[4] ? 'React workspaces demonstrate the operational platform story.' : 'React workspace evidence needs to be tied into the story.'
    ],
    recommendations: score >= 85
      ? ['Tighten the top-level README into a short recruiter walkthrough before public launch.']
      : ['Add a short portfolio overview that leads with turnaround operations, production readiness, and multi-line platform direction.']
  })
}

function buildArchitectureGate({ files = {}, readme = '', componentIndex = '' }) {
  const checks = [
    hasFile(files, 'services/dataArchitectureReadiness.service.js'),
    hasFile(files, 'services/productionHardeningReadiness.service.js'),
    hasFile(files, 'services/deploymentReadiness.service.js'),
    containsAny(readme, ['architecture', 'data architecture', 'normalization']),
    containsAny(componentIndex, ['ReactDataArchitectureReadinessCenter', 'ReactProductionHardeningCenter', 'ReactDeploymentReadinessCenter'])
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildShowcaseGate({
    id: 'architecture-story',
    label: 'Architecture story',
    score,
    summary: `${checks.filter(Boolean).length} of ${checks.length} architecture evidence signals are available.`,
    evidence: [
      checks[0] ? 'Data architecture hardening service exists.' : 'Data architecture service evidence is missing.',
      checks[1] ? 'Production hardening service exists.' : 'Production hardening service evidence is missing.',
      checks[2] ? 'Deployment readiness service exists.' : 'Deployment readiness service evidence is missing.',
      checks[3] ? 'Architecture language is present in documentation.' : 'Documentation should explain the architecture choices.',
      checks[4] ? 'Architecture readiness workspaces are wired into React.' : 'Architecture readiness workspaces need visible React evidence.'
    ],
    recommendations: score >= 85
      ? ['Add a simple diagram showing React, Express, Postgres, readiness services, and role-scoped operations.']
      : ['Create architecture notes that connect the frontend workspaces, API services, database, audit, and deployment gates.']
  })
}

function buildQualityEvidenceGate({ packageJson = {}, files = {}, testSummary = '' }) {
  const checks = [
    hasScript(packageJson, 'test:all'),
    hasScript(packageJson, 'browserTests:react'),
    hasScript(packageJson, 'perf:smoke:local') || hasScript(packageJson, 'perf:smoke:ci'),
    hasScript(packageJson, 'lighthouse:ci:local') || hasScript(packageJson, 'lighthouse:ci:ci'),
    hasFile(files, 'lhci-report') || hasFile(files, 'lighthouse-report') || containsAny(testSummary, ['Lighthouse', 'Cypress', 'Playwright', 'Jest'])
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildShowcaseGate({
    id: 'quality-evidence',
    label: 'Quality evidence',
    score,
    status: getStatusForScore(score, 90, 70),
    summary: `${checks.filter(Boolean).length} of ${checks.length} quality evidence signals are present.`,
    evidence: [
      checks[0] ? 'Full regression gate is scripted.' : 'Full regression gate is missing.',
      checks[1] ? 'React browser tests are scripted.' : 'React browser test script is missing.',
      checks[2] ? 'Performance smoke testing is scripted.' : 'Performance smoke testing should be represented.',
      checks[3] ? 'Lighthouse CI is scripted.' : 'Lighthouse CI should be represented.',
      checks[4] ? 'External quality artifacts or recent test summary are represented.' : 'A latest test evidence summary should be captured before launch.'
    ],
    recommendations: score >= 90
      ? ['Capture the final passing test-all output as launch evidence for the portfolio README.']
      : ['Make the release evidence repeatable with Jest, Cypress, Playwright, k6, and Lighthouse outputs.']
  })
}

function buildRecruiterWalkthroughGate({ files = {}, readme = '', componentIndex = '' }) {
  const checks = [
    containsAny(readme, ['walkthrough', 'demo', 'recruiter']),
    containsAny(componentIndex, ['EmployerDemoCommandCenter']),
    containsAny(readme, ['screenshot', 'screenshots']) || hasFile(files, 'docs/screenshots'),
    containsAny(readme, ['resume', 'talking points', 'interview']) || hasFile(files, 'docs/portfolio.md'),
    containsAny(componentIndex, ['ReactDeploymentReadinessCenter'])
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildShowcaseGate({
    id: 'recruiter-walkthrough',
    label: 'Recruiter walkthrough',
    score,
    summary: `${checks.filter(Boolean).length} of ${checks.length} walkthrough readiness signals are present.`,
    evidence: [
      checks[0] ? 'Walkthrough or demo language is represented.' : 'A recruiter walkthrough still needs to be documented.',
      checks[1] ? 'Employer demo command center is available.' : 'Employer demo command center evidence is missing.',
      checks[2] ? 'Screenshot guidance or assets are represented.' : 'Screenshot plan is missing.',
      checks[3] ? 'Resume or interview positioning is represented.' : 'Resume and interview talking points need to be drafted.',
      checks[4] ? 'Deployment readiness is visible in the app.' : 'Deployment readiness should be visible before public launch.'
    ],
    recommendations: score >= 85
      ? ['Turn the walkthrough into a concise README section with five screenshots and three resume bullets.']
      : ['Add a recruiter-facing walkthrough with screenshots, architecture story, and role-based demo path.']
  })
}

function buildLaunchAssetsGate({ files = {}, readme = '' }) {
  const checks = [
    hasFile(files, 'render.yaml') || hasFile(files, 'railway.json') || hasFile(files, 'fly.toml'),
    hasFile(files, 'docs/deployment.md') || containsAny(readme, ['deployment', 'deploy']),
    hasFile(files, 'docs/portfolio.md') || containsAny(readme, ['portfolio']),
    containsAny(readme, ['architecture diagram', 'diagram', 'data model']),
    containsAny(readme, ['public url', 'live demo', 'deployed'])
  ]
  const score = asPercent(checks.filter(Boolean).length, checks.length)

  return buildShowcaseGate({
    id: 'launch-assets',
    label: 'Launch assets',
    score,
    summary: `${checks.filter(Boolean).length} of ${checks.length} launch asset signals are complete.`,
    evidence: [
      checks[0] ? 'A hosting platform configuration exists.' : 'A hosting target config should be finalized.',
      checks[1] ? 'Deployment guidance is represented.' : 'Deployment runbook should be added.',
      checks[2] ? 'Portfolio documentation is represented.' : 'Portfolio documentation should be added.',
      checks[3] ? 'Architecture diagram language is represented.' : 'Architecture diagram still needs to be prepared.',
      checks[4] ? 'Live/public URL language is represented.' : 'Live URL placeholder should be added after deployment.'
    ],
    recommendations: score >= 80
      ? ['Finalize the public URL and screenshot set after deployment succeeds.']
      : ['Prepare the launch packet: public URL, screenshots, architecture diagram, deployment notes, and resume bullets.']
  })
}

function buildScreenshotPlan() {
  return [
    {
      id: 'turnaround-command-center',
      title: 'Turnaround operations command view',
      purpose: 'Lead with the flagship operational workflow: readiness, blockers, and department execution.',
      capture: 'Admin or turnaround manager view showing the selected sailing and operational status.'
    },
    {
      id: 'team-workspace',
      title: 'Turnaround team workspace',
      purpose: 'Show cruise-line scoped staffing, role coverage, and conflict-aware assignment workflow.',
      capture: 'Cruise line, ship, sailing, and team readiness cards visible together.'
    },
    {
      id: 'role-aware-execution',
      title: 'Role-aware operational execution',
      purpose: 'Demonstrate passenger, group leader, and operational lead visibility rules.',
      capture: 'Role selector plus a role-specific dashboard state.'
    },
    {
      id: 'architecture-hardening',
      title: 'Architecture and hardening centers',
      purpose: 'Make production thinking visible: data architecture, production hardening, and deployment readiness.',
      capture: 'Readiness scorecards with gates and recommendations.'
    },
    {
      id: 'quality-evidence',
      title: 'Quality and launch evidence',
      purpose: 'Prove the project is tested and release-minded, not just visually complete.',
      capture: 'Quality console or release evidence checklist after a passing run.'
    }
  ]
}

function buildResumeBullets(readiness = {}) {
  const score = readiness.overallScore || 0
  return [
    `Built Cruise Explorer, a React/Express/Postgres cruise turnaround operations platform with role-aware operational workflows and multi-cruise-line readiness direction.`,
    `Implemented production-style readiness centers for data architecture, production hardening, deployment, and portfolio packaging with scored gates and launch recommendations.`,
    `Maintained a regression suite spanning Jest, Cypress, Playwright, performance smoke testing, and Lighthouse while iterating on enterprise-grade portfolio features.`,
    `Modeled realistic cruise turnaround workflows including staffing coverage, command execution, continuity, shift handoff, closeout, and go-live readiness.`
  ].map((text, index) => ({ id: `resume-${index + 1}`, text, confidence: score >= 80 ? 'strong' : 'draft' }))
}

function buildInterviewTalkingPoints(gates = []) {
  const lowestGate = [...gates].sort((a, b) => a.score - b.score)[0]
  return [
    {
      id: 'product-ownership',
      prompt: 'Why this project matters',
      talkingPoint: 'It moved from a basic cruise admin app into an operational turnaround management platform with realistic role-based workflows.'
    },
    {
      id: 'architecture-evolution',
      prompt: 'How the architecture evolved',
      talkingPoint: 'The roadmap now separates workflow maturity from data architecture hardening, production hardening, deployment readiness, and portfolio packaging.'
    },
    {
      id: 'quality-discipline',
      prompt: 'How quality is protected',
      talkingPoint: 'Every slice is backed by tests and the release gate includes unit, integration, browser, mobile/responsive, performance, and Lighthouse checks.'
    },
    {
      id: 'next-improvement',
      prompt: 'What would be improved next',
      talkingPoint: lowestGate ? `${lowestGate.label}: ${lowestGate.recommendations?.[0] || lowestGate.summary}` : 'Finalize screenshots, public URL, and a concise recruiter walkthrough.'
    }
  ]
}

function buildPortfolioShowcase(input = {}) {
  const packageJson = asObject(input.packageJson)
  const files = asObject(input.files)
  const readme = asText(input.readme)
  const componentIndex = asText(input.componentIndex)
  const testSummary = asText(input.testSummary)

  const gates = [
    buildNarrativeGate({ readme, componentIndex }),
    buildArchitectureGate({ files, readme, componentIndex }),
    buildQualityEvidenceGate({ packageJson, files, testSummary }),
    buildRecruiterWalkthroughGate({ files, readme, componentIndex }),
    buildLaunchAssetsGate({ files, readme })
  ]
  const overallScore = asPercent(gates.reduce((total, gate) => total + gate.score, 0), gates.length * 100)
  const blockers = gates.filter(gate => gate.status === 'needs-polish')
  const watchlist = gates.filter(gate => gate.status === 'watch')

  const readiness = {
    title: 'Portfolio Polish Center',
    overallScore,
    status: blockers.length ? 'needs-polish' : watchlist.length ? 'watch' : 'strong',
    summary: blockers.length
      ? `${blockers.length} portfolio launch area${blockers.length === 1 ? '' : 's'} need polish before public presentation.`
      : watchlist.length
        ? `${watchlist.length} portfolio launch area${watchlist.length === 1 ? '' : 's'} should be tightened before publishing.`
        : 'Portfolio launch packaging is in strong shape.',
    gates
  }

  return {
    ...readiness,
    screenshotPlan: buildScreenshotPlan(),
    resumeBullets: buildResumeBullets(readiness),
    interviewTalkingPoints: buildInterviewTalkingPoints(gates),
    launchChecklist: gates
      .sort((a, b) => a.score - b.score)
      .map((gate, index) => ({
        sequence: index + 1,
        gateId: gate.id,
        title: gate.label,
        status: gate.status,
        action: gate.recommendations?.[0] || 'Review this portfolio gate before launch.'
      })),
    generatedAt: new Date().toISOString()
  }
}

module.exports = {
  buildArchitectureGate,
  buildLaunchAssetsGate,
  buildNarrativeGate,
  buildPortfolioShowcase,
  buildQualityEvidenceGate,
  buildRecruiterWalkthroughGate,
  buildResumeBullets,
  buildScreenshotPlan,
  getStatusForScore
}
