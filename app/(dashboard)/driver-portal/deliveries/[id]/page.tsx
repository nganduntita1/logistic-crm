import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { DeliveryForm } from '@/components/delivery/delivery-form'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, User, Weight, Hash } from 'lucide-react'

interface DeliveryPageProps {
  params: { id: string }
}

/**
 * Delivery Confirmation Page
 * Validates: Requirements 8.3, 8.4
 *
 * Shows shipment details and renders the DeliveryForm for photo upload.
 * Only accessible to the driver assigned to the shipment's trip.
 */
export default async function DeliveryConfirmationPage({ params }: DeliveryPageProps) {
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

  // Fetch the shipment with related data
  const { data: shipment, error } = await supabase
    .from('shipments')
    .select('*, client:clients(name), receiver:receivers(name, phone, address, city, country), trip:trips(id, route, driver_id)')
    .eq('id', params.id)
    .single()

  if (error || !shipment) notFound()

  // Ensure this shipment belongs to a trip assigned to the current driver
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const tripDriverId = (shipment.trip as { driver_id?: string } | null)?.driver_id
  if (!driver || tripDriverId !== driver.id) redirect('/driver-portal')

  // Already delivered — show read-only view
  const isDelivered = shipment.status === 'delivered'

  return (
    <div>
      <Header title="Confirm Delivery" userName={profile.full_name} userRole="driver" />
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Shipment details card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">Shipment Details</CardTitle>
              <StatusBadge status={shipment.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4 shrink-0" />
              <span className="font-mono font-medium text-foreground">
                {shipment.tracking_number}
              </span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <Package className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{shipment.description}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Weight className="h-4 w-4 shrink-0" />
              <span>
                {shipment.quantity} item{shipment.quantity !== 1 ? 's' : ''} · {shipment.weight} kg
              </span>
            </div>
            {shipment.receiver && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <User className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground font-medium">
                    {(shipment.receiver as { name: string }).name}
                  </p>
                  <p>{(shipment.receiver as { phone: string }).phone}</p>
                  <p>
                    {(shipment.receiver as { address: string; city: string; country: string }).address},{' '}
                    {(shipment.receiver as { city: string }).city},{' '}
                    {(shipment.receiver as { country: string }).country}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isDelivered ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              This shipment has already been marked as delivered.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Upload Delivery Proof</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryForm
                shipmentId={shipment.id}
                defaultReceiverName={
                  (shipment.receiver as { name?: string } | null)?.name ?? ''
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
