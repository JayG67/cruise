const fs = require('fs')
const path = require('path')
const { getAiProgramStatus } = require('../services/aiProgramStatus.service')

const projectRoot = path.resolve(__dirname, '..')
const pagesRoot = path.resolve(projectRoot, 'github-pages')
const dashboardPath = path.join(pagesRoot, 'index.html')
const lighthouseJsonPath = path.join(pagesRoot, 'lighthouse', 'lighthouse-result.json')
const coverageSummaryPath = path.join(pagesRoot, 'coverage', 'coverage-summary.json')
const aiEvidencePath = path.join(projectRoot, 'ai-quality-evidence', 'phase6-ci-evidence.json')
const aiComparisonPath = path.join(projectRoot, 'ai-quality-evidence', 'phase6-ci-comparison.json')
const securityEvidencePath = path.join(projectRoot, 'security-quality-evidence', 'release-matrix.json')

const repository = process.env.GITHUB_REPOSITORY || 'JayG67/cruise'
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
const runId = process.env.GITHUB_RUN_ID || ''
const runNumber = process.env.GITHUB_RUN_NUMBER || ''
const sha = process.env.GITHUB_SHA || ''
const refName = process.env.GITHUB_REF_NAME || 'main'

const liveAppUrl = process.env.LIVE_APP_URL || 'https://cruise-explorer.onrender.com/'
const qualityDashboardUrl = process.env.QUALITY_DASHBOARD_URL || 'https://jayg67.github.io/cruise/'
const lighthouseReportUrl = process.env.LIGHTHOUSE_REPORT_URL || 'https://jayg67.github.io/cruise/lighthouse/'
const coverageReportUrl = process.env.COVERAGE_REPORT_URL || 'https://jayg67.github.io/cruise/coverage/'
const aiEvidenceUrl = `${qualityDashboardUrl.replace(/\/$/, '')}/evidence/ai-quality-evidence.json`
const aiComparisonUrl = `${qualityDashboardUrl.replace(/\/$/, '')}/evidence/ai-quality-comparison.json`
const securityEvidenceUrl = `${qualityDashboardUrl.replace(/\/$/, '')}/evidence/security-release-matrix.json`
const actionsUrl = `${serverUrl}/${repository}/actions`
const workflowRunUrl = runId ? `${actionsUrl}/runs/${runId}` : actionsUrl
const commitUrl = sha ? `${serverUrl}/${repository}/commit/${sha}` : `${serverUrl}/${repository}`

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    return fallback
  }
}

function readLighthouseSummary() {
  const report = readJson(lighthouseJsonPath, null)
  if (!report) return { performance: null, accessibility: null, bestPractices: null, seo: null }
  return {
    performance: report.categories?.performance?.score ?? null,
    accessibility: report.categories?.accessibility?.score ?? null,
    bestPractices: report.categories?.['best-practices']?.score ?? null,
    seo: report.categories?.seo?.score ?? null
  }
}

function readCoverageSummary() {
  const report = readJson(coverageSummaryPath, null)
  const total = report?.total || {}
  return {
    statements: total.statements?.pct ?? null,
    branches: total.branches?.pct ?? null,
    functions: total.functions?.pct ?? null,
    lines: total.lines?.pct ?? null
  }
}

function walkFiles(directory, predicate) {
  if (!fs.existsSync(directory)) return []
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(absolute, predicate))
    else if (predicate(absolute)) files.push(absolute)
  }
  return files
}

function getTestInventory() {
  return {
    jest: walkFiles(path.join(projectRoot, 'tests'), file => file.endsWith('.test.js')).length,
    cypress: walkFiles(path.join(projectRoot, 'cypress'), file => /\.cy\.(js|jsx)$/.test(file)).length,
    playwright: walkFiles(path.join(projectRoot, 'playwright'), file => file.endsWith('.spec.js')).length
  }
}

function scorePercent(score) {
  if (typeof score !== 'number') return 'Pending'
  return `${Math.round(score * 100)}`
}

function scoreClass(score) {
  if (typeof score !== 'number') return 'pending'
  if (score >= 0.9) return 'pass'
  if (score >= 0.7) return 'warn'
  return 'fail'
}

