import {
  getReactPilotLaunchRecommendation,
  reactPilotLaunchSteps,
  summarizeReactPilotLaunch
} from '../domain/reactPilotLaunch.js'

const statusLabels = {
  ready: 'Ready',
  watch: 'Watch',
  blocked: 'Blocked'
}

export default function ReactPilotLaunchPanel({
  steps = reactPilotLaunchSteps
}) {
  const summary = summarizeReactPilotLaunch(steps)
  const recommendation = getReactPilotLaunchRecommendation(steps)

  return (
    <section className="pilot-card" aria-labelledby="react-pilot-heading" data-testid="react-pilot-launch-panel">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Stage 20 pilot launch path</p>
          <h2 id="react-pilot-heading">React pilot launch checklist</h2>
          <p className="section-summary">
            This stage compresses the remaining migration into a practical launch path: validate the build,
            preserve the legacy fallback, and add browser parity checks before replacing the production DOM workflow.
          </p>
        </div>
        <div className="pilot-summary" aria-label="React pilot launch summary" data-testid="react-pilot-summary">
          <span>{summary.ready} ready</span>
          <span>{summary.watch} watch</span>
          <span>{summary.blocked} blocked</span>
        </div>
      </div>

      <p className="status-card compact" role="status" data-testid="react-pilot-recommendation">
        {recommendation}
      </p>

      <ol className="pilot-step-list" data-testid="react-pilot-steps">
        {steps.map(step => (
          <li className={`pilot-step ${step.status}`} key={step.id} data-testid={`react-pilot-step-${step.id}`}>
            <p className="gate-status">{statusLabels[step.status] || step.status}</p>
            <h3>{step.label}</h3>
            <p>{step.evidence}</p>
            <small>Owner: {step.owner}</small>
          </li>
        ))}
      </ol>
    </section>
  )
}
