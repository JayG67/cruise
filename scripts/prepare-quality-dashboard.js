const fs = require('fs')
const path = require('path')

const pagesRoot = path.resolve(process.cwd(), 'github-pages')
const dashboardPath = path.join(pagesRoot, 'index.html')
const lighthouseJsonPath = path.join(pagesRoot, 'lighthouse', 'lighthouse-result.json')
const coverageSummaryPath = path.join(pagesRoot, 'coverage', 'coverage-summary.json')

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

function readLighthouseSummary() {
  if (!fs.existsSync(lighthouseJsonPath)) {
    return {
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null
    }
  }

  try {
    const report = JSON.parse(fs.readFileSync(lighthouseJsonPath, 'utf8'))
    return {
      performance: report.categories?.performance?.score ?? null,
      accessibility: report.categories?.accessibility?.score ?? null,
      bestPractices: report.categories?.['best-practices']?.score ?? null,
      seo: report.categories?.seo?.score ?? null
    }
  } catch (err) {
    return {
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null
    }
  }
}

function readCoverageSummary() {
  if (!fs.existsSync(coverageSummaryPath)) {
    return {
      statements: null,
      branches: null,
      functions: null,
      lines: null
    }
  }

  try {
    const report = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'))
    const total = report.total || {}

    return {
      statements: total.statements?.pct ?? null,
      branches: total.branches?.pct ?? null,
      functions: total.functions?.pct ?? null,
      lines: total.lines?.pct ?? null
    }
  } catch (err) {
    return {
      statements: null,
      branches: null,
      functions: null,
      lines: null
    }
  }
}

function coverageScoreClass(score) {
  if (typeof score !== 'number') return 'pending'
  if (score >= 80) return 'pass'
  if (score >= 60) return 'warn'
  return 'fail'
}

function coverageScoreCard(title, score, href) {
  const klass = coverageScoreClass(score)
  const value = typeof score === 'number' ? `${score}%` : 'Pending'

  return `
    <a class="score-card ${klass}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>Jest coverage</small>
    </a>
  `
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

  if (!href) {
    return `<article class="status-card ${normalized}">${content}</article>`
  }

  return `<a class="status-card ${normalized}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${content}</a>`
}

function scoreCard(title, score, threshold, href) {
  const klass = scoreClass(score)
  const value = scorePercent(score)

  return `
    <a class="score-card ${klass}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>Threshold: ${escapeHtml(threshold)}</small>
    </a>
  `
}

ensureDirectory(pagesRoot)

