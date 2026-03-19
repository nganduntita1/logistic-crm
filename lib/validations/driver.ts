import { z } from 'zod'

export const driverSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  license_number: z.string().min(1, 'License number is required'),
  passport_number: z.string().min(1, 'Passport number is required'),
  vehicle_id: z.string().uuid('Invalid vehicle ID').optional().or(z.literal('')),
})

export type DriverFormData = z.infer<typeof driverSchema>
