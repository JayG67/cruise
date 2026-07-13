const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

describe('release source package contracts', () => {
  it('provides a controlled generated-artifact cleanup command', () => {
    const packageJson = readJson('package.json')
    const cleanupScript = read('scripts/clean-generated-artifacts.js')

    expect(packageJson.scripts['clean:generated']).toBe('node scripts/clean-generated-artifacts.js')
    for (const generatedPath of [
      'dist',
      'coverage',
      'lhci-report',
      '.lighthouseci',
      'playwright-report',
      'test-results',
      'logs',
      'cypress/screenshots',
      'cypress/videos'
    ]) {
      expect(cleanupScript).toContain(`'${generatedPath}'`)
    }
    expect(cleanupScript).toContain("entry.name === '.git'")
    expect(cleanupScript).toContain("entry.name === 'node_modules'")
  })

  it('audits release source locally, in test:all, and in CI', () => {
    const packageJson = readJson('package.json')
    const workflow = read('.github/workflows/ci.yml')
    const auditScript = read('scripts/verify-source-package.js')

    expect(packageJson.scripts['release:source:audit']).toBe('node scripts/verify-source-package.js')
    expect(packageJson.scripts['test:all']).toContain('npm run release:source:audit')
    expect(packageJson.scripts['release:preflight']).toContain('npm run release:source:audit')
    expect(workflow).toContain('run: npm run release:source:audit')
    expect(auditScript).toContain('Release source package audit passed.')
  })

  it('blocks generated output, Finder metadata, archives, and private registries from release source', () => {
    const auditScript = read('scripts/verify-source-package.js')
    const gitignore = read('.gitignore')

    for (const contract of [
      '/^dist\\//',
      '/^coverage\\//',
      '/^lhci-report\\//',
      '/^\\.lighthouseci\\//',
      '/^playwright-report\\//',
      '/^test-results\\//',
      '/^logs\\//',
      '/\\.zip$/i',
      "'packages.applied-caas-gateway'",
      "'internal.api.openai.org'"
    ]) {
      expect(auditScript).toContain(contract)
    }

    for (const ignoredPath of ['dist/', 'coverage/', 'lhci-report/', '.lighthouseci/', 'playwright-report/', 'test-results/', 'logs/', '**/.DS_Store']) {
      expect(gitignore).toContain(ignoredPath)
    }
  })
})
