import { OperationsCommandContinuityPanels } from './OperationsCommandContinuityPanels.jsx'
import { OperationsDormantReadinessPanels } from './OperationsDormantReadinessPanels.jsx'
import { OperationsLaunchCloseoutPanels } from './OperationsLaunchCloseoutPanels.jsx'
import { OperationsReadinessEvidencePanels } from './OperationsReadinessEvidencePanels.jsx'
import { OperationsTimelineAuditPanels } from './OperationsTimelineAuditPanels.jsx'

export function OperationsEvidencePanels({ selectedOperation }) {
  return (
    <>
      <OperationsReadinessEvidencePanels selectedOperation={selectedOperation} />
      <OperationsDormantReadinessPanels selectedOperation={selectedOperation} />
      <OperationsCommandContinuityPanels selectedOperation={selectedOperation} />
      <OperationsLaunchCloseoutPanels selectedOperation={selectedOperation} />
      <OperationsTimelineAuditPanels selectedOperation={selectedOperation} />
    </>
  )
}
