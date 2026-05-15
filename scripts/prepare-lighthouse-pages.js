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
    .sort((a, b) => b.modifiedTime - a.modifiedTime)[0]
}

ensureDirectory(outputDir)

const htmlReport = findNewestFile(sourceDir, '.html')
const jsonReport = findNewestFile(sourceDir, '.json')

if (!htmlReport) {
  throw new Error(`No Lighthouse HTML report found in ${sourceDir}`)
}

fs.copyFileSync(htmlReport.fullPath, latestHtml)

if (jsonReport) {
  fs.copyFileSync(jsonReport.fullPath, latestJson)
}

const metadata = {
  generatedAt: new Date().toISOString(),
  sourceHtmlReport: htmlReport.file,
  sourceJsonReport: jsonReport ? jsonReport.file : null,
  latestReport: 'index.html'
}

fs.writeFileSync(
  path.join(outputDir, 'metadata.json'),
  JSON.stringify(metadata, null, 2)
)

console.log(`Prepared Lighthouse report for GitHub Pages: ${latestHtml}`)
