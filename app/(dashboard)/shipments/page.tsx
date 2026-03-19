import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ShipmentsTable } from '@/components/shipments/shipments-table'
import { getShipments } from '@/app/actions/shipments'

/**
 * Shipment List Page
 * Validates: Requirements 12.1, 17.4
 *
 * Displays all shipments with search by tracking number and
 * filters for status and payment_status.
 */
export default async function ShipmentsPage() {
  const { data: shipments, error } = await getShipments()

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error loading shipments: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="text-muted-foreground">Track and manage cargo shipments</p>
        </div>
        <Button asChild>
          <Link href="/shipments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Shipment
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading shipments...</div>}>
        <ShipmentsTable shipments={shipments ?? []} />
      </Suspense>
    </div>
  )
}
