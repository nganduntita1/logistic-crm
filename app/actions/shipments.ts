'use server'

import { requireOrganizationContext } from '@/lib/organizations'
import { shipmentSchema } from '@/lib/validations/shipment'
import { revalidatePath } from 'next/cache'
import { buildPaginationMeta, normalizePagination } from '@/lib/pagination'
import type { ShipmentStatus, PaymentStatus } from '@/lib/types/database'

const SHIPMENT_LIST_SELECT =
  'id, org_id, tracking_number, client_id, receiver_id, trip_id, description, quantity, weight, value, price, amount_paid, status, payment_status, created_at, updated_at, client:clients(id, name), receiver:receivers(id, name), trip:trips(id, route)'

/**
 * Generate a unique tracking number
 * Format: TRK-YYYYMMDD-XXXXX (e.g. TRK-20260314-A3F9B)
 */
function generateTrackingNumber(): string {
  const date = new Date()
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = Math.random().toString(36).toUpperCase().slice(2, 7)
  return `TRK-${datePart}-${randomPart}`
}

const ACTIVE_LOAD_STATUSES: ShipmentStatus[] = ['pending', 'in_transit']

type OrgSupabaseClient = Awaited<ReturnType<typeof requireOrganizationContext>>['supabase']

function formatKg(value: number): string {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function resolveAmountPaid(paymentStatus: PaymentStatus, price: number, inputAmountPaid: number): number {
  if (paymentStatus === 'unpaid') return 0
  if (paymentStatus === 'paid') return price
  return inputAmountPaid
}

async function validateTripCapacityForShipment(params: {
  supabase: OrgSupabaseClient
  organizationId: string
  tripId: string
  shipmentWeight: number
  excludeShipmentId?: string
}): Promise<string | null> {
  const {
    supabase,
    organizationId,
    tripId,
    shipmentWeight,
    excludeShipmentId,
  } = params

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, route, vehicle_id, vehicle:vehicles(id, plate_number, capacity)')
    .eq('id', tripId)
    .eq('org_id', organizationId)
    .maybeSingle()

  if (tripError || !trip) {
    return 'Selected trip was not found.'
  }

  const vehicle = Array.isArray(trip.vehicle) ? trip.vehicle[0] : trip.vehicle
  const vehicleCapacity = vehicle?.capacity ? Number(vehicle.capacity) : 0

  // Capacity applies only when a vehicle is assigned to the selected trip.
  if (!trip.vehicle_id || !vehicleCapacity) {
    return null
  }

  let loadQuery = supabase
    .from('shipments')
    .select('weight')
    .eq('org_id', organizationId)
    .eq('trip_id', tripId)
    .in('status', ACTIVE_LOAD_STATUSES)

  if (excludeShipmentId) {
    loadQuery = loadQuery.neq('id', excludeShipmentId)
  }

  const { data: activeShipments, error: loadError } = await loadQuery

  if (loadError) {
    return 'Unable to validate trip vehicle capacity right now.'
  }

  const currentLoad = (activeShipments ?? []).reduce((sum, row) => sum + Number(row.weight), 0)
  const projectedLoad = currentLoad + shipmentWeight

  if (projectedLoad > vehicleCapacity) {
    const remainingCapacity = Math.max(vehicleCapacity - currentLoad, 0)
    return `Vehicle ${vehicle.plate_number} capacity exceeded. Remaining: ${formatKg(remainingCapacity)} kg, shipment weight: ${formatKg(shipmentWeight)} kg.`
  }

  return null
}

/**
 * Create a new shipment with auto-generated tracking number
 * Validates: Requirements 4.1, 4.2, 4.3, 4.7
 */
export async function createShipment(formData: FormData) {

  try {
    const { supabase, organizationId, user } = await requireOrganizationContext()

    const tripId = formData.get('trip_id') as string
    const validated = shipmentSchema.parse({
      client_id: formData.get('client_id'),
      receiver_id: formData.get('receiver_id'),
      trip_id: tripId || undefined,
      description: formData.get('description'),
      quantity: Number(formData.get('quantity')),
      weight: Number(formData.get('weight')),
      value: Number(formData.get('value')),
      price: Number(formData.get('price')),
      amount_paid: Number(formData.get('amount_paid') ?? 0),
      payment_status: formData.get('payment_status'),
    })

    const resolvedAmountPaid = resolveAmountPaid(
      validated.payment_status,
      validated.price,
      validated.amount_paid
    )

    // Generate unique tracking number (retry on collision)
    let tracking_number = generateTrackingNumber()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('shipments')
        .select('id')
        .eq('tracking_number', tracking_number)
        .maybeSingle()
      if (!existing) break
      tracking_number = generateTrackingNumber()
      attempts++
    }

    const insertData: Record<string, unknown> = {
      ...validated,
      amount_paid: resolvedAmountPaid,
      org_id: organizationId,
      tracking_number,
      trip_id: validated.trip_id || null,
    }

    if (validated.trip_id) {
      const capacityError = await validateTripCapacityForShipment({
        supabase,
        organizationId,
        tripId: validated.trip_id,
        shipmentWeight: validated.weight,
      })

      if (capacityError) {
        return { error: capacityError }
      }
    }

    const { data, error } = await supabase
      .from('shipments')
      .insert(insertData)
      .select('*, client:clients(*), receiver:receivers(*), trip:trips(*)')
      .single()

    if (error) {
      return { error: error.message }
    }

    // Record initial status in history
    await supabase.from('shipment_status_history').insert({
      org_id: organizationId,
      shipment_id: data.id,
      status: 'pending',
      changed_by: user.id,
      notes: 'Shipment created',
    })

    revalidatePath('/shipments')
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create shipment' }
  }
}

