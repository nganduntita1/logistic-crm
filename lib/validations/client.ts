import { z } from 'zod'

// Phone validation regex - accepts international formats with +, -, spaces, and parentheses
const phoneRegex = /^[0-9+\-\s()]+$/

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(phoneRegex, 'Invalid phone format. Use only digits, +, -, spaces, and parentheses'),
  whatsapp: z.string().regex(phoneRegex, 'Invalid WhatsApp format. Use only digits, +, -, spaces, and parentheses').optional().or(z.literal('')),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type ClientFormData = z.infer<typeof clientSchema>
