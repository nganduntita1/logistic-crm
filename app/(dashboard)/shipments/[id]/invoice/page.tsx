import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getShipment } from '@/app/actions/shipments'
import { PrintInvoiceButton } from '@/components/shipments/print-invoice-button'
import { PaymentStatusBadge, StatusBadge } from '@/components/shared/status-badge'
import type { Client, PaymentStatus, Receiver, ShipmentStatus, Trip } from '@/lib/types/database'

interface ShipmentInvoicePageProps {
  params: { id: string }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function buildInvoiceNumber(trackingNumber: string, createdAt: string) {
  const datePart = new Date(createdAt).toISOString().slice(0, 10).replace(/-/g, '')
  return `INV-${datePart}-${trackingNumber.slice(-5)}`
}

export default async function ShipmentInvoicePage({ params }: ShipmentInvoicePageProps) {
  const { data: shipment, error } = await getShipment(params.id)

  if (error || !shipment) {
    notFound()
  }

  const client = shipment.client as Client | undefined
  const receiver = shipment.receiver as Receiver | undefined
  const trip = shipment.trip as Trip | undefined
  const invoiceNumber = buildInvoiceNumber(shipment.tracking_number, shipment.created_at)

  return (
    <>
      <div className="no-print container mx-auto max-w-4xl p-6 pb-3">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/shipments/${shipment.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shipment
            </Link>
          </Button>
          <PrintInvoiceButton />
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-6 print:max-w-full print:p-0">
        <div className="rounded-xl border bg-white p-8 shadow-sm print:shadow-none print:border-0 print:p-0">
        <div className="flex flex-col gap-6 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Invoice</p>
            <h1 className="text-3xl font-bold tracking-tight">{invoiceNumber}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Issued on {new Date(shipment.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-sm sm:text-right">
            <p className="font-semibold">Logistics CRM</p>
            <p className="text-muted-foreground">Johannesburg to DRC Cargo Management</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Bill To</p>
            <p className="mt-1 font-medium">{client?.name ?? 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{client?.email ?? 'No email'}</p>
            <p className="text-sm text-muted-foreground">{client?.phone ?? 'No phone'}</p>
            <p className="text-sm text-muted-foreground">
              {client?.address ? `${client.address}, ` : ''}
              {client?.city ? `${client.city}, ` : ''}
              {client?.country ?? ''}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Deliver To</p>
            <p className="mt-1 font-medium">{receiver?.name ?? 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{receiver?.phone ?? 'No phone'}</p>
            <p className="text-sm text-muted-foreground">{receiver?.address ?? ''}</p>
            <p className="text-sm text-muted-foreground">
              {receiver?.city ? `${receiver.city}, ` : ''}
              {receiver?.country ?? ''}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Tracking #</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Weight</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-3">{shipment.description}</td>
                <td className="px-4 py-3 font-mono">{shipment.tracking_number}</td>
                <td className="px-4 py-3 text-right">{shipment.quantity}</td>
                <td className="px-4 py-3 text-right">{shipment.weight} kg</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(shipment.price)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Shipment Status</p>
            <StatusBadge status={shipment.status as ShipmentStatus} />
            <p className="pt-2">Payment Status</p>
            <PaymentStatusBadge status={shipment.payment_status as PaymentStatus} />
            {trip && <p className="pt-2">Trip: {trip.route}</p>}
          </div>
          <div className="space-y-2 rounded-lg border p-4 sm:ml-auto sm:w-full sm:max-w-xs">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Declared Value</span>
              <span>{formatCurrency(shipment.value)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Shipping Fee</span>
              <span>{formatCurrency(shipment.price)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(shipment.price)}</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Thank you for choosing Logistics CRM. This invoice is system-generated and valid without signature.
        </p>
        </div>
      </div>
    </>
  )
}