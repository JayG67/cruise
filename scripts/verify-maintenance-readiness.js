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

if (problems.length > 0) fail(problems)

console.log('Maintenance readiness audit passed.')
console.log(`Required quality gates verified: ${requiredScripts.length}`)
console.log('Maintenance command and quality-gate contracts are consistent.')
