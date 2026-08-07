const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('retired portfolio showcase contracts', () => {
  it('keeps recruiter and interview packaging out of the application API and React client', () => {
    const routes = read('routes/cruise.routes.js')
    const controller = read('controllers/cruise.controller.js')
    const client = read('frontend/react/src/api/client.js')
    const styles = read('frontend/react/src/styles/components/readiness-centers.css')

    expect(routes).not.toContain("'/portfolio/showcase'")
    expect(controller).not.toContain('getPortfolioShowcase')
    expect(controller).not.toContain('buildPortfolioShowcase')
    expect(client).not.toContain('getPortfolioShowcase')
    expect(client).not.toContain("'/cruise/portfolio/showcase'")
    expect(styles).not.toContain('readiness-portfolio-polish.css')
  })
})
