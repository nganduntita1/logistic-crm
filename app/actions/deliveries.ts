'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024 // 2MB
const BUCKET = 'delivery-photos'
const MAX_RETRIES = 3

/**
 * Compress an image buffer using Sharp if it exceeds the threshold.
 * Validates: Requirement 11.6
 */
async function compressIfNeeded(input: Uint8Array): Promise<Uint8Array> {
  if (input.byteLength <= COMPRESS_THRESHOLD_BYTES) return input

  // Dynamic import to avoid issues in edge environments
  const sharp = (await import('sharp')).default
  const result = await sharp(input)
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()
  return new Uint8Array(result)
}

/**
 * Upload a delivery photo and create a delivery proof record.
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 16.4, 16.5
 */
export async function uploadDeliveryPhoto(formData: FormData) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const file = formData.get('photo') as File | null
    const shipmentId = formData.get('shipment_id') as string
    const receiverName = formData.get('receiver_name') as string

    if (!file) return { error: 'No photo provided' }
    if (!shipmentId) return { error: 'Shipment ID is required' }
    if (!receiverName?.trim()) return { error: 'Receiver name is required' }

    // Validate file type (Requirement 11.5)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.' }
    }

    // Validate file size (Requirement 16.5)
    if (file.size > MAX_SIZE_BYTES) {
      return { error: 'File size exceeds 10MB limit.' }
    }

    // Read file into buffer and compress if needed (Requirement 11.6)
    const arrayBuffer = await file.arrayBuffer()
    const rawBytes = new Uint8Array(arrayBuffer)
    const bytes = await compressIfNeeded(rawBytes)
    const wasCompressed = bytes !== rawBytes

    // Generate unique filename organized by shipment (Requirement 16.2, 16.6)
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${shipmentId}/${Date.now()}-delivery.${ext}`

    // Upload with retry logic (Requirement 16.4)
    let uploadError: string | null = null
    let photoUrl: string | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const { data: uploadData, error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, bytes, {
          contentType: wasCompressed ? 'image/jpeg' : file.type,
          upsert: false,
        })

      if (!error && uploadData) {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)
        photoUrl = urlData.publicUrl
        uploadError = null
        break
      }

      uploadError = error?.message ?? 'Upload failed'
      if (attempt < MAX_RETRIES) {
        // Brief delay before retry
        await new Promise((r) => setTimeout(r, 500 * attempt))
      }
    }

    if (uploadError || !photoUrl) {
      return { error: `Failed to upload photo after ${MAX_RETRIES} attempts: ${uploadError}` }
    }

    // Create delivery_proofs record (Requirement 11.3)
    const { data: proof, error: proofError } = await supabase
      .from('delivery_proofs')
      .insert({
        shipment_id: shipmentId,
        receiver_name: receiverName.trim(),
        photo_url: photoUrl,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (proofError) {
      return { error: proofError.message }
    }

    // Update shipment status to delivered (Requirement 11.4)
    const { error: statusError } = await supabase
      .from('shipments')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', shipmentId)

    if (statusError) {
      return { error: statusError.message }
    }

    // Record status change in history
    await supabase.from('shipment_status_history').insert({
      shipment_id: shipmentId,
      status: 'delivered',
      changed_by: user.id,
      notes: `Delivered to ${receiverName.trim()}`,
    })

    revalidatePath(`/shipments/${shipmentId}`)
    revalidatePath('/shipments')

    return { data: proof }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Failed to upload delivery photo' }
  }
}
