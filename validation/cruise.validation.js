const { z } = require('zod')

const uuidSchema = z.string().uuid('Invalid UUID format')

const cruiseLineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Cruise line name is required')
    .max(255, 'Cruise line name is too long'),

  country: z
    .string()
    .trim()
    .min(1, 'Country is required')
    .max(255, 'Country is too long')
    .optional(),

  website: z
    .string()
    .trim()
    .url('Website must be a valid URL')
    .max(255, 'Website URL is too long')
    .optional()
}).strict()

const shipSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ship name is required')
    .max(255, 'Ship name is too long'),

  cruiseLineId: uuidSchema
}).strict()

module.exports = {
  cruiseLineSchema,
  shipSchema
}