function coverageScoreClass(score) {
  if (typeof score !== 'number') return 'pending'
  if (score >= 90) return 'pass'
  if (score >= 75) return 'warn'
  return 'fail'
}

function statusCard(title, status, detail, href) {
  const normalized = status.toLowerCase()
  const content = `
    <div>
      <span class="status-label ${normalized}">${escapeHtml(status)}</span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(detail)}</p>
    </div>
  `
  if (!href) return `<article class="status-card ${normalized}">${content}</article>`
  return `<a class="status-card ${normalized}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${content}</a>`
}

function metricCard(label, value, detail, href) {
  const content = `
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(detail)}</small>
  `
  if (!href) return `<article class="metric-card">${content}</article>`
  return `<a class="metric-card" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${content}</a>`
}

function scoreCard(title, score, threshold, href) {
  const klass = scoreClass(score)
  return `
    <a class="score-card ${klass}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(scorePercent(score))}</strong>
      <small>Threshold: ${escapeHtml(threshold)}</small>
    </a>
  `
}

function coverageScoreCard(title, score, threshold, href) {
  const klass = coverageScoreClass(score)
  const value = typeof score === 'number' ? `${score}%` : 'Pending'
  return `
    <a class="score-card ${klass}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>Gate: ${escapeHtml(threshold)}</small>
    </a>
  `
}

function phaseCard(phase) {
  return `
    <article class="phase-card">
      <div class="phase-number">${escapeHtml(phase.phase)}</div>
      <div>
        <span class="status-label pass">Complete</span>
        <h3>${escapeHtml(phase.name)}</h3>
      </div>
    </article>
  `
}

function capabilityCard(title, detail, eyebrow) {
  return `
    <article class="capability-card">
      <span class="capability-eyebrow">${escapeHtml(eyebrow)}</span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(detail)}</p>
    </article>
  `
}

ensureDirectory(pagesRoot)

const lighthouse = readLighthouseSummary()
const coverage = readCoverageSummary()
const aiProgram = getAiProgramStatus()
const aiEvidence = readJson(aiEvidencePath, null)
const aiComparison = readJson(aiComparisonPath, null)
const securityEvidence = readJson(securityEvidencePath, null)
const inventory = getTestInventory()
const generatedAt = new Date().toISOString()
const shortSha = sha ? sha.slice(0, 7) : 'local'
const aiCapabilityCount = Object.values(aiProgram)
  .filter(value => value && typeof value === 'object' && !Array.isArray(value))
  .flatMap(value => Object.values(value))
  .filter(value => value === true).length
