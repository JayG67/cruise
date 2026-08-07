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

  it('documents the maintenance policy and release review checklist', () => {
    const guide = read('docs/maintenance-mode.md')
    const readme = read('README.md')

    for (const heading of [
      '# Maintenance Mode',
      '## Release Gate',
      '## Change Policy',
      '## Defect Triage',
      '## Release Review'
    ]) {
      expect(guide).toContain(heading)
    }

    expect(readme).toContain('npm run maintenance:readiness')
    expect(readme).toContain('docs/maintenance-mode.md')
    expect(readme).not.toContain('app.css remains as a compatibility layer')
  })
})
