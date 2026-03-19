import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TripForm } from '@/components/trips/trip-form'
import { getDrivers } from '@/app/actions/drivers'
import { getVehicles } from '@/app/actions/vehicles'
import type { Driver, Vehicle } from '@/lib/types/database'

/**
 * New Trip Page
 * Validates: Requirements 5.1, 5.2
 */
export default async function NewTripPage() {
  const [{ data: drivers }, { data: vehicles }] = await Promise.all([
    getDrivers(),
    getVehicles(),
  ])

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Trip</h1>
        <p className="text-muted-foreground">Plan a new cargo trip</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TripForm
            drivers={(drivers ?? []) as Driver[]}
            vehicles={(vehicles ?? []) as Vehicle[]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
