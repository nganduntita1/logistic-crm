import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getTrip } from '@/app/actions/trips'
import { TripStatusBadge } from '@/components/shared/trip-status-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { TripStatusControls } from '@/components/trips/trip-status-controls'
import type { TripStatus, ShipmentStatus, Shipment, Client, Receiver } from '@/lib/types/database'

interface TripDetailPageProps {
  params: { id: string }
}

/**
 * Trip Detail Page
 * Validates: Requirements 5.3, 5.4
 *
 * Displays trip info, assigned shipments, and status update controls.
 */
export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { data: trip, shipments = [], error } = await getTrip(params.id)

  if (error || !trip) {
    notFound()
  }

  const driver = trip.driver as any
  const vehicle = trip.vehicle as any

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/trips">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trips
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{trip.route}</h1>
          <p className="text-muted-foreground">
            {new Date(trip.departure_date).toLocaleDateString()} →{' '}
            {new Date(trip.expected_arrival).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TripStatusControls tripId={trip.id} currentStatus={trip.status as TripStatus} />
          <Button asChild variant="outline">
            <Link href={`/trips/${trip.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Trip
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trip Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <TripStatusBadge status={trip.status as TripStatus} />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Route</p>
                <p className="text-sm">{trip.route}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Departure</p>
                <p className="text-sm">{new Date(trip.departure_date).toLocaleDateString()}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Expected Arrival</p>
                <p className="text-sm">{new Date(trip.expected_arrival).toLocaleDateString()}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Driver</p>
                <p className="text-sm">
                  {driver?.profile?.full_name ? (
                    <Link href={`/drivers/${driver.id}`} className="underline underline-offset-2">
                      {driver.profile.full_name}
                    </Link>
                  ) : '—'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Vehicle</p>
                <p className="text-sm">
                  {vehicle ? (
                    <Link href={`/vehicles/${vehicle.id}`} className="underline underline-offset-2">
                      {vehicle.plate_number} ({vehicle.type})
                    </Link>
                  ) : '—'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(trip.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Shipments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Assigned Shipments
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({shipments.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipments.length > 0 ? (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Tracking #</th>
                        <th className="px-4 py-3 text-left font-medium">Client</th>
                        <th className="px-4 py-3 text-left font-medium">Receiver</th>
                        <th className="px-4 py-3 text-left font-medium">Description</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(shipments as Shipment[]).map((shipment) => {
                        const client = shipment.client as Client | undefined
                        const receiver = shipment.receiver as Receiver | undefined
                        return (
                          <tr key={shipment.id} className="border-b last:border-0">
                            <td className="px-4 py-3">
                              <Link
                                href={`/shipments/${shipment.id}`}
                                className="font-mono text-xs underline underline-offset-2"
                              >
                                {shipment.tracking_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3">{client?.name ?? '—'}</td>
                            <td className="px-4 py-3">
                              {receiver ? `${receiver.name}, ${receiver.city}` : '—'}
                            </td>
                            <td className="px-4 py-3 max-w-[200px] truncate">
                              {shipment.description}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={shipment.status as ShipmentStatus} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No shipments assigned to this trip yet. Assign shipments from the{' '}
                  <Link href="/shipments" className="underline underline-offset-2">
                    shipments page
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
