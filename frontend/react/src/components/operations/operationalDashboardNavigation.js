export const OPERATIONS_WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview', summary: 'Command plan, selected sailing context, and cross-department directory.' },
  { id: 'tasks', label: 'Tasks', summary: 'Task checklist, follow-up tasks, blocker notes, and shift updates.' },
  { id: 'dependencies', label: 'Dependencies', summary: 'Gates that must clear before embarkation or department release work can continue.' },
  { id: 'handoffs', label: 'Handoffs', summary: 'Department-to-department release workflow, owners, due times, and notes.' },
  { id: 'escalations', label: 'Escalations', summary: 'Open operational risks, owners, severity, monitoring, and resolution state.' },
  { id: 'staffing', label: 'Staffing', summary: 'Crew check-in, department leads, muster locations, and coverage gaps.' },
  { id: 'readiness', label: 'Readiness', summary: 'Department signoffs and final readiness approval workflow.' },
  { id: 'ai-briefing', label: 'AI Briefing', summary: 'Generate, review, and retrieve evidence-grounded turnaround briefings.' }
]

export function getLifecycleTargetWorkspace(item = {}) {
  const typeText = String(item.type || item.label || item.detail || item.departmentRole || '').toLowerCase()
  if (typeText.includes('staff')) return 'staffing'
  if (typeText.includes('dependency')) return 'dependencies'
  if (typeText.includes('handoff')) return 'handoffs'
  if (typeText.includes('escalation')) return 'escalations'
  if (typeText.includes('signoff') || typeText.includes('department')) return 'readiness'
  return 'tasks'
}

export function getPhaseTargetWorkspace(phase = {}) {
  const blockerText = [...(phase.blockers || []), phase.description, phase.label].filter(Boolean).join(' ').toLowerCase()
  if (blockerText.includes('staff')) return 'staffing'
  if (blockerText.includes('depend')) return 'dependencies'
  if (blockerText.includes('handoff')) return 'handoffs'
  if (blockerText.includes('escalation')) return 'escalations'
  if (blockerText.includes('signoff') || blockerText.includes('readiness')) return 'readiness'
  return 'tasks'
}
