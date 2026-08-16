const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()
const coverageDir = path.resolve(projectRoot, 'coverage')
const coverageLcovDir = path.join(coverageDir, 'lcov-report')
const coverageSummary = path.join(coverageDir, 'coverage-summary.json')
const coverageFinal = path.join(coverageDir, 'coverage-final.json')
const coverageLcov = path.join(coverageDir, 'lcov.info')
const coverageCobertura = path.join(coverageDir, 'cobertura-coverage.xml')
const coverageClover = path.join(coverageDir, 'clover.xml')
const coverageEvidenceJson = path.join(coverageDir, 'coverage-evidence.json')
const coverageEvidenceMarkdown = path.join(coverageDir, 'coverage-evidence.md')
const coverageEvidenceCsv = path.join(coverageDir, 'coverage-evidence.csv')
const outputDir = path.resolve(projectRoot, 'github-pages', 'coverage')

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function copyDirectory(source, destination) {
  ensureDirectory(destination)

  if (!fs.existsSync(source)) {
    return false
  }

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name)
    const destinationPath = path.join(destination, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath)
    } else {
      fs.copyFileSync(sourcePath, destinationPath)
    }
  }

  return true
}

function percentage(covered, total) {
  return total === 0 ? 100 : Math.floor((covered / total) * 10000) / 100
}

function metricFromCounts(covered, total) {
  return {
    total,
    covered,
    skipped: 0,
    pct: percentage(covered, total),
  }
}

function summarizeCoverageEntry(entry = {}) {
  const statementHits = Object.values(entry.s || {})
  const functionHits = Object.values(entry.f || {})
  const branchHits = Object.values(entry.b || {}).flat()
  const lineHits = new Map()

  for (const [statementId, statement] of Object.entries(entry.statementMap || {})) {
    const line = Number(statement?.start?.line)
    if (!line) continue
    const hitCount = Number(entry.s?.[statementId] || 0)
    lineHits.set(line, Math.max(lineHits.get(line) || 0, hitCount))
  }

  return {
    statements: metricFromCounts(statementHits.filter(hit => hit > 0).length, statementHits.length),
    branches: metricFromCounts(branchHits.filter(hit => hit > 0).length, branchHits.length),
    functions: metricFromCounts(functionHits.filter(hit => hit > 0).length, functionHits.length),
    lines: metricFromCounts([...lineHits.values()].filter(hit => hit > 0).length, lineHits.size),
  }
}

function addMetrics(left, right) {
  return ['statements', 'branches', 'functions', 'lines'].reduce((result, metricName) => {
    const total = Number(left?.[metricName]?.total || 0) + Number(right?.[metricName]?.total || 0)
    const covered = Number(left?.[metricName]?.covered || 0) + Number(right?.[metricName]?.covered || 0)
    result[metricName] = metricFromCounts(covered, total)
    return result
  }, {})
}

function normalizeSourcePath(sourcePath) {
  const absolutePath = path.resolve(sourcePath)
  const relativePath = path.relative(projectRoot, absolutePath)

  if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return relativePath.replaceAll(path.sep, '/')
  }

  const normalized = absolutePath.replaceAll('\\', '/')
  const projectMarker = `/${path.basename(projectRoot)}/`
  const markerIndex = normalized.lastIndexOf(projectMarker)
  return markerIndex >= 0
    ? normalized.slice(markerIndex + projectMarker.length)
    : path.basename(normalized)
}

