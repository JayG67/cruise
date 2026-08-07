import AiEvaluationHistoryWorkspace from './AiEvaluationHistoryWorkspace.jsx'
import AiEvaluationReleaseWorkspace from './AiEvaluationReleaseWorkspace.jsx'

const SUITE_DESCRIPTIONS = {
  'operational-evidence': 'Attacks targeting operational evidence and system output integrity.',
  'prompt-instruction': 'Attacks targeting prompt manipulation and instruction injection.',
  'provider-runtime': 'Attacks targeting provider behavior and runtime stability.'
}

export default function AiQualityEvidenceWorkspace({
  aiAdversarialStatus,
  aiAdversarialSummary,
  aiCiEvidence,
  aiCiEvidenceStatus,
  aiComparisonStatus,
  aiHistoryDecisionFilter,
  aiHistoryProviderFilter,
  aiHistoryProviders,
  aiHistorySearch,
  aiHistorySort,
  aiQualityStatus,
  aiQualitySummary,
  aiReleasePolicy,
  aiReleasePolicyPreview,
  aiReleasePolicyStatus,
  aiRunComparison,
  baselineAiRunId,
  currentAiRunId,
  filteredAiRuns,
  handleCompareAiRuns,
  handlePreviewAiReleasePolicy,
  isComparingAiRuns,
  isPreviewingAiReleasePolicy,
  selectedAiRun,
  selectedAiRunId,
  setAiHistoryDecisionFilter,
  setAiHistoryProviderFilter,
  setAiHistorySearch,
  setAiHistorySort,
  setAiRunComparison,
  setBaselineAiRunId,
  setCurrentAiRunId,
  setSelectedAiRunId,
  updateAiReleasePolicy
}) {
  return (
    <>
      <div className="go-live-readiness-panel ai-release-evidence-panel ce-surface-light" data-testid="react-ai-ci-evidence-panel">
        <div>
          <p className="eyebrow ce-kicker">Automated Release Evidence</p>
          <h3>Continuous integration quality gate</h3>
          <p>{aiCiEvidenceStatus}</p>
        </div>
        <ul className="go-live-readiness-list" aria-label="Automated release evidence summary">
          <li className={`readiness-item ${!aiCiEvidence ? 'pending' : aiCiEvidence.releaseDecision === 'APPROVED' ? 'ready' : 'attention'}`}>
            <span aria-hidden="true">{!aiCiEvidence ? '•' : aiCiEvidence.releaseDecision === 'APPROVED' ? '✓' : '!'}</span>
            <div><strong>CI release decision</strong><p>{aiCiEvidence?.releaseDecision || 'Not available in this runtime'}</p></div>
          </li>
          <li className={`readiness-item ${!aiCiEvidence?.comparison ? 'pending' : aiCiEvidence.comparison.outcome === 'REGRESSION' ? 'attention' : 'ready'}`}>
            <span aria-hidden="true">{!aiCiEvidence?.comparison ? '•' : aiCiEvidence.comparison.outcome === 'REGRESSION' ? '!' : '✓'}</span>
            <div><strong>Historical comparison</strong><p>{aiCiEvidence?.comparison?.outcome || 'No comparison baseline'}</p></div>
          </li>
          <li className={`readiness-item ${!aiCiEvidence ? 'pending' : aiCiEvidence.totals.failed === 0 ? 'ready' : 'attention'}`}>
            <span aria-hidden="true">{!aiCiEvidence ? '•' : aiCiEvidence.totals.failed === 0 ? '✓' : '!'}</span>
            <div><strong>Check results</strong><p>{aiCiEvidence ? `${aiCiEvidence.totals.passed} passed; ${aiCiEvidence.totals.failed} failed.` : 'No CI checks loaded.'}</p></div>
          </li>
        </ul>
        {(aiCiEvidence?.comparison?.newFailures?.length > 0 || aiCiEvidence?.comparison?.resolvedFailures?.length > 0) && (
          <div className="ai-ci-evidence-changes" data-testid="react-ai-ci-evidence-changes">
            <p><strong>New failures:</strong> {aiCiEvidence.comparison.newFailures.join(', ') || 'None'}</p>
            <p><strong>Resolved failures:</strong> {aiCiEvidence.comparison.resolvedFailures.join(', ') || 'None'}</p>
          </div>
        )}
      </div>

      <section className="ai-adversarial-dashboard ce-surface-light" data-testid="react-ai-adversarial-summary-panel" aria-labelledby="ai-adversarial-heading">
        <header className="ai-adversarial-dashboard__header">
          <div className="ai-adversarial-dashboard__intro">
            <p className="eyebrow ce-kicker">AI Adversarial Resilience</p>
            <h3 id="ai-adversarial-heading">AI safety and resilience validation</h3>
            <p className="ai-adversarial-dashboard__description">Comprehensive adversarial testing and resilience validation across all AI system layers.</p>
            <div className={`ai-adversarial-dashboard__gate ${aiAdversarialSummary?.releaseDecision === 'APPROVED' ? 'is-approved' : 'is-blocked'}`}>
              <span aria-hidden="true">{aiAdversarialSummary?.releaseDecision === 'APPROVED' ? '✓' : '!'}</span>
              <strong>Resilience status: {aiAdversarialSummary?.releaseDecision || 'Not available'}</strong>
            </div>
          </div>
          <ul className="ai-adversarial-metrics" aria-label="AI adversarial resilience summary">
            <li className={aiAdversarialSummary?.releaseDecision === 'APPROVED' ? 'is-approved' : 'is-blocked'}><span className="ai-adversarial-metrics__icon" aria-hidden="true">✓</span><span className="ai-adversarial-metrics__label">Release decision</span><strong>{aiAdversarialSummary?.releaseDecision || 'Not available'}</strong><small>{aiAdversarialSummary?.releaseDecision === 'APPROVED' ? 'System cleared for release' : 'Release requires attention'}</small></li>
            <li className={aiAdversarialSummary?.failedScenarios === 0 ? 'is-approved' : 'is-blocked'}><span className="ai-adversarial-metrics__icon" aria-hidden="true">▣</span><span className="ai-adversarial-metrics__label">Scenario coverage</span><strong>{aiAdversarialSummary ? `${aiAdversarialSummary.passedScenarios} / ${aiAdversarialSummary.totalScenarios}` : '—'}</strong><small>{aiAdversarialSummary ? `${aiAdversarialSummary.failedScenarios} failed scenarios` : 'No results available'}</small></li>
            <li className={aiAdversarialSummary?.resilienceScore === 100 ? 'is-approved' : 'is-blocked'}><span className="ai-adversarial-metrics__icon" aria-hidden="true">▥</span><span className="ai-adversarial-metrics__label">Resilience score</span><strong>{aiAdversarialSummary ? `${aiAdversarialSummary.resilienceScore}%` : '—'}</strong><small>{aiAdversarialSummary ? `Across ${aiAdversarialSummary.totalSuites} resilience suites` : 'No score available'}</small></li>
          </ul>
        </header>
        <ul className="ai-adversarial-suite-table" data-testid="react-ai-adversarial-suite-list" aria-label="AI adversarial suite results">
          {(aiAdversarialSummary?.suites || []).map(suite => (
            <li className={suite.releaseDecision === 'APPROVED' ? 'is-approved' : 'is-blocked'} key={suite.id}>
              <span className="ai-adversarial-suite-table__icon" aria-hidden="true">{suite.releaseDecision === 'APPROVED' ? '✓' : '!'}</span>
              <div className="ai-adversarial-suite-table__identity"><strong>{suite.name}</strong><p>{SUITE_DESCRIPTIONS[suite.id] || 'Adversarial resilience validation suite.'}</p></div>
              <div className="ai-adversarial-suite-table__metric"><span>Resilience</span><strong>{suite.resilienceScore}%</strong></div>
              <div className="ai-adversarial-suite-table__metric"><span>Scenarios</span><strong>{suite.passedScenarios} / {suite.totalScenarios}</strong></div>
              <div className="ai-adversarial-suite-table__status"><span>Status</span><strong>{suite.releaseDecision}</strong></div>
            </li>
          ))}
        </ul>
        <footer className="ai-adversarial-dashboard__footer"><span aria-hidden="true">i</span><p>{aiAdversarialStatus || 'Adversarial resilience results are not available.'}</p></footer>
      </section>

      <div className="go-live-readiness-panel ai-evaluation-quality-panel ce-surface-light" data-testid="react-ai-quality-summary-panel">
        <div><p className="eyebrow ce-kicker">AI Evaluation Quality</p><h3>Turnaround briefing quality evidence</h3><p>{aiQualityStatus}</p></div>
        <ul className="go-live-readiness-list" aria-label="AI evaluation quality summary">
          <li className={`readiness-item ${aiQualitySummary?.releaseReadiness === 'READY' ? 'ready' : 'attention'}`}><span aria-hidden="true">{aiQualitySummary?.releaseReadiness === 'READY' ? '✓' : '!'}</span><div><strong>Release readiness</strong><p>{aiQualitySummary?.releaseReadiness || 'No evaluation data'}</p></div></li>
          <li className={`readiness-item ${(aiQualitySummary?.runCount || 0) > 0 ? 'ready' : 'pending'}`}><span aria-hidden="true">{(aiQualitySummary?.runCount || 0) > 0 ? '✓' : '•'}</span><div><strong>Evaluation history</strong><p>{aiQualitySummary?.runCount || 0} runs; {aiQualitySummary?.passingRuns || 0} passing.</p></div></li>
          <li className={`readiness-item ${!aiQualitySummary?.latestRun ? 'pending' : aiQualitySummary.latestRun.passed ? 'ready' : 'attention'}`}><span aria-hidden="true">{!aiQualitySummary?.latestRun ? '•' : aiQualitySummary.latestRun.passed ? '✓' : '!'}</span><div><strong>Latest evaluation</strong><p>{aiQualitySummary?.latestRun ? `${aiQualitySummary.latestRun.passRate}% pass rate and ${aiQualitySummary.latestRun.averageScore} average score.` : 'No persisted evaluation run is available.'}</p></div></li>
        </ul>
        <div className="ai-quality-trend" data-testid="react-ai-quality-trend"><strong>Recent trend: {aiQualitySummary?.trend?.direction || 'No evaluation data'}</strong><span>Pass rate {aiQualitySummary?.trend?.passRateDelta >= 0 ? '+' : ''}{aiQualitySummary?.trend?.passRateDelta || 0} points</span><span>Average score {aiQualitySummary?.trend?.averageScoreDelta >= 0 ? '+' : ''}{aiQualitySummary?.trend?.averageScoreDelta || 0} points</span></div>
        <AiEvaluationReleaseWorkspace {...{ aiComparisonStatus, aiQualitySummary, aiReleasePolicy, aiReleasePolicyPreview, aiReleasePolicyStatus, aiRunComparison, baselineAiRunId, currentAiRunId, handleCompareAiRuns, handlePreviewAiReleasePolicy, isComparingAiRuns, isPreviewingAiReleasePolicy, setAiRunComparison, setBaselineAiRunId, setCurrentAiRunId, updateAiReleasePolicy }} />
        <AiEvaluationHistoryWorkspace {...{ aiHistoryDecisionFilter, aiHistoryProviderFilter, aiHistoryProviders, aiHistorySearch, aiHistorySort, aiQualitySummary, filteredAiRuns, selectedAiRun, selectedAiRunId, setAiHistoryDecisionFilter, setAiHistoryProviderFilter, setAiHistorySearch, setAiHistorySort, setSelectedAiRunId }} />
      </div>
    </>
  )
}
