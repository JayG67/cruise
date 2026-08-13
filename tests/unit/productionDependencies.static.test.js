const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

describe('production dependency security contracts', () => {
  it('pins patched frontend build dependencies and secure production overrides', () => {
    const packageJson = readJson('package.json')
    const packageLock = readJson('package-lock.json')

    expect(packageJson.dependencies.vite).toBeUndefined()
    expect(packageJson.dependencies['@vitejs/plugin-react']).toBeUndefined()
    expect(packageJson.devDependencies.vite).toBe('8.1.5')
    expect(packageJson.devDependencies['@vitejs/plugin-react']).toBeDefined()
    expect(packageJson.overrides.qs).toBe('6.15.3')
    expect(packageJson.overrides.postcss).toBe('8.5.23')
    expect(packageLock.packages['node_modules/vite'].version).toBe('8.1.5')
    expect(packageLock.packages['node_modules/vite'].dev).toBe(true)
    expect(packageLock.packages['node_modules/postcss'].dev).toBe(true)
    expect(packageLock.packages['node_modules/nanoid'].dev).toBe(true)
    expect(packageLock.packages['node_modules/qs'].version).toBe('6.15.3')
    expect(packageLock.packages['node_modules/postcss'].version).toBe('8.5.23')
  })

  it('runs the production dependency audit locally, in test:all, and in CI', () => {
    const packageJson = readJson('package.json')
    const workflow = read('.github/workflows/ci.yml')
    const auditScript = read('scripts/verify-production-dependencies.js')

    expect(packageJson.scripts['production:dependencies:audit']).toBe('node scripts/verify-production-dependencies.js')
    expect(packageJson.scripts['test:all']).toContain('npm run production:dependencies:audit')
    expect(workflow).toContain('run: npm run production:dependencies:audit')
    expect(auditScript).toContain("spawnSync('npm', ['audit', '--omit=dev', '--json']")
    expect(auditScript).toContain('Production dependency audit passed.')
    expect(auditScript).toContain('MAX_ACCEPTED_LOW_SEVERITY = 1')
    expect(auditScript).toContain('lowCount > MAX_ACCEPTED_LOW_SEVERITY')
  })


  it('keeps install metadata portable outside internal build environments', () => {
    const packageLockText = read('package-lock.json')
    const npmConfig = read('.npmrc')
    const nodeVersion = read('.nvmrc').trim()

    expect(packageLockText).not.toContain('packages.applied-caas-gateway1.internal.api.openai.org')
    expect(packageLockText).toContain('https://registry.npmjs.org/vite/-/vite-8.1.5.tgz')
    expect(npmConfig).toContain('registry=https://registry.npmjs.org/')
    expect(nodeVersion).toBe('22')
  })

  it('blocks moderate, high, and critical production findings without forced upgrades', () => {
    const auditScript = read('scripts/verify-production-dependencies.js')
    const packageJson = readJson('package.json')

    expect(auditScript).toContain("['moderate', 'high', 'critical']")
    expect(auditScript).not.toContain('--force')
    expect(packageJson.scripts['production:dependencies:audit']).not.toContain('--force')
  })
})
