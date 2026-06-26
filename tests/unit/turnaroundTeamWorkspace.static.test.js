const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('turnaround team workspace static contracts', () => {
  it('promotes the cruise-line to ship to sailing to team workflow as the primary staffing workspace', () => {
    const component = read('frontend/react/src/components/ReactTurnaroundAdminSetup.jsx')
    const styles = read('frontend/react/src/styles/design-system.css')

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
    const styles = read('frontend/react/src/styles/design-system.css')

    expect(component).toContain('data-testid="react-turnaround-admin-role-coverage"')
    expect(component).toContain('data-testid="react-turnaround-admin-role-card"')
    expect(component).toContain('data-testid="react-turnaround-admin-clear-role"')
    expect(component).toContain('data-testid="react-turnaround-admin-fill-role"')
    expect(component).toContain('replacementCandidatesByRole')
    expect(component).toContain('Fill from roster')
    expect(component).toContain('Clear role')
    expect(styles).toContain('.turnaround-role-coverage-grid')
    expect(styles).toContain('.turnaround-role-coverage-card.staffed')
    expect(styles).toContain('.turnaround-role-coverage-card.missing')
  })
})
