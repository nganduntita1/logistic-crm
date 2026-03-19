'use client'

import { useRouter } from 'next/navigation'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { InsuranceWarning } from '@/components/vehicles/insurance-warning'
import { Badge } from '@/components/ui/badge'
import type { Vehicle, VehicleStatus } from '@/lib/types/database'

interface VehiclesTableProps {
  vehicles: Vehicle[]
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
export function VehiclesTable({ vehicles }: VehiclesTableProps) {
  const router = useRouter()

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
    <DataTable
      data={vehicles}
      columns={columns}
      onRowClick={(vehicle) => router.push(`/vehicles/${vehicle.id}`)}
      itemsPerPage={20}
    />
  )
}
