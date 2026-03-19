'use client'

import { CheckCircle2, Clock, Package, Truck, XCircle } from 'lucide-react'
import type { ShipmentStatus, ShipmentStatusHistory } from '@/lib/types/database'

interface TimelineEntry extends Omit<ShipmentStatusHistory, 'profile'> {
  profile?: { full_name: string; email: string } | null
}

interface ShipmentTimelineProps {
  events: TimelineEntry[]
}

const statusConfig: Record<ShipmentStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-muted-foreground',
  },
  in_transit: {
    label: 'In Transit',
    icon: Truck,
    color: 'text-blue-500',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    color: 'text-green-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-destructive',
  },
}

/**
 * Shipment Timeline Component
 * Validates: Requirements 20.1, 20.2, 20.3, 20.5
 *
 * Displays status history in chronological order with timestamps,
 * user info, and visual indicators per status.
 */
export function ShipmentTimeline({ events }: ShipmentTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No status history available.</p>
    )
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-6">
      {events.map((event, index) => {
        const config = statusConfig[event.status as ShipmentStatus] ?? {
          label: event.status,
          icon: Package,
          color: 'text-muted-foreground',
        }
        const Icon = config.icon
        const isLast = index === events.length - 1

        return (
          <li key={event.id} className="ml-6">
            {/* Circle marker on the timeline line */}
            <span
              className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-border ${config.color}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>

            <div className="space-y-0.5">
              <p className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </p>

              {/* Timestamp — Requirement 20.2 */}
              <time className="text-xs text-muted-foreground">
                {new Date(event.created_at).toLocaleString()}
              </time>

              {/* User who made the change — Requirement 20.3 */}
              {event.profile && (
                <p className="text-xs text-muted-foreground">
                  by {event.profile.full_name}
                </p>
              )}

              {/* Notes */}
              {event.notes && (
                <p className="text-sm text-foreground/80 mt-1">{event.notes}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
