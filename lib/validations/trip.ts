import { z } from 'zod'

export const tripSchema = z.object({
  route: z.string().min(1, 'Route is required'),
  departure_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid departure date format',
  }),
  expected_arrival: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid expected arrival date format',
  }),
  driver_id: z.string().uuid('Invalid driver ID').optional().or(z.literal('')),
  vehicle_id: z.string().uuid('Invalid vehicle ID').optional().or(z.literal('')),
}).refine((data) => {
  const departure = new Date(data.departure_date)
  const arrival = new Date(data.expected_arrival)
  return arrival >= departure
}, {
  message: 'Expected arrival must be on or after departure date',
  path: ['expected_arrival'],
})

export type TripFormData = z.infer<typeof tripSchema>
