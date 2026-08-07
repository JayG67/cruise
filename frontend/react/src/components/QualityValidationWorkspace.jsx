import ConfirmActionPanel from './ConfirmActionPanel.jsx'
import { getReadinessItemSymbol } from '../domain/sqaConsole.js'

export default function QualityValidationWorkspace({
  isRunning,
  lastRun,
  output,
  readinessChecklist,
  resetConfirmationVisible,
  validationActions,
  onCancelReset,
  onClearOutput,
  onConfirmReset,
  onRequestReset,
  onRunValidation
}) {
  return (
    <>
      <div className="go-live-readiness-panel ce-surface-light" data-testid="react-go-live-readiness-panel">
        <div>
          <p className="eyebrow ce-kicker">Go-Live Readiness</p>
          <h3>Manual approval checklist</h3>
          <p>
            Use this checklist as the final human review path before authorizing an operational release.
            Automated checks support the decision, but final approval should include role, operations, fleet, passenger, and quality review.
          </p>
        </div>
        <ul className="go-live-readiness-list" aria-label="Go-live manual approval checklist">
          {readinessChecklist.map(item => (
            <li key={item.label} className={`readiness-item ${item.status || (item.passed ? 'ready' : 'attention')}`}>
              <span aria-hidden="true">{getReadinessItemSymbol(item.status || (item.passed ? 'ready' : 'attention'))}</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="react-sqa-action-grid" aria-label="Quality validation actions">
        {validationActions.map(action => (
          <article className="react-sqa-action-card ce-command-card ce-surface-light" key={action.key}>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
            <button type="button" onClick={() => onRunValidation(action)} disabled={isRunning} data-testid={action.testId}>
              {action.buttonLabel}
            </button>
          </article>
        ))}
        <article className="react-sqa-action-card danger-card ce-surface-light">
          <h3>Baseline Data Recovery</h3>
          <p>Reset baseline data after administrative workflow review.</p>
          <button type="button" className="danger-action-button ce-button-danger" onClick={onRequestReset} disabled={isRunning} data-testid="react-sqa-reset-demo-data-button">
            Reset Baseline Data
          </button>
          {resetConfirmationVisible && (
            <ConfirmActionPanel
              title="Reset baseline data"
              message="Reset baseline data back to the baseline dataset?"
              confirmLabel="Reset Baseline Data"
              cancelLabel="Keep Current Data"
              onConfirm={onConfirmReset}
              onCancel={onCancelReset}
              isWorking={isRunning}
              testId="react-sqa-reset-confirmation"
            />
          )}
        </article>
      </div>

      <div className="react-sqa-output-header">
        <div>
          <p className="eyebrow ce-kicker">Validation Output</p>
          <h3>Latest manual validation result</h3>
          <p>This environment allows controlled CRUD changes. Use Reset Baseline Data to restore the original baseline dataset.</p>
        </div>
        <div className="react-sqa-output-actions ce-action-row">
          <span>{lastRun}</span>
          <button type="button" className="secondary-button ce-button-secondary" onClick={onClearOutput}>
            Clear Output
          </button>
        </div>
      </div>

      <div className="react-sqa-report-links" aria-label="Quality report links">
        <a href="https://jayg67.github.io/cruise/" target="_blank" rel="noopener noreferrer">View Quality Dashboard</a>
        <a href="https://jayg67.github.io/cruise/lighthouse/" target="_blank" rel="noopener noreferrer">View Latest Lighthouse Mobile Report</a>
        <a href="https://jayg67.github.io/cruise/coverage/" target="_blank" rel="noopener noreferrer">View Latest Jest Coverage Report</a>
      </div>

      <pre className="react-sqa-output" role="status" aria-live="polite" aria-label="Quality validation output" data-testid="react-sqa-output">
        {output}
      </pre>
    </>
  )
}