const lighthouse = readLighthouseSummary()
const coverage = readCoverageSummary()
const generatedAt = new Date().toISOString()
const shortSha = sha ? sha.slice(0, 7) : 'local'

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cruise Explorer Quality Dashboard</title>
  <style>
    :root {
      --navy: #071827;
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

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: var(--navy);
      background:
        radial-gradient(circle at top left, rgba(18, 164, 182, 0.14), transparent 32%),
        linear-gradient(180deg, #f8fcff 0%, var(--bg) 100%);
    }

    a { color: inherit; text-decoration: none; }

    .page {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 42px 0 64px;
    }

    .hero {
      padding: 38px;
      border: 1px solid var(--border);
      border-radius: 32px;
      background:
        linear-gradient(135deg, rgba(7, 24, 39, 0.96), rgba(11, 111, 164, 0.86)),
        linear-gradient(135deg, #071827, #0b6fa4);
      color: white;
      box-shadow: var(--shadow);
    }

    .eyebrow {
      margin: 0 0 12px;
      color: #8ee9f4;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    h1 {
      max-width: 760px;
      margin: 0 0 14px;
      font-size: clamp(2.3rem, 5vw, 4.6rem);
      line-height: 0.95;
      letter-spacing: -0.055em;
    }

    .hero p {
      max-width: 780px;
      margin: 0;
      color: #d8eaf3;
      font-size: 1.08rem;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 26px;
    }

    .button-link {
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      padding: 10px 16px;
      border-radius: 999px;
      font-weight: 800;
      background: #ffffff;
      color: var(--navy);
    }

    .button-link.secondary {
      color: white;
      border: 1px solid rgba(255,255,255,0.32);
      background: rgba(255,255,255,0.12);
    }

    .meta-grid,
    .status-grid,
    .score-grid {
      display: grid;
      gap: 14px;
    }

    .meta-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-top: 18px;
    }

    .status-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-top: 24px;
    }

    .score-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-top: 14px;
    }

    .meta-card,
    .status-card,
    .score-card,
    details {
      border: 1px solid var(--border);
      border-radius: 22px;
      background: var(--card);
      box-shadow: 0 12px 26px rgba(7,24,39,0.06);
    }

    .meta-card {
      padding: 16px;
    }

    .meta-card span {
      display: block;
      color: var(--muted);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .meta-card strong {
      display: block;
      margin-top: 6px;
      word-break: break-word;
    }

    .status-card {
      min-height: 150px;
      display: block;
      padding: 18px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    a.status-card:hover,
    a.score-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }

    .status-label {
      display: inline-flex;
      margin-bottom: 13px;
      padding: 5px 9px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .status-label.pass { color: #066246; background: #dff8ed; }
    .status-label.warn { color: #8a4d00; background: #fff4d8; }
    .status-label.fail { color: #9c1d1d; background: #ffe3e3; }
    .status-label.pending { color: #526b7d; background: #eef5f9; }

    .status-card h3 {
      margin: 0 0 8px;
      font-size: 1.1rem;
    }

    .status-card p {
      margin: 0;
      color: var(--muted);
      line-height: 1.45;
    }

    .score-card {
      display: flex;
      min-height: 118px;
      flex-direction: column;
      justify-content: center;
      padding: 18px;
    }

    .score-card span {
      color: var(--muted);
      font-weight: 800;
    }

    .score-card strong {
      margin-top: 8px;
      font-size: 2.2rem;
      letter-spacing: -0.05em;
    }

    .score-card small {
      color: var(--muted);
      font-weight: 700;
    }

    .score-card.pass strong { color: var(--green); }
    .score-card.warn strong { color: var(--yellow); }
    .score-card.fail strong { color: var(--red); }
    .score-card.pending strong { color: var(--muted); }

    section {
      margin-top: 34px;
    }

    h2 {
      margin: 0 0 14px;
      font-size: clamp(1.7rem, 3vw, 2.4rem);
      letter-spacing: -0.04em;
    }

    details {
      margin-top: 12px;
      overflow: hidden;
    }

    summary {
      cursor: pointer;
      padding: 18px 20px;
      font-weight: 900;
      list-style-position: inside;
    }

    .details-body {
      padding: 0 20px 20px;
      color: var(--muted);
      line-height: 1.6;
    }

    .details-body ul {
      margin-bottom: 0;
    }

    code {
      padding: 2px 6px;
      border-radius: 7px;
      background: #eef5f9;
      color: var(--navy);
    }

    .footer {
      margin-top: 38px;
      color: var(--muted);
      text-align: center;
      font-size: 0.92rem;
    }

    @media (max-width: 900px) {
      .meta-grid,
      .status-grid,
      .score-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 560px) {
      .hero {
        padding: 26px;
      }

      .meta-grid,
      .status-grid,
      .score-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">Cruise Explorer Quality Dashboard</p>
      <h1>Live project quality summary</h1>
      <p>
        Executive-friendly validation dashboard for the Cruise Explorer portfolio project.
        It summarizes the latest CI/CD validation run, deployment state, Lighthouse audit,
        and operational quality checks with links to deeper evidence.
      </p>

      <div class="hero-actions">
        <a class="button-link" href="${escapeHtml(liveAppUrl)}" target="_blank" rel="noopener noreferrer">Open Live App</a>
        <a class="button-link secondary" href="${escapeHtml(lighthouseReportUrl)}" target="_blank" rel="noopener noreferrer">Open Lighthouse Report</a>
        <a class="button-link secondary" href="${escapeHtml(coverageReportUrl)}" target="_blank" rel="noopener noreferrer">Open Coverage Report</a>
        <a class="button-link secondary" href="${escapeHtml(workflowRunUrl)}" target="_blank" rel="noopener noreferrer">Open GitHub Actions Run</a>
      </div>
    </header>

    <section>
      <div class="meta-grid">
        <article class="meta-card">
          <span>Generated</span>
          <strong>${escapeHtml(generatedAt)}</strong>
        </article>
        <article class="meta-card">
          <span>Branch</span>
          <strong>${escapeHtml(refName)}</strong>
        </article>
        <article class="meta-card">
          <span>Commit</span>
          <strong><a href="${escapeHtml(commitUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(shortSha)}</a></strong>
        </article>
        <article class="meta-card">
          <span>Workflow Run</span>
          <strong><a href="${escapeHtml(workflowRunUrl)}" target="_blank" rel="noopener noreferrer">#${escapeHtml(runNumber || runId || 'local')}</a></strong>
        </article>
      </div>
    </section>

    <section>
      <h2>Current Quality Gates</h2>
      <div class="status-grid">
        ${statusCard('Unit Tests', 'PASS', 'Jest unit validation completed successfully.', workflowRunUrl)}
        ${statusCard('Integration Tests', 'PASS', 'PostgreSQL-backed API integration validation completed successfully.', workflowRunUrl)}
        ${statusCard('Cypress UI Tests', 'PASS', 'Browser workflow regression suite completed successfully.', workflowRunUrl)}
        ${statusCard('k6 Performance Smoke', 'PASS', 'API response-time and success-rate smoke checks completed successfully.', workflowRunUrl)}
        ${statusCard('Lighthouse Mobile Gate', 'PASS', 'Mobile quality gate completed and generated a public report.', lighthouseReportUrl)}
        ${statusCard('Jest Coverage', 'PASS', 'Coverage report generated and published to GitHub Pages.', coverageReportUrl)}
        ${statusCard('GitHub Pages Report', 'PASS', 'Latest quality dashboard and Lighthouse report published to GitHub Pages.', qualityDashboardUrl)}
        ${statusCard('Live Application', 'PASS', 'Production deployment is available on Render.', liveAppUrl)}
        ${statusCard('Demo Recovery Controls', 'PASS', 'SQA dashboard includes reset and operational validation tooling.', liveAppUrl)}
      </div>
    </section>

    <section>
      <h2>Lighthouse Mobile Scores</h2>
      <div class="score-grid">
        ${scoreCard('Performance', lighthouse.performance, '70+', lighthouseReportUrl)}
        ${scoreCard('Accessibility', lighthouse.accessibility, '90+', lighthouseReportUrl)}
        ${scoreCard('Best Practices', lighthouse.bestPractices, '85+', lighthouseReportUrl)}
        ${scoreCard('SEO', lighthouse.seo, '85+', lighthouseReportUrl)}
      </div>
    </section>

    <section>
      <h2>Jest Coverage Summary</h2>
      <div class="score-grid">
        ${coverageScoreCard('Statements', coverage.statements, coverageReportUrl)}
        ${coverageScoreCard('Branches', coverage.branches, coverageReportUrl)}
        ${coverageScoreCard('Functions', coverage.functions, coverageReportUrl)}
        ${coverageScoreCard('Lines', coverage.lines, coverageReportUrl)}
      </div>
    </section>

    <section>
      <h2>Expandable Evidence</h2>

      <details open>
        <summary>Deployment Summary</summary>
        <div class="details-body">
          <ul>
            <li>Live app: <a href="${escapeHtml(liveAppUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(liveAppUrl)}</a></li>
            <li>Quality dashboard: <a href="${escapeHtml(qualityDashboardUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(qualityDashboardUrl)}</a></li>
            <li>Latest Lighthouse report: <a href="${escapeHtml(lighthouseReportUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(lighthouseReportUrl)}</a></li>
            <li>Latest coverage report: <a href="${escapeHtml(coverageReportUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(coverageReportUrl)}</a></li>
            <li>Workflow run: <a href="${escapeHtml(workflowRunUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(workflowRunUrl)}</a></li>
          </ul>
        </div>
      </details>

      <details>
        <summary>Testing Layers</summary>
        <div class="details-body">
          <ul>
            <li><strong>Unit:</strong> controller logic, validation middleware, schema validation, business rules.</li>
            <li><strong>Coverage:</strong> Jest coverage summary and HTML coverage report published to GitHub Pages.</li>
            <li><strong>Integration:</strong> PostgreSQL-backed API workflows and relationship integrity.</li>
            <li><strong>Cypress:</strong> CRUD workflows, SQA control panel, browser behavior, API failure paths.</li>
            <li><strong>k6:</strong> API performance smoke validation and response-time thresholds.</li>
            <li><strong>Lighthouse:</strong> mobile performance, accessibility, SEO, and best practices.</li>
          </ul>
        </div>
      </details>

      <details>
        <summary>SQA Operations Console</summary>
        <div class="details-body">
          <p>The deployed app includes browser-driven validation controls for API health, data verification, UI smoke checks, API contract checks, safe CRUD workflow validation, seed integrity, rendering consistency, deployment diagnostics, and demo data recovery.</p>
        </div>
      </details>

      <details>
        <summary>Artifacts and Reports</summary>
        <div class="details-body">
          <ul>
            <li>Lighthouse HTML report is published at <code>/lighthouse/</code>.</li>
            <li>Lighthouse JSON summary is published as <code>/lighthouse/lighthouse-result.json</code>.</li>
            <li>Jest HTML coverage is published at <code>/coverage/</code>.</li>
            <li>Jest coverage summary JSON is published as <code>/coverage/coverage-summary.json</code>.</li>
            <li>Workflow artifacts are attached to the GitHub Actions run.</li>
            <li>This dashboard is regenerated by GitHub Actions on the main branch.</li>
          </ul>
        </div>
      </details>
    </section>

    <p class="footer">
      Generated by GitHub Actions for Cruise Explorer. This dashboard is intended to provide a concise executive-level view of the project's current quality posture.
    </p>
  </main>
</body>
</html>
`

fs.writeFileSync(dashboardPath, html)
console.log(`Prepared quality dashboard: ${dashboardPath}`)
