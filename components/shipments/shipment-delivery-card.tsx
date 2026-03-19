'use client'

import Link from 'next/link'
import { Package, User, Weight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import type { Shipment } from '@/lib/types/database'

interface ShipmentDeliveryCardProps {
  shipment: Shipment
}

/**
 * ShipmentDeliveryCard Component — links to delivery confirmation page
 * Validates: Requirements 8.3
 */
export function ShipmentDeliveryCard({ shipment }: ShipmentDeliveryCardProps) {
  return (
    <Link href={`/driver-portal/deliveries/${shipment.id}`} className="block">
      <Card className="active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Package className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="font-mono text-sm font-semibold truncate">
                {shipment.tracking_number}
              </span>
            </div>
            <StatusBadge status={shipment.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-0">
          <p className="text-sm text-foreground line-clamp-2">{shipment.description}</p>
          {shipment.receiver && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span>{shipment.receiver.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Weight className="h-4 w-4 shrink-0" />
            <span>
              {shipment.quantity} item{shipment.quantity !== 1 ? 's' : ''} · {shipment.weight} kg
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