/**
 * Update an existing shipment
 * Validates: Requirements 4.2, 4.3, 4.4
 */
export async function updateShipment(shipmentId: string, formData: FormData) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const tripId = formData.get('trip_id') as string
    const validated = shipmentSchema.parse({
      client_id: formData.get('client_id'),
      receiver_id: formData.get('receiver_id'),
      trip_id: tripId || undefined,
      description: formData.get('description'),
      quantity: Number(formData.get('quantity')),
      weight: Number(formData.get('weight')),
      value: Number(formData.get('value')),
      price: Number(formData.get('price')),
      amount_paid: Number(formData.get('amount_paid') ?? 0),
      payment_status: formData.get('payment_status'),
    })

    const resolvedAmountPaid = resolveAmountPaid(
      validated.payment_status,
      validated.price,
      validated.amount_paid
    )

    const { data: existingShipment, error: existingShipmentError } = await supabase
      .from('shipments')
      .select('id, status')
      .eq('id', shipmentId)
      .eq('org_id', organizationId)
      .maybeSingle()

    if (existingShipmentError || !existingShipment) {
      return { error: 'Shipment not found.' }
    }

    if (
      validated.trip_id &&
      ACTIVE_LOAD_STATUSES.includes(existingShipment.status as ShipmentStatus)
    ) {
      const capacityError = await validateTripCapacityForShipment({
        supabase,
        organizationId,
        tripId: validated.trip_id,
        shipmentWeight: validated.weight,
        excludeShipmentId: shipmentId,
      })

      if (capacityError) {
        return { error: capacityError }
      }
    }

    const { data, error } = await supabase
      .from('shipments')
      .update({
        ...validated,
        amount_paid: resolvedAmountPaid,
        trip_id: validated.trip_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId)
      .eq('org_id', organizationId)
      .select('*, client:clients(*), receiver:receivers(*), trip:trips(*)')
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/shipments')
    revalidatePath(`/shipments/${shipmentId}`)
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update shipment' }
  }
}

/**
 * Update shipment status and record in history
 * Validates: Requirements 4.5, 4.8
 */
