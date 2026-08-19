const { AiProviderError } = require('./aiProvider.service')
const { turnaroundBriefingJsonSchema } = require('../ai/contracts/turnaroundBriefing.jsonSchema')
const { estimateUsageCostUsd, getAiPricingConfig } = require('./aiCostEstimation.service')

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_OPENAI_MODEL = 'gpt-5-mini'

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function normalizeProviderTokenCount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

function normalizeOpenAiUsage(usage = {}, pricing = {}) {
  const inputTokens = normalizeProviderTokenCount(usage?.input_tokens)
  const outputTokens = normalizeProviderTokenCount(usage?.output_tokens)
  const suppliedTotal = normalizeProviderTokenCount(usage?.total_tokens)
  const totalTokens = suppliedTotal > 0 ? suppliedTotal : inputTokens + outputTokens
  return {
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd: estimateUsageCostUsd({ inputTokens, outputTokens }, pricing)
  }
}

function extractResponseText(payload = {}) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text

  for (const item of Array.isArray(payload.output) ? payload.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if ((content?.type === 'output_text' || content?.type === 'text') && typeof content.text === 'string') {
        return content.text
      }
    }
  }
  return ''
}

function mapOpenAiHttpError(status, payload = {}, requestId = null) {
  const providerMessage = payload?.error?.message || 'OpenAI request failed.'
  const details = { status, requestId }
  if (status === 401 || status === 403) {
    return new AiProviderError('OpenAI credentials were rejected.', 'AI_PROVIDER_CREDENTIALS_INVALID', details)
  }
  if (status === 429) {
    return new AiProviderError('OpenAI rate limit was reached.', 'AI_PROVIDER_RATE_LIMITED', details)
  }
  if (status >= 500) {
    return new AiProviderError('OpenAI is temporarily unavailable.', 'AI_PROVIDER_TEMPORARILY_UNAVAILABLE', details)
  }
  return new AiProviderError(providerMessage, 'AI_PROVIDER_REQUEST_REJECTED', details)
}

function buildOpenAiRequest({ model, prompt, metadata }) {
  return {
    model,
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: prompt.system }]
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: JSON.stringify(prompt.user) }]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'turnaround_briefing',
        description: 'Evidence-grounded cruise turnaround readiness briefing.',
        strict: true,
        schema: turnaroundBriefingJsonSchema
      }
    },
    metadata: Object.fromEntries(
      Object.entries(metadata || {})
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => [key, String(value).slice(0, 512)])
    )
  }
}

function createOpenAiResponsesProvider({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
  baseUrl = process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL,
  fetchImpl = global.fetch,
  pricing = getAiPricingConfig()
} = {}) {
  return {
    name: 'openai',
    model,
    credentialConfigured: Boolean(String(apiKey || '').trim()),
    async generateStructured({ prompt, metadata } = {}) {
      if (!String(apiKey || '').trim()) {
        throw new AiProviderError(
          'OPENAI_API_KEY is required when AI_PROVIDER=openai.',
          'AI_PROVIDER_CREDENTIALS_MISSING'
        )
      }
      if (typeof fetchImpl !== 'function') {
        throw new AiProviderError('No fetch implementation is available for OpenAI.', 'AI_PROVIDER_INVALID')
      }

      let response
      try {
        response = await fetchImpl(`${trimTrailingSlash(baseUrl)}/responses`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(buildOpenAiRequest({ model, prompt, metadata }))
        })
      } catch (error) {
        throw new AiProviderError('OpenAI network request failed.', 'AI_PROVIDER_NETWORK_ERROR', {
          causeName: error?.name || 'Error'
        })
      }

      const requestId = response.headers?.get?.('x-request-id') || null
      let payload
      try {
        payload = await response.json()
      } catch {
        throw new AiProviderError('OpenAI returned an unreadable response.', 'AI_PROVIDER_RESPONSE_INVALID', {
          status: response.status,
          requestId
        })
      }

      if (!response.ok) throw mapOpenAiHttpError(response.status, payload, requestId)
      if (payload.status && payload.status !== 'completed') {
        throw new AiProviderError('OpenAI did not complete the response.', 'AI_PROVIDER_RESPONSE_INCOMPLETE', {
          status: payload.status,
          requestId
        })
      }

      const outputText = extractResponseText(payload)
      if (!outputText) {
        throw new AiProviderError('OpenAI returned no structured output.', 'AI_PROVIDER_RESPONSE_INVALID', { requestId })
      }

      let output
      try {
        output = JSON.parse(outputText)
      } catch {
        throw new AiProviderError('OpenAI structured output was not valid JSON.', 'AI_PROVIDER_RESPONSE_INVALID', { requestId })
      }

      return {
        output,
        usage: normalizeOpenAiUsage(payload.usage, pricing),
        providerMetadata: {
          responseId: payload.id || null,
          requestId,
          serviceTier: payload.service_tier || null
        }
      }
    }
  }
}

module.exports = {
  DEFAULT_OPENAI_BASE_URL,
  DEFAULT_OPENAI_MODEL,
  buildOpenAiRequest,
  createOpenAiResponsesProvider,
  extractResponseText,
  mapOpenAiHttpError,
  normalizeOpenAiUsage,
  trimTrailingSlash
}
