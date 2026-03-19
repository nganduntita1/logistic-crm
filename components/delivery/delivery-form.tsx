'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoUpload } from './photo-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { uploadDeliveryPhoto } from '@/app/actions/deliveries'

interface DeliveryFormProps {
  shipmentId: string
  /** Pre-filled receiver name from the shipment record */
  defaultReceiverName?: string
}

/**
 * DeliveryForm Component
 * Validates: Requirements 11.1, 11.3
 *
 * Combines PhotoUpload with a receiver name input and handles
 * form submission via the uploadDeliveryPhoto server action.
 */
export function DeliveryForm({ shipmentId, defaultReceiverName = '' }: DeliveryFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [photo, setPhoto] = useState<File | null>(null)
  const [receiverName, setReceiverName] = useState(defaultReceiverName)
  const [isUploading, setIsUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | undefined>()
  const [nameError, setNameError] = useState<string | undefined>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    let valid = true
    if (!photo) {
      setPhotoError('Please select a delivery photo.')
      valid = false
    } else {
      setPhotoError(undefined)
    }
    if (!receiverName.trim()) {
      setNameError('Receiver name is required.')
      valid = false
    } else {
      setNameError(undefined)
    }
    if (!valid) return

    setIsUploading(true)

    const formData = new FormData()
    formData.append('photo', photo!)
    formData.append('shipment_id', shipmentId)
    formData.append('receiver_name', receiverName.trim())

    const result = await uploadDeliveryPhoto(formData)

    setIsUploading(false)

    if (result.error) {
      toast({
        title: 'Upload failed',
        description: result.error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Delivery confirmed',
      description: 'The shipment has been marked as delivered.',
    })

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="receiver_name">Receiver Name</Label>
        <Input
          id="receiver_name"
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          placeholder="Full name of the person who received the shipment"
          disabled={isUploading}
        />
        {nameError && <p className="text-sm text-destructive">{nameError}</p>}
      </div>

      <div className="space-y-1">
        <Label>Delivery Photo</Label>
        <PhotoUpload
          onFileChange={setPhoto}
          isUploading={isUploading}
          error={photoError}
        />
      </div>

      <Button type="submit" disabled={isUploading} className="w-full">
        {isUploading ? 'Uploading…' : 'Confirm Delivery'}
      </Button>
    </form>
  )
}
