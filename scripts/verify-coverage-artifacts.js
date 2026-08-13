const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()
const coverageDir = path.join(projectRoot, 'coverage')
const publishedDir = path.join(projectRoot, 'github-pages', 'coverage')
const verifyPublished = process.argv.includes('--published')

const rawArtifacts = [
  'coverage-summary.json',
  'coverage-final.json',
  'lcov.info',
  'cobertura-coverage.xml',
  'clover.xml',
  'coverage-evidence.json',
  path.join('lcov-report', 'index.html')
]

const publishedArtifacts = [
  'coverage-summary.json',
  'coverage-final.json',
  'lcov.info',
  'cobertura-coverage.xml',
  'clover.xml',
  'coverage-evidence.json',
  'index.html',
  'grouped-index.html',
  'metadata.json'
]

function assertArtifacts(baseDir, artifacts, label) {
  const missing = artifacts.filter(relativePath => !fs.existsSync(path.join(baseDir, relativePath)))
  if (missing.length > 0) {
    throw new Error(`${label} is incomplete. Missing: ${missing.join(', ')}`)
  }
}

assertArtifacts(coverageDir, rawArtifacts, 'Raw Jest coverage artifact set')

if (verifyPublished) {
  assertArtifacts(publishedDir, publishedArtifacts, 'Published GitHub Pages coverage artifact set')
}

console.log(`Coverage artifact audit passed (${verifyPublished ? 'raw + published' : 'raw'}).`)
console.log(`Raw coverage artifacts verified: ${rawArtifacts.length}`)
if (verifyPublished) console.log(`Published coverage artifacts verified: ${publishedArtifacts.length}`)
