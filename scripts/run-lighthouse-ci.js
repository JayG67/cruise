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
  const scoreLines = [
    '',
    'Lighthouse mobile scores',
    `  report: ${scores.file}`,
    `  performance: ${formatScore(scores.performance)}`,
    `  accessibility: ${formatScore(scores.accessibility)}`,
    `  best-practices: ${formatScore(scores.bestPractices)}`,
    `  seo: ${formatScore(scores.seo)}`
  ]

  console.log(scoreLines.join('\n'))

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        '## Lighthouse Mobile Scores',
        '',
        `- Report: \`${scores.file}\``,
        `- Performance: **${formatScore(scores.performance)}**`,
        `- Accessibility: **${formatScore(scores.accessibility)}**`,
        `- Best Practices: **${formatScore(scores.bestPractices)}**`,
        `- SEO: **${formatScore(scores.seo)}**`,
        ''
      ].join('\n')
    )
  }
} else {
  console.log('')
  console.log('Lighthouse mobile scores: no Lighthouse JSON report was found to summarize.')
}

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status || 0)
