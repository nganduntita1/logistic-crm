'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { receiverSchema, type ReceiverFormData } from '@/lib/validations/receiver'
import { createReceiver } from '@/app/actions/receivers'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ReceiverFormProps {
  onSuccess?: (receiverId: string) => void
}

/**
 * Receiver Form Component
 * Validates: Requirements 18.1, 18.4, 15.1, 15.6
 *
 * Handles receiver creation with field-level validation.
 * Calls onSuccess with the new receiver ID when done (for inline creation during shipment flow).
 */
export function ReceiverForm({ onSuccess }: ReceiverFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ReceiverFormData>({
    resolver: zodResolver(receiverSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
      country: '',
    },
  })

  const onSubmit = async (data: ReceiverFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })

      const result = await createReceiver(formData)

      if (result.error) {
        toast({
          title: 'Failed to create receiver',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Receiver created',
        description: 'New receiver has been added.',
      })

      if (onSuccess && result.data) {
        onSuccess(result.data.id)
      } else {
        router.back()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input id="name" {...register('name')} placeholder="Full name" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <Label htmlFor="phone">
          Phone <span className="text-destructive">*</span>
        </Label>
        <Input id="phone" {...register('phone')} placeholder="+1 234 567 8900" />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-1">
        <Label htmlFor="address">
          Address <span className="text-destructive">*</span>
        </Label>
        <Input id="address" {...register('address')} placeholder="Street address" />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      {/* City / Country row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="city">
            City <span className="text-destructive">*</span>
          </Label>
          <Input id="city" {...register('city')} placeholder="City" />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="country">
            Country <span className="text-destructive">*</span>
          </Label>
          <Input id="country" {...register('country')} placeholder="Country" />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        {/* Requirement 15.6: disabled while validation errors exist */}
        <Button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Creating...' : 'Create Receiver'}
        </Button>
      </div>
    </form>
  )
}
