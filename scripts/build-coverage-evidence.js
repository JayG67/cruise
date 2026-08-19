const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()
const coverageDir = path.join(projectRoot, 'coverage')
const summaryPath = path.join(coverageDir, 'coverage-summary.json')
const finalPath = path.join(coverageDir, 'coverage-final.json')
const outputJson = path.join(coverageDir, 'coverage-evidence.json')
const outputMarkdown = path.join(coverageDir, 'coverage-evidence.md')
const outputCsv = path.join(coverageDir, 'coverage-evidence.csv')

function percentage(covered, total) {
  return total === 0 ? 100 : Math.floor((covered / total) * 10000) / 100
}

function metric(covered, total) {
  return { total, covered, skipped: 0, pct: percentage(covered, total) }
}

function summarizeEntry(entry = {}) {
  const statementHits = Object.values(entry.s || {})
  const functionHits = Object.values(entry.f || {})
  const branchHits = Object.values(entry.b || {}).flat()
  const lineHits = new Map()
  for (const [id, statement] of Object.entries(entry.statementMap || {})) {
    const line = Number(statement?.start?.line)
    if (!line) continue
    lineHits.set(line, Math.max(lineHits.get(line) || 0, Number(entry.s?.[id] || 0)))
  }
  return {
    statements: metric(statementHits.filter(hit => hit > 0).length, statementHits.length),
    branches: metric(branchHits.filter(hit => hit > 0).length, branchHits.length),
    functions: metric(functionHits.filter(hit => hit > 0).length, functionHits.length),
    lines: metric([...lineHits.values()].filter(hit => hit > 0).length, lineHits.size)
  }
}

function addMetrics(left, right) {
  const result = {}
  for (const name of ['statements', 'branches', 'functions', 'lines']) {
    const covered = Number(left?.[name]?.covered || 0) + Number(right?.[name]?.covered || 0)
    const total = Number(left?.[name]?.total || 0) + Number(right?.[name]?.total || 0)
    result[name] = metric(covered, total)
  }
  return result
}

function loadSummary() {
  if (fs.existsSync(summaryPath)) return JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  if (!fs.existsSync(finalPath)) throw new Error('A Jest coverage summary or coverage-final.json is required before building coverage evidence.')
  const raw = JSON.parse(fs.readFileSync(finalPath, 'utf8'))
  const summary = Object.fromEntries(Object.entries(raw).map(([filePath, entry]) => [filePath, summarizeEntry(entry)]))
  summary.total = Object.values(summary).reduce((result, metrics) => addMetrics(result, metrics), {})
  return summary
}

const summary = loadSummary()
const normalizePath = filePath => {
  const absolutePath = path.resolve(filePath)
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

const files = Object.entries(summary)
  .filter(([filePath]) => filePath !== 'total')
  .map(([filePath, metrics]) => ({ file: normalizePath(filePath), ...metrics }))
  .sort((left, right) => left.file.localeCompare(right.file))

const thresholds = { statements: 90.5, branches: 65.5, functions: 94.5, lines: 92.25 }
const belowGlobalThresholdFiles = files.filter(file => Object.entries(thresholds).some(([metric, threshold]) => Number(file[metric]?.pct) < threshold))
const lowestLineCoverage = [...files]
  .sort((left, right) => Number(left.lines?.pct) - Number(right.lines?.pct))
  .slice(0, 25)

const evidence = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  thresholds,
  total: summary.total,
  fileCount: files.length,
  belowGlobalThresholdFileCount: belowGlobalThresholdFiles.length,
  lowestLineCoverage,
  files
}

fs.writeFileSync(outputJson, `${JSON.stringify(evidence, null, 2)}\n`)

const formatMetric = (entry, name) => `${entry[name].pct}% (${entry[name].covered}/${entry[name].total})`
const lines = [
  '# Jest Coverage Evidence',
  '',
  `Generated: ${evidence.generatedAt}`,
  '',
  `Source files represented: **${files.length}**`,
  '',
  '| Metric | Coverage | Gate |',
  '| --- | ---: | ---: |',
  `| Statements | ${formatMetric(summary.total, 'statements')} | ${thresholds.statements}% |`,
  `| Branches | ${formatMetric(summary.total, 'branches')} | ${thresholds.branches}% |`,
  `| Functions | ${formatMetric(summary.total, 'functions')} | ${thresholds.functions}% |`,
  `| Lines | ${formatMetric(summary.total, 'lines')} | ${thresholds.lines}% |`,
  '',
  '## Per-file coverage',
  '',
  '| File | Statements | Branches | Functions | Lines |',
  '| --- | ---: | ---: | ---: | ---: |',
  ...files.map(file => `| ${file.file.replaceAll('|', '\\|')} | ${file.statements.pct}% | ${file.branches.pct}% | ${file.functions.pct}% | ${file.lines.pct}% |`),
  ''
]
fs.writeFileSync(outputMarkdown, `${lines.join('\n')}\n`)

const csvEscape = value => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
const csvLines = [
  ['file', 'statements_pct', 'statements_covered', 'statements_total', 'branches_pct', 'branches_covered', 'branches_total', 'functions_pct', 'functions_covered', 'functions_total', 'lines_pct', 'lines_covered', 'lines_total'].join(','),
  ...files.map(file => [
    file.file,
    file.statements.pct, file.statements.covered, file.statements.total,
    file.branches.pct, file.branches.covered, file.branches.total,
    file.functions.pct, file.functions.covered, file.functions.total,
    file.lines.pct, file.lines.covered, file.lines.total
  ].map(csvEscape).join(','))
]
fs.writeFileSync(outputCsv, `${csvLines.join('\n')}\n`)

console.log(`Coverage evidence generated for ${files.length} source files.`)
console.log(`Files below at least one global threshold: ${belowGlobalThresholdFiles.length}`)
