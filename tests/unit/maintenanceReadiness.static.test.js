const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('maintenance-mode readiness contracts', () => {
  it('provides one deterministic maintenance readiness command', () => {
    const packageJson = JSON.parse(read('package.json'))
    const command = packageJson.scripts['maintenance:check']

    for (const scriptName of [
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
    ]) {
      expect(command).toContain(`npm run ${scriptName}`)
    }

    expect(packageJson.scripts['maintenance:readiness']).toBe(
      'npm run maintenance:check && node scripts/verify-maintenance-readiness.js'
    )
  })

})
