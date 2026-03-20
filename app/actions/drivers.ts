'use server'

import { requireOrganizationContext } from '@/lib/organizations'
import { driverSchema } from '@/lib/validations/driver'
import { provisionOrganizationUser } from '@/lib/auth/org-user-management'
import { revalidatePath } from 'next/cache'
import { buildPaginationMeta, normalizePagination } from '@/lib/pagination'

const DRIVER_LIST_SELECT =
  'id, org_id, user_id, license_number, passport_number, vehicle_id, status, created_at, updated_at, profile:profiles(id, full_name, email), vehicle:vehicles(id, plate_number, type)'

/**
 * Create a new driver with uniqueness checks for license and passport numbers
 * Validates: Requirements 6.1, 6.6
 */
export async function createDriver(formData: FormData) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const vehicleId = formData.get('vehicle_id') as string
    const validated = driverSchema.parse({
      user_id: formData.get('user_id'),
      license_number: formData.get('license_number'),
      passport_number: formData.get('passport_number'),
      vehicle_id: vehicleId || undefined,
    })

    // Check license_number uniqueness
    const { data: existingLicense } = await supabase
      .from('drivers')
      .select('id')
      .eq('org_id', organizationId)
      .eq('license_number', validated.license_number)
      .maybeSingle()

    if (existingLicense) {
      return { error: 'A driver with this license number already exists' }
    }

    // Check passport_number uniqueness
    const { data: existingPassport } = await supabase
      .from('drivers')
      .select('id')
      .eq('org_id', organizationId)
      .eq('passport_number', validated.passport_number)
      .maybeSingle()

    if (existingPassport) {
      return { error: 'A driver with this passport number already exists' }
    }

    const insertData: Record<string, unknown> = {
      org_id: organizationId,
      user_id: validated.user_id,
      license_number: validated.license_number,
      passport_number: validated.passport_number,
    }
    if (validated.vehicle_id) {
      insertData.vehicle_id = validated.vehicle_id
    }

    const { data, error } = await supabase
      .from('drivers')
      .insert(insertData)
      .select('*, profile:profiles(*), vehicle:vehicles(*)')
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/drivers')
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create driver' }
  }
}

/**
 * Update an existing driver
 * Validates: Requirements 6.1, 6.6
 */
export async function updateDriver(driverId: string, formData: FormData) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const vehicleId = formData.get('vehicle_id') as string
    const validated = driverSchema.parse({
      user_id: formData.get('user_id'),
      license_number: formData.get('license_number'),
      passport_number: formData.get('passport_number'),
      vehicle_id: vehicleId || undefined,
    })

    // Check license_number uniqueness (exclude current driver)
    const { data: existingLicense } = await supabase
      .from('drivers')
      .select('id')
      .eq('org_id', organizationId)
      .eq('license_number', validated.license_number)
      .neq('id', driverId)
      .maybeSingle()

    if (existingLicense) {
      return { error: 'A driver with this license number already exists' }
    }

    // Check passport_number uniqueness (exclude current driver)
    const { data: existingPassport } = await supabase
      .from('drivers')
      .select('id')
      .eq('org_id', organizationId)
      .eq('passport_number', validated.passport_number)
      .neq('id', driverId)
      .maybeSingle()

    if (existingPassport) {
      return { error: 'A driver with this passport number already exists' }
    }

    const updateData: Record<string, unknown> = {
      user_id: validated.user_id,
      license_number: validated.license_number,
      passport_number: validated.passport_number,
      vehicle_id: validated.vehicle_id || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('id', driverId)
      .eq('org_id', organizationId)
      .select('*, profile:profiles(*), vehicle:vehicles(*)')
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/drivers')
    revalidatePath(`/drivers/${driverId}`)
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update driver' }
  }
}

/**
 * Get all drivers with profile and vehicle data
 * Validates: Requirements 6.5
 */
