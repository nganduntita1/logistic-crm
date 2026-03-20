'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { HighlightText } from '@/components/shared/highlight-text'
import { PaginationControls } from '@/components/shared/pagination-controls'
import type { PaginationMeta } from '@/lib/pagination'
import type { ShipmentStatus, PaymentStatus } from '@/lib/types/database'

interface ShipmentLookup {
  id: string
  name: string
}

interface ShipmentTableRow {
  id: string
  tracking_number: string
  description: string
  status: ShipmentStatus
  payment_status: PaymentStatus
  price: number
  created_at: string
  client?: ShipmentLookup | ShipmentLookup[] | null
}

interface ShipmentsTableProps {
  shipments: ShipmentTableRow[]
  pagination?: PaginationMeta
  initialQuery?: string
  currentStatus?: string
  currentPaymentStatus?: string
}

export function ShipmentsTable({
  shipments,
  pagination,
  initialQuery = '',
  currentStatus = '',
  currentPaymentStatus = '',
}: ShipmentsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname)
  }

  const handleRowClick = (shipment: ShipmentTableRow) => {
    router.push(`/shipments/${shipment.id}`)
  }

  const columns: ColumnDef<ShipmentTableRow>[] = [
    {
      key: 'tracking_number',
      header: 'Tracking #',
      sortable: true,
      cell: (shipment) => <HighlightText text={shipment.tracking_number} highlight={initialQuery} />,
    },
    {
      key: 'client',
      header: 'Client',
      cell: (shipment) => {
        if (!shipment.client) return '—'
        return Array.isArray(shipment.client)
          ? shipment.client[0]?.name ?? '—'
          : shipment.client.name
      },
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (shipment) => <StatusBadge status={shipment.status} />,
    },
    {
      key: 'payment_status',
      header: 'Payment',
      sortable: true,
      cell: (shipment) => <PaymentStatusBadge status={shipment.payment_status} />,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      cell: (shipment) => `$${shipment.price.toLocaleString()}`,
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      cell: (shipment) => new Date(shipment.created_at).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search by tracking number..."
        onSearch={(query) => updateQueryParams({ q: query.trim() || null, page: '1' })}
        defaultValue={initialQuery}
        className="max-w-sm"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={currentStatus}
          onChange={(event) => updateQueryParams({ status: event.target.value || null, page: '1' })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={currentPaymentStatus}
          onChange={(event) => updateQueryParams({ payment: event.target.value || null, page: '1' })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <DataTable
        data={shipments}
        columns={columns}
        onRowClick={handleRowClick}
        itemsPerPage={20}
      />
      {pagination && (
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          onPageChange={(page) => updateQueryParams({ page: String(page) })}
        />
      )}
    </div>
  )
}
