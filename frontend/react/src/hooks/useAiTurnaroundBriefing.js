import { useCallback, useEffect, useRef, useState } from 'react'

import {
  generateOperationalAiBriefing,
  getOperationalAiBriefingHistory,
  reviewOperationalAiBriefing
} from '../api/client.js'

function normalizeGeneratedBriefing(response = {}) {
  const briefingId = response?.audit?.briefingId || response?.briefingId || response?.audit?.requestId || ''

  return {
    briefingId,
    operationId: response?.audit?.operationId || response?.operation?.id || '',
    question: response?.audit?.question || null,
    briefing: response?.briefing || null,
    provider: response?.audit?.provider || null,
    model: response?.audit?.model || response?.briefing?.model || null,
    promptVersion: response?.audit?.promptVersion || response?.briefing?.promptVersion || null,
    evidenceCount: response?.audit?.evidenceCount || response?.evidenceSummary?.included || 0,
    generatedAt: response?.audit?.generatedAt || response?.briefing?.generatedAt || null,
    evidenceSummary: response?.evidenceSummary || null,
    review: null
  }
}

export default function useAiTurnaroundBriefing({ operationId = '', selectedDemoUser = null, enabled = true } = {}) {
  const historyAbortRef = useRef(null)
  const [history, setHistory] = useState([])
  const [currentBriefing, setCurrentBriefing] = useState(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [reviewingBriefingId, setReviewingBriefingId] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const requestScope = { selectedDemoUser }

  const loadHistory = useCallback(async () => {
    historyAbortRef.current?.abort()

    if (!enabled || !operationId) {
      setHistory([])
      setCurrentBriefing(null)
      setIsLoadingHistory(false)
      return []
    }

    const controller = new AbortController()
    historyAbortRef.current = controller
    setIsLoadingHistory(true)
    setError('')

    try {
      const response = await getOperationalAiBriefingHistory(operationId, {
        signal: controller.signal,
        selectedDemoUser,
        limit: 20
      })
      const briefings = Array.isArray(response?.briefings) ? response.briefings : []
      setHistory(briefings)
      setCurrentBriefing(current => {
        if (!briefings.length) return null
        if (!current?.briefingId) return briefings[0]
        return briefings.find(item => item.briefingId === current.briefingId) || briefings[0]
      })
      return briefings
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setHistory([])
        setCurrentBriefing(null)
        setError(loadError.message || 'Unable to load AI turnaround briefing history.')
      }
      return []
    } finally {
      if (!controller.signal.aborted) setIsLoadingHistory(false)
    }
  }, [enabled, operationId, selectedDemoUser?.id])

  useEffect(() => {
    setStatus('')
    setError('')
    loadHistory()

    return () => historyAbortRef.current?.abort()
  }, [loadHistory])

  const generateBriefing = useCallback(async question => {
    const trimmedQuestion = String(question || '').trim()
    if (!operationId || !trimmedQuestion || isGenerating) return null

    setIsGenerating(true)
    setError('')
    setStatus('')

    try {
      const response = await generateOperationalAiBriefing(
        operationId,
        { question: trimmedQuestion },
        requestScope
      )
      const generated = normalizeGeneratedBriefing(response)
      setHistory(current => [
        generated,
        ...current.filter(item => item.briefingId !== generated.briefingId)
      ])
      setCurrentBriefing(generated)
      setStatus('AI turnaround briefing generated successfully.')
      return generated
    } catch (generationError) {
      setError(generationError.message || 'Unable to generate the AI turnaround briefing.')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [operationId, selectedDemoUser?.id, isGenerating])

  const reviewBriefing = useCallback(async (briefingId, disposition, notes = '') => {
    if (!operationId || !briefingId || reviewingBriefingId) return null

    setReviewingBriefingId(briefingId)
    setError('')
    setStatus('')

    try {
      const review = await reviewOperationalAiBriefing(
        operationId,
        briefingId,
        { disposition, notes: String(notes || '').trim() || undefined },
        requestScope
      )
      setHistory(current => current.map(item => (
        item.briefingId === briefingId ? { ...item, review } : item
      )))
      setCurrentBriefing(current => (
        current?.briefingId === briefingId ? { ...current, review } : current
      ))
      setStatus('Human review saved successfully.')
      return review
    } catch (reviewError) {
      setError(reviewError.message || 'Unable to save the AI turnaround briefing review.')
      return null
    } finally {
      setReviewingBriefingId('')
    }
  }, [operationId, selectedDemoUser?.id, reviewingBriefingId])

  return {
    history,
    currentBriefing,
    setCurrentBriefing,
    isLoadingHistory,
    isGenerating,
    reviewingBriefingId,
    error,
    status,
    loadHistory,
    generateBriefing,
    reviewBriefing
  }
}
