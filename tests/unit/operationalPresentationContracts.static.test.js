const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '../..')

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8')
}

describe('Operations summary score-card consistency contract', () => {
  it('keeps executive, after-action, and timeline summaries on light surfaces', () => {
    const launchPanels = readProjectFile('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx')
    const timelinePanels = readProjectFile('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx')
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(launchPanels).toContain('operations-executive-brief-score ce-surface-light')
    expect(launchPanels).toContain('operations-after-action-score ce-surface-light')
    expect((timelinePanels.match(/operations-timeline-score-card ce-surface-light/g) || []).length).toBeGreaterThanOrEqual(3)
    expect(contrastCss).toContain('.operations-executive-brief-score.ce-surface-light')
    expect(contrastCss).toContain('.operations-after-action-score.ce-surface-light')
    expect(contrastCss).toContain('.operations-timeline-summary > .ce-surface-light')
  })
})


describe('Department continuity presentation contract', () => {
  it('separates score, plain-language status, and human-readable role labels', () => {
    const continuityPanels = readProjectFile('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx')
    const continuityCss = readProjectFile('frontend/react/src/styles/components/operations-continuity-shared-lower-panels.css')

    expect(continuityPanels).toContain("AT_RISK: 'At risk'")
    expect(continuityPanels).toContain("replace(/[_-]+/g, ' ')")
    expect(continuityPanels).toContain('operations-continuity-department-score')
    expect(continuityPanels).toContain('operations-continuity-department-status')
    expect(continuityPanels).toContain('operations-continuity-department-role')
    expect(continuityCss).toContain('Department continuity cards present score, status, and role as separate human-readable lines.')
    expect(continuityCss).toContain('.operations-continuity-department-heading')
    expect(continuityCss).toContain('text-transform: uppercase !important;')
  })
})


describe('Department command presentation contract', () => {
  it('separates score, plain-language status, and human-readable role labels', () => {
    const commandPanels = readProjectFile('frontend/react/src/components/operations/OperationsCommandContinuityPanels.jsx')
    const continuityCss = readProjectFile('frontend/react/src/styles/components/operations-continuity-shared-lower-panels.css')

    expect(commandPanels).toContain('operations-command-center-department-score')
    expect(commandPanels).toContain('operations-command-center-department-status')
    expect(commandPanels).toContain('operations-command-center-department-role')
    expect(commandPanels).toContain('{formatContinuityStatus(department.status)}')
    expect(commandPanels).toContain('{formatDepartmentRole(department.departmentRole)}')
    expect(continuityCss).toContain('Department command cards use the same business-readable hierarchy as continuity cards.')
    expect(continuityCss).toContain('.operations-command-center-department-heading')
  })
})


describe('Lower operations evidence-card presentation contract', () => {
  it('separates score, status, and business labels across briefing, deployment, closeout, and archive cards', () => {
    const panels = readProjectFile('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx')
    const lowerPanelCss = readProjectFile('frontend/react/src/styles/components/operations-continuity-shared-lower-panels.css')

    expect(panels).toContain('const formatOperationalStatus')
    expect(panels).toContain('const formatOperationalRole')
    expect((panels.match(/operations-structured-status-card/g) || []).length).toBeGreaterThanOrEqual(4)
    expect(panels).toContain('operations-status-score')
    expect(panels).toContain('operations-status-label')
    expect(panels).toContain('operations-status-title')
    expect(lowerPanelCss).toContain('Shared readable hierarchy for lower operations status/evidence cards.')
    expect(lowerPanelCss).toContain('.operations-structured-status-card .operations-status-label')
    expect(lowerPanelCss).toContain('text-transform: uppercase;')
  })
})


describe('After-action department lessons layout contract', () => {
  it('keeps department lessons wide, readable, and responsive beside follow-up actions', () => {
    const panels = readProjectFile('frontend/react/src/components/operations/OperationsLaunchCloseoutPanels.jsx')
    const afterActionCss = readProjectFile('frontend/react/src/styles/components/operations-evidence-after-action.css')

    expect(panels).toContain('operations-after-action-departments')
    expect(panels).toContain('operations-after-action-followups')
    expect(panels).toContain('{formatOperationalRole(department.departmentRole)}')
    expect(afterActionCss).toContain('Keep after-action department lessons usable beside the follow-up action list.')
    expect(afterActionCss).toContain('grid-template-columns: minmax(18rem, 0.85fr) minmax(0, 2.15fr);')
    expect(afterActionCss).toContain('@media (max-width: 980px)')
  })
})


describe('Operations lifecycle phase alignment contract', () => {
  it('keeps every lifecycle phase card top-aligned instead of vertically centered', () => {
    const lifecycleCss = readProjectFile('frontend/react/src/styles/components/operations-evidence-lifecycle.css')

    expect(lifecycleCss).toContain('Lifecycle phase cards always begin at the top of their grid cell.')
    expect(lifecycleCss).toContain('flex-direction: column !important;')
    expect(lifecycleCss).toContain('align-items: flex-start !important;')
    expect(lifecycleCss).toContain('justify-content: flex-start !important;')
    expect(lifecycleCss).toContain('align-self: stretch;')
  })
})