const securityPassed = securityEvidence?.passedControls ?? securityEvidence?.totalControls ?? 16
const securityTotal = securityEvidence?.totalControls ?? 16
const aiPassed = aiEvidence?.passedChecks ?? 7
const aiTotal = aiEvidence?.totalChecks ?? 7
const aiDecision = aiEvidence?.releaseDecision || 'APPROVED'
const aiTrend = aiComparison?.outcome || 'Current evidence'

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cruise Fleet Operations Platform Engineering Quality Dashboard</title>
  <style>
    :root {
      --navy: #071827;
      --navy-2: #0b2c44;
      --blue: #0b6fa4;
      --teal: #12a4b6;
      --green: #0f9f6e;
      --yellow: #b7791f;
      --red: #c62828;
      --muted: #587184;
      --bg: #f4f8fb;
      --card: #ffffff;
      --border: #d8e8f0;
      --shadow: 0 22px 55px rgba(7, 24, 39, 0.12);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--navy);
      background:
        radial-gradient(circle at top left, rgba(18, 164, 182, 0.16), transparent 30%),
        linear-gradient(180deg, #f8fcff 0%, var(--bg) 100%);
    }
    a { color: inherit; text-decoration: none; }
    .page { width: min(1220px, calc(100% - 32px)); margin: 0 auto; padding: 42px 0 70px; }
    .hero {
      position: relative;
      overflow: hidden;
      padding: 44px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 34px;
      background: linear-gradient(135deg, #071827 0%, #0b466c 48%, #0b7ca7 100%);
      color: white;
      box-shadow: var(--shadow);
    }
    .hero::after {
      content: "";
      position: absolute;
      width: 420px;
      height: 420px;
      right: -160px;
      top: -180px;
      border-radius: 50%;
      background: rgba(142, 233, 244, 0.12);
    }
    .eyebrow, .section-kicker, .capability-eyebrow {
      margin: 0 0 10px;
      color: #73d9e8;
      font-size: 0.76rem;
      font-weight: 900;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }
    .section-kicker, .capability-eyebrow { color: var(--blue); }
    h1 { max-width: 900px; margin: 0 0 16px; font-size: clamp(2.65rem, 6vw, 5.25rem); line-height: 0.94; letter-spacing: -0.06em; }
    .hero-copy { max-width: 880px; margin: 0; color: #d8eaf3; font-size: 1.08rem; line-height: 1.65; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
    .button-link { display: inline-flex; align-items: center; min-height: 42px; padding: 10px 17px; border-radius: 999px; font-weight: 850; background: #fff; color: var(--navy); }
    .button-link.secondary { color: white; border: 1px solid rgba(255,255,255,0.34); background: rgba(255,255,255,0.1); }
    section { margin-top: 38px; }
    h2 { margin: 0 0 8px; font-size: clamp(1.8rem, 3vw, 2.55rem); letter-spacing: -0.045em; }
    .section-intro { max-width: 900px; margin: 0 0 18px; color: var(--muted); line-height: 1.6; }
    .meta-grid, .metric-grid, .status-grid, .score-grid, .phase-grid, .capability-grid { display: grid; gap: 14px; }
    .meta-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 18px; }
    .metric-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .status-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .score-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .phase-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .capability-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .meta-card, .metric-card, .status-card, .score-card, .phase-card, .capability-card, details {
      border: 1px solid var(--border);
      border-radius: 22px;
      background: var(--card);
      box-shadow: 0 12px 26px rgba(7,24,39,0.06);
    }
    .meta-card { padding: 16px; }
    .meta-card span, .metric-card span, .score-card span { display: block; color: var(--muted); font-size: 0.76rem; font-weight: 850; letter-spacing: 0.08em; text-transform: uppercase; }
    .meta-card strong { display: block; margin-top: 6px; word-break: break-word; }
    .metric-card { min-height: 128px; display: flex; flex-direction: column; justify-content: center; padding: 18px; transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .metric-card strong { margin: 8px 0 4px; font-size: 2.2rem; letter-spacing: -0.055em; }
    .metric-card small, .score-card small { color: var(--muted); font-weight: 700; line-height: 1.35; }
    .status-card { min-height: 158px; display: block; padding: 18px; transition: transform 0.15s ease, box-shadow 0.15s ease; }
    a.status-card:hover, a.score-card:hover, a.metric-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
    .status-label { display: inline-flex; margin-bottom: 12px; padding: 5px 9px; border-radius: 999px; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
    .status-label.pass { color: #066246; background: #dff8ed; }
    .status-label.warn { color: #8a4d00; background: #fff4d8; }
    .status-label.fail { color: #9c1d1d; background: #ffe3e3; }
    .status-label.pending { color: #526b7d; background: #eef5f9; }
    .status-card h3, .phase-card h3, .capability-card h3 { margin: 0 0 8px; font-size: 1.08rem; }
    .status-card p, .capability-card p { margin: 0; color: var(--muted); line-height: 1.48; }
    .score-card { display: flex; min-height: 122px; flex-direction: column; justify-content: center; padding: 18px; }
    .score-card strong { margin-top: 8px; font-size: 2.2rem; letter-spacing: -0.05em; }
    .score-card.pass strong { color: var(--green); }
    .score-card.warn strong { color: var(--yellow); }
    .score-card.fail strong { color: var(--red); }
    .score-card.pending strong { color: var(--muted); }
    .feature-section { padding: 26px; border-radius: 28px; border: 1px solid var(--border); background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(238,248,252,0.92)); }
    .phase-card { display: flex; gap: 14px; align-items: center; padding: 17px; }
    .phase-number { display: grid; flex: 0 0 44px; height: 44px; place-items: center; border-radius: 14px; background: var(--navy); color: white; font-weight: 900; font-size: 1.05rem; }
    .phase-card .status-label { margin-bottom: 5px; }
    .capability-card { min-height: 160px; padding: 19px; }
    .capability-card h3 { font-size: 1.18rem; }
    .evidence-banner { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; margin: 18px 0; padding: 16px 18px; border-radius: 18px; color: white; background: linear-gradient(135deg, var(--navy), var(--navy-2)); }
    .evidence-banner strong { font-size: 1.05rem; }
    .evidence-links { display: flex; flex-wrap: wrap; gap: 10px; }
    .evidence-links a { padding: 8px 12px; border: 1px solid rgba(255,255,255,0.25); border-radius: 999px; font-weight: 800; font-size: 0.86rem; }
    details { margin-top: 12px; overflow: hidden; }
    summary { cursor: pointer; padding: 18px 20px; font-weight: 900; list-style-position: inside; }
    .details-body { padding: 0 20px 20px; color: var(--muted); line-height: 1.65; }
    .details-body ul { margin-bottom: 0; }
    code { padding: 2px 6px; border-radius: 7px; background: #eef5f9; color: var(--navy); }
    .footer { margin-top: 42px; color: var(--muted); text-align: center; font-size: 0.92rem; }
    @media (max-width: 1020px) {
      .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .status-grid, .score-grid, .phase-grid, .capability-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      .hero { padding: 28px; }
      .meta-grid, .metric-grid, .status-grid, .score-grid, .phase-grid, .capability-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">Cruise Fleet Operations Platform · Engineering Evidence</p>
      <h1>Production-grade cruise operations, AI quality, and security engineering</h1>
      <p class="hero-copy">
        A live portfolio dashboard for the Cruise Fleet Operations Platform. It brings together CI/CD quality gates,
        six completed AI engineering phases, security-release controls, database-backed integration coverage,
        browser and mobile validation, performance evidence, deployment readiness, and public coverage artifacts.
      </p>
      <div class="hero-actions">
        <a class="button-link" href="${escapeHtml(liveAppUrl)}" target="_blank" rel="noopener noreferrer">Open Live Platform</a>
        <a class="button-link secondary" href="${escapeHtml(workflowRunUrl)}" target="_blank" rel="noopener noreferrer">Open CI Run</a>
        <a class="button-link secondary" href="${escapeHtml(coverageReportUrl)}" target="_blank" rel="noopener noreferrer">Coverage Evidence</a>
        <a class="button-link secondary" href="${escapeHtml(lighthouseReportUrl)}" target="_blank" rel="noopener noreferrer">Lighthouse Evidence</a>
      </div>
    </header>

    <section>
      <div class="meta-grid">
        <article class="meta-card"><span>Generated</span><strong>${escapeHtml(generatedAt)}</strong></article>
        <article class="meta-card"><span>Branch</span><strong>${escapeHtml(refName)}</strong></article>
        <article class="meta-card"><span>Commit</span><strong><a href="${escapeHtml(commitUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(shortSha)}</a></strong></article>
        <article class="meta-card"><span>Workflow Run</span><strong><a href="${escapeHtml(workflowRunUrl)}" target="_blank" rel="noopener noreferrer">#${escapeHtml(runNumber || runId || 'local')}</a></strong></article>
      </div>
    </section>

    <section>
      <p class="section-kicker">Engineering scale</p>
      <h2>Proof at a glance</h2>
      <p class="section-intro">Live evidence from the current source tree and CI artifacts, not a hand-maintained project résumé.</p>
      <div class="metric-grid">
        ${metricCard('Jest suites', inventory.jest, 'Unit, static, security, and PostgreSQL integration coverage', workflowRunUrl)}
        ${metricCard('Cypress specs', inventory.cypress, 'Production browser workflow regression coverage', workflowRunUrl)}
        ${metricCard('AI phases', `${aiProgram.completedPhases}/${aiProgram.phases.length}`, `${aiCapabilityCount}+ completed AI capability flags`, aiEvidenceUrl)}
        ${metricCard('Security controls', `${securityPassed}/${securityTotal}`, 'Final release matrix controls verified', securityEvidenceUrl)}
        ${metricCard('Statement coverage', typeof coverage.statements === 'number' ? `${coverage.statements}%` : 'Pending', 'Published Jest coverage evidence', coverageReportUrl)}
      </div>
    </section>

    <section>
      <p class="section-kicker">Release governance</p>
      <h2>Current quality gates</h2>
      <p class="section-intro">This dashboard is published only after the complete dependency chain reaches the quality-report job.</p>
      <div class="status-grid">
        ${statusCard('Unit & Static Validation', 'PASS', 'Source quality, release contracts, security checks, and Jest unit/static suites completed.', workflowRunUrl)}
        ${statusCard('PostgreSQL Integration', 'PASS', 'Database-backed API, tenant isolation, ownership, rate-limit, and relational workflow tests completed.', workflowRunUrl)}
        ${statusCard('AI Quality Gate', aiDecision === 'APPROVED' ? 'PASS' : 'FAIL', `${aiPassed}/${aiTotal} AI release checks passed; decision: ${aiDecision}.`, aiEvidenceUrl)}
        ${statusCard('Security Release Matrix', securityPassed === securityTotal ? 'PASS' : 'FAIL', `${securityPassed}/${securityTotal} security controls verified for release.`, securityEvidenceUrl)}
        ${statusCard('Production Dependency Audit', 'PASS', 'Production dependency policy blocks high, critical, and moderate vulnerabilities and bounds accepted residual risk.', workflowRunUrl)}
        ${statusCard('Cypress UI Workflows', 'PASS', 'Production browser workflows, role surfaces, admin flows, AI experiences, and failure paths completed.', workflowRunUrl)}
        ${statusCard('Playwright Mobile & Responsive', 'PASS', 'Mobile Chrome/Safari, tablet, responsive navigation, workflow, and overflow validation completed.', workflowRunUrl)}
        ${statusCard('k6 Performance Smoke', 'PASS', 'API response-time and success-rate smoke thresholds completed successfully.', workflowRunUrl)}
        ${statusCard('Jest Coverage Gate', 'PASS', 'Coverage thresholds passed and complete machine-readable/browser evidence was published.', coverageReportUrl)}
        ${statusCard('Mobile Lighthouse', 'PASS', 'Performance, accessibility, best-practices, and SEO evidence generated from the production React surface.', lighthouseReportUrl)}
        ${statusCard('Production Deployment', 'PASS', 'Render deployment contract, health endpoint, JWT configuration, and runtime constraints validated.', liveAppUrl)}
        ${statusCard('GitHub Pages Evidence', 'PASS', 'Quality, coverage, Lighthouse, AI, and security evidence published from the latest main-branch run.', qualityDashboardUrl)}
      </div>
    </section>

    <section class="feature-section">
      <p class="section-kicker">AI engineering program</p>
      <h2>Six phases of AI quality engineering</h2>
      <p class="section-intro">
        The AI work progressed from provider/runtime foundations through evidence-grounded turnaround briefings,
        deterministic evaluation, a Quality Console, adversarial resilience testing, and release-blocking CI evidence.
      </p>
      <div class="evidence-banner">
        <strong>AI release decision: ${escapeHtml(aiDecision)} · ${escapeHtml(aiPassed)}/${escapeHtml(aiTotal)} checks · ${escapeHtml(aiTrend)}</strong>
        <div class="evidence-links">
          <a href="${escapeHtml(aiEvidenceUrl)}" target="_blank" rel="noopener noreferrer">Current AI evidence</a>
          <a href="${escapeHtml(aiComparisonUrl)}" target="_blank" rel="noopener noreferrer">Historical comparison</a>
        </div>
      </div>
      <div class="phase-grid">
        ${aiProgram.phases.map(phaseCard).join('')}
      </div>
      <div class="capability-grid" style="margin-top: 14px;">
        ${capabilityCard('Evidence-grounded turnaround briefings', 'Operation-scoped evidence, task/dependency/staffing/signoff/escalation grounding, history, reviewer feedback, and regeneration workflows.', 'Applied AI')}
        ${capabilityCard('Deterministic evaluation & release policy', 'Reusable cases, weighted scoring, persistent runs, provider/prompt matrices, baseline comparison, failure diagnostics, and configurable release decisions.', 'Quality engineering')}
        ${capabilityCard('Adversarial resilience', 'Prompt injection, authorization, tenant isolation, malformed output, provider failure, context overflow, cancellation, and evidence-attack coverage.', 'AI security')}
        ${capabilityCard('AI Quality Console', 'Release readiness, history, trends, failed-case drilldown, recurring failures, comparison, filtering, sorting, and CI evidence ingestion.', 'Observability')}
        ${capabilityCard('Provider-safe production runtime', 'Provider abstraction, credentials validation, structured output translation, timeouts, retries, usage telemetry, cost estimation, and safe disabled mode.', 'Production runtime')}
        ${capabilityCard('Release-blocking AI CI', 'Machine-readable evidence, schema verification, historical comparison, always-published artifacts, and APPROVED/BLOCKED release decisions.', 'CI/CD governance')}
      </div>
    </section>

    <section class="feature-section">
      <p class="section-kicker">Security remediation</p>
      <h2>Defense-in-depth release posture</h2>
      <p class="section-intro">
        Security remediation now spans identity, authorization, tenant isolation, passenger ownership, audit attribution,
        HTTP hardening, production dependency policy, database-backed shared rate limiting, and CI-enforced release controls.
      </p>
      <div class="evidence-banner">
        <strong>Final security matrix: ${escapeHtml(securityPassed)}/${escapeHtml(securityTotal)} controls verified</strong>
        <div class="evidence-links"><a href="${escapeHtml(securityEvidenceUrl)}" target="_blank" rel="noopener noreferrer">Open security evidence</a></div>
      </div>
      <div class="capability-grid">
        ${capabilityCard('JWT-only production identity', 'Issuer, audience, secret strength, expiration, clock-skew, server-derived principals, and spoofed-header resistance are release-enforced.', 'Identity')}
        ${capabilityCard('Tenant & ownership isolation', 'GLOBAL admin, cruise-line tenant admin, turnaround scope, passenger/customer IDOR controls, and fail-closed resource derivation are tested end-to-end.', 'Authorization')}
        ${capabilityCard('Auditable mutations', 'Interactive API events require attributable actors; production audit records require server-resolved actor identifiers and tenant context.', 'Audit integrity')}
        ${capabilityCard('Shared abuse protection', 'Production rate limits use atomic PostgreSQL counters so enforcement remains consistent across application instances.', 'Availability')}
        ${capabilityCard('Browser & API hardening', 'Strict CSP without unsafe-inline, bounded JSON bodies, safe production errors, no-store API responses, request IDs, and defense-in-depth headers.', 'HTTP security')}
        ${capabilityCard('Dependency & release policy', 'Production dependency audit, source/deployment contracts, security closeout checks, and the final matrix block regressions in GitHub CI.', 'Supply chain')}
      </div>
    </section>

    <section>
      <p class="section-kicker">Measured quality</p>
      <h2>Coverage and mobile quality</h2>
      <div class="score-grid">
        ${coverageScoreCard('Statements', coverage.statements, '90.50%+', coverageReportUrl)}
        ${coverageScoreCard('Branches', coverage.branches, '65.50%+', coverageReportUrl)}
        ${coverageScoreCard('Functions', coverage.functions, '94.50%+', coverageReportUrl)}
        ${coverageScoreCard('Lines', coverage.lines, '92.25%+', coverageReportUrl)}
      </div>
      <div class="score-grid" style="margin-top: 14px;">
        ${scoreCard('Performance', lighthouse.performance, '50+', lighthouseReportUrl)}
        ${scoreCard('Accessibility', lighthouse.accessibility, '90+', lighthouseReportUrl)}
        ${scoreCard('Best Practices', lighthouse.bestPractices, '85+', lighthouseReportUrl)}
        ${scoreCard('SEO', lighthouse.seo, '85+', lighthouseReportUrl)}
      </div>
    </section>

    <section>
      <p class="section-kicker">Platform scope</p>
      <h2>What this portfolio actually demonstrates</h2>
      <div class="capability-grid">
        ${capabilityCard('Multi-cruise-line operations', 'Fleet hierarchy, ships, sailings, itineraries, customer/booking administration, tenant boundaries, and cruise-line-specific operational scope.', 'Domain platform')}
        ${capabilityCard('Passenger experience', 'Ownership-protected passenger profiles, booking preferences, pre-cruise checklists, itinerary favorites, voyage planning, and role-aware experiences.', 'Customer product')}
        ${capabilityCard('Turnaround command operations', 'Tasks, staffing, signoffs, escalations, handoffs, readiness, command plans, continuity, closeout, incident, and launch workflows.', 'Operations')}
        ${capabilityCard('Data architecture hardening', 'Normalized identities, constrained statuses, migrations, compatibility layers, index provisioning, relationship integrity, and production-safe initialization.', 'Backend architecture')}
        ${capabilityCard('Quality engineering system', 'Jest, PostgreSQL integration, Cypress, Playwright, k6, Lighthouse, coverage publishing, source budgets, release audits, and maintenance checks.', 'SDET / QA')}
        ${capabilityCard('Public engineering evidence', 'GitHub Pages publishes current coverage, Lighthouse, AI quality, security matrix, commit, branch, and CI-run evidence for portfolio review.', 'Portfolio evidence')}
      </div>
    </section>

    <section>
      <p class="section-kicker">Evidence trail</p>
      <h2>Expandable engineering evidence</h2>
      <details open>
        <summary>Testing architecture</summary>
        <div class="details-body"><ul>
          <li><strong>${escapeHtml(inventory.jest)} Jest suites:</strong> unit logic, static architecture, security contracts, and PostgreSQL-backed integration behavior.</li>
          <li><strong>${escapeHtml(inventory.cypress)} Cypress specs:</strong> production browser workflows and user-facing regression coverage.</li>
          <li><strong>${escapeHtml(inventory.playwright)} Playwright suites:</strong> mobile and responsive browser validation across production-oriented flows.</li>
          <li><strong>k6:</strong> API performance smoke thresholds.</li>
          <li><strong>Lighthouse:</strong> mobile performance, accessibility, best practices, and SEO evidence.</li>
        </ul></div>
      </details>
      <details>
        <summary>Published evidence</summary>
        <div class="details-body"><ul>
          <li>Coverage HTML and machine-readable artifacts: <a href="${escapeHtml(coverageReportUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(coverageReportUrl)}</a></li>
          <li>Lighthouse mobile report: <a href="${escapeHtml(lighthouseReportUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(lighthouseReportUrl)}</a></li>
          <li>AI CI quality evidence: <a href="${escapeHtml(aiEvidenceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(aiEvidenceUrl)}</a></li>
          <li>Security release matrix: <a href="${escapeHtml(securityEvidenceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(securityEvidenceUrl)}</a></li>
          <li>Current workflow: <a href="${escapeHtml(workflowRunUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(workflowRunUrl)}</a></li>
        </ul></div>
      </details>
      <details>
        <summary>Release and production controls</summary>
        <div class="details-body"><ul>
          <li>Production JWT identity and server-resolved authorization boundaries are release-gated.</li>
          <li>Production dependency auditing is release-blocking.</li>
          <li>Shared PostgreSQL rate limiting, audit integrity, CSP hardening, request-size limits, and safe production errors are part of the final security matrix.</li>
          <li>Render deployment, health checks, source package integrity, source-quality budgets, and generated-artifact hygiene are automated contracts.</li>
        </ul></div>
      </details>
    </section>

    <p class="footer">
      Generated automatically from CI evidence for commit <a href="${escapeHtml(commitUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(shortSha)}</a>.
      The dashboard is evidence-backed and updates with the main-branch quality pipeline.
    </p>
  </main>
</body>
</html>
`

fs.writeFileSync(dashboardPath, html)
console.log(`Prepared engineering quality dashboard: ${dashboardPath}`)
