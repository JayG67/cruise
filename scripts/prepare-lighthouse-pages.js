const fs = require('fs')
const path = require('path')

const sourceDir = path.resolve(process.cwd(), 'lhci-report')
const outputDir = path.resolve(process.cwd(), 'github-pages', 'lighthouse')
const latestHtml = path.join(outputDir, 'index.html')
const latestJson = path.join(outputDir, 'lighthouse-result.json')

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function findNewestFile(dir, extension) {
  if (!fs.existsSync(dir)) return null

  return fs
    .readdirSync(dir)
    .filter(file => file.endsWith(extension))
    .map(file => {
      const fullPath = path.join(dir, file)
      return {
        file,
        fullPath,
        modifiedTime: fs.statSync(fullPath).mtimeMs
      }
    })
    .sort((a, b) => b.modifiedTime - a.modifiedTime)[0] || null
}

function writeFallbackReport(reason) {
  const generatedAt = new Date().toISOString()
  const escapedReason = String(reason).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]))

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cruise Fleet Operations Platform Lighthouse Report</title>
</head>
<body>
  <main>
    <h1>Lighthouse report unavailable</h1>
    <p>The CI job did not produce a Lighthouse HTML report for this run.</p>
    <p>${escapedReason}</p>
  </main>
</body>
</html>`

  const json = {
    generatedAt,
    unavailable: true,
    reason
  }

  fs.writeFileSync(latestHtml, html)
  fs.writeFileSync(latestJson, JSON.stringify(json, null, 2))

  return {
    generatedAt,
    sourceHtmlReport: null,
    sourceJsonReport: null,
    latestReport: 'index.html',
    fallback: true,
    reason
  }
}

ensureDirectory(outputDir)

const htmlReport = findNewestFile(sourceDir, '.html')
const jsonReport = findNewestFile(sourceDir, '.json')

let metadata

if (htmlReport) {
  fs.copyFileSync(htmlReport.fullPath, latestHtml)

  if (jsonReport) {
    fs.copyFileSync(jsonReport.fullPath, latestJson)
  }

  metadata = {
    generatedAt: new Date().toISOString(),
    sourceHtmlReport: htmlReport.file,
    sourceJsonReport: jsonReport ? jsonReport.file : null,
    latestReport: 'index.html',
    fallback: false
  }
} else {
  metadata = writeFallbackReport(`No Lighthouse HTML report found in ${sourceDir}`)
}

fs.writeFileSync(
  path.join(outputDir, 'metadata.json'),
  JSON.stringify(metadata, null, 2)
)

console.log(`Prepared Lighthouse report for GitHub Pages: ${latestHtml}`)
