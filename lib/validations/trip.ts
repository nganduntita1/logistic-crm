import { z } from 'zod'

export const tripSchema = z.object({
  route: z.string(),
  transport_mode: z.enum(['road', 'air']),
  air_origin: z.string().optional().or(z.literal('')),
  air_destination: z.string().optional().or(z.literal('')),
  air_eta_days: z.coerce.number().int().optional(),
  departure_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid departure date format',
  }),
  expected_arrival: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid expected arrival date format',
  }),
  driver_id: z.string().uuid('Invalid driver ID').optional().or(z.literal('')),
  vehicle_id: z.string().uuid('Invalid vehicle ID').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.transport_mode === 'road' && (!data.route || data.route.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['route'],
      message: 'Route is required for road trips',
    })
  }

  if (data.transport_mode === 'air') {
    if (!data.air_origin || data.air_origin.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['air_origin'],
        message: 'Origin is required for air trips',
      })
    }

    if (!data.air_destination || data.air_destination.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['air_destination'],
        message: 'Destination is required for air trips',
      })
    }

    if (data.air_eta_days !== 1 && data.air_eta_days !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['air_eta_days'],
        message: 'Air ETA must be 1 or 2 days',
      })
    }
  }
}).refine((data) => {
  const departure = new Date(data.departure_date)
  const arrival = new Date(data.expected_arrival)
  return arrival >= departure
}, {
  message: 'Expected arrival must be on or after departure date',
  path: ['expected_arrival'],
})

export type TripFormData = z.infer<typeof tripSchema>
