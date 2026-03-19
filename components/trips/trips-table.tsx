'use client'

import { useRouter } from 'next/navigation'
import { DataTable, ColumnDef, FilterOption } from '@/components/shared/data-table'
import { TripStatusBadge } from '@/components/shared/trip-status-badge'
import type { Trip, TripStatus } from '@/lib/types/database'

interface TripsTableProps {
  trips: Trip[]
}

/**
 * Trips Table Component
 * Validates: Requirements 5.4
 *
 * Displays trips with driver/vehicle assignments and status filter.
 */
export function TripsTable({ trips }: TripsTableProps) {
  const router = useRouter()

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'All Statuses',
      options: [
        { value: 'planned', label: 'Planned' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ]

  const columns: ColumnDef<Trip>[] = [
    {
      key: 'route',
      header: 'Route',
      sortable: true,
    },
    {
      key: 'departure_date',
      header: 'Departure',
      sortable: true,
      cell: (t) => new Date(t.departure_date).toLocaleDateString(),
    },
    {
      key: 'expected_arrival',
      header: 'Expected Arrival',
      sortable: true,
      cell: (t) => new Date(t.expected_arrival).toLocaleDateString(),
    },
    {
      key: 'driver',
      header: 'Driver',
      cell: (t) => {
        const driver = t.driver as any
        return driver?.profile?.full_name ?? '—'
      },
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      cell: (t) => {
        const vehicle = t.vehicle as any
        return vehicle ? `${vehicle.plate_number} (${vehicle.type})` : '—'
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (t) => <TripStatusBadge status={t.status as TripStatus} />,
    },
  ]

  return (
    <DataTable
      data={trips}
      columns={columns}
      filterOptions={filterOptions}
      onRowClick={(trip) => router.push(`/trips/${trip.id}`)}
      itemsPerPage={20}
    />
  )
}
