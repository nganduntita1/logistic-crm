import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { VehiclesTable } from '@/components/vehicles/vehicles-table'
import { getVehicles } from '@/app/actions/vehicles'

/**
 * Vehicle List Page
 * Validates: Requirements 7.4
 *
 * Displays all vehicles in a DataTable with insurance expiry warnings and a "New Vehicle" button.
 */
export default async function VehiclesPage() {
  const { data: vehicles, error } = await getVehicles()

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error loading vehicles: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">Manage your fleet</p>
        </div>
        <Button asChild>
          <Link href="/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            New Vehicle
          </Link>
        </Button>
      </div>

      {/* Vehicles Table */}
      <Suspense fallback={<div>Loading vehicles...</div>}>
        <VehiclesTable vehicles={vehicles || []} />
      </Suspense>
    </div>
  )
}
