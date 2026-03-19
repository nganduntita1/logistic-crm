import { z } from 'zod'

// Phone validation regex - accepts international formats with +, -, spaces, and parentheses
const phoneRegex = /^[0-9+\-\s()]+$/

export const receiverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(phoneRegex, 'Invalid phone format. Use only digits, +, -, spaces, and parentheses'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
})

export type ReceiverFormData = z.infer<typeof receiverSchema>
