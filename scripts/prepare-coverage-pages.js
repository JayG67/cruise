const fs = require('fs')
const path = require('path')

const coverageDir = path.resolve(process.cwd(), 'coverage')
const coverageLcovDir = path.join(coverageDir, 'lcov-report')
const coverageSummary = path.join(coverageDir, 'coverage-summary.json')
const outputDir = path.resolve(process.cwd(), 'github-pages', 'coverage')

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function copyDirectory(source, destination) {
  ensureDirectory(destination)

  if (!fs.existsSync(source)) {
    return false
  }

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name)
    const destinationPath = path.join(destination, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath)
    } else {
      fs.copyFileSync(sourcePath, destinationPath)
    }
  }

  return true
}

ensureDirectory(outputDir)

const copiedHtml = copyDirectory(coverageLcovDir, outputDir)

if (fs.existsSync(coverageSummary)) {
  fs.copyFileSync(coverageSummary, path.join(outputDir, 'coverage-summary.json'))
}

if (!copiedHtml) {
  const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Cruise Explorer Coverage</title>
</head>
<body>
  <h1>Coverage report unavailable</h1>
  <p>The coverage summary was generated, but the HTML report directory was not found.</p>
</body>
</html>`

  fs.writeFileSync(path.join(outputDir, 'index.html'), fallbackHtml)
}

const metadata = {
  generatedAt: new Date().toISOString(),
  htmlReportCopied: copiedHtml,
  summaryCopied: fs.existsSync(coverageSummary)
}

fs.writeFileSync(
  path.join(outputDir, 'metadata.json'),
  JSON.stringify(metadata, null, 2)
)

console.log(`Prepared coverage report for GitHub Pages: ${outputDir}`)
