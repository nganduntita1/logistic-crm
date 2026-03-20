'use client'

import Link from 'next/link'
import { Calendar, MapPin, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TripStatusBadge } from '@/components/shared/trip-status-badge'
import type { Trip } from '@/lib/types/database'

interface TripCardProps {
  trip: Trip & { shipments?: { id: string; status: string; weight: number }[] }
}

/**
 * TripCard Component — mobile-optimized touch-friendly card
 * Validates: Requirements 8.6
 */
export function TripCard({ trip }: TripCardProps) {
  const pendingCount = trip.shipments?.filter((s) => s.status === 'in_transit').length ?? 0
  const totalCount = trip.shipments?.length ?? 0
  const activeLoadKg = (trip.shipments ?? []).reduce((sum, shipment) => sum + Number(shipment.weight), 0)
  const capacityKg = trip.vehicle?.capacity ? Number(trip.vehicle.capacity) : null
  const remainingKg = capacityKg !== null ? Math.max(capacityKg - activeLoadKg, 0) : null
  const utilizationPercent = capacityKg && capacityKg > 0
    ? Math.min((activeLoadKg / capacityKg) * 100, 100)
    : null
  const isOverCapacity = capacityKg !== null && activeLoadKg > capacityKg

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
          {capacityKg !== null && (
            <div className="rounded-md border p-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                Load: {activeLoadKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {capacityKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
              </p>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={isOverCapacity ? 'h-full bg-destructive transition-all' : 'h-full bg-primary transition-all'}
                  style={{ width: `${utilizationPercent ?? 0}%` }}
                />
              </div>
              <p className={isOverCapacity ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                {isOverCapacity
                  ? `Over capacity by ${(activeLoadKg - capacityKg).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`
                  : `Remaining: ${(remainingKg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg (${(utilizationPercent ?? 0).toFixed(1)}%)`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
