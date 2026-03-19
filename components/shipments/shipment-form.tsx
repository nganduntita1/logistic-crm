'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { shipmentSchema, type ShipmentFormData } from '@/lib/validations/shipment'
import { createShipment, updateShipment } from '@/app/actions/shipments'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ReceiverForm } from '@/components/receivers/receiver-form'
import type { Client, Receiver, Trip, Shipment } from '@/lib/types/database'

interface ShipmentFormProps {
  shipment?: Shipment
  clients: Client[]
  receivers: Receiver[]
  trips: Trip[]
  onSuccess?: () => void
}

/**
 * Shipment Form Component
 * Validates: Requirements 4.2, 4.3, 4.4, 18.3, 15.1, 15.6
 *
 * Handles create and edit modes. Includes client/receiver/trip dropdowns
 * and an inline "New Receiver" dialog for creating receivers on the fly.
 */
export function ShipmentForm({ shipment, clients, receivers: initialReceivers, trips, onSuccess }: ShipmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiverDialogOpen, setReceiverDialogOpen] = useState(false)

  const isEditMode = !!shipment

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    mode: 'onChange',
    defaultValues: {
      client_id: shipment?.client_id ?? '',
      receiver_id: shipment?.receiver_id ?? '',
      trip_id: shipment?.trip_id ?? '',
      description: shipment?.description ?? '',
      quantity: shipment?.quantity ?? ('' as unknown as number),
      weight: shipment?.weight ?? ('' as unknown as number),
      value: shipment?.value ?? ('' as unknown as number),
      price: shipment?.price ?? ('' as unknown as number),
      payment_status: shipment?.payment_status ?? 'unpaid',
    },
  })

  const onSubmit = async (data: ShipmentFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('client_id', data.client_id)
      formData.append('receiver_id', data.receiver_id)
      formData.append('trip_id', data.trip_id ?? '')
      formData.append('description', data.description)
      formData.append('quantity', String(data.quantity))
      formData.append('weight', String(data.weight))
      formData.append('value', String(data.value))
      formData.append('price', String(data.price))
      formData.append('payment_status', data.payment_status)

      const result = isEditMode
        ? await updateShipment(shipment.id, formData)
        : await createShipment(formData)

      if (result.error) {
        toast({
          title: isEditMode ? 'Failed to update shipment' : 'Failed to create shipment',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: isEditMode ? 'Shipment updated' : 'Shipment created',
        description: isEditMode
          ? 'Shipment details have been saved.'
          : 'New shipment has been created.',
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/shipments')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Called when a new receiver is created inline — select it and close dialog
  const handleNewReceiver = (receiverId: string) => {
    setValue('receiver_id', receiverId, { shouldValidate: true })
    setReceiverDialogOpen(false)
    toast({ title: 'Receiver created', description: 'New receiver selected.' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Client */}
      <div className="space-y-1">
        <Label htmlFor="client_id">
          Client <span className="text-destructive">*</span>
        </Label>
        <select
          id="client_id"
          {...register('client_id')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select a client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.phone}
            </option>
          ))}
        </select>
        {errors.client_id && (
          <p className="text-sm text-destructive">{errors.client_id.message}</p>
        )}
      </div>

      {/* Receiver + inline creation */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="receiver_id">
            Receiver <span className="text-destructive">*</span>
          </Label>
          <Dialog open={receiverDialogOpen} onOpenChange={setReceiverDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                + New Receiver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Receiver</DialogTitle>
              </DialogHeader>
              <ReceiverForm onSuccess={handleNewReceiver} />
            </DialogContent>
          </Dialog>
        </div>
        <select
          id="receiver_id"
          {...register('receiver_id')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select a receiver...</option>
          {initialReceivers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.city}, {r.country}
            </option>
          ))}
        </select>
        {errors.receiver_id && (
          <p className="text-sm text-destructive">{errors.receiver_id.message}</p>
        )}
      </div>

      {/* Trip (optional) */}
      <div className="space-y-1">
        <Label htmlFor="trip_id">Trip (optional)</Label>
        <select
          id="trip_id"
          {...register('trip_id')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">No trip assigned</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.route} — {new Date(t.departure_date).toLocaleDateString()} ({t.status})
            </option>
          ))}
        </select>
        {errors.trip_id && (
          <p className="text-sm text-destructive">{errors.trip_id.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Input id="description" {...register('description')} placeholder="Cargo description" />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Quantity / Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="quantity">
            Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            step={1}
            {...register('quantity', { valueAsNumber: true })}
            placeholder="1"
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="weight">
            Weight (kg) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="weight"
            type="number"
            min={0.01}
            step={0.01}
            {...register('weight', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.weight && (
            <p className="text-sm text-destructive">{errors.weight.message}</p>
          )}
        </div>
      </div>

      {/* Value / Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="value">
            Value ($) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="value"
            type="number"
            min={0}
            step={0.01}
            {...register('value', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.value && (
            <p className="text-sm text-destructive">{errors.value.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="price">
            Price ($) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            min={0}
            step={0.01}
            {...register('price', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
      </div>

      {/* Payment status */}
      <div className="space-y-1">
        <Label htmlFor="payment_status">
          Payment Status <span className="text-destructive">*</span>
        </Label>
        <select
          id="payment_status"
          {...register('payment_status')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        {errors.payment_status && (
          <p className="text-sm text-destructive">{errors.payment_status.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting
            ? isEditMode ? 'Saving...' : 'Creating...'
            : isEditMode ? 'Save Changes' : 'Create Shipment'}
        </Button>
      </div>
    </form>
  )
}
