const { z } = require('zod')

const uuidSchema = z
  .string()
  .uuid('Invalid UUID format')

const customerIdSchema = z
  .string()
  .trim()
  .regex(/^C[A-Z0-9]{9}$/, 'Customer ID must be 10 characters and start with C')

const bookingIdSchema = z
  .string()
  .trim()
  .regex(/^B[A-Z0-9]{9}$/, 'Booking ID must be 10 characters and start with B')

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
    .optional(),

  brandFamily: z
    .string()
    .trim()
    .max(255, 'Brand family is too long')
    .optional(),

  brandTheme: z
    .string()
    .trim()
    .max(255, 'Brand theme is too long')
    .optional(),

  marketPositioning: z
    .string()
    .trim()
    .max(500, 'Market positioning is too long')
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

const customerSchema = z.object({
  id: customerIdSchema,

  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(100, 'First name is too long'),

  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(100, 'Last name is too long'),

  email: z
    .string()
    .trim()
    .email('Email must be a valid email address')
    .max(255, 'Email is too long'),

  phone: z
    .string()
    .trim()
    .max(50, 'Phone is too long')
    .optional(),

  loyaltyNumber: z
    .string()
    .trim()
    .max(100, 'Loyalty number is too long')
    .optional()
}).strict()

const diningPreferenceOptions = [
  'Early seating',
  'Late seating',
  'Anytime dining',
  'My Time dining',
  'Freestyle dining',
  'Rotational dining',
  'Flexible dining',
  'Special dietary request',
  'Kids menu'
]

const diningPreferenceSchema = z
  .string()
  .trim()
  .pipe(z.enum(diningPreferenceOptions))
  .optional()

const bookingPassengerSchema = z.object({
  customerId: customerIdSchema,

  passengerRole: z
    .string()
    .trim()
    .min(1, 'Passenger role is required')
    .max(50, 'Passenger role is too long'),

  isPrimaryGuest: z
    .boolean()
    .optional()
    .default(false),

  diningPreference: diningPreferenceSchema,

  accessibilityNotes: z
    .string()
    .trim()
    .max(255, 'Accessibility notes are too long')
    .optional(),

  boardingGroup: z
    .string()
    .trim()
    .max(50, 'Boarding group is too long')
    .optional()
}).strict()

const bookingSchema = z.object({
  id: bookingIdSchema,

  sailingId: uuidSchema,

  bookingStatus: z
    .string()
    .trim()
    .min(1, 'Booking status is required')
    .max(50, 'Booking status is too long'),

  cabinNumber: z
    .string()
    .trim()
    .max(20, 'Cabin number is too long')
    .optional(),

  fareCode: z
    .string()
    .trim()
    .max(50, 'Fare code is too long')
    .optional(),

  embarkationPort: z
    .string()
    .trim()
    .max(255, 'Embarkation port is too long')
    .optional(),

  debarkationPort: z
    .string()
    .trim()
    .max(255, 'Debarkation port is too long')
    .optional(),

  createdByCustomerId: customerIdSchema.optional(),

  passengers: z
    .array(bookingPassengerSchema)
    .min(1, 'Booking must include at least one passenger')
}).strict()

const bookingPassengerCreateSchema = bookingPassengerSchema.strict()

const passengerCustomerUpdateSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().trim().email('Email must be valid').max(255),
  phone: z.string().trim().max(50).optional(),
  diningPreference: diningPreferenceSchema,
  accessibilityNotes: z.string().trim().max(255).optional()
}).strict()

const bookingPreferenceUpdateSchema = z.object({
  diningPreference: diningPreferenceSchema,
  accessibilityNotes: z.string().trim().max(255).optional()
}).strict()

const itineraryFavoriteSchema = z.object({
  customerId: customerIdSchema,
  activityScheduleId: uuidSchema
}).strict()


module.exports = {
  cruiseLineSchema,
  shipSchema,
  sailingSchema,
  itineraryDaySchema,
  activityScheduleSchema,
  customerSchema,
  bookingSchema,
  bookingPassengerCreateSchema,
  passengerCustomerUpdateSchema,
  bookingPreferenceUpdateSchema,
  itineraryFavoriteSchema,
  customerIdSchema,
  bookingIdSchema
}
