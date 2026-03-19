import { VehicleForm } from '@/components/vehicles/vehicle-form'

/**
 * New Vehicle Page
 * Validates: Requirements 7.1
 *
 * Renders the VehicleForm in creation mode.
 */
export default function NewVehiclePage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Vehicle</h1>
        <p className="text-muted-foreground">Add a new vehicle to your fleet</p>
      </div>
      <VehicleForm />
    </div>
  )
}