export async function getDrivers() {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('drivers')
      .select('*, profile:profiles(*), vehicle:vehicles(*)')
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
    return { error: 'Failed to get drivers' }
  }
}

export async function getPaginatedDrivers(params?: {
  page?: number
  pageSize?: number
  query?: string
}) {
  try {
    const { supabase, organizationId } = await requireOrganizationContext()
    const { page, pageSize, from, to } = normalizePagination(params ?? {})
    const query = params?.query?.trim() ?? ''

    let request = supabase
      .from('drivers')
      .select(DRIVER_LIST_SELECT, { count: 'exact' })
      .eq('org_id', organizationId)

    if (query) {
      request = request.ilike('license_number', `%${query}%`)
    }

    const { data, error, count } = await request
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return { error: error.message }
    }

    return {
      data,
      pagination: buildPaginationMeta(page, pageSize, count ?? 0),
    }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get drivers' }
  }
}

/**
 * Get a single driver by ID with profile, vehicle, and trip history
 * Validates: Requirements 6.5
 */
export async function getDriver(driverId: string) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('drivers')
      .select('*, profile:profiles(*), vehicle:vehicles(*)')
      .eq('id', driverId)
      .eq('org_id', organizationId)
      .single()

    if (error) {
      return { error: error.message }
    }

    // Fetch trip history separately
    const { data: trips } = await supabase
      .from('trips')
      .select('id, route, departure_date, expected_arrival, status')
      .eq('driver_id', driverId)
      .eq('org_id', organizationId)
      .order('departure_date', { ascending: false })

    return { data, trips: trips ?? [] }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get driver' }
  }
}

/**
 * Assign a vehicle to a driver
 * Validates: Requirements 6.3
 */
export async function assignVehicleToDriver(driverId: string, vehicleId: string | null) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('drivers')
      .update({ vehicle_id: vehicleId, updated_at: new Date().toISOString() })
      .eq('id', driverId)
      .eq('org_id', organizationId)
      .select('*, profile:profiles(*), vehicle:vehicles(*)')
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/drivers')
    revalidatePath(`/drivers/${driverId}`)
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to assign vehicle to driver' }
  }
}

/**
 * Get all profiles with driver role (for driver creation form)
 */
export async function getDriverProfiles() {

  try {
    const { supabase } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'driver')
      .order('full_name')

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get driver profiles' }
  }
}

/**
 * Quick-create a driver: provision user account with driver role, then create driver record.
 * Only requires name, email, password, and license number.
 * Passport number is auto-set as a unique placeholder for later update.
 */
export async function quickCreateDriver(params: {
  fullName: string
  email: string
  password: string
  licenseNumber: string
}) {
  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    // Step 1: Create user account with driver role
    const provisionResult = await provisionOrganizationUser({
      email: params.email,
      fullName: params.fullName,
      role: 'driver',
      password: params.password,
    })

    if ('error' in provisionResult && provisionResult.error) {
      return { error: provisionResult.error }
    }

    if (!provisionResult.success || !provisionResult.data) {
      return { error: 'Failed to create user account.' }
    }

    const userId = provisionResult.data.userId

    // Check license_number uniqueness
    const { data: existingLicense } = await supabase
      .from('drivers')
      .select('id')
      .eq('org_id', organizationId)
      .eq('license_number', params.licenseNumber)
      .maybeSingle()

    if (existingLicense) {
      return { error: 'A driver with this license number already exists.' }
    }

    // Step 2: Create driver record; passport placeholder can be updated on the driver profile page
    const passportPlaceholder = `PENDING-${userId.slice(0, 8).toUpperCase()}`

    const { data, error } = await supabase
      .from('drivers')
      .insert({
        org_id: organizationId,
        user_id: userId,
        license_number: params.licenseNumber,
        passport_number: passportPlaceholder,
      })
      .select(`${DRIVER_LIST_SELECT}`)
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/drivers')
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create driver.' }
  }
}
