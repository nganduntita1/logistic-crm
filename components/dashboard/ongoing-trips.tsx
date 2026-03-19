'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TripStatusBadge } from '@/components/shared/trip-status-badge'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { getOngoingTrips, type OngoingTrip } from '@/app/actions/dashboard'
import { Calendar, Truck, User } from 'lucide-react'

export function OngoingTrips() {
  const [trips, setTrips] = useState<OngoingTrip[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const result = await getOngoingTrips(6)
        if (result.error) {
          setError(result.error)
        } else {
          setTrips(result.data || null)
          setError(null)
        }
      } catch {
        setError('Failed to load ongoing trips')
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-sm text-destructive">{error}</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ongoing Trips</CardTitle>
      </CardHeader>
      <CardContent>
        {!trips || trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trips currently in progress</p>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-foreground truncate">{trip.route}</p>
                  <TripStatusBadge status={trip.status} />
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {trip.driver_name}
                  </p>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    {trip.vehicle_plate ?? 'No vehicle assigned'}
                  </p>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(trip.departure_date).toLocaleDateString('en-ZA')} {'->'}{' '}
                    {new Date(trip.expected_arrival).toLocaleDateString('en-ZA')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
