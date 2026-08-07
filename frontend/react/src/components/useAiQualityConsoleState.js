import { useEffect, useMemo, useState } from 'react'

import {
  compareAiEvaluationRuns,
  getAiAdversarialQualitySummary,
  getAiCiEvidenceSummary,
  getAiEvaluationQualitySummary,
  previewAiEvaluationReleasePolicy
} from '../api/client.js'
import { filterAndSortAiRuns, getAiHistoryProviders } from '../domain/sqaConsole.js'

const DEFAULT_RELEASE_POLICY = {
  minimumPassRate: 100,
  minimumAverageScore: 80,
  minimumPassRateDelta: 0,
  minimumAverageScoreDelta: 0,
  allowNewFailedCases: false
}

export default function useAiQualityConsoleState(selectedDemoUser) {
  const [aiQualitySummary, setAiQualitySummary] = useState(null)
  const [aiCiEvidence, setAiCiEvidence] = useState(null)
  const [aiCiEvidenceStatus, setAiCiEvidenceStatus] = useState('Loading automated release evidence...')
  const [aiAdversarialSummary, setAiAdversarialSummary] = useState(null)
  const [aiAdversarialStatus, setAiAdversarialStatus] = useState('Loading AI resilience evidence...')
  const [aiQualityStatus, setAiQualityStatus] = useState('Loading AI evaluation quality...')
  const [selectedAiRunId, setSelectedAiRunId] = useState(null)
  const [currentAiRunId, setCurrentAiRunId] = useState('')
  const [baselineAiRunId, setBaselineAiRunId] = useState('')
  const [aiRunComparison, setAiRunComparison] = useState(null)
  const [aiComparisonStatus, setAiComparisonStatus] = useState('Select two evaluation runs to compare.')
  const [isComparingAiRuns, setIsComparingAiRuns] = useState(false)
  const [aiReleasePolicy, setAiReleasePolicy] = useState(DEFAULT_RELEASE_POLICY)
  const [aiReleasePolicyPreview, setAiReleasePolicyPreview] = useState(null)
  const [aiReleasePolicyStatus, setAiReleasePolicyStatus] = useState('Adjust thresholds and preview the release decision.')
  const [isPreviewingAiReleasePolicy, setIsPreviewingAiReleasePolicy] = useState(false)
  const [aiHistoryDecisionFilter, setAiHistoryDecisionFilter] = useState('ALL')
  const [aiHistoryProviderFilter, setAiHistoryProviderFilter] = useState('ALL')
  const [aiHistorySearch, setAiHistorySearch] = useState('')
  const [aiHistorySort, setAiHistorySort] = useState('completed-desc')

  useEffect(() => {
    let active = true
    getAiCiEvidenceSummary({ selectedDemoUser })
      .then(summary => {
        if (!active) return
        setAiCiEvidence(summary)
        setAiCiEvidenceStatus(summary.state === 'AVAILABLE' ? 'Automated release evidence loaded' : summary.message)
      })
      .catch(error => {
        if (active) setAiCiEvidenceStatus(error.message || 'Automated release evidence unavailable')
      })
    return () => { active = false }
  }, [selectedDemoUser])

  useEffect(() => {
    let active = true
    getAiAdversarialQualitySummary({ selectedDemoUser })
      .then(summary => {
        if (!active) return
        setAiAdversarialSummary(summary)
        setAiAdversarialStatus(summary.releaseDecision === 'APPROVED' ? 'AI resilience validation approved' : 'AI resilience validation requires attention')
      })
      .catch(error => {
        if (active) setAiAdversarialStatus(error.message || 'AI resilience evidence unavailable')
      })
    return () => { active = false }
  }, [selectedDemoUser])

  useEffect(() => {
    let active = true
    getAiEvaluationQualitySummary({ selectedDemoUser, limit: 10 })
      .then(summary => {
        if (!active) return
        setAiQualitySummary(summary)
        if (summary.releasePolicy) setAiReleasePolicy(summary.releasePolicy)
        const runs = summary.runs || []
        setCurrentAiRunId(current => current || runs[0]?.runId || '')
        setBaselineAiRunId(current => current || runs[runs.length - 1]?.runId || '')
        setAiQualityStatus(summary.releaseReadiness === 'READY' ? 'AI release gate ready' : summary.releaseReadiness === 'BLOCKED' ? 'AI release gate blocked' : 'No AI evaluation runs yet')
      })
      .catch(error => {
        if (active) setAiQualityStatus(error.message || 'AI evaluation quality unavailable')
      })
    return () => { active = false }
  }, [selectedDemoUser])

  const aiHistoryProviders = useMemo(() => getAiHistoryProviders(aiQualitySummary?.runs), [aiQualitySummary])
  const filteredAiRuns = useMemo(() => filterAndSortAiRuns(aiQualitySummary?.runs, {
    decision: aiHistoryDecisionFilter,
    provider: aiHistoryProviderFilter,
    search: aiHistorySearch,
    sort: aiHistorySort
  }), [aiHistoryDecisionFilter, aiHistoryProviderFilter, aiHistorySearch, aiHistorySort, aiQualitySummary])
  const selectedAiRun = aiQualitySummary?.runs?.find(run => run.runId === selectedAiRunId) || null

  async function handleCompareAiRuns() {
    if (!currentAiRunId || !baselineAiRunId) {
      setAiComparisonStatus('Select both a current run and a baseline run.')
      return
    }
    if (currentAiRunId === baselineAiRunId) {
      setAiComparisonStatus('Current and baseline evaluation runs must be different.')
      return
    }

    setIsComparingAiRuns(true)
    setAiComparisonStatus('Comparing evaluation runs...')
    try {
      const comparison = await compareAiEvaluationRuns(currentAiRunId, baselineAiRunId, { selectedDemoUser })
      setAiRunComparison(comparison)
      setAiComparisonStatus(comparison.regressed ? 'Regression detected against the selected baseline.' : 'No release-blocking regression detected.')
    } catch (error) {
      setAiRunComparison(null)
      setAiComparisonStatus(error.message || 'Evaluation comparison unavailable.')
    } finally {
      setIsComparingAiRuns(false)
    }
  }

  function updateAiReleasePolicy(field, value) {
    setAiReleasePolicy(current => ({ ...current, [field]: value }))
    setAiReleasePolicyPreview(null)
  }

  async function handlePreviewAiReleasePolicy() {
    if (!currentAiRunId || !baselineAiRunId || currentAiRunId === baselineAiRunId) {
      setAiReleasePolicyStatus('Select two different evaluation runs before previewing the release policy.')
      return
    }

    setIsPreviewingAiReleasePolicy(true)
    setAiReleasePolicyStatus('Evaluating the selected release policy...')
    try {
      const preview = await previewAiEvaluationReleasePolicy({
        suiteId: aiQualitySummary?.suiteId || 'turnaround-briefing-phase3',
        currentRunId: currentAiRunId,
        baselineRunId: baselineAiRunId,
        policy: aiReleasePolicy
      }, { selectedDemoUser })
      setAiReleasePolicyPreview(preview)
      setAiReleasePolicyStatus(preview.passed ? 'The candidate satisfies the selected release policy.' : 'The candidate is blocked by the selected release policy.')
    } catch (error) {
      setAiReleasePolicyPreview(null)
      setAiReleasePolicyStatus(error.message || 'Release-policy preview unavailable.')
    } finally {
      setIsPreviewingAiReleasePolicy(false)
    }
  }

  return {
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
  }
}
