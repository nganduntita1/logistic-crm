'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Update a driver's current location
 * Validates: Requirements 9.1, 9.2, 9.4
 *
 * Validates coordinate ranges before inserting into driver_locations table.
 * Latitude must be between -90 and 90, longitude between -180 and 180.
 */
export async function updateDriverLocation(
  driverId: string,
  latitude: number,
  longitude: number
) {
  try {
    if (latitude < -90 || latitude > 90) {
      return { error: 'Invalid latitude: must be between -90 and 90' }
    }
    if (longitude < -180 || longitude > 180) {
      return { error: 'Invalid longitude: must be between -180 and 180' }
    }

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('driver_locations')
      .insert({
        driver_id: driverId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/map')
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update driver location' }
  }
}

/**
 * Get the latest location for each active driver
 * Validates: Requirements 9.2, 9.4
 *
 * Uses the get_latest_driver_locations() PostgreSQL function defined in
 * supabase/migrations/002_driver_locations_function.sql
 */
export async function getLatestDriverLocations() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.rpc('get_latest_driver_locations')

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get driver locations' }
  }
}
