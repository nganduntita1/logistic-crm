import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { TripCard } from '@/components/trips/trip-card'
import { ShipmentDeliveryCard } from '@/components/shipments/shipment-delivery-card'
import { LocationButton } from '@/components/drivers/location-button'
import type { Trip, Shipment } from '@/lib/types/database'

/**
 * Driver Portal Page — mobile-optimized dashboard for drivers
 * Validates: Requirements 8.1, 8.2, 8.6
 *
 * Displays trips assigned to the authenticated driver and
 * pending (in_transit) deliveries across all active trips.
 */
export default async function DriverPortalPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'driver') redirect('/')

  // Get the driver record for this user
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!driver) {
    return (
      <div>
        <Header title="Driver Portal" userName={profile.full_name} userRole="driver" />
        <div className="p-6">
          <p className="text-muted-foreground">
            No driver profile found. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  // Fetch trips assigned to this driver (active ones)
  const { data: trips } = await supabase
    .from('trips')
    .select('*, vehicle:vehicles(*)')
    .eq('driver_id', driver.id)
    .in('status', ['planned', 'in_progress'])
    .order('departure_date', { ascending: true })

  const tripIds = (trips ?? []).map((t) => t.id)

  // Fetch in_transit shipments for those trips
  let pendingShipments: (Shipment & { receiver?: { name: string } })[] = []
  if (tripIds.length > 0) {
    const { data: shipments } = await supabase
      .from('shipments')
      .select('*, receiver:receivers(name)')
      .in('trip_id', tripIds)
      .eq('status', 'in_transit')
      .order('created_at', { ascending: true })

    pendingShipments = (shipments ?? []) as typeof pendingShipments
  }

  // Build a map of trip_id → shipments for count display
  const shipmentsByTrip: Record<string, { id: string; status: string }[]> = {}
  for (const s of pendingShipments) {
    if (!s.trip_id) continue
    if (!shipmentsByTrip[s.trip_id]) shipmentsByTrip[s.trip_id] = []
    shipmentsByTrip[s.trip_id].push({ id: s.id, status: s.status })
  }

  const enrichedTrips = (trips ?? []).map((trip) => ({
    ...trip,
    shipments: shipmentsByTrip[trip.id] ?? [],
  })) as (Trip & { shipments: { id: string; status: string }[] })[]

  return (
    <div>
      <Header title="Driver Portal" userName={profile.full_name} userRole="driver" />
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Location update — large touch target */}
        <div className="flex justify-end">
          <LocationButton driverId={driver.id} />
        </div>

        {/* Active trips */}
        <section>
          <h2 className="text-lg font-semibold mb-3">My Trips</h2>
          {enrichedTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active trips assigned to you.</p>
          ) : (
            <div className="space-y-3">
              {enrichedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </section>

        {/* Pending deliveries */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Pending Deliveries
            {pendingShipments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({pendingShipments.length})
              </span>
            )}
          </h2>
          {pendingShipments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending deliveries.</p>
          ) : (
            <div className="space-y-3">
              {pendingShipments.map((shipment) => (
                <ShipmentDeliveryCard key={shipment.id} shipment={shipment} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
