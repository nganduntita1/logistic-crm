'use server'

import { createServerClient } from '@/lib/supabase/server'
import { shipmentSchema } from '@/lib/validations/shipment'
import { revalidatePath } from 'next/cache'
import type { ShipmentStatus, PaymentStatus } from '@/lib/types/database'

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

/**
 * Create a new shipment with auto-generated tracking number
 * Validates: Requirements 4.1, 4.2, 4.3, 4.7
 */
export async function createShipment(formData: FormData) {
  try {
    const supabase = await createServerClient()

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
      payment_status: formData.get('payment_status'),
    })

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
      tracking_number,
      trip_id: validated.trip_id || null,
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
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('shipment_status_history').insert({
        shipment_id: data.id,
        status: 'pending',
        changed_by: user.id,
        notes: 'Shipment created',
      })
    }

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
    const supabase = await createServerClient()

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
      payment_status: formData.get('payment_status'),
    })

    const { data, error } = await supabase
      .from('shipments')
      .update({
        ...validated,
        trip_id: validated.trip_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId)
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
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('shipments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', shipmentId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Record status change in history
    await supabase.from('shipment_status_history').insert({
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
export async function updateShipmentPaymentStatus(
  shipmentId: string,
  paymentStatus: PaymentStatus
) {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('shipments')
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', shipmentId)
      .select()
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
    return { error: 'Failed to update shipment payment status' }
  }
}

/**
 * Search shipments by tracking number (partial match)
 * Validates: Requirements 12.1
 */
export async function searchShipments(query: string) {
  try {
    const supabase = await createServerClient()

    if (!query || query.trim() === '') {
      const { data, error } = await supabase
        .from('shipments')
        .select('*, client:clients(*), receiver:receivers(*), trip:trips(*)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) return { error: error.message }
      return { data }
    }

    const { data, error } = await supabase
      .from('shipments')
      .select('*, client:clients(*), receiver:receivers(*), trip:trips(*)')
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
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('shipment_status_history')
      .select('*, profile:profiles(full_name, email)')
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
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('shipments')
      .select('*, client:clients(*), receiver:receivers(*), trip:trips(*)')
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

/**
 * Get a single shipment by ID with all related data
 */
export async function getShipment(shipmentId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('shipments')
      .select('*, client:clients(*), receiver:receivers(*), trip:trips(*), delivery_proof:delivery_proofs(*)')
      .eq('id', shipmentId)
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
