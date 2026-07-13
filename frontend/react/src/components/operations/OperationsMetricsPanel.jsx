import { getOperationalMetricTone } from './operationalDashboardUtils.js'

export function OperationsMetricsPanel({ operationalMetrics }) {
  if (!operationalMetrics) {
    return null
  }

  return (
    <section className="operations-metrics" aria-labelledby="operations-metrics-heading" data-testid="react-operations-metrics">
      <div className="operations-metrics-header">
        <div>
          <p className="eyebrow ce-kicker">Operational analytics</p>
          <h4 id="operations-metrics-heading">Turnaround performance signals</h4>
          <p>Release confidence blends readiness, risk, staffing, dependencies, handoffs, escalations, and timeline activity into a command-center view.</p>
        </div>
        <div className="operations-metrics-confidence" aria-label={`Release confidence ${operationalMetrics.summary?.releaseConfidence || 0}%`}>
          <span>{operationalMetrics.summary?.releaseConfidence || 0}%</span>
          <small>Release confidence</small>
        </div>
      </div>
      <div className="operations-metrics-signal-grid" data-testid="react-operations-metrics-signals">
        {(operationalMetrics.signals || []).map(signal => (
          <article className={`operations-metrics-signal ${getOperationalMetricTone(signal.status)}`} key={signal.id}>
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
            <em>{signal.detail}</em>
          </article>
        ))}
      </div>
      {operationalMetrics.departmentMetrics?.length > 0 && (
        <div className="operations-metrics-departments" data-testid="react-operations-metrics-departments">
          <strong>Department risk ranking</strong>
          <ol>
            {operationalMetrics.departmentMetrics.slice(0, 4).map(department => (
              <li key={department.departmentRole}>
                <span>{department.departmentRole}</span>
                <strong>{department.taskCompletionPercent}% tasks complete</strong>
                <em>Risk {department.riskScore} · {department.staffingGap} staffing gap · {department.openEscalationCount} open escalations</em>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
