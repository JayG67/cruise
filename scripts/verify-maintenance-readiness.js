const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function fail(problems) {
  console.error('Maintenance readiness audit failed:')
  problems.forEach(problem => console.error(`- ${problem}`))
  process.exit(1)
}

const problems = []
const packageJson = JSON.parse(read('package.json'))
const scripts = packageJson.scripts || {}
const maintenanceGuidePath = 'docs/maintenance-mode.md'

const requiredScripts = [
  'repo:hygiene',
  'test:inventory:audit',
  'release:source:audit',
  'production:deployment:audit',
  'production:dependencies:audit',
  'react:production:complete',
  'ai:foundation:complete',
  'ai:phase2:complete',
  'ai:phase3:complete',
  'ai:phase4:complete',
  'ai:phase5:complete',
  'ai:phase6:complete'
]

if (!fs.existsSync(path.join(projectRoot, maintenanceGuidePath))) {
  problems.push(`Missing maintenance guide: ${maintenanceGuidePath}`)
}

const maintenanceCommand = scripts['maintenance:check'] || ''
for (const scriptName of requiredScripts) {
  if (!scripts[scriptName]) {
    problems.push(`Required quality script is missing: ${scriptName}`)
  }
  if (!maintenanceCommand.includes(`npm run ${scriptName}`)) {
    problems.push(`maintenance:check must run ${scriptName}`)
  }
}

if (scripts['maintenance:readiness'] !== 'npm run maintenance:check && node scripts/verify-maintenance-readiness.js') {
  problems.push('maintenance:readiness must run the maintenance checks before this audit.')
}

const readme = read('README.md')
for (const requiredText of [
  'Maintenance Mode',
  'npm run maintenance:readiness',
  maintenanceGuidePath
]) {
  if (!readme.includes(requiredText)) {
    problems.push(`README is missing maintenance-mode guidance: ${requiredText}`)
  }
}

if (readme.includes('app.css remains as a compatibility layer')) {
  problems.push('README still claims the retired app.css file remains in use.')
}

if (fs.existsSync(path.join(projectRoot, maintenanceGuidePath))) {
  const guide = read(maintenanceGuidePath)
  for (const requiredHeading of [
    '# Maintenance Mode',
    '## Release Gate',
    '## Change Policy',
    '## Defect Triage',
    '## Release Review'
  ]) {
    if (!guide.includes(requiredHeading)) {
      problems.push(`Maintenance guide is missing: ${requiredHeading}`)
    }
  }
}

if (problems.length > 0) fail(problems)

console.log('Maintenance readiness audit passed.')
console.log(`Required quality gates verified: ${requiredScripts.length}`)
console.log('Maintenance documentation and retired-CSS status are consistent.')
