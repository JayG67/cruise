const turnaroundBriefingJsonSchema = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'riskLevel', 'findings', 'unknowns', 'generatedAt', 'model', 'promptVersion'],
  properties: {
    summary: { type: 'string', minLength: 1, maxLength: 1800 },
    riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    findings: {
      type: 'array',
      maxItems: 30,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['category', 'severity', 'title', 'explanation', 'evidenceIds', 'recommendedAction'],
        properties: {
          category: {
            type: 'string',
            enum: ['task', 'dependency', 'handoff', 'staffing', 'signoff', 'escalation', 'data-quality']
          },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          title: { type: 'string', minLength: 1, maxLength: 240 },
          explanation: { type: 'string', minLength: 1, maxLength: 1200 },
          evidenceIds: {
            type: 'array',
            minItems: 1,
            maxItems: 20,
            items: { type: 'string', minLength: 1, maxLength: 160 }
          },
          recommendedAction: { type: 'string', minLength: 1, maxLength: 600 }
        }
      }
    },
    unknowns: {
      type: 'array',
      maxItems: 20,
      items: { type: 'string', minLength: 1, maxLength: 500 }
    },
    generatedAt: { type: 'string', format: 'date-time' },
    model: { type: 'string', minLength: 1, maxLength: 160 },
    promptVersion: { type: 'string', minLength: 1, maxLength: 80 }
  }
})

module.exports = { turnaroundBriefingJsonSchema }
