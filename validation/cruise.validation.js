const { z } = require('zod')

const uuidSchema = z
  .string()
  .uuid('Invalid UUID format')

const cruiseLineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Cruise line name is required')
    .max(255, 'Cruise line name is too long'),

  country: z
    .string()
    .trim()
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

  currentPort: z
    .string()
    .trim()
    .min(1, 'Current port is required')
    .max(255, 'Current port is too long'),

  cruiseLineId: uuidSchema
}).strict()

const sailingSchema = z.object({
  departureDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must use YYYY-MM-DD format'),

  port: z
    .string()
    .trim()
    .max(255, 'Port is too long')
    .optional(),

  departurePort: z
    .string()
    .trim()
    .min(1, 'Departure port is required')
    .max(255, 'Departure port is too long'),

  arrivalPort: z
    .string()
    .trim()
    .min(1, 'Arrival port is required')
    .max(255, 'Arrival port is too long'),

  days: z
    .number()
    .int('Days must be a whole number')
    .min(1, 'Days must be at least 1')
    .max(30, 'Days must be 30 or fewer'),

  isRepositioning: z
    .boolean()
    .optional()
    .default(false)
}).strict()

const activityScheduleSchema = z.object({
  time: z
    .string()
    .trim()
    .min(1, 'Activity time is required')
    .max(20, 'Activity time is too long'),

  activity: z
    .string()
    .trim()
    .min(1, 'Activity description is required')
    .max(255, 'Activity description is too long')
}).strict()

const itineraryDaySchema = z.object({
  day: z
    .number()
    .int('Day must be a whole number')
    .min(1, 'Day must be at least 1')
    .max(30, 'Day must be 30 or fewer'),

  title: z
    .string()
    .trim()
    .min(1, 'Itinerary title is required')
    .max(255, 'Itinerary title is too long'),

  port: z
    .string()
    .trim()
    .min(1, 'Itinerary port is required')
    .max(255, 'Itinerary port is too long'),

  activitySchedule: z
    .array(activityScheduleSchema)
    .optional()
    .default([])
}).strict()

module.exports = {
  cruiseLineSchema,
  shipSchema,
  sailingSchema,
  itineraryDaySchema,
  activityScheduleSchema
}
