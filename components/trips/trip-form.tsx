'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tripSchema, type TripFormData } from '@/lib/validations/trip'
import { createTrip, updateTrip } from '@/app/actions/trips'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Trip, Driver, Vehicle } from '@/lib/types/database'

interface TripFormProps {
  trip?: Trip
  drivers: (Driver & { profile?: { full_name: string; email: string } })[]
  vehicles: Vehicle[]
}

/**
 * Trip Form Component
 * Validates: Requirements 5.1, 5.2, 5.6, 5.7, 15.1, 15.6
 *
 * Handles create and edit modes. Validates date ordering and
 * surfaces overlap errors from the server action.
 */
export function TripForm({ trip, drivers, vehicles }: TripFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = !!trip

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    mode: 'onChange',
    defaultValues: {
      route: trip?.route ?? '',
      departure_date: trip?.departure_date ?? '',
      expected_arrival: trip?.expected_arrival ?? '',
      driver_id: trip?.driver_id ?? '',
      vehicle_id: trip?.vehicle_id ?? '',
    },
  })

  const onSubmit = async (data: TripFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('route', data.route)
      formData.append('departure_date', data.departure_date)
      formData.append('expected_arrival', data.expected_arrival)
      if (data.driver_id) formData.append('driver_id', data.driver_id)
      if (data.vehicle_id) formData.append('vehicle_id', data.vehicle_id)

      const result = isEditMode
        ? await updateTrip(trip.id, formData)
        : await createTrip(formData)

      if (result.error) {
        toast({
          title: isEditMode ? 'Failed to update trip' : 'Failed to create trip',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: isEditMode ? 'Trip updated' : 'Trip created',
        description: isEditMode ? 'Trip details have been saved.' : 'New trip has been created.',
      })

      router.push('/trips')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Route */}
      <div className="space-y-1">
        <Label htmlFor="route">
          Route <span className="text-destructive">*</span>
        </Label>
        <Input
          id="route"
          {...register('route')}
          placeholder="e.g. Johannesburg → Lubumbashi"
        />
        {errors.route && (
          <p className="text-sm text-destructive">{errors.route.message}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="departure_date">
            Departure Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="departure_date"
            type="date"
            {...register('departure_date')}
          />
          {errors.departure_date && (
            <p className="text-sm text-destructive">{errors.departure_date.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="expected_arrival">
            Expected Arrival <span className="text-destructive">*</span>
          </Label>
          <Input
            id="expected_arrival"
            type="date"
            {...register('expected_arrival')}
          />
          {errors.expected_arrival && (
            <p className="text-sm text-destructive">{errors.expected_arrival.message}</p>
          )}
        </div>
      </div>

      {/* Driver */}
      <div className="space-y-1">
        <Label htmlFor="driver_id">Driver</Label>
        <select
          id="driver_id"
          {...register('driver_id')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">No driver assigned</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.profile?.full_name ?? driver.id} — {driver.license_number}
            </option>
          ))}
        </select>
        {errors.driver_id && (
          <p className="text-sm text-destructive">{errors.driver_id.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Drivers already assigned to overlapping trips cannot be selected.
        </p>
      </div>

      {/* Vehicle */}
      <div className="space-y-1">
        <Label htmlFor="vehicle_id">Vehicle</Label>
        <select
          id="vehicle_id"
          {...register('vehicle_id')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">No vehicle assigned</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.plate_number} — {vehicle.type} (cap: {vehicle.capacity})
            </option>
          ))}
        </select>
        {errors.vehicle_id && (
          <p className="text-sm text-destructive">{errors.vehicle_id.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Vehicles already assigned to overlapping trips cannot be selected.
        </p>
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
            : isEditMode ? 'Save Changes' : 'Create Trip'}
        </Button>
      </div>
    </form>
  )
}
