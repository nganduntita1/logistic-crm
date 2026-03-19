'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { StatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { ClientForm } from '@/components/clients/client-form'
import { Pencil, Phone, Mail, MapPin, MessageCircle, FileText } from 'lucide-react'
import type { Client, Shipment } from '@/lib/types/database'

interface ClientDetailViewProps {
  client: Client
  shipments: Shipment[]
}

/**
 * Client Detail View Component
 * Validates: Requirements 3.4
 *
 * Displays client info, shipment history, and an edit dialog.
 */
export function ClientDetailView({ client, shipments }: ClientDetailViewProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)

  const shipmentColumns: ColumnDef<Shipment>[] = [
    {
      key: 'tracking_number',
      header: 'Tracking #',
      sortable: true,
    },
    {
      key: 'description',
      header: 'Description',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'payment_status',
      header: 'Payment',
      sortable: true,
      cell: (s) => <PaymentStatusBadge status={s.payment_status} />,
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      cell: (s) => new Date(s.created_at).toLocaleDateString(),
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground mt-1">Client details and shipment history</p>
        </div>
        <Button onClick={() => setEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Client Info Card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={client.phone} />
          {client.whatsapp && (
            <InfoRow icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value={client.whatsapp} />
          )}
          {client.email && (
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={client.email} />
          )}
          {(client.address || client.city || client.country) && (
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={[client.address, client.city, client.country].filter(Boolean).join(', ')}
            />
          )}
          {client.notes && (
            <div className="sm:col-span-2">
              <InfoRow icon={<FileText className="h-4 w-4" />} label="Notes" value={client.notes} />
            </div>
          )}
        </div>
      </div>

      {/* Shipment History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Shipment History
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({shipments.length} {shipments.length === 1 ? 'shipment' : 'shipments'})
          </span>
        </h2>
        <DataTable
          data={shipments}
          columns={shipmentColumns}
          itemsPerPage={10}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={client}
            onSuccess={() => {
              setEditOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}
