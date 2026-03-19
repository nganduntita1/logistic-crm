import { z } from 'zod'

export const vehicleSchema = z.object({
  plate_number: z.string().min(1, 'Plate number is required'),
  type: z.string().min(1, 'Vehicle type is required'),
  capacity: z.number().positive('Capacity must be positive'),
  insurance_expiry: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid insurance expiry date format',
  }),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>