function readCoverageDetails() {
  if (fs.existsSync(coverageSummary)) {
    const summary = JSON.parse(fs.readFileSync(coverageSummary, 'utf8'))
    const files = Object.entries(summary)
      .filter(([fileName]) => fileName !== 'total')
      .map(([fileName, metrics]) => ({ fileName: normalizeSourcePath(fileName), metrics }))
      .sort((left, right) => left.fileName.localeCompare(right.fileName))

    return {
      total: summary.total || files.reduce((result, file) => addMetrics(result, file.metrics), {}),
      files,
      source: 'coverage-summary.json',
    }
  }

  if (fs.existsSync(coverageFinal)) {
    const rawCoverage = JSON.parse(fs.readFileSync(coverageFinal, 'utf8'))
    const files = Object.entries(rawCoverage)
      .map(([fileName, entry]) => ({ fileName: normalizeSourcePath(fileName), metrics: summarizeCoverageEntry(entry) }))
      .sort((left, right) => left.fileName.localeCompare(right.fileName))

    return {
      total: files.reduce((result, file) => addMetrics(result, file.metrics), {}),
      files,
      source: 'coverage-final.json',
    }
  }

  return null
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function coverageClass(value) {
  if (value >= 80) return 'high'
  if (value >= 50) return 'medium'
  return 'low'
}

function reportHref(fileName) {
  const normalizedFileName = fileName.replaceAll('\\', '/')
  const directHref = `${normalizedFileName}.html`
  const projectHref = `${path.basename(projectRoot)}/${directHref}`

  if (fs.existsSync(path.join(coverageLcovDir, directHref))) return directHref
  if (fs.existsSync(path.join(coverageLcovDir, projectHref))) return projectHref

  return directHref
}

function metricSummary(metric) {
  return `${metric.covered}/${metric.total}`
}

function renderMetricOverview(label, metric) {
  return `<div class="fl pad1y space-right2">
    <span class="strong">${metric.pct}% </span>
    <span class="quiet">${label}</span>
    <span class="fraction">${metricSummary(metric)}</span>
  </div>`
}

function renderMetricCells(metric) {
  const klass = coverageClass(Number(metric.pct))
  return `<td data-value="${metric.pct}" class="pct ${klass}">${metric.pct}%</td>
    <td data-value="${metric.total}" class="abs ${klass}">${metricSummary(metric)}</td>`
}

function renderFileRow({ fileName, metrics }) {
  const statementClass = coverageClass(Number(metrics.statements.pct))
  const statementWidth = Math.max(0, Math.min(100, Math.round(Number(metrics.statements.pct))))
  return `<tr>
    <td class="file ${statementClass}" data-value="${escapeHtml(fileName)}"><a href="${escapeHtml(reportHref(fileName))}">${escapeHtml(fileName)}</a></td>
    <td data-value="${metrics.statements.pct}" class="pic ${statementClass}">
      <div class="chart"><div class="cover-fill${statementWidth === 100 ? ' cover-full' : ''}" style="width: ${statementWidth}%"></div><div class="cover-empty" style="width: ${100 - statementWidth}%"></div></div>
    </td>
    ${renderMetricCells(metrics.statements)}
    ${renderMetricCells(metrics.branches)}
    ${renderMetricCells(metrics.functions)}
    ${renderMetricCells(metrics.lines)}
  </tr>`
}

function buildFlatCoverageIndex(coverageDetails) {
  const { total, files } = coverageDetails
  return `<!doctype html>
<html lang="en">
<head>
  <title>Code coverage report for all source files</title>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="prettify.css" />
  <link rel="stylesheet" href="base.css" />
  <link rel="shortcut icon" type="image/x-icon" href="favicon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    .coverage-summary .sorter { background-image: url(sort-arrow-sprite.png); }
    .report-navigation { margin-top: 0.75rem; }
    .report-navigation a { margin-right: 1rem; }
    .coverage-summary .file { min-width: 24rem; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="pad1">
    <h1>All source files</h1>
    <div class="clearfix">
      ${renderMetricOverview('Statements', total.statements)}
      ${renderMetricOverview('Branches', total.branches)}
      ${renderMetricOverview('Functions', total.functions)}
      ${renderMetricOverview('Lines', total.lines)}
    </div>
    <p class="quiet">This flat report lists every covered source file, matching the per-file detail shown by the command-line coverage report.</p>
    <p class="report-navigation"><a href="grouped-index.html">Open grouped directory view</a></p>
    <template id="filterTemplate"><div class="quiet">Filter: <input type="search" id="fileSearch"></div></template>
  </div>
  <div class="status-line ${coverageClass(Number(total.lines.pct))}"></div>
  <div class="pad1">
    <table class="coverage-summary">
      <thead><tr>
        <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
        <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
        <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
        <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
        <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
        <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
        <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
        <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
        <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
        <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
      </tr></thead>
      <tbody>${files.map(renderFileRow).join('\n')}</tbody>
    </table>
  </div>
  <div class="push"></div>
</div>
<div class="footer quiet pad2 space-top1 center small">Generated by Jest/Istanbul. Flat index prepared for the Cruise Fleet Operations Platform.</div>
<script src="prettify.js"></script>
<script>window.onload = function () { prettyPrint(); }</script>
<script src="sorter.js"></script>
</body>
</html>`
}

ensureDirectory(outputDir)

const copiedHtml = copyDirectory(coverageLcovDir, outputDir)
const coverageDetails = readCoverageDetails()

const productionCoverageArtifacts = [
  [coverageSummary, 'coverage-summary.json'],
  [coverageFinal, 'coverage-final.json'],
  [coverageLcov, 'lcov.info'],
  [coverageCobertura, 'cobertura-coverage.xml'],
  [coverageClover, 'clover.xml'],
  [coverageEvidenceJson, 'coverage-evidence.json'],
  [coverageEvidenceMarkdown, 'coverage-evidence.md'],
  [coverageEvidenceCsv, 'coverage-evidence.csv']
]

const publishedArtifacts = []
for (const [source, fileName] of productionCoverageArtifacts) {
  if (!fs.existsSync(source)) continue
  fs.copyFileSync(source, path.join(outputDir, fileName))
  publishedArtifacts.push(fileName)
}

if (copiedHtml && coverageDetails) {
  const generatedIndex = path.join(outputDir, 'index.html')
  const groupedIndex = path.join(outputDir, 'grouped-index.html')
  if (fs.existsSync(generatedIndex)) {
    fs.copyFileSync(generatedIndex, groupedIndex)
  }
  fs.writeFileSync(generatedIndex, buildFlatCoverageIndex(coverageDetails))
} else if (!copiedHtml) {
  const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Cruise Fleet Operations Platform Coverage</title></head>
<body><h1>Coverage report unavailable</h1><p>The coverage summary was generated, but the HTML report directory was not found.</p></body>
</html>`

  fs.writeFileSync(path.join(outputDir, 'index.html'), fallbackHtml)
}

const metadata = {
  generatedAt: new Date().toISOString(),
  htmlReportCopied: copiedHtml,
  summaryCopied: fs.existsSync(coverageSummary),
  completeCoverageDataPublished: [coverageSummary, coverageFinal, coverageLcov, coverageCobertura, coverageClover, coverageEvidenceJson, coverageEvidenceMarkdown].every(filePath => fs.existsSync(filePath)),
  publishedArtifacts,
  flatIndexGenerated: Boolean(copiedHtml && coverageDetails),
  fileCount: coverageDetails?.files.length || 0,
  coverageSource: coverageDetails?.source || null,
}

fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

console.log(`Prepared coverage report for GitHub Pages: ${outputDir}`)
console.log(`Published flat coverage index with ${metadata.fileCount} source files.`)
