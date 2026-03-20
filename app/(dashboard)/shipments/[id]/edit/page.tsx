import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShipmentForm } from '@/components/shipments/shipment-form'
import { getShipment } from '@/app/actions/shipments'
import { getClients } from '@/app/actions/clients'
import { getReceivers } from '@/app/actions/receivers'
import { createServerClient } from '@/lib/supabase/server'
import type { Shipment } from '@/lib/types/database'
import type { ShipmentTripOption } from '@/lib/types/shipment-trip-option'

interface EditShipmentPageProps {
  params: { id: string }
}

export default async function EditShipmentPage({ params }: EditShipmentPageProps) {
  const [{ data: shipment, error }, { data: clients }, { data: receivers }] = await Promise.all([
    getShipment(params.id),
    getClients(),
    getReceivers(),
  ])

  if (error || !shipment) {
    notFound()
  }

  const supabase = await createServerClient()
  const { data: trips } = await supabase
    .from('trips')
    .select('id, route, departure_date, status, vehicle:vehicles(plate_number, capacity), shipments(id, weight, status)')
    .in('status', ['planned', 'in_progress'])
    .order('departure_date', { ascending: true })

  const tripOptions: ShipmentTripOption[] = (trips ?? []).map((trip) => {
    const vehicle = Array.isArray(trip.vehicle) ? trip.vehicle[0] : trip.vehicle
    const activeLoad = (trip.shipments ?? [])
      .filter((tripShipment) => tripShipment.id !== shipment.id)
      .filter((tripShipment) => tripShipment.status === 'pending' || tripShipment.status === 'in_transit')
      .reduce((sum, tripShipment) => sum + Number(tripShipment.weight), 0)

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
          <Link href={`/shipments/${shipment.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipment
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Shipment</h1>
        <p className="text-muted-foreground">Update shipment details</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Shipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentForm
            shipment={shipment as Shipment}
            clients={clients ?? []}
            receivers={receivers ?? []}
            trips={tripOptions}
          />
        </CardContent>
      </Card>
    </div>
  )
}