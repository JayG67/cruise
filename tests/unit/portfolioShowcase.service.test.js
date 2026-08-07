const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function exists(relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath))
}

describe('retired portfolio showcase service', () => {
  it('removes the personal portfolio-scoring service from production source', () => {
    expect(exists('services/portfolioShowcase.service.js')).toBe(false)
    expect(exists('frontend/react/src/components/ReactPortfolioPolishCenter.jsx')).toBe(false)
    expect(exists('frontend/react/src/styles/components/readiness-portfolio-polish.css')).toBe(false)
  })
})
