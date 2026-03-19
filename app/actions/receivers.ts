'use server'

import { requireOrganizationContext } from '@/lib/organizations'
import { receiverSchema } from '@/lib/validations/receiver'
import { revalidatePath } from 'next/cache'

/**
 * Create a new receiver
 * Validates: Requirements 18.1, 18.4
 */
export async function createReceiver(formData: FormData) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const validated = receiverSchema.parse({
      name: formData.get('name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      country: formData.get('country'),
    })

    const { data, error } = await supabase
      .from('receivers')
      .insert({ ...validated, org_id: organizationId })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/receivers')
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create receiver' }
  }
}

/**
 * Get all receivers for selection dropdowns
 * Validates: Requirements 18.2
 */
export async function getReceivers() {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('receivers')
      .select('*')
      .eq('org_id', organizationId)
      .order('name', { ascending: true })

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get receivers' }
  }
}
