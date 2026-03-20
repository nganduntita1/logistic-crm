'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { TripStatusBadge } from '@/components/shared/trip-status-badge'
import { PaginationControls } from '@/components/shared/pagination-controls'
import type { PaginationMeta } from '@/lib/pagination'
import type { TripStatus } from '@/lib/types/database'

interface TripDriver {
  profile?: { full_name: string } | { full_name: string }[] | null
}

interface TripVehicle {
  plate_number: string
  type: string
}

interface TripRow {
  id: string
  route: string
  departure_date: string
  expected_arrival: string
  status: TripStatus
  driver?: TripDriver | TripDriver[] | null
  vehicle?: TripVehicle | TripVehicle[] | null
}

interface TripsTableProps {
  trips: TripRow[]
  pagination?: PaginationMeta
  currentStatus?: string
}

/**
 * Trips Table Component
 * Validates: Requirements 5.4
 *
 * Displays trips with driver/vehicle assignments and status filter.
 */
export function TripsTable({ trips, pagination, currentStatus = '' }: TripsTableProps) {
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

  const columns: ColumnDef<TripRow>[] = [
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
        const driver = Array.isArray(t.driver) ? t.driver[0] : t.driver
        const profile = Array.isArray(driver?.profile) ? driver?.profile[0] : driver?.profile
        return profile?.full_name ?? '—'
      },
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      cell: (t) => {
        const vehicle = Array.isArray(t.vehicle) ? t.vehicle[0] : t.vehicle
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={currentStatus}
          onChange={(event) => updateQueryParams({ status: event.target.value || null, page: '1' })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <DataTable
        data={trips}
        columns={columns}
        onRowClick={(trip) => router.push(`/trips/${trip.id}`)}
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
