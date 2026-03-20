'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tripSchema, type TripFormData } from '@/lib/validations/trip'
import { createTrip, updateTrip } from '@/app/actions/trips'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { quickCreateDriver } from '@/app/actions/drivers'
import { VehicleForm } from '@/components/vehicles/vehicle-form'
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
  const [driverOptions, setDriverOptions] = useState(drivers)
  const [vehicleOptions, setVehicleOptions] = useState(vehicles)
  const [driverDialogOpen, setDriverDialogOpen] = useState(false)
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [quickDriverName, setQuickDriverName] = useState('')
  const [quickDriverEmail, setQuickDriverEmail] = useState('')
  const [quickDriverPassword, setQuickDriverPassword] = useState('')
  const [quickDriverLicense, setQuickDriverLicense] = useState('')
  const [quickDriverSubmitting, setQuickDriverSubmitting] = useState(false)
  const [quickDriverError, setQuickDriverError] = useState('')

  const isEditMode = !!trip

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    mode: 'onChange',
    defaultValues: {
      route: trip?.route ?? '',
      transport_mode: trip?.transport_mode ?? 'road',
      air_origin: trip?.air_origin ?? '',
      air_destination: trip?.air_destination ?? '',
      air_eta_days: trip?.air_eta_days ?? 1,
      departure_date: trip?.departure_date ?? '',
      expected_arrival: trip?.expected_arrival ?? '',
      driver_id: trip?.driver_id ?? '',
      vehicle_id: trip?.vehicle_id ?? '',
    },
  })

  const transportMode = watch('transport_mode')
  const departureDate = watch('departure_date')
  const airEtaDays = watch('air_eta_days')

  useEffect(() => {
    if (transportMode !== 'air') {
      return
    }

    setValue('driver_id', '', { shouldValidate: true })
    setValue('vehicle_id', '', { shouldValidate: true })

    if (!departureDate || (airEtaDays !== 1 && airEtaDays !== 2)) {
      return
    }

    const departure = new Date(departureDate)
    departure.setDate(departure.getDate() + Number(airEtaDays))
    const computedArrival = departure.toISOString().slice(0, 10)
    setValue('expected_arrival', computedArrival, { shouldValidate: true })
  }, [transportMode, departureDate, airEtaDays, setValue])

  const onSubmit = async (data: TripFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('route', data.route ?? '')
      formData.append('transport_mode', data.transport_mode)
      formData.append('air_origin', data.air_origin ?? '')
      formData.append('air_destination', data.air_destination ?? '')
      if (data.air_eta_days) {
        formData.append('air_eta_days', String(data.air_eta_days))
      }
      formData.append('departure_date', data.departure_date)
      formData.append('expected_arrival', data.expected_arrival)
      if (data.transport_mode === 'road') {
        if (data.driver_id) formData.append('driver_id', data.driver_id)
        if (data.vehicle_id) formData.append('vehicle_id', data.vehicle_id)
      }

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
      {/* Transport Mode */}
      <div className="space-y-1">
        <Label htmlFor="transport_mode">
          Transport Mode <span className="text-destructive">*</span>
        </Label>
        <select
          id="transport_mode"
          {...register('transport_mode')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="road">Road (vehicle + driver)</option>
          <option value="air">Air (plane)</option>
        </select>
      </div>

      {/* Route (road) */}
      {transportMode === 'road' && (
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
      )}

      {/* Air details */}
      {transportMode === 'air' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="air_origin">
              From <span className="text-destructive">*</span>
            </Label>
            <Input id="air_origin" {...register('air_origin')} placeholder="e.g. Johannesburg" />
            {errors.air_origin && (
              <p className="text-sm text-destructive">{errors.air_origin.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="air_destination">
              To <span className="text-destructive">*</span>
            </Label>
            <Input id="air_destination" {...register('air_destination')} placeholder="e.g. Lubumbashi" />
            {errors.air_destination && (
              <p className="text-sm text-destructive">{errors.air_destination.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="air_eta_days">
              Plane ETA <span className="text-destructive">*</span>
            </Label>
            <select
              id="air_eta_days"
              {...register('air_eta_days', { valueAsNumber: true })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value={1}>1 day</option>
              <option value={2}>2 days</option>
            </select>
            {errors.air_eta_days && (
              <p className="text-sm text-destructive">{errors.air_eta_days.message}</p>
            )}
          </div>
        </div>
      )}

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
            readOnly={transportMode === 'air'}
          />
          {errors.expected_arrival && (
            <p className="text-sm text-destructive">{errors.expected_arrival.message}</p>
          )}
          {transportMode === 'air' && (
            <p className="text-xs text-muted-foreground">
              For plane trips, expected arrival is auto-calculated from departure date and ETA.
            </p>
          )}
        </div>
      </div>

      {/* Driver + Vehicle only for road trips */}
      {transportMode === 'road' && (
        <>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="driver_id">Driver</Label>
              <Dialog open={driverDialogOpen} onOpenChange={(open) => {
                  setDriverDialogOpen(open)
                  if (!open) {
                    setQuickDriverName('')
                    setQuickDriverEmail('')
                    setQuickDriverPassword('')
                    setQuickDriverLicense('')
                    setQuickDriverError('')
                  }
                }}>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="outline">+ New Driver</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Driver</DialogTitle>
                  </DialogHeader>
                  <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setQuickDriverSubmitting(true)
                      setQuickDriverError('')
                      const result = await quickCreateDriver({
                        fullName: quickDriverName,
                        email: quickDriverEmail,
                        password: quickDriverPassword,
                        licenseNumber: quickDriverLicense,
                      })
                      setQuickDriverSubmitting(false)
                      if (result.error) {
                        setQuickDriverError(result.error)
                        return
                      }
                      if (result.data) {
                        const newDriver = result.data as unknown as Driver & { profile?: { full_name: string; email: string } }
                        setDriverOptions((prev) => [newDriver, ...prev])
                        setValue('driver_id', result.data.id, { shouldValidate: true })
                        setDriverDialogOpen(false)
                        toast({ title: 'Driver created', description: 'Driver has been added and selected for this trip.' })
                      }
                    }}
                  >
                    <div className="space-y-1">
                      <Label htmlFor="qd-name">Full Name <span className="text-destructive">*</span></Label>
                      <Input id="qd-name" value={quickDriverName} onChange={(e) => setQuickDriverName(e.target.value)} placeholder="Jane Doe" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="qd-email">Email <span className="text-destructive">*</span></Label>
                      <Input id="qd-email" type="email" value={quickDriverEmail} onChange={(e) => setQuickDriverEmail(e.target.value)} placeholder="jane@example.com" required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="qd-password">Password <span className="text-destructive">*</span></Label>
                      <Input id="qd-password" type="password" value={quickDriverPassword} onChange={(e) => setQuickDriverPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="qd-license">License Number <span className="text-destructive">*</span></Label>
                      <Input id="qd-license" value={quickDriverLicense} onChange={(e) => setQuickDriverLicense(e.target.value)} placeholder="e.g. DL-123456" required />
                    </div>
                    {quickDriverError && <p className="text-sm text-destructive">{quickDriverError}</p>}
                    <Button type="submit" disabled={quickDriverSubmitting} className="w-full">
                      {quickDriverSubmitting ? 'Creating...' : 'Create Driver'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <select
              id="driver_id"
              {...register('driver_id')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No driver assigned</option>
              {driverOptions.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.profile?.full_name ?? driver.id} — {driver.license_number}
                </option>
              ))}
            </select>
            {errors.driver_id && (
              <p className="text-sm text-destructive">{errors.driver_id.message}</p>
            )}
            {driverOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No drivers found. Use the New Driver button above to create one without leaving this trip.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Drivers already assigned to overlapping trips cannot be selected.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="vehicle_id">Vehicle</Label>
              <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="outline">+ New Vehicle</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Vehicle</DialogTitle>
                  </DialogHeader>
                  <VehicleForm
                    onSuccess={(createdVehicle) => {
                      setVehicleOptions((prev) => [createdVehicle, ...prev])
                      setValue('vehicle_id', createdVehicle.id, { shouldValidate: true })
                      setVehicleDialogOpen(false)
                      toast({ title: 'Vehicle created', description: 'Vehicle selected for this trip.' })
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <select
              id="vehicle_id"
              {...register('vehicle_id')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No vehicle assigned</option>
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate_number} — {vehicle.type} (cap: {vehicle.capacity})
                </option>
              ))}
            </select>
            {errors.vehicle_id && (
              <p className="text-sm text-destructive">{errors.vehicle_id.message}</p>
            )}
            {vehicleOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No vehicles found. Use the New Vehicle button above to create one inline.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Vehicles already assigned to overlapping trips cannot be selected.
            </p>
          </div>
        </>
      )}

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
