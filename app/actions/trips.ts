'use server'

import { createServerClient } from '@/lib/supabase/server'
import { tripSchema } from '@/lib/validations/trip'
import { revalidatePath } from 'next/cache'
import type { TripStatus } from '@/lib/types/database'

/**
 * Check for overlapping driver or vehicle assignments
 * Validates: Requirements 5.6, 5.7
 *
 * Returns an error string if overlap found, null otherwise.
 */
async function checkOverlap(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  departure_date: string,
  expected_arrival: string,
  driver_id?: string | null,
  vehicle_id?: string | null,
  excludeTripId?: string
): Promise<string | null> {
  // Build base query for overlapping trips (planned or in_progress)
  // Two date ranges overlap when: start1 <= end2 AND end1 >= start2
  const buildQuery = (field: string, value: string) => {
    let q = supabase
      .from('trips')
      .select('id, route, departure_date, expected_arrival')
      .eq(field, value)
      .in('status', ['planned', 'in_progress'])
      .lte('departure_date', expected_arrival)
      .gte('expected_arrival', departure_date)

    if (excludeTripId) {
      q = q.neq('id', excludeTripId)
    }
    return q
  }

  if (driver_id) {
    const { data: driverConflicts } = await buildQuery('driver_id', driver_id)
    if (driverConflicts && driverConflicts.length > 0) {
      const conflict = driverConflicts[0]
      return `Driver is already assigned to trip "${conflict.route}" (${conflict.departure_date} – ${conflict.expected_arrival})`
    }
  }

  if (vehicle_id) {
    const { data: vehicleConflicts } = await buildQuery('vehicle_id', vehicle_id)
    if (vehicleConflicts && vehicleConflicts.length > 0) {
      const conflict = vehicleConflicts[0]
      return `Vehicle is already assigned to trip "${conflict.route}" (${conflict.departure_date} – ${conflict.expected_arrival})`
    }
  }

  return null
}

/**
 * Create a new trip with overlap validation
 * Validates: Requirements 5.1, 5.2, 5.6, 5.7, 19.1
 */
export async function createTrip(formData: FormData) {
  try {
    const supabase = await createServerClient()

    const driverId = formData.get('driver_id') as string
    const vehicleId = formData.get('vehicle_id') as string

    const validated = tripSchema.parse({
      route: formData.get('route'),
      departure_date: formData.get('departure_date'),
      expected_arrival: formData.get('expected_arrival'),
      driver_id: driverId || undefined,
      vehicle_id: vehicleId || undefined,
    })

    const resolvedDriverId = validated.driver_id || null
    const resolvedVehicleId = validated.vehicle_id || null

    // Check for overlapping assignments
    const overlapError = await checkOverlap(
      supabase,
      validated.departure_date,
      validated.expected_arrival,
      resolvedDriverId,
      resolvedVehicleId
    )
    if (overlapError) {
      return { error: overlapError }
    }

    const { data, error } = await supabase
      .from('trips')
      .insert({
        route: validated.route,
        departure_date: validated.departure_date,
        expected_arrival: validated.expected_arrival,
        driver_id: resolvedDriverId,
        vehicle_id: resolvedVehicleId,
        status: 'planned',
      })
      .select('*, driver:drivers(*, profile:profiles(*)), vehicle:vehicles(*)')
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/trips')
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create trip' }
  }
}

/**
 * Update an existing trip
 * Validates: Requirements 5.1, 5.2, 5.6, 5.7
 */
