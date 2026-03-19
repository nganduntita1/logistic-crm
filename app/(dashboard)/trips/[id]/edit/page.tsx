import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TripForm } from '@/components/trips/trip-form'
import { getTrip } from '@/app/actions/trips'
import { getDrivers } from '@/app/actions/drivers'
import { getVehicles } from '@/app/actions/vehicles'
import type { Driver, Vehicle } from '@/lib/types/database'

interface EditTripPageProps {
  params: { id: string }
}

/**
 * Edit Trip Page
 * Validates: Requirements 5.1, 5.2, 5.6, 5.7
 */
export default async function EditTripPage({ params }: EditTripPageProps) {
  const [{ data: trip, error }, { data: drivers }, { data: vehicles }] = await Promise.all([
    getTrip(params.id),
    getDrivers(),
    getVehicles(),
  ])

  if (error || !trip) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Trip</h1>
        <p className="text-muted-foreground">{trip.route}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TripForm
            trip={trip}
            drivers={(drivers ?? []) as Driver[]}
            vehicles={(vehicles ?? []) as Vehicle[]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
