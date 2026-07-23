const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

const generatedPaths = [
  'dist',
  'build',
  'coverage',
  'lhci-report',
  '.lighthouseci',
  'github-pages',
  'playwright-report',
  'test-results',
  'logs',
  'cypress/screenshots',
  'cypress/videos',
  'lighthouse-report.report.html',
  'lighthouse-report.report.json'
]

function removePath(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath)
  if (!fs.existsSync(absolutePath)) return false

  fs.rmSync(absolutePath, { recursive: true, force: true })
  console.log(`Removed ${relativePath}`)
  return true
}

function removeFinderMetadata(directory) {
  if (!fs.existsSync(directory)) return 0

  let removed = 0
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue

    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      removed += removeFinderMetadata(fullPath)
    } else if (entry.name === '.DS_Store') {
      fs.rmSync(fullPath, { force: true })
      console.log(`Removed ${path.relative(projectRoot, fullPath)}`)
      removed += 1
    }
  }

  return removed
}

const removedPaths = generatedPaths.reduce((count, relativePath) => (
  count + (removePath(relativePath) ? 1 : 0)
), 0)
const removedFinderFiles = removeFinderMetadata(projectRoot)

console.log(`Generated artifact cleanup complete. Removed ${removedPaths} artifact paths and ${removedFinderFiles} Finder metadata files.`)