describe('Operations summary surface and overflow contract', () => {
  it('keeps timeline, workspace, and directory light surfaces readable and fully visible', () => {
    const commandPanels = readProjectFile('frontend/react/src/components/operations/OperationsCommandPanels.jsx')
    const timelinePanels = readProjectFile('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx')
    const workspaceCss = readProjectFile('frontend/react/src/styles/components/operations-workspace-shell.css')
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect((timelinePanels.match(/operations-timeline-score-card ce-surface-light/g) || []).length).toBeGreaterThanOrEqual(3)
    expect(commandPanels).toContain('operations-workspace-active-summary ce-surface-light')
    expect(commandPanels).toContain('role="status"')
    expect(commandPanels).toContain('aria-live="polite"')
    expect(commandPanels).toContain('aria-atomic="true"')
    expect((commandPanels.match(/operations-directory-metric ce-surface-light/g) || []).length).toBe(5)
    expect((commandPanels.match(/operations-directory-contact ce-surface-light/g) || []).length).toBe(2)
    expect(workspaceCss).toContain('grid-template-columns: minmax(12rem, 0.55fr) minmax(0, 1.65fr);')
    expect(workspaceCss).toContain('\"summary summary\";')
    expect(workspaceCss).toContain('grid-area: summary;')
    expect(workspaceCss).toContain('overflow-wrap: anywhere;')
    expect(contrastCss).toContain('Operations summary and directory light surfaces must remain readable inside dark command panels.')
    expect(contrastCss).toContain('.operations-directory-metrics > .ce-surface-light')
  })
})

describe('Operations timeline light summary surface contract', () => {
  it('keeps timeline totals dark-on-light inside the role dashboard', () => {
    const timeline = readProjectFile('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx')
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect((timeline.match(/operations-timeline-score-card ce-surface-light/g) || []).length).toBeGreaterThanOrEqual(3)
    expect(contrastCss).toContain('.react-role-dashboard .operations-timeline-summary > .ce-surface-light')
    expect(contrastCss).toContain('background: #f8fbff !important;')
    expect(contrastCss).toContain('color: #0f172a !important;')
    expect(contrastCss).toContain('min-inline-size: 5.5rem !important;')
  })
})


describe('Operations timeline semantic score-card contrast contract', () => {
  it('keeps all timeline summary cards light despite broad command summary selectors', () => {
    const timelinePanels = readProjectFile('frontend/react/src/components/operations/OperationsTimelineAuditPanels.jsx')
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect((timelinePanels.match(/operations-timeline-score-card ce-surface-light/g) || []).length).toBe(3)
    expect(contrastCss).toContain('body .react-role-dashboard .operations-timeline .operations-timeline-summary > .operations-timeline-score-card.ce-surface-light')
    expect(contrastCss).toContain('background: #f8fbff !important;')
    expect(contrastCss).toContain('background-image: none !important;')
    expect(contrastCss).toContain('color: #0f172a !important;')
  })
})

describe('Operational light editor contrast contract', () => {
  it('keeps operational forms, controls, labels, and action buttons readable on light surfaces', () => {
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')
    const commandSummary = readProjectFile('frontend/react/src/components/operations/OperationsCommandSummarySection.jsx')
    const taskSection = readProjectFile('frontend/react/src/components/operations/OperationsTaskChecklistSection.jsx')
    const handoffSection = readProjectFile('frontend/react/src/components/operations/OperationsDependencyHandoffSection.jsx')
    const escalationSection = readProjectFile('frontend/react/src/components/operations/OperationsEscalationSection.jsx')
    const staffingSection = readProjectFile('frontend/react/src/components/operations/OperationsStaffingSignoffSection.jsx')

    expect(commandSummary).toContain('operational-command-form ce-editor-card ce-surface-light')
    expect(commandSummary).toContain('operational-light-editor')
    expect(taskSection).toContain('operational-task-create-form ce-editor-card ce-surface-light')
    expect(taskSection).toContain('operational-task-detail-form ce-editor-card ce-surface-light')
    expect(handoffSection).toContain('operational-handoff-form ce-editor-card ce-surface-light')
    expect(escalationSection).toContain('operational-escalation-update-form ce-editor-card ce-surface-light')
    expect(staffingSection).toContain('operational-signoff-form ce-editor-card ce-surface-light')
    expect(contrastCss).toContain('#react-role-dashboard.react-role-dashboard form.ce-editor-card.ce-surface-light')
    expect(contrastCss).toContain('html body #react-role-dashboard.react-role-dashboard form.operational-light-editor.ce-editor-card.ce-surface-light')
    expect(contrastCss).toContain('body #react-role-dashboard.react-role-dashboard :is(')
    expect(contrastCss).toContain('.operational-command-form,')
    expect(contrastCss).toContain('.operational-handoff-form,')
    expect(contrastCss).toContain('.operational-escalation-update-form')
    expect(contrastCss).toContain('background: #f8fbff !important;')
    expect(contrastCss).toContain('color: #315a78 !important;')
    expect(contrastCss).toContain("input:not([type='checkbox']):not([type='radio'])")
    expect(contrastCss).toContain('background: #e6f6ff !important;')
    expect(contrastCss).toContain('color: #0f172a !important;')
    expect(contrastCss).toContain('color: #475569 !important;')
  })
})

