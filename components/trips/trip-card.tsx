'use client'

import Link from 'next/link'
import { Calendar, MapPin, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TripStatusBadge } from '@/components/shared/trip-status-badge'
import type { Trip } from '@/lib/types/database'

interface TripCardProps {
  trip: Trip & { shipments?: { id: string; status: string }[] }
}

/**
 * TripCard Component — mobile-optimized touch-friendly card
 * Validates: Requirements 8.6
 */
export function TripCard({ trip }: TripCardProps) {
  const pendingCount = trip.shipments?.filter((s) => s.status === 'in_transit').length ?? 0
  const totalCount = trip.shipments?.length ?? 0

  return (
    <Link href={`/trips/${trip.id}`} className="block">
      <Card className="active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="font-semibold text-base truncate">{trip.route}</span>
            </div>
            <TripStatusBadge status={trip.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {new Date(trip.departure_date).toLocaleDateString()} →{' '}
              {new Date(trip.expected_arrival).toLocaleDateString()}
            </span>
          </div>
          {trip.vehicle && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0" />
              <span>{trip.vehicle.plate_number} — {trip.vehicle.type}</span>
            </div>
          )}
          {totalCount > 0 && (
            <div className="text-sm font-medium text-foreground">
              {pendingCount} pending delivery{pendingCount !== 1 ? 'ies' : ''} / {totalCount} total
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
