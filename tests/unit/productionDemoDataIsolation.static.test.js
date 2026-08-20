const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('production demo-data isolation contracts', () => {
  it('keeps production startup schema-only and gates destructive demo seeding behind policy', () => {
    const index = read('index.js')

    expect(index).toContain("require('./services/demoDataPolicy.service')")
    expect(index).toContain('await initializeDatabase()')
    expect(index).toContain('if (shouldLoadDemoDataOnStartup())')
    expect(index).toContain('await loadCruiseData()')
    expect(index.indexOf('if (shouldLoadDemoDataOnStartup())')).toBeLessThan(index.indexOf('await loadCruiseData()'))
  })

  it('gates seed-file HTTP hosting and demo reset through the same production-safe policy', () => {
    const app = read('app.js')
    const adminController = read('controllers/admin.controller.js')

    expect(app).toContain("require('./services/demoDataPolicy.service')")
    expect(app).toContain('if (!canExposeSeedDataOverHttp())')
    expect(app).toContain("return res.status(404).type('text/plain').send('Not found')")
    expect(adminController).toContain("require('../services/demoDataPolicy.service')")
    expect(adminController).toContain('if (!canResetDemoData())')
    expect(adminController).toContain("return res.status(404).json({ message: 'Not found' })")
  })

  it('pins the production deployment to explicit demo-data disablement', () => {
    const renderConfig = read('render.yaml')
    const envExample = read('.env.example')

    expect(renderConfig).toContain('key: CRUISE_DEMO_DATA_MODE')
    expect(renderConfig).toContain('value: disabled')
    expect(renderConfig).toContain('preDeployCommand: npm run db:bootstrap:render-demo')
    expect(envExample).toContain('CRUISE_DEMO_DATA_MODE=enabled')
    expect(envExample).toContain('Production always disables demo data')
  })
})
