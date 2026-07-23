import { OperationsDependencyWorkspace } from './OperationsDependencyWorkspace.jsx'
import { OperationsEscalationWorkspace } from './OperationsEscalationWorkspace.jsx'
import { OperationsHandoffWorkspace } from './OperationsHandoffWorkspace.jsx'
import { OperationsTaskWorkspace } from './OperationsTaskWorkspace.jsx'

export function OperationsTaskFlowWorkspaces(props) {
  const { activeOperationsWorkspace, selectedOperation } = props

  if (!selectedOperation) return null

  if (activeOperationsWorkspace === 'dependencies') {
    return <OperationsDependencyWorkspace {...props} />
  }

  if (activeOperationsWorkspace === 'escalations') {
    return <OperationsEscalationWorkspace {...props} />
  }

  if (activeOperationsWorkspace === 'handoffs') {
    return <OperationsHandoffWorkspace {...props} />
  }

  if (activeOperationsWorkspace === 'tasks') {
    return <OperationsTaskWorkspace {...props} />
  }

  return null
}
