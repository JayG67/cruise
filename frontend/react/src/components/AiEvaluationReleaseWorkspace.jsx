export default function AiEvaluationReleaseWorkspace({
  aiComparisonStatus,
  aiQualitySummary,
  aiReleasePolicy,
  aiReleasePolicyPreview,
  aiReleasePolicyStatus,
  aiRunComparison,
  baselineAiRunId,
  currentAiRunId,
  handleCompareAiRuns,
  handlePreviewAiReleasePolicy,
  isComparingAiRuns,
  isPreviewingAiReleasePolicy,
  setAiRunComparison,
  setBaselineAiRunId,
  setCurrentAiRunId,
  updateAiReleasePolicy
}) {
  const runs = aiQualitySummary?.runs || []
  const sameRunSelected = Boolean(currentAiRunId && currentAiRunId === baselineAiRunId)
  const selectionIncomplete = !currentAiRunId || !baselineAiRunId || sameRunSelected

  function formatRunOption(run) {
    const completedAt = run.completedAt ? new Date(run.completedAt).toLocaleString() : 'Unknown date'
    return `${run.runId} · ${run.passRate}% · ${completedAt}`
  }

  function selectCurrentRun(event) {
    setCurrentAiRunId(event.target.value)
    setAiRunComparison(null)
  }

  function selectBaselineRun(event) {
    setBaselineAiRunId(event.target.value)
    setAiRunComparison(null)
  }

  return (
    <>
      <section className="ai-baseline-comparison" data-testid="react-ai-baseline-comparison" aria-labelledby="ai-baseline-comparison-heading">
        <div>
          <p className="eyebrow ce-kicker">Baseline comparison</p>
          <h4 id="ai-baseline-comparison-heading">Compare evaluation runs</h4>
          <p>Choose a candidate run and a historical baseline to identify score regressions, new failed cases, and recovered cases.</p>
        </div>
        <div className="ai-baseline-controls">
          <label>
            <span>Current run</span>
            <select data-testid="react-ai-current-run-select" value={currentAiRunId} onChange={selectCurrentRun}>
              <option value="">Select current run</option>
              {runs.map(run => <option key={`current-${run.runId}`} value={run.runId}>{formatRunOption(run)}</option>)}
            </select>
          </label>
          <label>
            <span>Baseline run</span>
            <select data-testid="react-ai-baseline-run-select" value={baselineAiRunId} onChange={selectBaselineRun}>
              <option value="">Select baseline run</option>
              {runs.map(run => <option key={`baseline-${run.runId}`} value={run.runId}>{formatRunOption(run)}</option>)}
            </select>
          </label>
          <button type="button" className="secondary-button ce-button-secondary" data-testid="react-ai-compare-runs-button" onClick={handleCompareAiRuns} disabled={isComparingAiRuns || selectionIncomplete}>
            {isComparingAiRuns ? 'Comparing...' : 'Compare Runs'}
          </button>
        </div>
        <p className="ai-comparison-status" aria-live="polite">{aiComparisonStatus}</p>
        {aiRunComparison && (
          <div className={`ai-comparison-result ${aiRunComparison.regressed ? 'regressed' : 'stable'}`} data-testid="react-ai-comparison-result">
            <div className="ai-comparison-decision">
              <strong>{aiRunComparison.regressed ? 'REGRESSION' : 'ACCEPTABLE'}</strong>
              <span>{aiRunComparison.currentRunId} compared with {aiRunComparison.baselineRunId}</span>
            </div>
            <dl className="ai-comparison-metrics">
              <div><dt>Pass-rate change</dt><dd>{aiRunComparison.passRateDelta >= 0 ? '+' : ''}{aiRunComparison.passRateDelta} points</dd></div>
              <div><dt>Average-score change</dt><dd>{aiRunComparison.averageScoreDelta >= 0 ? '+' : ''}{aiRunComparison.averageScoreDelta} points</dd></div>
              <div><dt>New failed cases</dt><dd>{aiRunComparison.newFailedCases?.join(', ') || 'None'}</dd></div>
              <div><dt>Recovered cases</dt><dd>{aiRunComparison.recoveredCases?.join(', ') || 'None'}</dd></div>
              <div><dt>Release-policy reasons</dt><dd>{aiRunComparison.reasons?.join(', ') || 'None'}</dd></div>
            </dl>
          </div>
        )}
      </section>

      <section className="ai-release-policy-controls" data-testid="react-ai-release-policy-controls" aria-labelledby="ai-release-policy-heading">
        <div>
          <p className="eyebrow ce-kicker">Release policy controls</p>
          <h4 id="ai-release-policy-heading">Preview quality-gate thresholds</h4>
          <p>Adjust the candidate quality and regression thresholds, then preview whether the selected current run would be approved against the selected baseline.</p>
        </div>
        <div className="ai-release-policy-grid">
          <label><span>Minimum pass rate</span><input data-testid="react-ai-policy-minimum-pass-rate" type="number" min="0" max="100" step="1" value={aiReleasePolicy.minimumPassRate} onChange={event => updateAiReleasePolicy('minimumPassRate', Number(event.target.value))} /></label>
          <label><span>Minimum average score</span><input data-testid="react-ai-policy-minimum-average-score" type="number" min="0" max="100" step="1" value={aiReleasePolicy.minimumAverageScore} onChange={event => updateAiReleasePolicy('minimumAverageScore', Number(event.target.value))} /></label>
          <label><span>Minimum pass-rate change</span><input data-testid="react-ai-policy-minimum-pass-rate-delta" type="number" min="-100" max="100" step="1" value={aiReleasePolicy.minimumPassRateDelta} onChange={event => updateAiReleasePolicy('minimumPassRateDelta', Number(event.target.value))} /></label>
          <label><span>Minimum score change</span><input data-testid="react-ai-policy-minimum-score-delta" type="number" min="-100" max="100" step="1" value={aiReleasePolicy.minimumAverageScoreDelta} onChange={event => updateAiReleasePolicy('minimumAverageScoreDelta', Number(event.target.value))} /></label>
          <label className="ai-release-policy-checkbox"><input data-testid="react-ai-policy-allow-new-failures" type="checkbox" checked={aiReleasePolicy.allowNewFailedCases} onChange={event => updateAiReleasePolicy('allowNewFailedCases', event.target.checked)} /><span>Allow newly failed evaluation cases</span></label>
        </div>
        <button type="button" className="secondary-button ce-button-secondary" data-testid="react-ai-preview-release-policy-button" onClick={handlePreviewAiReleasePolicy} disabled={isPreviewingAiReleasePolicy || selectionIncomplete}>{isPreviewingAiReleasePolicy ? 'Evaluating...' : 'Preview Release Decision'}</button>
        <p className="ai-release-policy-status" aria-live="polite">{aiReleasePolicyStatus}</p>
        {aiReleasePolicyPreview && (
          <div className={`ai-release-policy-result ${aiReleasePolicyPreview.passed ? 'approved' : 'blocked'}`} data-testid="react-ai-release-policy-result">
            <strong>{aiReleasePolicyPreview.decision}</strong>
            <span>{aiReleasePolicyPreview.failureCount} policy failure{aiReleasePolicyPreview.failureCount === 1 ? '' : 's'}</span>
            <ul>{aiReleasePolicyPreview.failures.length ? aiReleasePolicyPreview.failures.map((failure, index) => <li key={`${failure.reason}-${index}`}>{failure.reason.replaceAll('-', ' ')}{failure.actual !== undefined ? `: ${failure.actual} (required ${failure.required})` : failure.caseIds?.length ? `: ${failure.caseIds.join(', ')}` : ''}</li>) : <li>All selected quality and regression thresholds passed.</li>}</ul>
          </div>
        )}
      </section>
    </>
  )
}