describe('Operational compatibility editor contrast contract', () => {
  test('keeps all operational editor text dark on light surfaces', () => {
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

    expect(contrastCss).toContain('.operational-command-compatibility-panel form.operational-light-editor.ce-editor-card.ce-surface-light *')
    expect(contrastCss).toContain('color: #315a78 !important;')
    expect(contrastCss).toContain('background: #ffffff !important;')
    expect(contrastCss).toContain('background: #e6f6ff !important;')
    expect(contrastCss).toContain('color: #334155 !important;')
  })
})

describe('Operational command detail surface ownership contract', () => {
  test('does not apply dark command-card typography to semantic light editor forms', () => {
    const commandDetailCss = readProjectFile('frontend/react/src/styles/components/operations-command-detail.css')

    expect(commandDetailCss).toContain('.operational-command-form:not(.ce-surface-light)')
    expect(commandDetailCss).toContain('.operational-task-create-form:not(.ce-surface-light)')
    expect(commandDetailCss).toContain('form:not(.ce-surface-light)')
    expect(commandDetailCss).toContain('[class*="form"]:not(.ce-surface-light)')
    expect(commandDetailCss).toContain('[class*="editor"]:not(.ce-surface-light)')
    expect(commandDetailCss).not.toContain('.operational-command-form *,\n.react-role-dashboard .operational-command-compatibility-panel .operational-task-create-form *')
  })
})

test('operational light editors use the rendered class-based dashboard selector', () => {
  const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

  expect(contrastCss).toContain('html body .react-role-dashboard .operational-command-compatibility-panel form.operational-light-editor.ce-editor-card.ce-surface-light')
  expect(contrastCss).toContain('color: #315a78 !important;')
  expect(contrastCss).toContain('background: #e6f6ff !important;')
  expect(contrastCss).toContain('color: #334155 !important;')
})

test('operational light editor labels outrank legacy dark command selectors', () => {
  const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')

  expect(contrastCss).toContain('#react-role-dashboard#react-role-dashboard.react-role-dashboard')
  expect(contrastCss).toContain('form.operational-light-editor.operational-light-editor.ce-editor-card.ce-surface-light')
  expect(contrastCss).toContain('> label > span')
  expect(contrastCss).toContain('color: #315a78 !important;')
  expect(contrastCss).toContain('-webkit-text-fill-color: #315a78 !important;')
})

describe('Turnaround operations light editor ownership contract', () => {
  test('every operational workspace editor declares a semantic light surface', () => {
    const files = [
      'frontend/react/src/components/operations/OperationsHandoffWorkspace.jsx',
      'frontend/react/src/components/operations/OperationsStaffingReadinessWorkspaces.jsx',
      'frontend/react/src/components/operations/OperationsEscalationWorkspace.jsx',
      'frontend/react/src/components/operations/OperationsTaskWorkspace.jsx'
    ]

    for (const file of files) {
      const source = readProjectFile(file)
      const operationalForms = source.match(/<form className="[^"]*operational-[^"]*"/g) || []
      expect(operationalForms.length).toBeGreaterThan(0)
      for (const form of operationalForms) {
        expect(form).toContain('ce-editor-card')
        expect(form).toContain('ce-surface-light')
        expect(form).toContain('operational-light-editor')
      }
    }
  })

  test('final contrast rules keep operational light editors readable', () => {
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')
    expect(contrastCss).toContain('form.operational-light-editor.operational-light-editor.ce-editor-card.ce-surface-light')
    expect(contrastCss).toContain('color: #315a78 !important;')
    expect(contrastCss).toContain('background: #ffffff !important;')
    expect(contrastCss).toContain('color: #0f172a !important;')
    expect(contrastCss).toContain('color: #475569 !important;')
  })
})

describe('Turnaround task destructive-action contrast contract', () => {
  test('keeps remove-task buttons dark-on-light in every operations task rendering path', () => {
    const contrastCss = readProjectFile('frontend/react/src/styles/utilities/contrast-contract.css')
    const checklist = readProjectFile('frontend/react/src/components/operations/OperationsTaskChecklistSection.jsx')
    const workspace = readProjectFile('frontend/react/src/components/operations/OperationsTaskWorkspace.jsx')

    expect(checklist).toContain('operational-task-remove-action')
    expect(workspace).toContain('operational-task-remove-action')
    expect(contrastCss).toContain('button.operational-task-remove-action')
    expect(contrastCss).toContain('background: #fff1f2 !important;')
    expect(contrastCss).toContain('color: #7f1d1d !important;')
    expect(contrastCss).toContain('background: #ffe4e6 !important;')
    expect(contrastCss).toContain('color: #881337 !important;')
  })
})
