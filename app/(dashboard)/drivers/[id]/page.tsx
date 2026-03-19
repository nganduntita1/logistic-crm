import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getDriver } from '@/app/actions/drivers'
import type { DriverStatus, TripStatus } from '@/lib/types/database'

interface DriverDetailPageProps {
  params: { id: string }
}

const driverStatusVariant: Record<DriverStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  on_leave: 'outline',
}

const driverStatusLabel: Record<DriverStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
}

const tripStatusVariant: Record<TripStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  planned: 'outline',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
}

const tripStatusLabel: Record<TripStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/**
 * Driver Detail Page
 * Validates: Requirements 6.5
 *
 * Displays driver information and trip history.
 */
export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { data: driver, trips, error } = await getDriver(params.id)

  if (error || !driver) {
    notFound()
  }

  const profile = driver.profile as { full_name: string; email: string } | undefined
  const vehicle = driver.vehicle as { plate_number: string; type: string } | undefined

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/drivers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Drivers
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile?.full_name ?? 'Driver'}
          </h1>
          <p className="text-muted-foreground">{profile?.email}</p>
        </div>
        <Button asChild>
          <Link href={`/drivers/${driver.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Driver
          </Link>
        </Button>
      </div>

      {/* Driver Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
            <p className="text-sm">{profile?.full_name ?? '—'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{profile?.email ?? '—'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">License Number</p>
            <p className="text-sm">{driver.license_number}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Passport Number</p>
            <p className="text-sm">{driver.passport_number}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Assigned Vehicle</p>
            <p className="text-sm">
              {vehicle ? `${vehicle.plate_number} (${vehicle.type})` : 'None'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={driverStatusVariant[driver.status as DriverStatus]}>
              {driverStatusLabel[driver.status as DriverStatus]}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Added</p>
            <p className="text-sm">{new Date(driver.created_at).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Trip History */}
      <Card>
        <CardHeader>
          <CardTitle>Trip History</CardTitle>
        </CardHeader>
        <CardContent>
          {trips && trips.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Route</th>
                    <th className="px-4 py-3 text-left font-medium">Departure</th>
                    <th className="px-4 py-3 text-left font-medium">Expected Arrival</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{trip.route}</td>
                      <td className="px-4 py-3">
                        {new Date(trip.departure_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(trip.expected_arrival).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tripStatusVariant[trip.status as TripStatus]}>
                          {tripStatusLabel[trip.status as TripStatus]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No trips assigned yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
