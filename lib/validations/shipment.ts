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
  amount_paid: z.number().nonnegative('Amount paid cannot be negative'),
  payment_status: z.enum(['unpaid', 'partial', 'paid']),
}).superRefine((data, ctx) => {
  if (data.amount_paid > data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['amount_paid'],
      message: 'Amount paid cannot exceed shipment price',
    })
  }

  if (data.payment_status === 'unpaid' && data.amount_paid !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['amount_paid'],
      message: 'Unpaid shipments must have amount paid set to 0',
    })
  }

  if (data.payment_status === 'partial' && (data.amount_paid <= 0 || data.amount_paid >= data.price)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['amount_paid'],
      message: 'Partial payment must be greater than 0 and less than total price',
    })
  }

  if (data.payment_status === 'paid' && data.amount_paid !== data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['amount_paid'],
      message: 'Paid shipments must have amount paid equal to total price',
    })
  }
})

export type ShipmentFormData = z.infer<typeof shipmentSchema>
