const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('Application shell ownership', () => {
  test('delegates workspace navigation and browser-test selection bridging to focused hooks', () => {
    const app = read('frontend/react/src/App.jsx')
    const navigation = read('frontend/react/src/hooks/useApplicationWorkspaceNavigation.js')
    const selectionBridge = read('frontend/react/src/hooks/useDemoSelectionBridge.js')

    expect(app).toContain("import useApplicationWorkspaceNavigation from './hooks/useApplicationWorkspaceNavigation.js'")
    expect(app).toContain("import useDemoSelectionBridge from './hooks/useDemoSelectionBridge.js'")
    expect(app).toContain('useDemoSelectionBridge({')
    expect(app).toContain('useApplicationWorkspaceNavigation({')
    expect(app).not.toContain('window.__cruiseDemoUsers =')
    expect(app).not.toContain('setRoleSwitchRequest(')
    expect(app).not.toContain('pendingNavigationSectionId')

    expect(navigation).toContain('function scrollToSection(sectionId)')
    expect(navigation).toContain('setRoleSwitchRequest({ sectionId, workspaceLabel, requiredRole })')
    expect(navigation).toContain("roleSwitchRequest.requiredRole === 'admin'")
    expect(navigation).toContain('setPendingNavigationSectionId(roleSwitchRequest.sectionId)')

    expect(selectionBridge).toContain('window.__cruiseDemoUsers =')
    expect(selectionBridge).toContain('window.__cruiseDemoSelectionState =')
    expect(selectionBridge).toContain('window.__cruiseSelectDemoUser =')
    expect(selectionBridge).toContain('setSelectedDemoUserId(matchingUser.id)')
    expect(selectionBridge).toContain('delete window.__cruiseDemoSelectionState')
  })
})
