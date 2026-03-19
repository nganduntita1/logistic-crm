'use server'

import { requireOrganizationContext } from '@/lib/organizations'
import { clientSchema } from '@/lib/validations/client'
import { revalidatePath } from 'next/cache'

/**
 * Create a new client
 * Validates: Requirements 3.1, 3.5, 12.2
 */
export async function createClient(formData: FormData) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    // Validate input
    const validated = clientSchema.parse({
      name: formData.get('name'),
      phone: formData.get('phone'),
      whatsapp: formData.get('whatsapp') || '',
      email: formData.get('email') || '',
      address: formData.get('address') || '',
      city: formData.get('city') || '',
      country: formData.get('country') || '',
      notes: formData.get('notes') || '',
    })

    // Insert client
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...validated, org_id: organizationId })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/clients')
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create client' }
  }
}

/**
 * Update an existing client
 * Validates: Requirements 3.2, 3.5
 */
export async function updateClient(clientId: string, formData: FormData) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    // Validate input
    const validated = clientSchema.parse({
      name: formData.get('name'),
      phone: formData.get('phone'),
      whatsapp: formData.get('whatsapp') || '',
      email: formData.get('email') || '',
      address: formData.get('address') || '',
      city: formData.get('city') || '',
      country: formData.get('country') || '',
      notes: formData.get('notes') || '',
    })

    // Update client
    const { data, error } = await supabase
      .from('clients')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .eq('org_id', organizationId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/clients')
    revalidatePath(`/clients/${clientId}`)
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update client' }
  }
}

/**
 * Delete a client with referential integrity check
 * Validates: Requirements 3.6
 */
export async function deleteClient(clientId: string) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    // Check if client has associated shipments
    const { data: shipments, error: checkError } = await supabase
      .from('shipments')
      .select('id')
      .eq('client_id', clientId)
      .eq('org_id', organizationId)
      .limit(1)

    if (checkError) {
      return { error: checkError.message }
    }

    if (shipments && shipments.length > 0) {
      return { error: 'Cannot delete client with associated shipments' }
    }

    // Delete client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('org_id', organizationId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/clients')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to delete client' }
  }
}

/**
 * Search clients by name or phone number
 * Validates: Requirements 3.3, 12.2, 12.4
 */
export async function searchClients(query: string) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    if (!query || query.trim() === '') {
      // Return all clients if no query
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('org_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        return { error: error.message }
      }

      return { data }
    }

    // Search by name or phone (case-insensitive partial matching)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('org_id', organizationId)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to search clients' }
  }
}

/**
 * Get a single client by ID
 */
export async function getClient(clientId: string) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('org_id', organizationId)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get client' }
  }
}

/**
 * Get all clients
 */
export async function getClients() {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('org_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get clients' }
  }
}
