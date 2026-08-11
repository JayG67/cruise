const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('GitHub Pages coverage report preparation', () => {
  it('publishes a flat per-file coverage index while preserving the grouped Istanbul report', () => {
    const script = read('scripts/prepare-coverage-pages.js')

    expect(script).toContain("const coverageFinal = path.join(coverageDir, 'coverage-final.json')")
    expect(script).toContain("const coverageLcov = path.join(coverageDir, 'lcov.info')")
    expect(script).toContain("const coverageCobertura = path.join(coverageDir, 'cobertura-coverage.xml')")
    expect(script).toContain("const coverageClover = path.join(coverageDir, 'clover.xml')")
    expect(script).toContain("[coverageFinal, 'coverage-final.json']")
    expect(script).toContain("[coverageLcov, 'lcov.info']")
    expect(script).toContain("[coverageCobertura, 'cobertura-coverage.xml']")
    expect(script).toContain("[coverageClover, 'clover.xml']")
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
    expect(packageJson.scripts['coverage:ci']).toContain('--coverageReporters=json')
    expect(packageJson.scripts['coverage:ci']).toContain('--coverageReporters=cobertura')
    expect(packageJson.scripts['coverage:ci']).toContain('--coverageReporters=clover')
    expect(packageJson.scripts['coverage:prepare-pages']).toBe('node scripts/prepare-coverage-pages.js')
  })


  it('verifies complete raw and published coverage artifacts before GitHub upload', () => {
    const workflow = read('.github/workflows/ci.yml')
    const verifier = read('scripts/verify-coverage-artifacts.js')
    const jestConfig = read('jest.config.js')

    expect(workflow).toContain('node scripts/verify-coverage-artifacts.js')
    expect(workflow).toContain('node scripts/verify-coverage-artifacts.js --published')
    expect(workflow).toContain('id: jest-coverage')
    expect(workflow).toContain('continue-on-error: true')
    expect(workflow).toContain('name: Enforce Jest coverage gate result')
    expect(workflow).toContain('steps.jest-coverage.outcome')
    expect(workflow).toContain('Artifact includes HTML, LCOV, JSON, JSON summary, Cobertura XML, and Clover XML coverage outputs.')
    expect(verifier).toContain("'coverage-final.json'")
    expect(verifier).toContain("'cobertura-coverage.xml'")
    expect(verifier).toContain("'clover.xml'")
    expect(verifier).toContain("path.join('lcov-report', 'index.html')")
    expect(jestConfig).toContain('coverageThreshold')
    expect(jestConfig).toContain('statements: 90')
    expect(jestConfig).toContain('branches: 65')
    expect(jestConfig).toContain('functions: 94')
    expect(jestConfig).toContain('lines: 92')
  })

})
