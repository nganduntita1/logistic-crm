'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, ColumnDef, FilterOption } from '@/components/shared/data-table'
import { SearchInput } from '@/components/shared/search-input'
import { StatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { HighlightText } from '@/components/shared/highlight-text'
import { searchShipments } from '@/app/actions/shipments'
import type { Shipment, ShipmentStatus, PaymentStatus } from '@/lib/types/database'

interface ShipmentsTableProps {
  shipments: Shipment[]
}

/**
 * Shipments Table Component
 * Validates: Requirements 12.1, 17.4
 *
 * Searchable by tracking number, filterable by status and payment_status.
 */
export function ShipmentsTable({ shipments: initialShipments }: ShipmentsTableProps) {
  const router = useRouter()
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    const { data, error } = await searchShipments(query)
    if (!error && data) {
      setShipments(data as Shipment[])
    }
    setIsSearching(false)
  }, [])

  const handleRowClick = (shipment: Shipment) => {
    router.push(`/shipments/${shipment.id}`)
  }

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'All Statuses',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'in_transit', label: 'In Transit' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      key: 'payment_status',
      label: 'All Payments',
      options: [
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'partial', label: 'Partial' },
        { value: 'paid', label: 'Paid' },
      ],
    },
  ]

  const columns: ColumnDef<Shipment>[] = [
    {
      key: 'tracking_number',
      header: 'Tracking #',
      sortable: true,
      cell: (s) => <HighlightText text={s.tracking_number} highlight={searchQuery} />,
    },
    {
      key: 'client',
      header: 'Client',
      cell: (s) => (s.client as any)?.name ?? '—',
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
      cell: (s) => <StatusBadge status={s.status as ShipmentStatus} />,
    },
    {
      key: 'payment_status',
      header: 'Payment',
      sortable: true,
      cell: (s) => <PaymentStatusBadge status={s.payment_status as PaymentStatus} />,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      cell: (s) => `$${s.price.toLocaleString()}`,
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      cell: (s) => new Date(s.created_at).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search by tracking number..."
        onSearch={handleSearch}
        className="max-w-sm"
      />
      {isSearching && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}
      <DataTable
        data={shipments}
        columns={columns}
        filterOptions={filterOptions}
        onRowClick={handleRowClick}
        itemsPerPage={20}
      />
    </div>
  )
}
