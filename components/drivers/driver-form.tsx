'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { driverSchema, type DriverFormData } from '@/lib/validations/driver'
import { createDriver, updateDriver } from '@/app/actions/drivers'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Driver, Vehicle } from '@/lib/types/database'

interface DriverProfile {
  id: string
  full_name: string
  email: string
}

interface DriverFormProps {
  driver?: Driver & { profile?: DriverProfile }
  profiles: DriverProfile[]
  vehicles: Vehicle[]
  onSuccess?: (driver: Driver & { profile?: DriverProfile }) => void
}

/**
 * Driver Form Component
 * Validates: Requirements 6.1, 6.6, 15.1, 15.6
 *
 * Handles both create and edit modes with Zod validation.
 * Includes uniqueness validation for license and passport numbers.
 */
export function DriverForm({ driver, profiles, vehicles, onSuccess }: DriverFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = !!driver

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    mode: 'onChange',
    defaultValues: {
      user_id: driver?.user_id ?? '',
      license_number: driver?.license_number ?? '',
      passport_number: driver?.passport_number ?? '',
      vehicle_id: driver?.vehicle_id ?? '',
    },
  })

  const onSubmit = async (data: DriverFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('user_id', data.user_id)
      formData.append('license_number', data.license_number)
      formData.append('passport_number', data.passport_number)
      if (data.vehicle_id) {
        formData.append('vehicle_id', data.vehicle_id)
      }

      const result = isEditMode
        ? await updateDriver(driver.id, formData)
        : await createDriver(formData)

      if (result.error) {
        toast({
          title: isEditMode ? 'Failed to update driver' : 'Failed to create driver',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: isEditMode ? 'Driver updated' : 'Driver created',
        description: isEditMode
          ? 'Driver details have been saved.'
          : 'New driver has been added.',
      })

      if (onSuccess && result.data) {
        onSuccess(result.data as Driver & { profile?: DriverProfile })
      } else {
        router.push('/drivers')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* User (Profile) */}
      <div className="space-y-1">
        <Label htmlFor="user_id">
          User Account <span className="text-destructive">*</span>
        </Label>
        <select
          id="user_id"
          {...register('user_id')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select a user account</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name} ({profile.email})
            </option>
          ))}
        </select>
        {errors.user_id && (
          <p className="text-sm text-destructive">{errors.user_id.message}</p>
        )}
        {profiles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No driver accounts available. Create a user with the driver role first.
          </p>
        )}
      </div>

      {/* License Number */}
      <div className="space-y-1">
        <Label htmlFor="license_number">
          License Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="license_number"
          {...register('license_number')}
          placeholder="e.g. DL-123456"
        />
        {errors.license_number && (
          <p className="text-sm text-destructive">{errors.license_number.message}</p>
        )}
      </div>

      {/* Passport Number */}
      <div className="space-y-1">
        <Label htmlFor="passport_number">
          Passport Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="passport_number"
          {...register('passport_number')}
          placeholder="e.g. A12345678"
        />
        {errors.passport_number && (
          <p className="text-sm text-destructive">{errors.passport_number.message}</p>
        )}
      </div>

      {/* Vehicle Assignment (optional) */}
      <div className="space-y-1">
        <Label htmlFor="vehicle_id">Assigned Vehicle</Label>
        <select
          id="vehicle_id"
          {...register('vehicle_id')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">No vehicle assigned</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.plate_number} — {vehicle.type}
            </option>
          ))}
        </select>
        {errors.vehicle_id && (
          <p className="text-sm text-destructive">{errors.vehicle_id.message}</p>
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
            : isEditMode ? 'Save Changes' : 'Create Driver'}
        </Button>
      </div>
    </form>
  )
}
