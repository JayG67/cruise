export function buildOperationCommandDraft(operationCard) {
  return {
    status: operationCard.commandStatus || operationCard.status || 'PLANNED',
    readinessLevel: operationCard.commandReadinessLevel || operationCard.readinessLevel || 'Standard coordination',
    port: operationCard.port || operationCard.arrivalPort || '',
    notes: operationCard.notes || ''
  }
}

export function buildEscalationCreateDraft({ roleView, selectedPerson }) {
  return {
    departmentRole: roleView,
    severity: 'WATCH',
    title: '',
    ownerName: selectedPerson?.displayName || '',
    status: 'OPEN',
    resolutionNotes: ''
  }
}

export function buildEscalationUpdateDraft(escalation) {
  return {
    severity: escalation.severity || 'WATCH',
    title: escalation.title || '',
    ownerName: escalation.ownerName || '',
    status: escalation.status || 'OPEN',
    resolutionNotes: escalation.resolutionNotes || ''
  }
}

export function buildHandoffDraft(handoff, selectedPerson) {
  return {
    status: handoff.status || 'PENDING',
    ownerName: handoff.ownerName || selectedPerson?.displayName || '',
    dueTime: handoff.dueTime || '',
    notes: handoff.notes || ''
  }
}

export function findRoleStaffing(operationCard, departmentRole, selectedPerson) {
  return (operationCard.staffing || []).find(staffing => staffing.departmentRole === departmentRole) || {
    departmentRole,
    plannedCount: 0,
    checkedInCount: 0,
    leadName: selectedPerson?.displayName || '',
    musterLocation: '',
    notes: ''
  }
}

export function buildStaffingDraft(operationCard, departmentRole, selectedPerson) {
  const staffing = findRoleStaffing(operationCard, departmentRole, selectedPerson)
  return {
    plannedCount: String(staffing.plannedCount ?? 0),
    checkedInCount: String(staffing.checkedInCount ?? 0),
    leadName: staffing.leadName || selectedPerson?.displayName || '',
    musterLocation: staffing.musterLocation || '',
    notes: staffing.notes || ''
  }
}

export function findRoleSignoff(operationCard, departmentRole, selectedPerson) {
  return (operationCard.signoffs || []).find(signoff => signoff.departmentRole === departmentRole) || {
    departmentRole,
    approverName: selectedPerson?.displayName || '',
    status: 'PENDING',
    notes: ''
  }
}

export function buildSignoffDraft(operationCard, departmentRole, selectedPerson) {
  const signoff = findRoleSignoff(operationCard, departmentRole, selectedPerson)
  return {
    approverName: signoff.approverName || selectedPerson?.displayName || '',
    status: signoff.status || 'PENDING',
    notes: signoff.notes || ''
  }
}

export function buildTaskCreateDraft({ roleView, selectedPerson }) {
  return {
    departmentRole: roleView,
    taskName: '',
    ownerName: selectedPerson?.displayName || '',
    dueTime: '',
    location: '',
    blockerReason: ''
  }
}

export function buildTaskDetailDraft(task) {
  return {
    ownerName: task.ownerName || '',
    dueTime: task.dueTime || '',
    location: task.location || '',
    blockerReason: task.blockerReason || ''
  }
}
