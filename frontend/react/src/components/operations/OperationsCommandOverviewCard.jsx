import { OperationsCommandSummarySection } from './OperationsCommandSummarySection.jsx'
import { OperationsDependencyHandoffSection } from './OperationsDependencyHandoffSection.jsx'
import { OperationsStaffingSignoffSection } from './OperationsStaffingSignoffSection.jsx'
import { OperationsEscalationSection } from './OperationsEscalationSection.jsx'
import { OperationsTaskChecklistSection } from './OperationsTaskChecklistSection.jsx'

export function OperationsCommandOverviewCard(props) {
  const { item } = props

  return (
    <article className="operational-readiness-card ce-command-card" data-testid="react-operational-readiness-card">
      <OperationsCommandSummarySection {...props} />
      <OperationsDependencyHandoffSection {...props} />
      <OperationsStaffingSignoffSection {...props} />
      <OperationsEscalationSection {...props} />
      <OperationsTaskChecklistSection {...props} />
    </article>
  )
}