export async function updateTrip(tripId: string, formData: FormData) {
  try {
    const supabase = await createServerClient()

    const driverId = formData.get('driver_id') as string
    const vehicleId = formData.get('vehicle_id') as string

    const validated = tripSchema.parse({
      route: formData.get('route'),
      departure_date: formData.get('departure_date'),
      expected_arrival: formData.get('expected_arrival'),
      driver_id: driverId || undefined,
      vehicle_id: vehicleId || undefined,
    })

    const resolvedDriverId = validated.driver_id || null
    const resolvedVehicleId = validated.vehicle_id || null

    // Check for overlapping assignments (exclude current trip)
    const overlapError = await checkOverlap(
      supabase,
      validated.departure_date,
      validated.expected_arrival,
      resolvedDriverId,
      resolvedVehicleId,
      tripId
    )
    if (overlapError) {
      return { error: overlapError }
    }

    const { data, error } = await supabase
      .from('trips')
      .update({
        route: validated.route,
        departure_date: validated.departure_date,
        expected_arrival: validated.expected_arrival,
        driver_id: resolvedDriverId,
        vehicle_id: resolvedVehicleId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId)
      .select('*, driver:drivers(*, profile:profiles(*)), vehicle:vehicles(*)')
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/trips')
    revalidatePath(`/trips/${tripId}`)
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update trip' }
  }
}

/**
 * Update trip status with cascading shipment updates
 * Validates: Requirements 19.2, 19.3, 19.5
 *
 * When status → in_progress: all pending shipments in the trip become in_transit
 * When status → completed/cancelled: no automatic shipment cascade
 */
export async function updateTripStatus(tripId: string, status: TripStatus, notes?: string) {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('trips')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', tripId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Cascade: when trip starts, move pending shipments to in_transit (Requirement 19.5)
    if (status === 'in_progress') {
      const { data: pendingShipments } = await supabase
        .from('shipments')
        .select('id')
        .eq('trip_id', tripId)
        .eq('status', 'pending')

      if (pendingShipments && pendingShipments.length > 0) {
        const shipmentIds = pendingShipments.map((s) => s.id)

        await supabase
          .from('shipments')
          .update({ status: 'in_transit', updated_at: new Date().toISOString() })
          .in('id', shipmentIds)

        // Record status change in history for each shipment
        const historyRecords = shipmentIds.map((shipmentId) => ({
          shipment_id: shipmentId,
          status: 'in_transit' as const,
          changed_by: user.id,
          notes: notes ?? `Trip started — status updated automatically`,
        }))

        await supabase.from('shipment_status_history').insert(historyRecords)
      }
    }

    revalidatePath('/trips')
    revalidatePath(`/trips/${tripId}`)
    revalidatePath('/shipments')
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update trip status' }
  }
}

/**
 * Assign shipments to a trip
 * Validates: Requirements 5.3, 5.5
 */
export async function assignShipmentsToTrip(tripId: string, shipmentIds: string[]) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('shipments')
      .update({ trip_id: tripId, updated_at: new Date().toISOString() })
      .in('id', shipmentIds)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/trips')
    revalidatePath(`/trips/${tripId}`)
    revalidatePath('/shipments')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to assign shipments to trip' }
  }
}

/**
 * Remove a shipment from a trip
 */
export async function removeShipmentFromTrip(shipmentId: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('shipments')
      .update({ trip_id: null, updated_at: new Date().toISOString() })
      .eq('id', shipmentId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/trips')
    revalidatePath('/shipments')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to remove shipment from trip' }
  }
}

/**
 * Get all trips with driver and vehicle data
 */
export async function getTrips() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('trips')
      .select('*, driver:drivers(*, profile:profiles(*)), vehicle:vehicles(*)')
      .order('departure_date', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get trips' }
  }
}

/**
 * Get a single trip with full related data including shipments
 */
export async function getTrip(tripId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('trips')
      .select('*, driver:drivers(*, profile:profiles(*)), vehicle:vehicles(*)')
      .eq('id', tripId)
      .single()

    if (error) {
      return { error: error.message }
    }

    // Fetch shipments separately to avoid deep nesting issues
    const { data: shipments } = await supabase
      .from('shipments')
      .select('*, client:clients(*), receiver:receivers(*)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })

    return { data, shipments: shipments ?? [] }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get trip' }
  }
}
