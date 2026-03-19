import { z } from 'zod'

export const shipmentSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  receiver_id: z.string().uuid('Invalid receiver ID'),
  trip_id: z.string().uuid('Invalid trip ID').optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be positive'),
  weight: z.number().positive('Weight must be positive'),
  value: z.number().nonnegative('Value cannot be negative'),
  price: z.number().nonnegative('Price cannot be negative'),
  payment_status: z.enum(['unpaid', 'partial', 'paid']),
})

export type ShipmentFormData = z.infer<typeof shipmentSchema>
