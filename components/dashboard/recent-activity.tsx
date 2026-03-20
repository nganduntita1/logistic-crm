'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { getRecentShipments, type RecentShipment } from '@/app/actions/dashboard'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import type { ShipmentStatus, PaymentStatus } from '@/lib/types/database'

interface RecentActivityProps {
  initialShipments?: RecentShipment[]
}

export function RecentActivity({ initialShipments = [] }: RecentActivityProps) {
  const [shipments, setShipments] = useState<RecentShipment[] | null>(initialShipments.length > 0 ? initialShipments : null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(initialShipments.length === 0)

  useEffect(() => {
    if (initialShipments.length > 0) {
      return
    }

    async function fetch() {
      try {
        setLoading(true)
        const result = await getRecentShipments(8)
        if (result.error) {
          setError(result.error)
        } else {
          setShipments(result.data || null)
        }
      } catch (err) {
        setError('Failed to load recent activity')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [initialShipments])

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!shipments || shipments.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent shipments</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Shipments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shipments.map((shipment) => (
            <Link
              key={shipment.id}
              href={`/shipments/${shipment.id}`}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold text-foreground truncate">
                  {shipment.tracking_number}
                </p>
                <p className="text-xs text-muted-foreground">
                  {shipment.client_name} •{' '}
                  {new Date(shipment.created_at).toLocaleDateString('en-ZA')}
                </p>
              </div>
              <div className="flex gap-2 ml-2">
                <StatusBadge status={shipment.status as ShipmentStatus} />
                <PaymentStatusBadge status={shipment.payment_status as PaymentStatus} />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
