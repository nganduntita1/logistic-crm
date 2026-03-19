'use client'

import { useRouter } from 'next/navigation'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import type { Driver, DriverStatus } from '@/lib/types/database'

type DriverWithRelations = Driver & {
  profile?: { full_name: string; email: string } | null
  vehicle?: { plate_number: string; type: string } | null
}

interface DriversTableProps {
  drivers: DriverWithRelations[]
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
export function DriversTable({ drivers }: DriversTableProps) {
  const router = useRouter()

  const columns: ColumnDef<DriverWithRelations>[] = [
    {
      key: 'profile',
      header: 'Name',
      sortable: false,
      cell: (driver) => driver.profile?.full_name ?? '—',
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
      cell: (driver) =>
        driver.vehicle
          ? `${driver.vehicle.plate_number} (${driver.vehicle.type})`
          : <span className="text-muted-foreground">None</span>,
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
    <DataTable
      data={drivers}
      columns={columns}
      searchKey="license_number"
      searchPlaceholder="Search by license number..."
      onRowClick={(driver) => router.push(`/drivers/${driver.id}`)}
      itemsPerPage={20}
    />
  )
}