export async function updateShipmentStatus(
  shipmentId: string,
  status: ShipmentStatus,
  notes?: string
) {

  try {
    const { supabase, organizationId, user } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('shipments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', shipmentId)
      .eq('org_id', organizationId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Record status change in history
    await supabase.from('shipment_status_history').insert({
      org_id: organizationId,
      shipment_id: shipmentId,
      status,
      changed_by: user.id,
      notes: notes ?? null,
    })

    revalidatePath('/shipments')
    revalidatePath(`/shipments/${shipmentId}`)
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update shipment status' }
  }
}

/**
 * Update shipment payment status
 */
export async function updateShipmentPayment(
  shipmentId: string,
  paymentStatus: PaymentStatus,
  amountPaid?: number
) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, price')
      .eq('id', shipmentId)
      .eq('org_id', organizationId)
      .maybeSingle()

    if (shipmentError || !shipment) {
      throw new Error('Shipment not found')
    }

    const price = Number(shipment.price)
    const resolvedAmountPaid = resolveAmountPaid(
      paymentStatus,
      price,
      amountPaid ?? 0
    )

    const { data, error } = await supabase
      .from('shipments')
      .update({
        payment_status: paymentStatus,
        amount_paid: resolvedAmountPaid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId)
      .eq('org_id', organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/shipments')
    revalidatePath(`/shipments/${shipmentId}`)
  } catch (error) {
    throw error
  }
}

/**
 * Search shipments by tracking number (partial match)
 * Validates: Requirements 12.1
 */
export async function searchShipments(query: string) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    if (!query || query.trim() === '') {
      const { data, error } = await supabase
        .from('shipments')
        .select(SHIPMENT_LIST_SELECT)
        .eq('org_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) return { error: error.message }
      return { data }
    }

    const { data, error } = await supabase
      .from('shipments')
      .select(SHIPMENT_LIST_SELECT)
      .eq('org_id', organizationId)
      .ilike('tracking_number', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return { error: error.message }
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to search shipments' }
  }
}

/**
 * Get shipment timeline (status history)
 * Validates: Requirements 4.8, 20.1, 20.2, 20.3, 20.5
 */
export async function getShipmentTimeline(shipmentId: string) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('shipment_status_history')
      .select('*, profile:profiles(full_name, email)')
      .eq('org_id', organizationId)
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: true })

    if (error) return { error: error.message }
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get shipment timeline' }
  }
}

/**
 * Get all shipments with related data
 */
export async function getShipments() {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('shipments')
      .select(SHIPMENT_LIST_SELECT)
      .eq('org_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get shipments' }
  }
}

export async function getPaginatedShipments(params?: {
  page?: number
  pageSize?: number
  query?: string
  status?: string
  paymentStatus?: string
}) {
  try {
    const { supabase, organizationId } = await requireOrganizationContext()
    const { page, pageSize, from, to } = normalizePagination(params ?? {})
    const query = params?.query?.trim() ?? ''
    const status = params?.status?.trim() ?? ''
    const paymentStatus = params?.paymentStatus?.trim() ?? ''

    let request = supabase
      .from('shipments')
      .select(SHIPMENT_LIST_SELECT, { count: 'exact' })
      .eq('org_id', organizationId)

    if (query) {
      request = request.ilike('tracking_number', `%${query}%`)
    }

    if (status) {
      request = request.eq('status', status)
    }

    if (paymentStatus) {
      request = request.eq('payment_status', paymentStatus)
    }

    const { data, error, count } = await request
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) return { error: error.message }

    return {
      data,
      pagination: buildPaginationMeta(page, pageSize, count ?? 0),
    }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get shipments' }
  }
}

/**
 * Get a single shipment by ID with all related data
 */
export async function getShipment(shipmentId: string) {

  try {
    const { supabase, organizationId } = await requireOrganizationContext()

    const { data, error } = await supabase
      .from('shipments')
      .select('*, client:clients(*), receiver:receivers(*), trip:trips(*), delivery_proof:delivery_proofs(*)')
      .eq('id', shipmentId)
      .eq('org_id', organizationId)
      .single()

    if (error) return { error: error.message }
    return { data }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to get shipment' }
  }
}
