'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { updateTripStatus } from '@/app/actions/trips'
import type { TripStatus } from '@/lib/types/database'

interface TripStatusControlsProps {
  tripId: string
  currentStatus: TripStatus
}

const transitions: Record<TripStatus, { next: TripStatus; label: string; variant: 'default' | 'destructive' | 'outline' }[]> = {
  planned: [
    { next: 'in_progress', label: 'Start Trip', variant: 'default' },
    { next: 'cancelled', label: 'Cancel Trip', variant: 'destructive' },
  ],
  in_progress: [
    { next: 'completed', label: 'Mark Completed', variant: 'default' },
    { next: 'cancelled', label: 'Cancel Trip', variant: 'destructive' },
  ],
  completed: [],
  cancelled: [],
}

/**
 * Trip Status Controls
 * Validates: Requirements 19.2, 19.3, 19.5
 *
 * Renders available status transitions for the current trip status.
 */
export function TripStatusControls({ tripId, currentStatus }: TripStatusControlsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<TripStatus | null>(null)

  const available = transitions[currentStatus]

  if (available.length === 0) return null

  const handleTransition = async (next: TripStatus) => {
    setLoading(next)
    try {
      const result = await updateTripStatus(tripId, next)
      if (result.error) {
        toast({
          title: 'Failed to update status',
          description: result.error,
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Trip status updated' })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {available.map(({ next, label, variant }) => (
        <Button
          key={next}
          variant={variant}
          size="sm"
          disabled={loading !== null}
          onClick={() => handleTransition(next)}
        >
          {loading === next ? 'Updating...' : label}
        </Button>
      ))}
    </div>
  )
}
