const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')

const forbiddenTrackedPatterns = [
  /^node_modules\//,
  /^dist\//,
  /^build\//,
  /^coverage\//,
  /^lhci-report\//,
  /^\.lighthouseci\//,
  /^github-pages\//,
  /^playwright-report\//,
  /^test-results\//,
  /^logs\//,
  /^cypress\/(screenshots|videos)\//,
  /^lighthouse-report\.report\.(html|json)$/,
  /(^|\/)\.DS_Store$/,
  /\.zip$/i
]

const requiredFiles = [
  '.gitignore',
  '.npmrc',
  '.nvmrc',
  'package.json',
  'package-lock.json',
  'render.yaml',
  '.github/workflows/ci.yml'
]

const requiredIgnoreEntries = [
  'node_modules/',
  'dist/',
  'build/',
  'coverage/',
  'lhci-report/',
  '.lighthouseci/',
  'github-pages/',
  'playwright-report/',
  'test-results/',
  'logs/',
  'cypress/screenshots/',
  'cypress/videos/',
  '**/.DS_Store'
]

function fail(messages) {
  const details = Array.isArray(messages) ? messages : [messages]
  console.error('Release source package audit failed:')
  details.forEach(message => console.error(`- ${message}`))
  process.exit(1)
}

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function getTrackedFiles() {
  try {
    return execFileSync('git', ['ls-files'], { cwd: projectRoot, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean)
  } catch (error) {
    fail(`Unable to inspect tracked files: ${error.message}`)
  }
}

const problems = []
const trackedFiles = getTrackedFiles()
const forbiddenTrackedFiles = trackedFiles.filter(filePath => (
  forbiddenTrackedPatterns.some(pattern => pattern.test(filePath))
))

if (forbiddenTrackedFiles.length > 0) {
  problems.push(`Generated or packaged files are tracked by Git: ${forbiddenTrackedFiles.join(', ')}`)
}

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(projectRoot, relativePath))) {
    problems.push(`Required release file is missing: ${relativePath}`)
  }
}

const gitignore = read('.gitignore')
for (const entry of requiredIgnoreEntries) {
  if (!gitignore.includes(entry)) {
    problems.push(`.gitignore must include: ${entry}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
const scripts = packageJson.scripts || {}
if (scripts['clean:generated'] !== 'node scripts/clean-generated-artifacts.js') {
  problems.push('package.json must define clean:generated with the controlled cleanup script.')
}
if (scripts['release:source:audit'] !== 'node scripts/verify-source-package.js') {
  problems.push('package.json must define release:source:audit.')
}
if (!scripts['release:preflight']?.includes('npm run release:source:audit')) {
  problems.push('release:preflight must run release:source:audit.')
}

const packageLock = read('package-lock.json')
if (packageLock.includes('packages.applied-caas-gateway') || packageLock.includes('internal.api.openai.org')) {
  problems.push('package-lock.json contains a private package registry URL.')
}

if (read('.npmrc').trim().split(/\r?\n/)[0] !== 'registry=https://registry.npmjs.org/') {
  problems.push('.npmrc must use the public npm registry.')
}
if (read('.nvmrc').trim() !== '22') {
  problems.push('.nvmrc must pin the supported Node.js 22 runtime.')
}

if (problems.length > 0) fail(problems)

console.log('Release source package audit passed.')
console.log(`Tracked source files inspected: ${trackedFiles.length}`)
console.log('Generated artifacts remain excluded from release source.')
