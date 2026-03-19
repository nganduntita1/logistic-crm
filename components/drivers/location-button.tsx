'use client'

import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { updateDriverLocation } from '@/app/actions/locations'

interface LocationButtonProps {
  driverId: string
}

/**
 * LocationButton Component
 * Validates: Requirements 9.1, 9.3, 9.5
 *
 * Uses the browser Geolocation API to get the driver's current coordinates
 * and saves them via the updateDriverLocation server action.
 * Handles permission denied errors with a user-friendly toast message.
 */
export function LocationButton({ driverId }: LocationButtonProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        const result = await updateDriverLocation(driverId, latitude, longitude)

        if (result.error) {
          toast({
            title: 'Failed to update location',
            description: result.error,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Location updated',
            description: 'Your current location has been saved.',
          })
        }

        setIsLoading(false)
      },
      (error) => {
        setIsLoading(false)

        if (error.code === error.PERMISSION_DENIED) {
          toast({
            title: 'Location permission denied',
            description:
              'Please allow location access in your browser settings to update your location.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Location unavailable',
            description: 'Unable to retrieve your location. Please try again.',
            variant: 'destructive',
          })
        }
      }
    )
  }

  return (
    <Button
      onClick={handleUpdateLocation}
      disabled={isLoading}
      variant="outline"
      size="default"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Getting location...' : 'Update Location'}
    </Button>
  )
}
