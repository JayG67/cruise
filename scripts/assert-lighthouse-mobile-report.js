const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()
const reportRoots = [
  path.join(projectRoot, 'lhci-report'),
  path.join(projectRoot, '.lighthouseci')
]

function collectJsonReports(directory) {
  if (!fs.existsSync(directory)) return []

  return fs
    .readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(directory, file))
}

function readLighthouseReport(reportPath) {
  try {
    const payload = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
    const categories = payload.categories || payload.lhr?.categories
    const configSettings = payload.configSettings || payload.lhr?.configSettings || {}

    if (!categories?.performance) return null

    return {
      reportPath,
      categories,
      formFactor: configSettings.formFactor,
      screenEmulation: configSettings.screenEmulation || {}
    }
  } catch (error) {
    return null
  }
}

const lighthouseReports = reportRoots
  .flatMap(collectJsonReports)
  .map(readLighthouseReport)
  .filter(Boolean)

if (lighthouseReports.length === 0) {
  throw new Error('No Lighthouse mobile JSON report was generated. The GitHub mobile quality gate must run Lighthouse and produce a report artifact.')
}

const mobileReport = lighthouseReports.find(report => (
  report.formFactor === 'mobile' || report.screenEmulation.mobile === true
))

if (!mobileReport) {
  throw new Error('A Lighthouse report was generated, but it was not configured as a mobile audit.')
}

function score(categoryName) {
  const value = mobileReport.categories[categoryName]?.score
  return typeof value === 'number' ? value.toFixed(2) : 'n/a'
}

const relativePath = path.relative(projectRoot, mobileReport.reportPath)
console.log('Verified Lighthouse mobile report artifact.')
console.log(`Report: ${relativePath}`)
console.log(`Performance: ${score('performance')}`)
console.log(`Accessibility: ${score('accessibility')}`)
console.log(`Best Practices: ${score('best-practices')}`)
console.log(`SEO: ${score('seo')}`)
