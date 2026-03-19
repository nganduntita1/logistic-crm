'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema, type ClientFormData } from '@/lib/validations/client'
import { createClient, updateClient } from '@/app/actions/clients'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client } from '@/lib/types/database'

interface ClientFormProps {
  client?: Client
  onSuccess?: () => void
}

/**
 * Client Form Component
 * Validates: Requirements 3.1, 3.5, 15.1, 15.6
 *
 * Handles both create and edit modes.
 * Shows field-specific validation errors and prevents submission while errors exist.
 */
export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = !!client

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: 'onChange',
    defaultValues: {
      name: client?.name ?? '',
      phone: client?.phone ?? '',
      whatsapp: client?.whatsapp ?? '',
      email: client?.email ?? '',
      address: client?.address ?? '',
      city: client?.city ?? '',
      country: client?.country ?? '',
      notes: client?.notes ?? '',
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value ?? '')
      })

      const result = isEditMode
        ? await updateClient(client.id, formData)
        : await createClient(formData)

      if (result.error) {
        toast({
          title: isEditMode ? 'Failed to update client' : 'Failed to create client',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: isEditMode ? 'Client updated' : 'Client created',
        description: isEditMode
          ? 'Client details have been saved.'
          : 'New client has been added.',
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/clients')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input id="name" {...register('name')} placeholder="Full name" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <Label htmlFor="phone">
          Phone <span className="text-destructive">*</span>
        </Label>
        <Input id="phone" {...register('phone')} placeholder="+1 234 567 8900" />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* WhatsApp */}
      <div className="space-y-1">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input id="whatsapp" {...register('whatsapp')} placeholder="+1 234 567 8900" />
        {errors.whatsapp && (
          <p className="text-sm text-destructive">{errors.whatsapp.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} placeholder="client@example.com" />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-1">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register('address')} placeholder="Street address" />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      {/* City / Country row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register('city')} placeholder="City" />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register('country')} placeholder="Country" />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          {...register('notes')}
          placeholder="Additional notes..."
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        {/* Requirement 15.6: disabled while validation errors exist */}
        <Button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting
            ? isEditMode ? 'Saving...' : 'Creating...'
            : isEditMode ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </form>
  )
}
