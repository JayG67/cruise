const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const projectRoot = process.cwd()
const reportDirectories = [
  path.join(projectRoot, 'lhci-report'),
  path.join(projectRoot, '.lighthouseci')
]

function findJsonReports(dir) {
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const fullPath = path.join(dir, file)
      return {
        fullPath,
        modifiedTime: fs.statSync(fullPath).mtimeMs
      }
    })
}

function getScore(category = {}) {
  return typeof category.score === 'number' ? category.score : null
}

function formatScore(score) {
  return typeof score === 'number' ? score.toFixed(2) : 'n/a'
}

function readLatestScores() {
  const reports = reportDirectories
    .flatMap(findJsonReports)
    .sort((left, right) => right.modifiedTime - left.modifiedTime)

  for (const report of reports) {
    try {
      const payload = JSON.parse(fs.readFileSync(report.fullPath, 'utf8'))
      const categories = payload.categories || payload.lhr?.categories

      if (!categories) continue

      return {
        file: path.relative(projectRoot, report.fullPath),
        performance: getScore(categories.performance),
        accessibility: getScore(categories.accessibility),
        bestPractices: getScore(categories['best-practices']),
        seo: getScore(categories.seo)
      }
    } catch (error) {
      // Keep scanning; LHCI may leave metadata JSON next to the LHR file.
    }
  }

  return null
}

const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const result = spawnSync(executable, ['lhci', 'autorun', '--config=.github/lighthouserc.json'], {
  cwd: projectRoot,
  stdio: 'inherit'
})

const scores = readLatestScores()

if (scores) {
  console.log('')
  console.log('Lighthouse mobile scores')
  console.log(`  report: ${scores.file}`)
  console.log(`  performance: ${formatScore(scores.performance)}`)
  console.log(`  accessibility: ${formatScore(scores.accessibility)}`)
  console.log(`  best-practices: ${formatScore(scores.bestPractices)}`)
  console.log(`  seo: ${formatScore(scores.seo)}`)
} else {
  console.log('')
  console.log('Lighthouse mobile scores: no Lighthouse JSON report was found to summarize.')
}

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status || 0)
