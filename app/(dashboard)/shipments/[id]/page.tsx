import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Pencil } from 'lucide-react'
import { getShipment, getShipmentTimeline, updateShipmentPayment } from '@/app/actions/shipments'
import { StatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { ShipmentTimeline } from '@/components/shipments/shipment-timeline'
import type { ShipmentStatus, PaymentStatus, ShipmentStatusHistory, Client, Receiver, Trip, DeliveryProof } from '@/lib/types/database'

interface ShipmentDetailPageProps {
  params: { id: string }
}

/**
 * Shipment Detail Page
 * Validates: Requirements 4.8, 20.4
 *
 * Displays full shipment info, status timeline, and delivery proof if available.
 */
export default async function ShipmentDetailPage({ params }: ShipmentDetailPageProps) {
  const [{ data: shipment, error }, { data: timeline }] = await Promise.all([
    getShipment(params.id),
    getShipmentTimeline(params.id),
  ])

  if (error || !shipment) {
    notFound()
  }

  const client = shipment.client as Client | undefined
  const receiver = shipment.receiver as Receiver | undefined
  const trip = shipment.trip as Trip | undefined
  const deliveryProof = shipment.delivery_proof as DeliveryProof | undefined
  const amountPaid = Number(shipment.amount_paid ?? 0)
  const balance = Math.max(Number(shipment.price) - amountPaid, 0)
  const markAsPaid = updateShipmentPayment.bind(null, shipment.id, 'paid', Number(shipment.price))

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/shipments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipments
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            {shipment.tracking_number}
          </h1>
          <p className="text-muted-foreground">{shipment.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/shipments/${shipment.id}/invoice`}>
              <FileText className="mr-2 h-4 w-4" />
              Invoice
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/shipments/${shipment.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Shipment
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Shipment Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipment Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <StatusBadge status={shipment.status as ShipmentStatus} />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Payment</p>
                <div className="flex items-center gap-2">
                  <PaymentStatusBadge status={shipment.payment_status as PaymentStatus} />
                  {shipment.payment_status !== 'paid' && (
                    <form action={markAsPaid}>
                      <Button type="submit" size="sm" variant="outline">Mark as Paid</Button>
                    </form>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="text-sm">
                  {client ? (
                    <Link href={`/clients/${client.id}`} className="underline underline-offset-2">
                      {client.name}
                    </Link>
                  ) : '—'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Receiver</p>
                <p className="text-sm">
                  {receiver ? `${receiver.name} — ${receiver.city}, ${receiver.country}` : '—'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Trip</p>
                <p className="text-sm">
                  {trip ? (
                    <Link href={`/trips/${trip.id}`} className="underline underline-offset-2">
                      {trip.route}
                    </Link>
                  ) : 'Not assigned'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                <p className="text-sm">{shipment.quantity}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Weight</p>
                <p className="text-sm">{shipment.weight} kg</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Value</p>
                <p className="text-sm">${shipment.value.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Price</p>
                <p className="text-sm">${shipment.price.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                <p className="text-sm">${amountPaid.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                <p className="text-sm">${balance.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(shipment.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Proof — Requirement 20.4 */}
          {deliveryProof && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Proof</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Received by</p>
                    <p className="text-sm">{deliveryProof.receiver_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Delivered at</p>
                    <p className="text-sm">{new Date(deliveryProof.delivered_at).toLocaleString()}</p>
                  </div>
                </div>
                {deliveryProof.photo_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Photo</p>
                    <div className="relative rounded-md border overflow-hidden max-h-64 w-full h-64">
                      <Image
                        src={deliveryProof.photo_url}
                        alt="Delivery proof"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline — Requirements 20.1–20.5 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ShipmentTimeline events={(timeline as ShipmentStatusHistory[]) ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
