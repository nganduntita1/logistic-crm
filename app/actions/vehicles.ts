'use server'

import { requireOrganizationContext } from '@/lib/organizations'
import { vehicleSchema } from '@/lib/validations/vehicle'
import { revalidatePath } from 'next/cache'

/**
 * Create a new vehicle
 * Validates: Requirements 7.1, 7.3
 */
export async function createVehicle(formData: FormData) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const validated = vehicleSchema.parse({
      plate_number: formData.get('plate_number'),
      type: formData.get('type'),
      capacity: Number(formData.get('capacity')),
      insurance_expiry: formData.get('insurance_expiry'),
    })

    const { data, error } = await supabase
      .from('vehicles')
      .insert({ ...validated, org_id: organizationId })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/vehicles')
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create vehicle' }
  }
}

/**
 * Update an existing vehicle
 * Validates: Requirements 7.5
 */
export async function updateVehicle(vehicleId: string, formData: FormData) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const validated = vehicleSchema.parse({
      plate_number: formData.get('plate_number'),
      type: formData.get('type'),
      capacity: Number(formData.get('capacity')),
      insurance_expiry: formData.get('insurance_expiry'),
    })

    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .eq('org_id', organizationId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/vehicles')
    revalidatePath(`/vehicles/${vehicleId}`)
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update vehicle' }
  }
}

/**
 * Delete a vehicle with active trip check
 * Validates: Requirements 7.6
 *
 * Prevents deletion if the vehicle is assigned to a trip with status 'planned' or 'in_progress'.
 */
export async function deleteVehicle(vehicleId: string) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    // Check for active trips (planned or in_progress)
    const { data: activeTrips, error: checkError } = await supabase
      .from('trips')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('org_id', organizationId)
      .in('status', ['planned', 'in_progress'])
      .limit(1)

    if (checkError) {
      return { error: checkError.message }
    }

    if (activeTrips && activeTrips.length > 0) {
      return { error: 'Cannot delete vehicle assigned to an active or planned trip' }
    }

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('org_id', organizationId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/vehicles')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to delete vehicle' }
  }
}

/**
 * Get all vehicles
 * Validates: Requirements 7.1
 */
export async function getVehicles() {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('vehicles')
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
    return { error: 'Failed to get vehicles' }
  }
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicle(vehicleId: string) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
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
    return { error: 'Failed to get vehicle' }
  }
}
