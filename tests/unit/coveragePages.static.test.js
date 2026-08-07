const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('GitHub Pages coverage report preparation', () => {
  it('publishes a flat per-file coverage index while preserving the grouped Istanbul report', () => {
    const script = read('scripts/prepare-coverage-pages.js')

    expect(script).toContain("const coverageFinal = path.join(coverageDir, 'coverage-final.json')")
    expect(script).toContain("const coverageLcov = path.join(coverageDir, 'lcov.info')")
    expect(script).toContain("[coverageFinal, 'coverage-final.json']")
    expect(script).toContain("[coverageLcov, 'lcov.info']")
    expect(script).toContain('completeCoverageDataPublished')
    expect(script).toContain("fs.copyFileSync(generatedIndex, groupedIndex)")
    expect(script).toContain("fs.writeFileSync(generatedIndex, buildFlatCoverageIndex(coverageDetails))")
    expect(script).toContain('This flat report lists every covered source file')
    expect(script).toContain('Open grouped directory view')
    expect(script).toContain('files.map(renderFileRow)')
  })

  it('keeps the CI coverage command generating the detailed inputs required by the published report', () => {
    const packageJson = JSON.parse(read('package.json'))

    expect(packageJson.scripts['coverage:ci']).toContain('--coverageReporters=json-summary')
    expect(packageJson.scripts['coverage:ci']).toContain('--coverageReporters=lcov')
    expect(packageJson.scripts['coverage:prepare-pages']).toBe('node scripts/prepare-coverage-pages.js')
  })
})
