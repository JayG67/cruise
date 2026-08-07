import { OperationsIncidentBriefingScenarioPanels } from './OperationsIncidentBriefingScenarioPanels.jsx'
import { OperationsMetricsPanel } from './OperationsMetricsPanel.jsx'
import { OperationsPlaybookPanels } from './OperationsPlaybookPanels.jsx'
import { OperationsReleasePacketPanel } from './OperationsReleasePacketPanel.jsx'

export function OperationsReadinessEvidencePanels({ selectedOperation }) {
  return (
    <>
      <OperationsReleasePacketPanel releasePacket={selectedOperation?.releasePacket} />
      <OperationsMetricsPanel operationalMetrics={selectedOperation?.operationalMetrics} />
      <OperationsPlaybookPanels
        playbookTemplate={selectedOperation?.playbookTemplate}
        playbookVariance={selectedOperation?.playbookVariance}
      />
      <OperationsIncidentBriefingScenarioPanels
        incidentCommand={selectedOperation?.incidentCommand}
        operationalBriefingBoard={selectedOperation?.outreachBoard}
        scenarioPlan={selectedOperation?.scenarioPlan}
      />
    </>
  )
}
