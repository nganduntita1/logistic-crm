import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getVehicle } from '@/app/actions/vehicles'
import { VehicleForm } from '@/components/vehicles/vehicle-form'

interface EditVehiclePageProps {
  params: { id: string }
}

/**
 * Edit Vehicle Page
 * Validates: Requirements 7.5
 */
export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { data: vehicle, error } = await getVehicle(params.id)

  if (error || !vehicle) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/vehicles/${vehicle.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicle
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>
        <p className="text-muted-foreground">Update vehicle details</p>
      </div>

      <VehicleForm vehicle={vehicle} />
    </div>
  )
}
