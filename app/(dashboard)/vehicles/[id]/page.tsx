import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getVehicle } from '@/app/actions/vehicles'
import { InsuranceWarning } from '@/components/vehicles/insurance-warning'
import type { VehicleStatus } from '@/lib/types/database'

interface VehicleDetailPageProps {
  params: { id: string }
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
 * Vehicle Detail Page
 * Validates: Requirements 7.5
 *
 * Displays vehicle information with an edit button.
 */
export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { data: vehicle, error } = await getVehicle(params.id)

  if (error || !vehicle) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vehicles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicles
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{vehicle.plate_number}</h1>
          <p className="text-muted-foreground">{vehicle.type}</p>
        </div>
        <Button asChild>
          <Link href={`/vehicles/${vehicle.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Vehicle
          </Link>
        </Button>
      </div>

      {/* Vehicle Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Plate Number</p>
            <p className="text-sm">{vehicle.plate_number}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Type</p>
            <p className="text-sm">{vehicle.type}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Capacity</p>
            <p className="text-sm">{vehicle.capacity.toLocaleString()} kg</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={statusVariant[vehicle.status as VehicleStatus]}>
              {statusLabel[vehicle.status as VehicleStatus]}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Insurance Expiry</p>
            <div className="flex items-center gap-2">
              <p className="text-sm">
                {new Date(vehicle.insurance_expiry).toLocaleDateString()}
              </p>
              <InsuranceWarning insuranceExpiry={vehicle.insurance_expiry} />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Added</p>
            <p className="text-sm">{new Date(vehicle.created_at).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
