import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { ShipmentForm } from '@/components/shipments/shipment-form'
import { getClients } from '@/app/actions/clients'
import { getReceivers } from '@/app/actions/receivers'
import { createServerClient } from '@/lib/supabase/server'
import type { ShipmentTripOption } from '@/lib/types/shipment-trip-option'

/**
 * New Shipment Page
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 18.3
 */
export default async function NewShipmentPage() {
  const [{ data: clients }, { data: receivers }] = await Promise.all([
    getClients(),
    getReceivers(),
  ])

  const supabase = await createServerClient()
  const { data: trips } = await supabase
    .from('trips')
    .select('id, route, departure_date, status, vehicle:vehicles(plate_number, capacity), shipments(weight, status)')
    .in('status', ['planned', 'in_progress'])
    .order('departure_date', { ascending: true })

  const tripOptions: ShipmentTripOption[] = (trips ?? []).map((trip) => {
    const vehicle = Array.isArray(trip.vehicle) ? trip.vehicle[0] : trip.vehicle
    const activeLoad = (trip.shipments ?? [])
      .filter((shipment) => shipment.status === 'pending' || shipment.status === 'in_transit')
      .reduce((sum, shipment) => sum + Number(shipment.weight), 0)

    return {
      id: trip.id,
      route: trip.route,
      departure_date: trip.departure_date,
      status: trip.status,
      vehicle_capacity: vehicle?.capacity ? Number(vehicle.capacity) : null,
      vehicle_plate_number: vehicle?.plate_number ?? null,
      current_load_weight: activeLoad,
    }
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/shipments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipments
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Shipment</h1>
        <p className="text-muted-foreground">Create a new cargo shipment</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Shipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentForm
            clients={clients ?? []}
            receivers={receivers ?? []}
            trips={tripOptions}
          />
        </CardContent>
      </Card>
    </div>
  )
}
