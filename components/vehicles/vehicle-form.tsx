'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vehicleSchema, type VehicleFormData } from '@/lib/validations/vehicle'
import { createVehicle, updateVehicle } from '@/app/actions/vehicles'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Vehicle } from '@/lib/types/database'

interface VehicleFormProps {
  vehicle?: Vehicle
  onSuccess?: () => void
}

/**
 * Vehicle Form Component
 * Validates: Requirements 7.1, 7.3, 15.1, 15.6
 *
 * Handles both create and edit modes with Zod validation.
 */
export function VehicleForm({ vehicle, onSuccess }: VehicleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = !!vehicle

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    mode: 'onChange',
    defaultValues: {
      plate_number: vehicle?.plate_number ?? '',
      type: vehicle?.type ?? '',
      capacity: vehicle?.capacity ?? ('' as unknown as number),
      insurance_expiry: vehicle?.insurance_expiry
        ? vehicle.insurance_expiry.split('T')[0]
        : '',
    },
  })

  const onSubmit = async (data: VehicleFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('plate_number', data.plate_number)
      formData.append('type', data.type)
      formData.append('capacity', String(data.capacity))
      formData.append('insurance_expiry', data.insurance_expiry)

      const result = isEditMode
        ? await updateVehicle(vehicle.id, formData)
        : await createVehicle(formData)

      if (result.error) {
        toast({
          title: isEditMode ? 'Failed to update vehicle' : 'Failed to create vehicle',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: isEditMode ? 'Vehicle updated' : 'Vehicle created',
        description: isEditMode
          ? 'Vehicle details have been saved.'
          : 'New vehicle has been added.',
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/vehicles')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Plate Number */}
      <div className="space-y-1">
        <Label htmlFor="plate_number">
          Plate Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="plate_number"
          {...register('plate_number')}
          placeholder="e.g. ABC 123 GP"
        />
        {errors.plate_number && (
          <p className="text-sm text-destructive">{errors.plate_number.message}</p>
        )}
      </div>

      {/* Vehicle Type */}
      <div className="space-y-1">
        <Label htmlFor="type">
          Vehicle Type <span className="text-destructive">*</span>
        </Label>
        <Input
          id="type"
          {...register('type')}
          placeholder="e.g. Truck, Van, Trailer"
        />
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Capacity */}
      <div className="space-y-1">
        <Label htmlFor="capacity">
          Capacity (kg) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="capacity"
          type="number"
          min="1"
          step="1"
          {...register('capacity', { valueAsNumber: true })}
          placeholder="e.g. 5000"
        />
        {errors.capacity && (
          <p className="text-sm text-destructive">{errors.capacity.message}</p>
        )}
      </div>

      {/* Insurance Expiry */}
      <div className="space-y-1">
        <Label htmlFor="insurance_expiry">
          Insurance Expiry <span className="text-destructive">*</span>
        </Label>
        <Input
          id="insurance_expiry"
          type="date"
          {...register('insurance_expiry')}
        />
        {errors.insurance_expiry && (
          <p className="text-sm text-destructive">{errors.insurance_expiry.message}</p>
        )}
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
        <Button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting
            ? isEditMode ? 'Saving...' : 'Creating...'
            : isEditMode ? 'Save Changes' : 'Create Vehicle'}
        </Button>
      </div>
    </form>
  )
}
