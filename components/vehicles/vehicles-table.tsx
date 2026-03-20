'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { InsuranceWarning } from '@/components/vehicles/insurance-warning'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/shared/search-input'
import { PaginationControls } from '@/components/shared/pagination-controls'
import type { PaginationMeta } from '@/lib/pagination'
import type { Vehicle, VehicleStatus } from '@/lib/types/database'

interface VehiclesTableProps {
  vehicles: Vehicle[]
  pagination?: PaginationMeta
  initialQuery?: string
}

const statusVariant: Record<VehicleStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  available: 'default',
  in_use: 'secondary',
  maintenance: 'outline',
  retired: 'destructive',
}

const statusLabel: Record<VehicleStatus, string> = {
  available: 'Available',
  in_use: 'In Use',
  maintenance: 'Maintenance',
  retired: 'Retired',
}

/**
 * Vehicles Table Component
 * Validates: Requirements 7.4
 *
 * Displays vehicles in a DataTable with insurance expiry warnings.
 */
export function VehiclesTable({ vehicles, pagination, initialQuery = '' }: VehiclesTableProps) {
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

  const columns: ColumnDef<Vehicle>[] = [
    {
      key: 'plate_number',
      header: 'Plate Number',
      sortable: true,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
    },
    {
      key: 'capacity',
      header: 'Capacity (kg)',
      sortable: true,
      cell: (vehicle) => vehicle.capacity.toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (vehicle) => (
        <Badge variant={statusVariant[vehicle.status]}>
          {statusLabel[vehicle.status]}
        </Badge>
      ),
    },
    {
      key: 'insurance_expiry',
      header: 'Insurance Expiry',
      sortable: true,
      cell: (vehicle) => (
        <div className="flex items-center gap-2">
          <span>{new Date(vehicle.insurance_expiry).toLocaleDateString()}</span>
          <InsuranceWarning insuranceExpiry={vehicle.insurance_expiry} />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search by plate number or vehicle type..."
        onSearch={(query) => updateQueryParams({ q: query.trim() || null, page: '1' })}
        defaultValue={initialQuery}
        className="max-w-sm"
      />
      <DataTable
        data={vehicles}
        columns={columns}
        onRowClick={(vehicle) => router.push(`/vehicles/${vehicle.id}`)}
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
