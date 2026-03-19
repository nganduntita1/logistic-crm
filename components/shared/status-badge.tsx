import * as React from 'react'
import { Badge } from '@/components/ui/badge'

export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

interface StatusBadgeProps {
  status: ShipmentStatus
  className?: string
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<ShipmentStatus, { variant: any; label: string }> = {
    pending: {
      variant: 'outline',
      label: 'Pending',
    },
    in_transit: {
      variant: 'warning',
      label: 'In Transit',
    },
    delivered: {
      variant: 'success',
      label: 'Delivered',
    },
    cancelled: {
      variant: 'destructive',
      label: 'Cancelled',
    },
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const variants: Record<PaymentStatus, { variant: any; label: string }> = {
    unpaid: {
      variant: 'destructive',
      label: 'Unpaid',
    },
    partial: {
      variant: 'warning',
      label: 'Partial',
    },
    paid: {
      variant: 'success',
      label: 'Paid',
    },
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
