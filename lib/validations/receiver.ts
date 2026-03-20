import { z } from 'zod'

// Phone validation regex - accepts international formats with +, -, spaces, and parentheses
const phoneRegex = /^[0-9+\-\s()]+$/

export const receiverSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone format. Use only digits, +, -, spaces, and parentheses').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
})

export type ReceiverFormData = z.infer<typeof receiverSchema>
