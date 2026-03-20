'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/shared/search-input'
import { PaginationControls } from '@/components/shared/pagination-controls'
import type { PaginationMeta } from '@/lib/pagination'
import type { DriverStatus } from '@/lib/types/database'

interface DriverWithRelations {
  id: string
  license_number: string
  passport_number: string
  status: DriverStatus
  profile?: { full_name: string; email: string } | { full_name: string; email: string }[] | null
  vehicle?: { plate_number: string; type: string } | { plate_number: string; type: string }[] | null
}

interface DriversTableProps {
  drivers: DriverWithRelations[]
  pagination?: PaginationMeta
  initialQuery?: string
}

const statusVariant: Record<DriverStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  on_leave: 'outline',
}

const statusLabel: Record<DriverStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
}

/**
 * Drivers Table Component
 * Validates: Requirements 6.5
 *
 * Displays drivers in a DataTable with assigned vehicle info.
 */
export function DriversTable({ drivers, pagination, initialQuery = '' }: DriversTableProps) {
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

  const columns: ColumnDef<DriverWithRelations>[] = [
    {
      key: 'profile',
      header: 'Name',
      sortable: false,
      cell: (driver) => {
        const profile = Array.isArray(driver.profile) ? driver.profile[0] : driver.profile
        return profile?.full_name ?? '—'
      },
    },
    {
      key: 'license_number',
      header: 'License Number',
      sortable: true,
    },
    {
      key: 'passport_number',
      header: 'Passport Number',
      sortable: true,
    },
    {
      key: 'vehicle',
      header: 'Assigned Vehicle',
      sortable: false,
      cell: (driver) => {
        const vehicle = Array.isArray(driver.vehicle) ? driver.vehicle[0] : driver.vehicle
        return vehicle
          ? `${vehicle.plate_number} (${vehicle.type})`
          : <span className="text-muted-foreground">None</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (driver) => (
        <Badge variant={statusVariant[driver.status as DriverStatus]}>
          {statusLabel[driver.status as DriverStatus]}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search by license number..."
        onSearch={(query) => updateQueryParams({ q: query.trim() || null, page: '1' })}
        defaultValue={initialQuery}
        className="max-w-sm"
      />
      <DataTable
        data={drivers}
        columns={columns}
        onRowClick={(driver) => router.push(`/drivers/${driver.id}`)}
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
