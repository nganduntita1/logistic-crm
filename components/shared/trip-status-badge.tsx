import * as React from 'react'
import { Badge } from '@/components/ui/badge'

export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

interface TripStatusBadgeProps {
  status: TripStatus
  className?: string
}

export function TripStatusBadge({ status, className }: TripStatusBadgeProps) {
  const variants: Record<TripStatus, { variant: any; label: string }> = {
    planned: {
      variant: 'outline',
      label: 'Planned',
    },
    in_progress: {
      variant: 'warning',
      label: 'In Progress',
    },
    completed: {
      variant: 'success',
      label: 'Completed',
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
