import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ShipmentsTable } from '@/components/shipments/shipments-table'
import { getPaginatedShipments } from '@/app/actions/shipments'

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string; status?: string; payment?: string }
}) {
  const query = searchParams?.q ?? ''
  const status = searchParams?.status ?? ''
  const paymentStatus = searchParams?.payment ?? ''

  const { data: shipments, pagination, error } = await getPaginatedShipments({
    page: searchParams?.page ? Number(searchParams.page) : 1,
    pageSize: 20,
    query,
    status,
    paymentStatus,
  })

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

      <ShipmentsTable
        shipments={shipments ?? []}
        pagination={pagination}
        initialQuery={query}
        currentStatus={status}
        currentPaymentStatus={paymentStatus}
      />
    </div>
  )
}
