const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function readCssBundle(relativePath, seen = new Set()) {
  const absolutePath = path.join(projectRoot, relativePath)

  if (seen.has(absolutePath)) {
    return ''
  }

  seen.add(absolutePath)

  const source = fs.readFileSync(absolutePath, 'utf8')
  const directory = path.dirname(absolutePath)
  const imports = [...source.matchAll(/@import\s+['"]([^'"]+)['"];?/g)]

  return [
    source,
    ...imports.map(([, importPath]) => readCssBundle(path.relative(projectRoot, path.join(directory, importPath)), seen))
  ].join('\n')
}

describe('turnaround team workspace static contracts', () => {
  it('promotes the cruise-line to ship to sailing to team workflow as the primary staffing workspace', () => {
    const component = read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx')
    const styles = readCssBundle('frontend/react/src/styles/index.css')

    expect(component).toContain('buildTurnaroundTeamWorkspace')
    expect(component).toContain('data-testid="react-turnaround-team-workspace"')
    expect(component).toContain('1. Cruise line')
    expect(component).toContain('2. Ship')
    expect(component).toContain('3. Sailing')
    expect(component).toContain('4. Team readiness')
    expect(component).toContain('staffedRoleCount')
    expect(component).toContain('requiredRoleCount')
    expect(styles).toContain('.turnaround-team-workspace')
    expect(styles).toContain('.turnaround-workspace-card.ready')
  })

  it('adds role-by-role coverage controls for filling and clearing the selected turnaround team', () => {
    const component = read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx')
    const styles = readCssBundle('frontend/react/src/styles/index.css')

    expect(component).toContain('data-testid="react-turnaround-admin-role-coverage"')
    expect(component).toContain('data-testid="react-turnaround-admin-role-card"')
    expect(component).toContain('data-testid="react-turnaround-admin-clear-role"')
    expect(component).toContain('data-testid="react-turnaround-admin-fill-role"')
    expect(component).toContain('replacementCandidatesByRole')
    expect(component).toContain('Fill from roster')
    expect(component).toContain('Clear role')
    expect(component).toContain('turnaround-role-assignment-label')
    expect(component).toContain('turnaround-role-assignment-person')
    expect(styles).toContain('.turnaround-role-coverage-card .turnaround-role-assignment')
    expect(styles).toContain('gap: 0.35rem !important')
    expect(styles).toContain('.turnaround-role-coverage-grid')
    expect(styles).toContain('.turnaround-role-coverage-card.staffed')
    expect(styles).toContain('.turnaround-role-coverage-card.missing')
  })

  it('keeps the complete-team badge readable on its light success surface', () => {
    const component = read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx')
    const styles = readCssBundle('frontend/react/src/styles/index.css')

    expect(component).toContain('className="turnaround-team-complete-badge"')
    expect(component).not.toContain('className="ready">Complete team')
    expect(styles).toContain('.turnaround-team-complete-badge')
    expect(styles).toContain('color: #065f46 !important')
    expect(styles).toContain('-webkit-text-fill-color: #065f46 !important')
  })

})
